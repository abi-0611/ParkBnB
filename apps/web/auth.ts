/**
 * Auth.js v5 configuration — email + password edition
 *
 * Providers:
 *   • Email + Password  (Supabase handles bcrypt; we own the session via Auth.js JWT)
 *   • Google OAuth      (optional — needs AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)
 *
 * Session: JWT, 30-day expiry, HttpOnly SameSite=Lax cookie, CSRF token
 * JWT payload: sub (Supabase UUID), role, kycStatus, isBanned
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

/** Auth.js accepts AUTH_SECRET or legacy NEXTAUTH_SECRET — both must be set in Vercel for production. */
function authSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

if (process.env.NODE_ENV === "production" && !authSecret()) {
  console.error(
    "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Add it in Vercel → Project → Settings → Environment Variables, then redeploy."
  );
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

/** Service-role client for DB reads. Never exposed to the browser. */
function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Anon client — used only to call signInWithPassword (no cookie storage). */
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function fetchProfile(userId: string) {
  const { data } = await adminDb()
    .from("users")
    .select("id, email, full_name, role, kyc_status, is_banned, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function fetchProfileByEmail(email: string) {
  const { data } = await adminDb()
    .from("users")
    .select("id, email, full_name, role, kyc_status, is_banned, avatar_url")
    .eq("email", email)
    .maybeSingle();
  return data;
}

/** Ensure a user row exists in auth.users + public.users for OAuth sign-ins. */
async function ensureOAuthUser(
  email: string,
  fullName: string,
  avatarUrl: string
): Promise<string | null> {
  const db = adminDb();
  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // First Google sign-in — create auth user (email_confirm: true skips confirmation)
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, avatar_url: avatarUrl },
  });

  return error ? null : (data?.user?.id ?? null);
}

// ─── Config ───────────────────────────────────────────────────────────────────

const config: NextAuthConfig = {
  /**
   * Vercel / serverless: trust the Host header so Auth.js accepts the deployment URL.
   * Without this + AUTH_SECRET, `/api/auth/session` often returns 500 in production.
   */
  trustHost: true,

  secret: authSecret(),

  session: {
    strategy: "jwt",
    maxAge:    30 * 24 * 60 * 60,  // 30 days
    updateAge: 24 * 60 * 60,        // re-sign daily
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [
    // ── Google OAuth (optional) ───────────────────────────────────────────────
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId:     process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // ── Email + Password ──────────────────────────────────────────────────────
    // Supabase validates the bcrypt password hash; Auth.js owns the session.
    // New-user registration goes through POST /api/auth/signup (admin API).
    Credentials({
      id:   "email-password",
      name: "Email & Password",
      credentials: {
        email:    { label: "Email address", type: "email"    },
        password: { label: "Password",      type: "password" },
      },
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.trim().toLowerCase();
        const password = (credentials?.password as string | undefined);

        if (!email || !password || password.length < 8) return null;

        // Verify credentials — Supabase handles bcrypt comparison
        const { data, error } = await anonClient().auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) return null;

        // Fetch role / kyc / ban from public.users
        const profile = await fetchProfile(data.user.id);
        if (!profile)          return null;
        if (profile.is_banned) return null;

        return {
          id:        profile.id,
          email:     profile.email,
          name:      profile.full_name,
          image:     profile.avatar_url,
          role:      profile.role,
          kycStatus: profile.kyc_status,
          isBanned:  profile.is_banned,
        };
      },
    }),
  ],

  callbacks: {
    // ── Block banned OAuth users before a session is issued ───────────────────
    async signIn({ user, account }) {
      if (account?.type !== "oauth") return true;

      const existing = await fetchProfileByEmail(user.email!);

      if (existing) {
        if (existing.is_banned) return false;
        user.id = existing.id;
        return true;
      }

      const uid = await ensureOAuthUser(
        user.email!,
        user.name  ?? "",
        user.image ?? ""
      );
      if (!uid) return false;
      user.id = uid;
      return true;
    },

    // ── Embed role / kyc / ban into the JWT ───────────────────────────────────
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.sub       = user.id;
        token.role      = (user as Record<string, unknown>).role      as string  ?? "seeker";
        token.kycStatus = (user as Record<string, unknown>).kycStatus as string  ?? "not_submitted";
        token.isBanned  = (user as Record<string, unknown>).isBanned  as boolean ?? false;
      }

      // OAuth: profile fields aren't on the user object — fetch from DB
      if (account?.type === "oauth" && token.sub) {
        const profile = await fetchProfile(token.sub);
        if (profile) {
          token.role      = profile.role;
          token.kycStatus = profile.kyc_status;
          token.isBanned  = profile.is_banned;
        }
      }

      // Manual trigger (e.g. after KYC approval or role change)
      if (trigger === "update" && token.sub) {
        const profile = await fetchProfile(token.sub);
        if (profile) {
          token.role      = profile.role;
          token.kycStatus = profile.kyc_status;
          token.isBanned  = profile.is_banned;
        }
      }

      return token;
    },

    // ── Expose JWT fields to the client via useSession() ─────────────────────
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      const u = session.user as unknown as {
        role: string; kycStatus: string; isBanned: boolean;
      };
      u.role      = (token.role      as string)  ?? "seeker";
      u.kycStatus = (token.kycStatus as string)  ?? "not_submitted";
      u.isBanned  = (token.isBanned  as boolean) ?? false;
      return session;
    },
  },

  // ── Secure HttpOnly cookies ───────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
