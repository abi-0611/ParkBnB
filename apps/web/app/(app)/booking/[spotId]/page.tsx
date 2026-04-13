"use client";

import {
  type SpotSeekerDetail,
} from "@parknear/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Car, Clock, CreditCard, ArrowLeft,
  ArrowRight, AlertCircle, CheckCircle, Star,
} from "lucide-react";

import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion-variants";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

// ─── Helpers ────────────────────────────────────────────────
function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(localValue: string) {
  return new Date(localValue).toISOString();
}

function getDurationHours(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(0, (e - s) / 3_600_000);
}

// ─── Step indicator ─────────────────────────────────────────
function StepDot({ step, current }: { step: number; current: number }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
          done
            ? "bg-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            : active
            ? "bg-electric text-white shadow-glow-xs"
            : "border border-border-token text-txt-disabled"
        )}
      >
        {done ? <CheckCircle className="h-3.5 w-3.5" /> : step}
      </div>
      {step < 3 && (
        <div
          className={cn(
            "h-px w-8 transition-all duration-500",
            done ? "bg-emerald" : "bg-border-token"
          )}
        />
      )}
    </div>
  );
}

export default function WebBookingPage() {
  const params = useParams();
  const spotId = params.spotId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [spot, setSpot] = useState<SpotSeekerDetail | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; number_plate: string }[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rzpReady, setRzpReady] = useState(false);

  // Date/time state
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5, 0, 0); // default to 5 min from now
  const later = new Date(now.getTime() + 2 * 3_600_000); // default 2h duration

  const [startLocal, setStartLocal] = useState(toLocalDatetimeValue(now));
  const [endLocal, setEndLocal] = useState(toLocalDatetimeValue(later));

  const durationHrs = useMemo(
    () => getDurationHours(startLocal, endLocal),
    [startLocal, endLocal]
  );

  const estimatedPrice = useMemo(() => {
    if (!spot?.price_per_hour || durationHrs <= 0) return null;
    return Math.round(Number(spot.price_per_hour) * durationHrs);
  }, [spot, durationHrs]);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch(`/api/booking/init/${spotId}`);
    const json = (await res.json()) as {
      spot?: SpotSeekerDetail;
      vehicles?: { id: string; number_plate: string }[];
      error?: string;
    };
    if (!res.ok || !json.spot) {
      setErr(json.error ?? "Failed to load booking data");
      return;
    }
    setSpot(json.spot);
    setVehicles(json.vehicles ?? []);
    if (json.vehicles?.[0]) setVehicleId(json.vehicles[0].id);
  }, [spotId, session?.user?.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const sc = document.createElement("script");
    sc.src = "https://checkout.razorpay.com/v1/checkout.js";
    sc.async = true;
    sc.onload = () => setRzpReady(true);
    document.body.appendChild(sc);
    return () => { sc.remove(); };
  }, []);

  const onPay = async () => {
    if (!spot || !vehicleId) {
      setErr("Please select a vehicle.");
      return;
    }
    if (durationHrs <= 0) {
      setErr("End time must be after start time.");
      return;
    }
    if (new Date(startLocal) < new Date()) {
      setErr("Start time cannot be in the past.");
      return;
    }

    setBusy(true);
    setErr(null);
    const checkoutRes = await fetch("/api/booking/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId,
        vehicleId,
        bookingType: "hourly",
        startIso: toIso(startLocal),
        endIso: toIso(endLocal),
      }),
    });
    const checkoutJson = (await checkoutRes.json()) as {
      bookingId?: string;
      amountPaise?: number;
      keyId?: string;
      orderId?: string;
      error?: string;
    };
    if (!checkoutRes.ok || !checkoutJson.bookingId || !checkoutJson.orderId || !checkoutJson.keyId || !checkoutJson.amountPaise) {
      setErr(checkoutJson.error ?? "Failed to start checkout.");
      setBusy(false);
      return;
    }
    const bid = checkoutJson.bookingId;
    const paise = checkoutJson.amountPaise;

    if (!rzpReady || !window.Razorpay) {
      setErr("Payment gateway loading — please retry in a moment.");
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: checkoutJson.keyId,
      amount: paise,
      currency: "INR",
      order_id: checkoutJson.orderId,
      name: "ParkNear",
      description: spot.title,
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await fetch("/api/booking/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bid,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        const verifyJson = (await verifyRes.json()) as { error?: string };
        if (!verifyRes.ok) { setErr(verifyJson.error ?? "Payment verification failed"); setBusy(false); return; }
        router.push(`/booking/confirmation/${bid}`);
      },
    });
    rzp.open();
    setBusy(false);
  };

  // ─── Loading ───────────────────────────────────────────────
  if (!spot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric border-t-transparent" />
          <p className="text-sm text-txt-muted">Loading spot…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(61,123,255,0.10)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-lg px-4 py-8 pt-24 sm:px-6">
        {/* Back link */}
        <Link
          href={`/spot/${spotId}`}
          className="mb-6 flex items-center gap-1.5 text-sm text-txt-muted transition-colors hover:text-txt-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to spot
        </Link>

        {/* Step indicators */}
        <div className="mb-6 flex items-center">
          {[1, 2, 3].map((s) => (
            <StepDot key={s} step={s} current={3} />
          ))}
          <span className="ml-3 text-xs text-txt-muted">Booking & payment</span>
        </div>

        {/* ─── Spot summary ─── */}
        <GlassCard variant="elevated" className="mb-4 p-4" hover={false}>
          <div className="flex gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-electric/10">
              <MapPin className="h-6 w-6 text-electric-bright" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-white leading-tight">{spot.title}</h1>
              {spot.fuzzy_landmark && (
                <p className="mt-0.5 text-xs text-txt-muted">{String(spot.fuzzy_landmark)}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {spot.price_per_hour != null && (
                  <Pill variant="primary" className="text-[10px]">
                    ₹{spot.price_per_hour}/hr
                  </Pill>
                )}
                {spot.avg_rating != null && (
                  <span className="flex items-center gap-0.5 text-[10px] text-txt-muted">
                    <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                    {Number(spot.avg_rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ─── Booking form ─── */}
        <GlassCard variant="elevated" className="mb-4 p-5" hover={false}>
          <h2 className="mb-4 text-sm font-semibold text-white">Select date & time</h2>

          <div className="space-y-4">
            {/* Start */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-txt-muted">
                <Clock className="h-3.5 w-3.5" />
                Start time
              </label>
              <input
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className="w-full rounded-xl border border-border-token bg-bg-elevated px-4 py-2.5 text-sm text-txt-primary outline-none transition-all focus:border-electric focus:shadow-glow-xs [color-scheme:dark]"
              />
            </div>

            {/* End */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-txt-muted">
                <Clock className="h-3.5 w-3.5" />
                End time
              </label>
              <input
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className="w-full rounded-xl border border-border-token bg-bg-elevated px-4 py-2.5 text-sm text-txt-primary outline-none transition-all focus:border-electric focus:shadow-glow-xs [color-scheme:dark]"
              />
            </div>

            {/* Duration indicator */}
            {durationHrs > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl bg-electric/8 px-4 py-2.5"
              >
                <span className="text-xs text-txt-secondary">Duration</span>
                <span className="text-sm font-semibold text-electric-bright">
                  {durationHrs < 1
                    ? `${Math.round(durationHrs * 60)} min`
                    : `${durationHrs.toFixed(1)} hr${durationHrs !== 1 ? "s" : ""}`}
                </span>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* ─── Vehicle ─── */}
        <GlassCard variant="elevated" className="mb-4 p-5" hover={false}>
          <h2 className="mb-4 text-sm font-semibold text-white">Select vehicle</h2>

          {vehicles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-token p-4 text-center">
              <Car className="mx-auto mb-2 h-6 w-6 text-txt-disabled" />
              <p className="text-xs text-txt-muted">No vehicles added.</p>
              <Link href="/profile" className="mt-1 inline-block text-xs text-electric-bright hover:underline">
                Add a vehicle from your profile
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <motion.button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200",
                    vehicleId === v.id
                      ? "border-electric/40 bg-electric/10 shadow-glow-xs"
                      : "border-border-token bg-bg-elevated hover:border-border-token-bright"
                  )}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snappy}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      vehicleId === v.id ? "bg-electric/20" : "bg-bg-overlay"
                    )}
                  >
                    <Car className={cn("h-4 w-4", vehicleId === v.id ? "text-electric-bright" : "text-txt-muted")} />
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold",
                      vehicleId === v.id ? "text-white" : "text-txt-secondary"
                    )}
                  >
                    {v.number_plate}
                  </span>
                  {vehicleId === v.id && (
                    <motion.span
                      layoutId="vehicle-check"
                      className="ml-auto"
                    >
                      <CheckCircle className="h-4 w-4 text-electric-bright" />
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* ─── Price summary ─── */}
        <AnimatePresence>
          {estimatedPrice !== null && durationHrs > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={springs.gentle}
            >
              <GlassCard variant="elevated" className="mb-4 overflow-hidden" hover={false}>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />
                <div className="p-5">
                  <h2 className="mb-4 text-sm font-semibold text-white">Price breakdown</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-txt-secondary">
                        ₹{spot.price_per_hour}/hr × {durationHrs.toFixed(1)} hr
                      </span>
                      <span className="text-txt-primary">₹{estimatedPrice}</span>
                    </div>
                    <div className="h-px bg-border-token" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-xl font-bold text-white">₹{estimatedPrice}</span>
                    </div>
                    <p className="text-[10px] text-txt-disabled">
                      Final amount calculated at checkout. No hidden fees.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Error banner ─── */}
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CTA ─── */}
        <GlowButton
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          onClick={() => void onPay()}
          disabled={busy || vehicles.length === 0 || durationHrs <= 0}
          icon={<CreditCard className="h-4 w-4" />}
        >
          {busy ? "Processing…" : `Pay ₹${estimatedPrice ?? "—"} · Confirm booking`}
        </GlowButton>

        <p className="mt-3 text-center text-xs text-txt-disabled">
          Secured by Razorpay · No charge until confirmed
          <ArrowRight className="ml-1 inline h-3 w-3" />
        </p>
      </div>
    </main>
  );
}
