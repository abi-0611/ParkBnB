"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  duration = 1.5,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        setDisplay(v.toFixed(decimals));
      },
    });
    return controls.stop;
  }, [inView, value, duration, decimals, motionValue]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

// ─── Stat display block ─────────────────────────────────────
interface StatBlockProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  className?: string;
}

export function StatBlock({ value, suffix, prefix, label, className }: StatBlockProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <AnimatedNumber
        value={value}
        suffix={suffix}
        prefix={prefix}
        className="text-3xl font-bold text-glow text-electric-bright"
      />
      <span className="text-xs font-medium text-txt-muted uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
