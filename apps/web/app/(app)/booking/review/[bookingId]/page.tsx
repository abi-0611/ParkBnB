"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";

const SEEKER_TAGS = [
  { key: "clean",               label: "Clean spot" },
  { key: "safe",                label: "Safe area" },
  { key: "easy_access",         label: "Easy access" },
  { key: "good_lighting",       label: "Good lighting" },
  { key: "spacious",            label: "Spacious" },
  { key: "helpful_host",        label: "Helpful host" },
  { key: "accurate_description",label: "Accurate description" },
  { key: "great_value",         label: "Great value" },
];

const OWNER_TAGS = [
  { key: "clean",   label: "Left spot clean" },
  { key: "safe",    label: "Safe driver" },
  { key: "late",    label: "Arrived late" },
];

type Booking = {
  id: string;
  status: string;
  review_type: "seeker_to_owner" | "owner_to_seeker";
  spotTitle: string;
  otherPartyName: string;
  alreadyReviewed: boolean;
};

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/booking/review/info?bookingId=${bookingId}`);
      const data = (await res.json()) as Booking & { error?: string };
      if (!res.ok) { setLoadErr(data.error ?? "Not found"); return; }
      setBooking(data);
    } catch {
      setLoadErr("Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);

  const toggleTag = (key: string) => {
    setTags((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);
  };

  const submit = async () => {
    if (!booking) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const res = await fetch("/api/booking/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          tags,
          review_type: booking.review_type,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setSuccess(true);
    } catch (e) {
      setSubmitErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base">
        <Loader2 className="h-8 w-8 animate-spin text-electric" />
      </main>
    );
  }

  /* ─── Error state ─── */
  if (loadErr || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <GlassCard variant="elevated" className="max-w-sm py-14 text-center">
          <p className="text-txt-secondary">{loadErr ?? "Booking not found."}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-electric-bright hover:underline"
          >
            ← Go back
          </button>
        </GlassCard>
      </main>
    );
  }

  /* ─── Already reviewed ─── */
  if (booking.alreadyReviewed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <GlassCard variant="elevated" className="max-w-sm py-14 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald" />
          <h2 className="text-lg font-bold text-white">Already reviewed!</h2>
          <p className="mt-2 text-sm text-txt-secondary">You have already submitted a review for this booking.</p>
          <button
            onClick={() => router.push("/bookings")}
            className="mt-6 text-sm text-electric-bright hover:underline"
          >
            View my bookings
          </button>
        </GlassCard>
      </main>
    );
  }

  /* ─── Success state ─── */
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,rgba(16,185,129,0.12)_0%,transparent_65%)]" />
        <GlassCard variant="elevated" className="relative max-w-sm py-14 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald" />
          <h2 className="text-xl font-bold text-white">Review submitted!</h2>
          <p className="mt-2 text-sm text-txt-secondary">Thanks for sharing your experience.</p>
          <div className="mt-6 flex flex-col gap-3 px-6">
            <GlowButton variant="primary" fullWidth onClick={() => router.push("/bookings")}>
              My bookings
            </GlowButton>
          </div>
        </GlassCard>
      </main>
    );
  }

  const availableTags = booking.review_type === "seeker_to_owner" ? SEEKER_TAGS : OWNER_TAGS;
  const displayRating = hoverRating || rating;

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(61,123,255,0.07)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-lg px-4 py-8 pt-24 sm:px-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm text-txt-muted transition hover:text-txt-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <Pill variant="primary" className="mb-3">
            {booking.review_type === "seeker_to_owner" ? "Rate your parking spot" : "Rate your guest"}
          </Pill>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {booking.review_type === "seeker_to_owner"
              ? `How was ${booking.spotTitle}?`
              : `How was ${booking.otherPartyName}?`}
          </h1>
          <p className="mt-2 text-sm text-txt-muted">
            Booking #{bookingId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Stars */}
        <GlassCard variant="elevated" className="mb-4 p-6 text-center" hover={false}>
          <p className="mb-4 text-sm text-txt-muted">Tap to rate</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={[
                    "h-10 w-10 transition-colors",
                    n <= displayRating ? "fill-yellow-400 text-yellow-400" : "fill-none text-txt-disabled",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-txt-primary">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][displayRating]}
          </p>
        </GlassCard>

        {/* Tags */}
        <GlassCard variant="elevated" className="mb-4 p-5" hover={false}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-txt-muted">
            Quick tags <span className="text-txt-disabled">(optional)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleTag(key)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                  tags.includes(key)
                    ? "border-electric bg-electric/15 text-electric-bright"
                    : "border-border-token text-txt-muted hover:border-electric/40",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Comment */}
        <GlassCard variant="elevated" className="mb-6 p-5" hover={false}>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-txt-muted">
            Comment <span className="text-txt-disabled">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Share your experience…"
            className="w-full resize-none rounded-xl border border-border-token bg-bg-surface px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-disabled focus:border-electric/50 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-txt-disabled">{comment.length}/500</p>
        </GlassCard>

        {submitErr && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {submitErr}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <GlowButton
            variant="primary"
            fullWidth
            loading={submitting}
            onClick={() => void submit()}
          >
            Submit review
          </GlowButton>
          <GlowButton
            variant="ghost"
            fullWidth
            onClick={() => router.push("/bookings")}
            disabled={submitting}
          >
            Skip for now
          </GlowButton>
        </div>
      </div>
    </main>
  );
}
