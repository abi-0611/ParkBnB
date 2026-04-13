"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";

interface Props {
  bookingId: string;
  status: string;
  /** ISO start_time string */
  startTime: string;
  /** Compact mode — just icon button */
  compact?: boolean;
}

export function CancelBookingButton({ bookingId, status, startTime, compact }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!["pending", "confirmed"].includes(status)) return null;

  const minsUntilStart = (new Date(startTime).getTime() - Date.now()) / 60_000;
  const refundLabel =
    minsUntilStart > 30
      ? "Full refund"
      : minsUntilStart > 0
      ? "50% refund"
      : "No refund (past start)";
  const refundNote =
    minsUntilStart > 30
      ? "Since your booking starts in more than 30 minutes you qualify for a full refund."
      : minsUntilStart > 0
      ? "Since your booking starts in less than 30 minutes only 50% will be refunded."
      : "The booking start time has already passed — no refund will be issued.";

  const cancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: reason.trim() || undefined }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Cancellation failed");
      setDone(true);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="text-xs text-txt-muted">Cancelled</span>
    );
  }

  return (
    <>
      {/* Trigger */}
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
          title="Cancel booking"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <GlowButton
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="border-red-500/40 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 hover:shadow-none"
        >
          Cancel booking
        </GlowButton>
      )}

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border-token bg-bg-elevated p-6 shadow-elevated">
            {/* Header */}
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Cancel booking?</h3>
                <p className="mt-0.5 text-xs text-txt-muted">This action cannot be undone.</p>
              </div>
            </div>

            {/* Refund info */}
            <div className="mb-4 rounded-xl border border-border-token bg-bg-surface/60 p-3">
              <p className="text-xs font-semibold text-txt-secondary">{refundLabel}</p>
              <p className="mt-1 text-xs text-txt-muted">{refundNote}</p>
            </div>

            {/* Optional reason */}
            <label className="block text-xs font-medium text-txt-secondary">
              Reason <span className="text-txt-disabled">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Let the host know why…"
              className="mt-1.5 w-full resize-none rounded-xl border border-border-token bg-bg-surface px-3 py-2 text-sm text-txt-primary placeholder:text-txt-disabled focus:border-electric/50 focus:outline-none"
            />

            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <GlowButton
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Keep booking
              </GlowButton>
              <button
                onClick={() => void cancel()}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
