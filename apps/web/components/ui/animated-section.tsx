"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  stagger?: boolean;
  staggerDelay?: number;
  id?: string;
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  stagger = false,
  staggerDelay = 0.08,
  id,
}: AnimatedSectionProps) {
  const containerVariants = stagger
    ? staggerContainer(staggerDelay, delay)
    : {
        hidden:  { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: delay },
        },
      };

  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
    >
      {children}
    </motion.section>
  );
}

// ─── Single animated item (use inside AnimatedSection with stagger) ───
interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}

export function AnimatedItem({
  children,
  className,
  variants = fadeUp,
  delay,
}: AnimatedItemProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      transition={delay !== undefined ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}

// ─── Simple div that animates on scroll ───
export function AnimatedDiv({
  children,
  className,
  variants = fadeUp,
  delay = 0,
}: AnimatedItemProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger grid wrapper ───
interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function StaggerGrid({
  children,
  className,
  stagger = 0.07,
  delay = 0,
}: StaggerGridProps) {
  return (
    <motion.div
      className={cn("grid", className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </motion.div>
  );
}
