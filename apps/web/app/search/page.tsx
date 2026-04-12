"use client";

import { searchSpotsNearby, type SearchSpotsResult } from "@parknear/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, SlidersHorizontal, Star,
  AlertCircle, Locate, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeUp, springs } from "@/lib/motion-variants";

const CHENNAI = { lat: 13.0827, lng: 80.2707 };

function formatInr(n: string | number | null | undefined) {
  if (n == null) return "—";
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? `₹${Math.round(num)}` : "—";
}

// ─── Skeleton card ──────────────────────────────────────────
function SpotSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border-token bg-bg-surface p-4">
      <div className="h-24 w-24 shrink-0 rounded-xl skeleton" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-4 w-3/4 rounded-lg skeleton" />
        <div className="h-3 w-1/2 rounded-lg skeleton" />
        <div className="h-3 w-2/3 rounded-lg skeleton" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 rounded-full skeleton" />
          <div className="h-6 w-20 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}

// ─── Spot card ──────────────────────────────────────────────
function SpotCard({ spot, index }: { spot: SearchSpotsResult; index: number }) {
  const photo = spot.photos[0];
  const rating =
    typeof spot.avg_rating === "number"
      ? spot.avg_rating
      : Number(spot.avg_rating) || null;
  const dist = spot.distance_meters
    ? spot.distance_meters < 1000
      ? `${Math.round(spot.distance_meters)} m`
      : `${(spot.distance_meters / 1000).toFixed(1)} km`
    : null;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      layout
    >
      <Link href={`/spot/${spot.id}`}>
        <motion.div
          className="group flex gap-4 rounded-2xl border border-border-token bg-bg-surface p-4 transition-colors"
          whileHover={{
            borderColor: "rgba(61,123,255,0.35)",
            boxShadow: "0 0 20px rgba(61,123,255,0.12), 0 8px 32px rgba(0,0,0,0.40)",
            y: -2,
          }}
          transition={springs.gentle}
        >
          {/* Photo */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-bg-elevated">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={spot.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <MapPin className="h-8 w-8 text-txt-disabled" />
              </div>
            )}
            {/* Available indicator */}
            <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald shadow-glow-emerald" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-txt-primary">{spot.title}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-electric-bright">
                {formatInr(spot.price_per_hour)}
                <span className="text-xs font-normal text-txt-muted">/hr</span>
              </span>
              {dist && (
                <span className="flex items-center gap-1 text-xs text-txt-muted">
                  <Navigation className="h-3 w-3" />
                  {dist}
                </span>
              )}
              {rating !== null && (
                <span className="flex items-center gap-1 text-xs text-txt-secondary">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {spot.fuzzy_landmark && (
              <p className="mt-1.5 line-clamp-1 text-xs text-txt-muted">
                {spot.fuzzy_landmark}
              </p>
            )}

            <div className="mt-2.5 flex gap-2">
              <Pill variant="emerald">{formatInr(spot.price_per_hour)}/hr</Pill>
              {dist && <Pill variant="ghost">{dist} away</Pill>}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-shrink-0 items-center self-center">
            <ChevronDown className="h-4 w-4 -rotate-90 text-txt-disabled transition-colors group-hover:text-electric-bright" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Radius chip ────────────────────────────────────────────
function RadiusChip({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  const label = value < 1000 ? `${value}m` : `${value / 1000}km`;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-electric bg-electric/15 text-electric-bright shadow-glow-xs"
          : "border-border-token bg-bg-surface text-txt-muted hover:border-electric/40 hover:text-txt-secondary"
      )}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={springs.snappy}
    >
      {label}
    </motion.button>
  );
}

// ─── Empty state ─────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.gentle}
    >
      <motion.div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-bg-elevated border border-border-token"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <MapPin className="h-9 w-9 text-txt-disabled" />
      </motion.div>
      <p className="text-base font-semibold text-txt-secondary">No spots found nearby</p>
      <p className="mt-2 max-w-xs text-sm text-txt-muted">
        Try expanding the radius or use your current location.
      </p>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────
const RADII = [500, 1000, 2000, 5000];

export default function SearchPage() {
  const [lat, setLat]       = useState(CHENNAI.lat);
  const [lng, setLng]       = useState(CHENNAI.lng);
  const [radius, setRadius] = useState(2000);
  const [spots, setSpots]   = useState<SearchSpotsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [located, setLocated] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data, error } = await searchSpotsNearby(supabase, {
        lat,
        lng,
        radius_meters: radius,
      });
      if (error) setErr(error.message);
      setSpots(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed");
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius]);

  useEffect(() => { void run(); }, [run]);

  const useBrowserLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocated(true);
      },
      () => setErr("Location denied — showing Chennai results."),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  };

  return (
    <main className="min-h-screen bg-bg-base pb-20 pt-20">
      {/* ─── Header ─── */}
      <motion.div
        className="sticky top-16 z-30 border-b border-border-token bg-bg-base/90 backdrop-blur-xl"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          {/* Title row */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Find parking</h1>
              <p className="text-xs text-txt-muted">
                {loading
                  ? "Searching…"
                  : `${spots.length} spot${spots.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {located && (
                <Pill variant="neon" pulse animate>
                  <Navigation className="h-3 w-3" />
                  Live location
                </Pill>
              )}
              <GlowButton
                variant="glass"
                size="sm"
                icon={<Locate className="h-3.5 w-3.5" />}
                onClick={useBrowserLocation}
              >
                Locate me
              </GlowButton>
            </div>
          </div>

          {/* Radius chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-txt-muted">
              <SlidersHorizontal className="h-3 w-3" />
              Radius
            </span>
            <div className="flex gap-2">
              {RADII.map((r) => (
                <RadiusChip
                  key={r}
                  value={r}
                  active={radius === r}
                  onClick={() => setRadius(r)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Body ─── */}
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {/* Error banner */}
        <AnimatePresence>
          {err && (
            <motion.div
              className="mb-4 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springs.snappy}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading && (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ...springs.gentle }}
              >
                <SpotSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results */}
        {!loading && spots.length > 0 && (
          <motion.ul
            className="flex flex-col gap-3"
            variants={staggerContainer(0.06, 0)}
            initial="hidden"
            animate="visible"
          >
            {spots.map((s, i) => (
              <li key={s.id}>
                <SpotCard spot={s} index={i} />
              </li>
            ))}
          </motion.ul>
        )}

        {/* Empty state */}
        {!loading && spots.length === 0 && !err && <EmptyState />}

        {/* Results count */}
        {!loading && spots.length > 0 && (
          <motion.p
            className="mt-6 text-center text-xs text-txt-disabled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Showing {spots.length} verified spots · Fuzzy locations only
          </motion.p>
        )}
      </div>
    </main>
  );
}
