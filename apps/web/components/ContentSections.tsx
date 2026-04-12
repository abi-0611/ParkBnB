"use client";

import { motion } from "framer-motion";
import { Search, CreditCard, ParkingSquare, Shield, Star, MapPin, Zap, Lock, Clock, CheckCircle } from "lucide-react";
import { GlassCard, BentoCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { AnimatedSection, AnimatedItem, StaggerGrid } from "@/components/ui/animated-section";
import { fadeUp } from "@/lib/motion-variants";

// ─── How It Works ───────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Search nearby",
    body: "Enter your destination and find verified parking spots within seconds.",
    color: "electric",
  },
  {
    num: "02",
    icon: CreditCard,
    title: "Book & pay",
    body: "Secure your spot with instant payment. Get directions to the exact location.",
    color: "neon",
  },
  {
    num: "03",
    icon: ParkingSquare,
    title: "Park stress-free",
    body: "Drive straight in. No hunting, no waiting — parking exactly where you need it.",
    color: "emerald",
  },
];

const stepColors = {
  electric: {
    bg:     "bg-electric/10",
    icon:   "text-electric-bright",
    pill:   "text-electric border-electric/30 bg-electric/10",
    glow:   "rgba(61,123,255,0.20)",
  },
  neon: {
    bg:     "bg-neon/10",
    icon:   "text-neon-bright",
    pill:   "text-neon-bright border-neon/30 bg-neon/10",
    glow:   "rgba(0,170,255,0.20)",
  },
  emerald: {
    bg:     "bg-emerald/10",
    icon:   "text-emerald",
    pill:   "text-[#34D399] border-emerald/30 bg-emerald/10",
    glow:   "rgba(16,185,129,0.20)",
  },
} as const;

export function HowItWorksSection() {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28" stagger staggerDelay={0.1}>
      <AnimatedItem variants={fadeUp} className="mb-4 flex justify-center">
        <Pill variant="primary">How It Works</Pill>
      </AnimatedItem>

      <AnimatedItem variants={fadeUp} className="mb-10 text-center sm:mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Parking in{" "}
          <span className="text-gradient">3 simple steps</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-txt-secondary">
          From searching to parking in under a minute. No apps to install, no queues.
        </p>
      </AnimatedItem>

      {/* Steps */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-electric/30 via-neon/20 to-emerald/30 lg:block" />

        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, i) => {
            const c = stepColors[step.color as keyof typeof stepColors];
            return (
              <AnimatedItem key={step.num} variants={fadeUp}>
                <motion.div
                  className="group relative"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <GlassCard variant="elevated" hover={false} className="h-full p-6" glow>
                    {/* Step number */}
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.pill}`}
                      >
                        Step {step.num}
                      </span>
                      {/* Number glow indicator */}
                      <motion.div
                        className="text-5xl font-black text-white/4 select-none"
                        whileHover={{ opacity: 0.08 }}
                      >
                        {step.num}
                      </motion.div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg}`}
                      style={{ boxShadow: `0 0 20px ${c.glow}` }}
                    >
                      <step.icon className={`h-6 w-6 ${c.icon}`} strokeWidth={1.75} />
                    </div>

                    <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm text-txt-secondary">{step.body}</p>

                    {/* Progress dots */}
                    <div className="mt-6 flex gap-1.5">
                      {STEPS.map((_, j) => (
                        <div
                          key={j}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            j <= i ? `flex-1 ${c.bg} border border-current opacity-80` : "w-6 bg-bg-elevated"
                          }`}
                        />
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              </AnimatedItem>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ─── Features bento grid ───────────────────────────────────
const FEATURES = [
  {
    icon: Shield,
    title: "KYC-verified owners",
    body: "Every listing owner is ID-verified before they can accept bookings.",
    colSpan: 2 as const,
    pill: "Trust & Safety",
    pillVariant: "emerald" as const,
  },
  {
    icon: Zap,
    title: "Instant confirmation",
    body: "Get booking confirmation in under 3 seconds.",
    colSpan: 1 as const,
    pill: "Fast",
    pillVariant: "neon" as const,
  },
  {
    icon: Clock,
    title: "Real-time availability",
    body: "Live slot updates — if it's listed, it's available right now.",
    colSpan: 1 as const,
    pill: "Live",
    pillVariant: "primary" as const,
  },
  {
    icon: Lock,
    title: "Secure payments",
    body: "Razorpay-powered payments with automatic refunds on cancellations.",
    colSpan: 2 as const,
    pill: "Payments",
    pillVariant: "primary" as const,
  },
  {
    icon: Star,
    title: "Two-way reviews",
    body: "Owners and seekers rate each other, keeping the community trustworthy.",
    colSpan: 1 as const,
    pill: "Community",
    pillVariant: "emerald" as const,
  },
  {
    icon: MapPin,
    title: "In-app navigation",
    body: "Get turn-by-turn directions directly to the spot — no copy-pasting addresses.",
    colSpan: 2 as const,
    pill: "Navigation",
    pillVariant: "neon" as const,
  },
];

export function FeaturesSection() {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28" stagger>
      <AnimatedItem variants={fadeUp} className="mb-4 flex justify-center">
        <Pill variant="primary">Features</Pill>
      </AnimatedItem>

      <AnimatedItem variants={fadeUp} className="mb-10 text-center sm:mb-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything you need,{" "}
          <span className="text-gradient">nothing you don&#39;t</span>
        </h2>
      </AnimatedItem>

      <StaggerGrid
        className="grid-cols-1 gap-4 md:grid-cols-3"
        stagger={0.06}
      >
        {FEATURES.map((f) => (
          <AnimatedItem
            key={f.title}
            variants={fadeUp}
            className={f.colSpan === 2 ? "md:col-span-2" : ""}
          >
            <BentoCard colSpan={f.colSpan} className="h-full">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10">
                  <f.icon className="h-5 w-5 text-electric-bright" strokeWidth={1.75} />
                </div>
                <Pill variant={f.pillVariant}>{f.pill}</Pill>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-txt-secondary">{f.body}</p>
            </BentoCard>
          </AnimatedItem>
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}

// ─── Areas Marquee ─────────────────────────────────────────
const AREAS = [
  "Anna Nagar", "T. Nagar", "OMR", "Velachery", "Adyar",
  "Porur", "Tambaram", "Perungudi", "Nungambakkam", "Egmore",
  "Guindy", "Mylapore", "Sholinganallur", "Thoraipakkam",
];

export function AreasSection() {
  const doubled = [...AREAS, ...AREAS];

  return (
    <AnimatedSection className="overflow-hidden border-y border-border-token py-14 sm:py-20" stagger>
      <AnimatedItem variants={fadeUp} className="mb-12 px-4 text-center">
        <Pill variant="neon" className="mb-4">Coverage</Pill>
        <h2 className="text-3xl font-bold text-white">
          Serving all of{" "}
          <span className="text-gradient-neon">Chennai</span>
        </h2>
        <p className="mt-3 text-txt-secondary">
          From the IT corridor to the city centre — we&#39;ve got you covered.
        </p>
      </AnimatedItem>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg-base to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg-base to-transparent" />

        <div className="flex animate-marquee gap-4 whitespace-nowrap">
          {doubled.map((area, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 rounded-2xl border border-border-token bg-bg-surface px-5 py-3 text-sm font-medium text-txt-secondary shadow-surface"
            >
              <MapPin className="h-3.5 w-3.5 text-electric-bright" />
              {area}
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ─── Trust & Safety ────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: Shield,      title: "KYC verification",   body: "Every user ID-checked before listing or booking." },
  { icon: Star,        title: "Two-way reviews",     body: "Honest feedback from both owners and seekers." },
  { icon: CheckCircle, title: "SOS emergency",       body: "One-tap SOS button connects you to support instantly." },
  { icon: Lock,        title: "Dispute resolution",  body: "Dedicated team to resolve any booking conflicts fairly." },
];

export function TrustSection() {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28" stagger>
      <AnimatedItem variants={fadeUp} className="mb-4 flex justify-center">
        <Pill variant="emerald">Trust & Safety</Pill>
      </AnimatedItem>

      <AnimatedItem variants={fadeUp} className="mb-10 text-center sm:mb-16">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Safety isn&#39;t an{" "}
          <span className="text-gradient">afterthought</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-txt-secondary">
          We built trust into the platform from day one.
        </p>
      </AnimatedItem>

      <StaggerGrid className="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
        {TRUST_ITEMS.map((item) => (
          <AnimatedItem key={item.title} variants={fadeUp}>
            <motion.div
              className="group flex h-full flex-col gap-4 rounded-2xl border border-border-token bg-bg-surface p-5 transition-colors"
              whileHover={{
                borderColor: "rgba(16,185,129,0.30)",
                boxShadow: "0 0 20px rgba(16,185,129,0.12)",
                y: -4,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/10">
                <item.icon className="h-5 w-5 text-emerald" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="mb-1.5 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-txt-secondary">{item.body}</p>
              </div>
            </motion.div>
          </AnimatedItem>
        ))}
      </StaggerGrid>
    </AnimatedSection>
  );
}
