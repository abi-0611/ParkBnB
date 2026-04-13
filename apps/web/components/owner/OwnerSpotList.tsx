"use client";

import type { Spot } from "@parknear/shared";
import { getSpotPhotoPublicUrl } from "@parknear/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Edit3, Calendar, Power, PowerOff, ChevronRight, MapPin, ParkingSquare,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { GlowButton } from "@/components/ui/glow-button";
import { springs } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";

export function OwnerSpotList({ spots }: { spots: Spot[] }) {
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function toggle(id: string, isActive: boolean) {
    setBusy(id);
    await fetch("/api/owner/spots/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId: id, isActive: !isActive }),
    });
    setBusy(null);
    router.refresh();
  }

  async function deactivate(id: string) {
    setBusy(id);
    setConfirmId(null);
    await fetch("/api/owner/spots/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId: id, isActive: false }),
    });
    setBusy(null);
    router.refresh();
  }

  if (!spots.length) {
    return null; // parent renders empty state
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {spots.map((spot, index) => {
          const thumb = spot.photos?.[0];
          const src = thumb ? getSpotPhotoPublicUrl(url, thumb) : null;
          const isLoading = busy === spot.id;

          return (
            <motion.li
              key={spot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ delay: index * 0.05, ...springs.gentle }}
            >
              <motion.div
                whileHover={{ y: -2 }}
                transition={springs.snappy}
              >
                <GlassCard
                  variant="elevated"
                  hover={false}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isLoading && "opacity-60"
                  )}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                    {/* ─── Photo ─── */}
                    <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-bg-overlay sm:h-24 sm:w-32">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={spot.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ParkingSquare className="h-8 w-8 text-txt-disabled" />
                        </div>
                      )}
                      {/* Status overlay dot */}
                      <div className="absolute left-2 top-2">
                        <span
                          className={cn(
                            "flex h-2 w-2 rounded-full",
                            spot.is_active ? "bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-txt-disabled"
                          )}
                        />
                      </div>
                    </div>

                    {/* ─── Info ─── */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{spot.title}</h3>
                        <Pill
                          variant={spot.is_active ? "emerald" : "primary"}
                          className="text-[10px]"
                        >
                          {spot.is_active ? "Active" : "Paused"}
                        </Pill>
                      </div>

                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-txt-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {spot.spot_type ?? "—"} · {spot.coverage ?? "—"}
                        </span>
                        {spot.price_per_hour != null && (
                          <span className="font-semibold text-electric-bright">
                            ₹{spot.price_per_hour}/hr
                          </span>
                        )}
                      </div>

                      {Number(spot.total_reviews) > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-xs font-medium text-txt-secondary">
                            {Number(spot.avg_rating).toFixed(1)}
                          </span>
                          <span className="text-xs text-txt-muted">
                            ({spot.total_reviews} review{Number(spot.total_reviews) !== 1 ? "s" : ""})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-txt-disabled">No reviews yet</span>
                      )}
                    </div>

                    {/* ─── Actions ─── */}
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Link href={`/spots/${spot.id}`}>
                        <GlowButton variant="glass" size="sm" icon={<Edit3 className="h-3.5 w-3.5" />}>
                          Edit
                        </GlowButton>
                      </Link>
                      <Link href={`/spots/${spot.id}/availability`}>
                        <GlowButton variant="ghost" size="sm" icon={<Calendar className="h-3.5 w-3.5" />}>
                          Schedule
                        </GlowButton>
                      </Link>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void toggle(spot.id, spot.is_active)}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all",
                          spot.is_active
                            ? "border-warning/30 bg-warning/8 text-warning hover:bg-warning/15"
                            : "border-emerald/30 bg-emerald/8 text-emerald hover:bg-emerald/15",
                          "disabled:opacity-50"
                        )}
                      >
                        {spot.is_active ? (
                          <><PowerOff className="h-3 w-3" /> Pause</>
                        ) : (
                          <><Power className="h-3 w-3" /> Activate</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ─── Deactivate confirm banner ─── */}
                  <AnimatePresence>
                    {confirmId === spot.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springs.snappy}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-t border-border-token bg-danger/5 px-5 py-3">
                          <p className="text-xs text-danger">
                            This will permanently deactivate the listing.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-txt-muted hover:text-txt-primary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => void deactivate(spot.id)}
                              className="rounded-lg bg-danger/20 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/30 disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>

              {/* Deactivate trigger (shown below the card) */}
              {confirmId !== spot.id && (
                <div className="mt-1 flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => setConfirmId(spot.id)}
                    className="flex items-center gap-1 text-[11px] text-txt-disabled transition-colors hover:text-danger"
                  >
                    <ChevronRight className="h-3 w-3 rotate-90" />
                    Deactivate listing
                  </button>
                </div>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
