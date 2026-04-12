"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { MapPin, Navigation, Star, ArrowRight, Zap } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { staggerContainer, wordReveal, springs } from "@/lib/motion-variants";

interface HeroSectionProps {
  spotCount: number | null;
  locale: "en" | "ta";
}

const WORDS = ["Find", "your", "parking", "spot", "in", "seconds."];

export function HeroSection({ spotCount, locale }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgY         = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-4 pt-20 pb-12"
    >
      {/* ─── Layered backgrounds ─── */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ y: bgY }}>
        <div className="absolute inset-0 bg-bg-base" />
        <div className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(61,123,255,0.18)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-grid-sm opacity-100" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-base to-transparent" />

        <motion.div
          className="absolute left-1/4 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric/8 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-1/4 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-neon/8 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald/6 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </motion.div>

      {/* ─── Content ─── */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ delay: 0.2, ...springs.bouncy }}
        >
          <Pill variant="neon" pulse className="mb-6 sm:mb-8">
            <Zap className="h-3 w-3" />
            {locale === "ta" ? "சென்னையில் புதுமையான பார்க்கிங்" : "Now live in Chennai"}
          </Pill>
        </motion.div>

        {/* Headline — word-by-word stagger */}
        <motion.h1
          className="mb-5 max-w-2xl overflow-visible text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl"
          variants={staggerContainer(0.07, 0.3)}
          initial="hidden"
          animate="visible"
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {WORDS.map((word, i) => (
            <motion.span
              key={i}
              className={
                word === "parking"
                  ? "text-gradient inline-block mr-[0.22em]"
                  : "inline-block mr-[0.22em] text-white"
              }
              variants={wordReveal}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mb-8 max-w-lg px-2 text-base text-txt-secondary sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0   }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {locale === "ta"
            ? "உங்கள் இடத்துக்கு அருகில் பார்க்கிங் கண்டுபிடித்து, உடனடியாக புக் செய்யுங்கள்."
            : "Discover verified parking spots near your destination and book instantly — no driving in circles."}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mb-10 flex flex-wrap items-center justify-center gap-3 sm:mb-14"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0   }}
          transition={{ delay: 1.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/search">
            <GlowButton variant="primary" size="lg" icon={<Navigation className="h-4 w-4" />}>
              {locale === "ta" ? "பார்க்கிங் தேடு" : "Find parking now"}
            </GlowButton>
          </Link>
          <Link href="/login">
            <GlowButton
              variant="glass"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
            >
              {locale === "ta" ? "இடம் பட்டியலிடு" : "List your space"}
            </GlowButton>
          </Link>
        </motion.div>

        {/* ─── Stats row ─── */}
        <motion.div
          className="mb-10 flex flex-wrap items-center justify-center gap-6 sm:mb-14 sm:gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {[
            {
              value: spotCount ?? 120,
              suffix: "+",
              label: locale === "ta" ? "சரிபார்க்கப்பட்ட இடங்கள்" : "Verified spots",
            },
            { value: 4.9, suffix: "", label: locale === "ta" ? "சராசரி மதிப்பீடு" : "Avg rating", decimals: 1 },
            { value: 2,   suffix: "m", label: locale === "ta" ? "சராசரி தேடல் நேரம்" : "Avg search time" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                decimals={(stat as { decimals?: number }).decimals ?? 0}
                className="text-2xl font-bold text-white text-glow sm:text-3xl"
              />
              <span className="text-xs font-medium uppercase tracking-wider text-txt-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ─── Floating UI mockup ─── */}
        <motion.div
          className="relative w-full max-w-md px-2 sm:max-w-lg sm:px-0"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Blue underglow */}
          <div className="absolute -inset-4 -bottom-8 rounded-3xl bg-electric/20 blur-3xl" />
          <div className="absolute -inset-2 -bottom-4 rounded-3xl bg-neon/10 blur-2xl" />

          <GlassCard variant="elevated" hover={false} className="overflow-hidden rounded-3xl border-electric/20">
            {/* Fake dark map */}
            <div className="relative h-52 w-full overflow-hidden bg-bg-overlay sm:h-64">
              <div className="absolute inset-0 bg-grid opacity-60" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 256">
                <defs>
                  <filter id="glow-road">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <line x1="0" y1="80"  x2="400" y2="80"  stroke="rgba(0,170,255,0.35)" strokeWidth="1.5" filter="url(#glow-road)" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="rgba(0,170,255,0.25)" strokeWidth="1"   filter="url(#glow-road)" />
                <line x1="120" y1="0" x2="120" y2="256" stroke="rgba(0,170,255,0.30)" strokeWidth="1.5" filter="url(#glow-road)" />
                <line x1="280" y1="0" x2="280" y2="256" stroke="rgba(0,170,255,0.20)" strokeWidth="1"   filter="url(#glow-road)" />
                <line x1="0" y1="200" x2="200" y2="0"   stroke="rgba(61,123,255,0.20)"  strokeWidth="1" filter="url(#glow-road)" />
                <path
                  d="M 60 220 Q 120 160 200 128 T 340 80"
                  stroke="rgba(0,170,255,0.80)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#glow-road)"
                />
              </svg>

              <motion.div
                className="absolute left-1/2 top-6 -translate-x-1/2"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Pill variant="neon" pulse className="shadow-glow-neon">
                  <Navigation className="h-3 w-3" />
                  Arriving in 2 min
                </Pill>
              </motion.div>

              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-electric/20 blur-md" />
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-electric shadow-glow-md">
                    <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="absolute inset-0 animate-ping-slow rounded-full bg-electric/30" />
                </div>
              </motion.div>
            </div>

            {/* Bottom card info */}
            <div className="p-4">
              <p className="mb-3 text-xs font-medium text-txt-muted">
                4800 Anna Salai, Chennai
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-electric to-neon shadow-glow-sm" />
                  <div>
                    <p className="text-sm font-semibold text-txt-primary">Ravi S.</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="text-xs text-txt-secondary">4.80</span>
                    </div>
                  </div>
                </div>
                <Pill variant="emerald">
                  <span>₹40 / hr</span>
                </Pill>
              </div>
            </div>
          </GlassCard>

          {/* Floating chip — top left (hidden on very small screens) */}
          <motion.div
            className="absolute -left-2 top-16 hidden sm:-left-10 sm:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0   }}
            transition={{ delay: 1.3, ...springs.bouncy }}
          >
            <GlassCard variant="bright" hover={false} className="p-3 pr-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald/15">
                  <Zap className="h-3.5 w-3.5 text-emerald" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Instant book</p>
                  <p className="text-[10px] text-txt-muted">No approval needed</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Floating chip — bottom right (hidden on very small screens) */}
          <motion.div
            className="absolute -right-2 bottom-16 hidden sm:-right-10 sm:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ delay: 1.5, ...springs.bouncy }}
          >
            <GlassCard variant="bright" hover={false} className="p-3 pl-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/15">
                  <Star className="h-3.5 w-3.5 fill-electric text-electric" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Verified spots</p>
                  <p className="text-[10px] text-txt-muted">KYC checked owners</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ─── Scroll indicator ─── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.div
          className="flex h-10 w-6 items-start justify-center rounded-full border border-border-token p-1.5"
          animate={{ borderColor: ["rgba(99,126,255,0.15)", "rgba(99,126,255,0.40)", "rgba(99,126,255,0.15)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="h-1.5 w-1 rounded-full bg-electric"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
