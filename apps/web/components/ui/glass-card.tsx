"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion-variants";

type GlassVariant = "default" | "elevated" | "bright" | "minimal" | "neon";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: GlassVariant;
  hover?: boolean;
  glow?: boolean;
  className?: string;
}

const variantClasses: Record<GlassVariant, string> = {
  default:
    "bg-bg-surface/70 backdrop-blur-xl border border-border-token " +
    "shadow-card",
  elevated:
    "bg-bg-elevated/80 backdrop-blur-2xl border border-border-token " +
    "shadow-elevated",
  bright:
    "bg-bg-elevated/80 backdrop-blur-2xl border border-electric/20 " +
    "shadow-glow-xs",
  minimal:
    "bg-bg-surface/40 backdrop-blur-md border border-border-token/50",
  neon:
    "bg-bg-surface/70 backdrop-blur-xl border border-neon/20 " +
    "shadow-glow-neon",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = "default", hover = true, glow = false, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          variantClasses[variant],
          className
        )}
        whileHover={
          hover
            ? {
                y: -4,
                borderColor: glow
                  ? "rgba(61, 123, 255, 0.40)"
                  : "rgba(99, 126, 255, 0.25)",
                boxShadow: glow
                  ? "0 0 24px rgba(61, 123, 255, 0.40), 0 0 48px rgba(61, 123, 255, 0.15), 0 16px 48px rgba(0,0,0,0.40)"
                  : "0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
              }
            : undefined
        }
        transition={springs.gentle}
        {...props}
      >
        {/* Top edge highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// ─── Bento card (used in feature grid) ─────────────────────
interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
}

export function BentoCard({ children, className, colSpan = 1, rowSpan = 1 }: BentoCardProps) {
  const colClass = { 1: "", 2: "md:col-span-2", 3: "md:col-span-3" }[colSpan];
  const rowClass = { 1: "", 2: "md:row-span-2" }[rowSpan];

  return (
    <GlassCard
      variant="default"
      hover
      glow
      className={cn("p-6", colClass, rowClass, className)}
    >
      {children}
    </GlassCard>
  );
}
