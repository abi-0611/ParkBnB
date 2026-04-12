"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Calendar, Settings, MapPin, ExternalLink, Code2 } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { StatBlock } from "@/components/ui/animated-number";
import { fadeUp, slideInLeft, slideInRight } from "@/lib/motion-variants";

// ─── Owner CTA ─────────────────────────────────────────────
export function OwnerCTASection() {
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28" stagger>
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background */}
        <div className="absolute inset-0 bg-bg-elevated" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_50%,rgba(61,123,255,0.12)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-grid-sm opacity-50" />
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/50 to-transparent" />

        <div className="relative grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          {/* Left copy */}
          <AnimatedItem variants={slideInLeft}>
            <Pill variant="emerald" className="mb-6">For Owners</Pill>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Turn your empty{" "}
              <span className="text-gradient">parking into income</span>
            </h2>
            <p className="mb-8 text-txt-secondary">
              List your spare parking space, set your own schedule, and earn passive income every month.
              Takes less than 5 minutes to set up.
            </p>

            {/* Mini stat row */}
            <div className="mb-8 flex flex-wrap gap-8">
              <StatBlock value={8500} suffix="+" label="Avg monthly ₹" />
              <StatBlock value={94}   suffix="%" label="Owner retention" />
              <StatBlock value={5}    suffix="m" label="Setup time" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <GlowButton variant="emerald" size="lg" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Start earning
                </GlowButton>
              </Link>
              <Link href="/#how">
                <GlowButton variant="glass" size="lg">
                  Learn more
                </GlowButton>
              </Link>
            </div>
          </AnimatedItem>

          {/* Right — feature card */}
          <AnimatedItem variants={slideInRight}>
            <GlassCard variant="elevated" hover={false} className="p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-txt-muted">
                Owner Dashboard Preview
              </p>
              <ul className="space-y-4">
                {[
                  { icon: TrendingUp, label: "Weekly passive income",    sub: "Automatic payouts every Monday" },
                  { icon: Calendar,   label: "Flexible schedule control", sub: "Block dates anytime from the app" },
                  { icon: Settings,   label: "Simple listing management", sub: "Edit pricing, photos, availability" },
                ].map((item) => (
                  <motion.li
                    key={item.label}
                    className="flex items-start gap-4 rounded-xl border border-border-token bg-bg-base/50 p-4"
                    whileHover={{ borderColor: "rgba(61,123,255,0.30)", x: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-electric/10">
                      <item.icon className="h-4 w-4 text-electric-bright" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-txt-primary">{item.label}</p>
                      <p className="mt-0.5 text-xs text-txt-muted">{item.sub}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </GlassCard>
          </AnimatedItem>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ─── Final CTA ─────────────────────────────────────────────
export function FinalCTASection() {
  return (
    <AnimatedSection className="relative overflow-hidden border-t border-border-token py-16 sm:py-24 lg:py-28" stagger>
      {/* Background radial */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(61,123,255,0.12)_0%,transparent_65%)]" />

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <AnimatedItem variants={fadeUp}>
          <Pill variant="neon" pulse className="mb-6">Get started today</Pill>
        </AnimatedItem>
        <AnimatedItem variants={fadeUp}>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to park{" "}
            <span className="text-gradient">smarter?</span>
          </h2>
        </AnimatedItem>
        <AnimatedItem variants={fadeUp}>
          <p className="mb-10 text-lg text-txt-secondary">
            Join thousands of Chennai drivers finding stress-free parking every day.
          </p>
        </AnimatedItem>
        <AnimatedItem variants={fadeUp}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/search">
              <GlowButton variant="primary" size="xl" icon={<ArrowRight className="h-5 w-5" />} iconPosition="right">
                Find parking now
              </GlowButton>
            </Link>
            <Link href="/login">
              <GlowButton variant="outline" size="xl">
                Create account
              </GlowButton>
            </Link>
          </div>
        </AnimatedItem>
      </div>
    </AnimatedSection>
  );
}

// ─── Footer ────────────────────────────────────────────────
const FOOTER_LINKS = {
  Product:  [
    { label: "Find parking",  href: "/search"    },
    { label: "List a space",  href: "/login"     },
    { label: "How it works",  href: "/#how"      },
    { label: "Pricing",       href: "/login"     },
  ],
  Company:  [
    { label: "About",     href: "/login" },
    { label: "Blog",      href: "/login" },
    { label: "Careers",   href: "/login" },
    { label: "Contact",   href: "/login" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/login" },
    { label: "Terms of use",   href: "/login" },
    { label: "Refund policy",  href: "/login" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border-token bg-bg-base">
      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-5 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="group mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
                <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-white">
                Park<span className="text-gradient">Near</span>
              </span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-txt-muted">
              Peer-to-peer parking marketplace for Chennai. Book verified spots near you, instantly.
            </p>
            <div className="flex gap-3">
              {[
                { icon: ExternalLink, href: "#", label: "Twitter" },
                { icon: Code2,        href: "#", label: "GitHub"  },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-token bg-bg-surface text-txt-muted transition-colors hover:border-electric/30 hover:text-electric-bright"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  <s.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-txt-muted">
                {category}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-txt-secondary transition-colors hover:text-txt-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border-token pt-8 sm:flex-row">
          <p className="text-xs text-txt-disabled">
            © 2026 ParkNear. Built as a college project. All rights reserved.
          </p>
          <p className="text-xs text-txt-disabled">
            Made with care in Chennai, India
          </p>
        </div>
      </div>
    </footer>
  );
}
