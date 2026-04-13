"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      className={
        className ??
        "rounded-xl border border-border-token px-4 py-2 text-sm text-txt-secondary transition-colors hover:border-electric/30 hover:text-electric-bright disabled:opacity-50"
      }
      onClick={async () => {
        setLoading(true);
        await signOut({ redirectTo: "/" });
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
