/**
 * Extend next-auth types to include our custom user fields.
 * These are populated via the jwt + session callbacks in auth.ts.
 */
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:         string;
      role:       string;   // "seeker" | "owner" | "both" | "admin"
      kycStatus:  string;   // "not_submitted" | "submitted" | "verified" | "rejected"
      isBanned:   boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?:      string;
    kycStatus?: string;
    isBanned?:  boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?:      string;
    kycStatus?: string;
    isBanned?:  boolean;
  }
}
