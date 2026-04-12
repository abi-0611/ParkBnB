"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillVariant = "primary" | "neon" | "emerald" | "ghost" | "warning";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  icon?: ReactNode;
  className?: string;
  animate?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<PillVariant, string> = {
  primary:
    "bg-electric/12 border border-electric/25 text-electric-bright " +
    "shadow-[0_2px_12px_rgba(61,123,255,0.20)]",
  neon:
    "bg-neon/10 border border-neon/25 text-neon-bright " +
    "shadow-[0_2px_12px_rgba(0,170,255,0.20)]",
  emerald:
    "bg-emerald/10 border border-emerald/25 text-[#34D399] " +
    "shadow-[0_2px_12px_rgba(16,185,129,0.20)]",
  ghost:
    "bg-white/5 border border-white/10 text-txt-secondary",
  warning:
    "bg-warning/10 border border-warning/25 text-warning",
};

export function Pill({ children, variant = "primary", icon, className, animate = false, pulse = false }: PillProps) {
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
    "backdrop-blur-sm",
    variantStyles[variant],
    className
  );

  if (animate) {
    return (
      <motion.span
        className={base}
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {pulse && <PulseDot variant={variant} />}
        {icon}
        {children}
      </motion.span>
    );
  }

  return (
    <span className={base}>
      {pulse && <PulseDot variant={variant} />}
      {icon}
      {children}
    </span>
  );
}

function PulseDot({ variant }: { variant: PillVariant }) {
  const colors: Record<PillVariant, string> = {
    primary: "bg-electric",
    neon:    "bg-neon",
    emerald: "bg-emerald",
    ghost:   "bg-txt-muted",
    warning: "bg-warning",
  };

  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping-slow rounded-full opacity-75",
          colors[variant]
        )}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colors[variant])} />
    </span>
  );
}
