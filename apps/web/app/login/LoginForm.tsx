"use client";

import { signInSchema, signUpSchema } from "@parknear/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ArrowRight, Shield, Zap, Star,
  Eye, EyeOff, UserPlus, LogIn,
} from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { springs, staggerContainer, fadeUp } from "@/lib/motion-variants";

// ─── Floating label input ────────────────────────────────────────────────────
function FloatingInput({
  id, label, type = "text", value, onChange,
  placeholder, autoComplete, required,
  rightSlot,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; required?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 font-medium transition-all duration-200 select-none z-10",
          lifted
            ? "top-2 text-2xs text-electric-bright"
            : "top-1/2 -translate-y-1/2 text-sm text-txt-muted"
        )}
      >
        {label}
      </motion.label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={lifted ? placeholder : ""}
        autoComplete={autoComplete}
        required={required}
        className={cn(
          "w-full rounded-xl border bg-bg-elevated px-4 pb-3 pt-6 text-sm text-txt-primary outline-none transition-all duration-200",
          "placeholder:text-txt-disabled",
          rightSlot ? "pr-11" : "",
          focused
            ? "border-electric shadow-glow-xs"
            : "border-border-token hover:border-border-token-bright"
        )}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ─── Password field with show/hide toggle ────────────────────────────────────
function PasswordInput({
  id, label, value, onChange, autoComplete,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <FloatingInput
      id={id} label={label} type={show ? "text" : "password"}
      value={value} onChange={onChange}
      autoComplete={autoComplete}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-txt-muted transition-colors hover:text-txt-secondary"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show
            ? <EyeOff className="h-4 w-4" />
            : <Eye    className="h-4 w-4" />
          }
        </button>
      }
    />
  );
}

// ─── Password strength bar ────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)                    s++;
    if (password.length >= 12)                   s++;
    if (/[A-Z]/.test(password))                  s++;
    if (/[0-9]/.test(password))                  s++;
    if (/[^A-Za-z0-9]/.test(password))           s++;
    return s;
  })();

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["", "bg-danger", "bg-warning", "bg-warning", "bg-emerald", "bg-emerald"];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-1"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= score ? colors[score] : "bg-border-token"
            )}
          />
        ))}
      </div>
      <p className={cn("text-2xs font-medium", score >= 4 ? "text-emerald" : "text-txt-muted")}>
        {labels[score]}
      </p>
    </motion.div>
  );
}

// ─── Left decorative panel ───────────────────────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: Zap,    label: "Instant booking",  sub: "Confirm in under 3 seconds"  },
    { icon: Shield, label: "Verified spots",    sub: "KYC-checked every owner"     },
    { icon: Star,   label: "4.9 avg rating",    sub: "From 1,200+ reviews"         },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-12">
      <div className="absolute inset-0 bg-bg-elevated" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_10%_80%,rgba(61,123,255,0.15)_0%,transparent_65%)]" />
      <div className="absolute inset-0 bg-grid-sm opacity-60" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/40 to-transparent" />
      <motion.div
        className="absolute right-8 top-24 h-48 w-48 rounded-full bg-electric/8 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-24 left-8 h-40 w-40 rounded-full bg-neon/8 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      <div className="relative">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
            <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">
            Park<span className="text-gradient">Near</span>
          </span>
        </Link>
      </div>

      <motion.div
        className="relative"
        variants={staggerContainer(0.1, 0.3)}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-2">
          <Pill variant="neon" pulse>Chennai&#39;s #1 parking app</Pill>
        </motion.div>
        <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-bold text-white">
          Park smarter,{" "}
          <span className="text-gradient">stress less</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-txt-secondary">
          Join thousands of Chennai drivers finding verified parking spots in seconds.
        </motion.p>
        <motion.ul variants={staggerContainer(0.08, 0.6)} className="mt-8 space-y-4">
          {features.map((f) => (
            <motion.li key={f.label} variants={fadeUp} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric/10">
                <f.icon className="h-4 w-4 text-electric-bright" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-txt-primary">{f.label}</p>
                <p className="text-xs text-txt-muted">{f.sub}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.p
        className="relative text-xs text-txt-disabled"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Made as a college project · Chennai, India
      </motion.p>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.p
      className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-3 py-2.5 text-xs text-danger"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      {message}
    </motion.p>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────
export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") || "/dashboard";
  const errorParam   = searchParams.get("error");

  const [mode, setMode]           = useState<"signin" | "signup">("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName, setFullName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [error, setError]         = useState<string | null>(
    errorParam === "banned" ? "Your account has been suspended. Contact support." : null
  );
  const [pending, setPending]     = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPw("");
    setPhone("");
  }

  // ── Sign in ─────────────────────────────────────────────────────────────────
  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const result = await signIn("email-password", {
      email:    parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setPending(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  // ── Sign up ─────────────────────────────────────────────────────────────────
  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signUpSchema.safeParse({
      email,
      password,
      confirmPassword: confirmPw,
      full_name: fullName,
      phone,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);

    // 1. Create account
    const res = await fetch("/api/auth/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:           parsed.data.email,
        password:        parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
        full_name:       parsed.data.full_name,
        phone:           parsed.data.phone,
      }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };

    if (!res.ok || !json.ok) {
      setPending(false);
      setError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    // 2. Immediately sign in with the new credentials
    const result = await signIn("email-password", {
      email:    parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setPending(false);

    if (result?.error) {
      setError("Account created — please sign in.");
      switchMode("signin");
      return;
    }
    router.push(next);
    router.refresh();
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  async function onGoogle() {
    setError(null);
    setGooglePending(true);
    await signIn("google", { redirectTo: next });
    setGooglePending(false);
  }

  const isSignUp = mode === "signup";

  return (
    <main className="flex min-h-screen bg-bg-base">
      {/* Left panel */}
      <div className="hidden w-[45%] shrink-0 border-r border-border-token lg:block">
        <LeftPanel />
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
            <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-white">
            Park<span className="text-gradient">Near</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">
          {/* Mode toggle */}
          <div className="mb-8 flex gap-1 rounded-xl border border-border-token bg-bg-elevated p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  "relative flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200",
                  mode === m ? "text-white" : "text-txt-muted hover:text-txt-secondary"
                )}
              >
                {mode === m && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 rounded-lg bg-electric shadow-glow-xs"
                    transition={springs.snappy}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  {m === "signin"
                    ? <><LogIn  className="h-3 w-3" />Sign in</>
                    : <><UserPlus className="h-3 w-3" />Create account</>
                  }
                </span>
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springs.smooth}
              className="mb-6"
            >
              <h1 className="text-2xl font-bold text-white">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-txt-muted">
                {isSignUp
                  ? "Start finding and listing parking spots today."
                  : "Sign in to manage your bookings and spots."
                }
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google OAuth */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onGoogle}
                disabled={googlePending}
                className={cn(
                  "flex w-full items-center justify-center gap-3 rounded-xl border border-border-token bg-bg-elevated px-4 py-3",
                  "text-sm font-semibold text-txt-primary transition-all",
                  "hover:border-electric/40 hover:bg-electric/5 disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {googlePending
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-electric border-t-transparent" />
                  : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                }
                Continue with Google
              </button>

              <div className="relative my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border-token" />
                <span className="text-2xs font-medium uppercase tracking-widest text-txt-disabled">or</span>
                <div className="h-px flex-1 bg-border-token" />
              </div>
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={isSignUp ? onSignUp : onSignIn}
              className="space-y-4"
              initial={{ opacity: 0, x: isSignUp ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -24 : 24 }}
              transition={springs.smooth}
            >
              {isSignUp && (
                <FloatingInput
                  id="full-name" label="Full name"
                  value={fullName} onChange={setFullName}
                  placeholder="Your name" autoComplete="name"
                />
              )}

              {isSignUp && (
                <FloatingInput
                  id="phone"
                  label="Mobile number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="10-digit number"
                  autoComplete="tel"
                  required
                />
              )}

              <FloatingInput
                id="email" label="Email address" type="email"
                value={email} onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email" required
              />

              <div className="space-y-2">
                <PasswordInput
                  id="password" label="Password"
                  value={password} onChange={setPassword}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                {isSignUp && <StrengthBar password={password} />}
              </div>

              {isSignUp && (
                <PasswordInput
                  id="confirm-password" label="Confirm password"
                  value={confirmPw} onChange={setConfirmPw}
                  autoComplete="new-password"
                />
              )}

              {error && <ErrorBanner message={error} />}

              <GlowButton
                type="submit"
                variant={isSignUp ? "emerald" : "primary"}
                size="lg" fullWidth loading={pending}
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
              >
                {isSignUp ? "Create account" : "Sign in"}
              </GlowButton>
            </motion.form>
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-txt-disabled">
            <Link href="/" className="text-electric-bright hover:underline">
              ← Back home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
