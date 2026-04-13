"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";

export function ProfilePhoneCard({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) setMessage(json.error ?? "Could not save");
      else setMessage("Saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border-token bg-bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Phone className="h-4 w-4 text-electric-bright" />
        Mobile number
      </p>
      <p className="mt-1 text-xs text-txt-muted">
        10-digit Indian number (used for bookings and support). You can update it anytime.
      </p>
      <form onSubmit={onSave} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="profile-phone" className="sr-only">
            Mobile number
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-border-token bg-bg-elevated px-4 py-3 text-sm text-txt-primary outline-none transition focus:border-electric"
          />
        </div>
        <GlowButton type="submit" size="sm" loading={saving} variant="outline">
          Save
        </GlowButton>
      </form>
      {message ? <p className="mt-2 text-xs text-txt-secondary">{message}</p> : null}
    </section>
  );
}
