"use client";

import Link from "next/link";
import { getSpotPhotoPublicUrl } from "@parknear/shared";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Star, Clock, Shield, ChevronLeft,
  ChevronRight, User, Calendar,
} from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { fadeUp, slideInRight, springs, staggerContainer } from "@/lib/motion-variants";

interface Review {
  rating: unknown;
  reviewer_name: unknown;
  comment: unknown;
}

function formatInr(n: unknown) {
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? `₹${Math.round(num)}` : "—";
}

// ─── Photo gallery ──────────────────────────────────────────
function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-3xl border border-border-token bg-bg-elevated sm:h-96">
        <MapPin className="h-12 w-12 text-txt-disabled" />
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Blue underglow */}
      <div className="absolute -inset-2 -bottom-8 rounded-3xl bg-electric/15 blur-3xl" />

      <div className="relative h-72 w-full sm:h-96">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={photos[current]}
            alt={`${title} - photo ${current + 1}`}
            className="h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-base/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-bg-base/40 to-transparent" />

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <motion.button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg-base/70 backdrop-blur-sm border border-border-token text-txt-primary"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(9,9,23,0.9)" }}
              whileTap={{ scale: 0.92 }}
              transition={springs.snappy}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg-base/70 backdrop-blur-sm border border-border-token text-txt-primary"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(9,9,23,0.9)" }}
              whileTap={{ scale: 0.92 }}
              transition={springs.snappy}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-electric shadow-glow-xs" : "w-1.5 bg-white/30"
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        )}

        {/* Counter pill */}
        <div className="absolute right-3 top-3">
          <Pill variant="ghost">
            {current + 1} / {photos.length}
          </Pill>
        </div>
      </div>
    </div>
  );
}

// ─── Review card ────────────────────────────────────────────
function ReviewCard({ review, index }: { review: Review; index: number }) {
  const rating = Number(review.rating) || 0;
  return (
    <motion.li
      variants={fadeUp}
      custom={index}
      className="rounded-2xl border border-border-token bg-bg-surface p-4"
      whileHover={{ borderColor: "rgba(99,126,255,0.25)", y: -2 }}
      transition={springs.gentle}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric/10">
            <User className="h-4 w-4 text-electric-bright" />
          </div>
          <span className="text-sm font-semibold text-txt-primary">
            {String(review.reviewer_name ?? "Anonymous")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < Math.round(rating) ? "fill-warning text-warning" : "text-txt-disabled"}`}
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-txt-secondary">{rating.toFixed(1)}</span>
        </div>
      </div>
      {review.comment ? (
        <p className="text-sm text-txt-secondary">{String(review.comment)}</p>
      ) : null}
    </motion.li>
  );
}

// ─── Main component ─────────────────────────────────────────
export function SpotDetailClient({
  data,
  spotId,
}: {
  data: Record<string, unknown>;
  spotId: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const photosRaw  = Array.isArray(data.photos)  ? (data.photos  as string[]) : [];
  const photos = photosRaw.map((p) => getSpotPhotoPublicUrl(supabaseUrl, p));
  const reviews = Array.isArray(data.reviews) ? (data.reviews as Review[])                         : [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : null;

  return (
    <main className="min-h-screen bg-bg-base pb-32 pt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/search"
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-txt-muted transition-colors hover:text-txt-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ─── Left column ─── */}
          <div>
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <PhotoGallery photos={photos} title={String(data.title ?? "")} />
            </motion.div>

            {/* Spot info */}
            <AnimatedSection className="mt-8" stagger staggerDelay={0.07}>
              <AnimatedItem variants={fadeUp}>
                <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {String(data.title ?? "")}
                  </h1>
                  {avgRating !== null && (
                    <div className="flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/8 px-3 py-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <span className="text-sm font-bold text-warning">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-txt-muted">({reviews.length})</span>
                    </div>
                  )}
                </div>
                {data.fuzzy_landmark ? (
                  <p className="flex items-center gap-1.5 text-sm text-txt-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {String(data.fuzzy_landmark)}
                  </p>
                ) : null}
              </AnimatedItem>

              {/* Vehicle types / amenities pills */}
              <AnimatedItem variants={fadeUp}>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill variant="primary">
                    <Shield className="h-3 w-3" />
                    Verified spot
                  </Pill>
                  {data.price_per_hour != null ? (
                    <Pill variant="emerald">
                      <Clock className="h-3 w-3" />
                      {formatInr(data.price_per_hour)}/hr
                    </Pill>
                  ) : null}
                  {data.price_per_day != null ? (
                    <Pill variant="ghost">
                      <Calendar className="h-3 w-3" />
                      {formatInr(data.price_per_day)}/day
                    </Pill>
                  ) : null}
                </div>
              </AnimatedItem>

              {/* Host card */}
              <AnimatedItem variants={fadeUp}>
                <GlassCard variant="elevated" hover glow className="mt-6 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-txt-muted">
                    Your host
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-neon shadow-glow-sm">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-txt-primary">
                        {String(data.owner_name ?? "Host")}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Shield className="h-3 w-3 text-emerald" />
                        <span className="text-xs text-emerald">KYC verified</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </AnimatedItem>

              {/* Reviews */}
              <AnimatedItem variants={fadeUp}>
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      Reviews
                      {reviews.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-txt-muted">
                          ({reviews.length})
                        </span>
                      )}
                    </h2>
                    {avgRating !== null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-bold text-txt-primary">{avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <p className="rounded-2xl border border-border-token bg-bg-surface px-5 py-8 text-center text-sm text-txt-muted">
                      No reviews yet — be the first to book!
                    </p>
                  ) : (
                    <motion.ul
                      className="space-y-3"
                      variants={staggerContainer(0.06)}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-60px" }}
                    >
                      {reviews.map((r, i) => (
                        <ReviewCard key={i} review={r} index={i} />
                      ))}
                    </motion.ul>
                  )}
                </div>
              </AnimatedItem>
            </AnimatedSection>
          </div>

          {/* ─── Right sticky booking card ─── */}
          <motion.div
            className="lg:sticky lg:top-24 lg:self-start"
            variants={slideInRight}
            initial="hidden"
            animate="visible"
          >
            <GlassCard variant="bright" hover={false} className="p-6">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-electric-bright text-glow">
                    {formatInr(data.price_per_hour)}
                  </span>
                  <span className="text-sm text-txt-muted">/hour</span>
                </div>
                {data.price_per_day != null ? (
                  <p className="mt-0.5 text-sm text-txt-secondary">
                    or {formatInr(data.price_per_day)} per day
                  </p>
                ) : null}
              </div>

              {/* Rating summary */}
              {avgRating !== null && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-border-token bg-bg-base/60 px-3 py-2.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < Math.round(avgRating) ? "fill-warning text-warning" : "text-txt-disabled"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-txt-primary">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-txt-muted">
                    · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Perks list */}
              <ul className="mb-6 space-y-2.5">
                {[
                  { icon: Shield,   text: "Verified by ParkNear" },
                  { icon: Clock,    text: "Flexible hourly booking" },
                  { icon: MapPin,   text: "Exact address after booking" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm text-txt-secondary">
                    <item.icon className="h-4 w-4 shrink-0 text-electric-bright" strokeWidth={1.75} />
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={`/booking/${spotId}`} className="block">
                <GlowButton variant="primary" size="lg" fullWidth>
                  Book now
                </GlowButton>
              </Link>

              <p className="mt-4 text-center text-xs text-txt-disabled">
                No charge until confirmed · Free cancellation
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
