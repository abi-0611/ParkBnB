import type { Variants, Transition } from "framer-motion";

// ─── Easings ───────────────────────────────────────────────
export const easings = {
  spring:   [0.34, 1.56, 0.64, 1]  as [number, number, number, number],
  smooth:   [0.4,  0,    0.2,  1]  as [number, number, number, number],
  snappy:   [0.2,  0,    0,    1]  as [number, number, number, number],
  outExpo:  [0.16, 1,    0.3,  1]  as [number, number, number, number],
  inExpo:   [0.7,  0,    0.84, 0]  as [number, number, number, number],
} as const;

// ─── Spring presets ────────────────────────────────────────
export const springs = {
  gentle:  { type: "spring", stiffness: 120, damping: 20, mass: 1   } satisfies Transition,
  snappy:  { type: "spring", stiffness: 300, damping: 28, mass: 0.8 } satisfies Transition,
  bouncy:  { type: "spring", stiffness: 400, damping: 22, mass: 0.7 } satisfies Transition,
  slow:    { type: "spring", stiffness:  60, damping: 20, mass: 1.2 } satisfies Transition,
  smooth:  { duration: 0.5,  ease: easings.outExpo                  } satisfies Transition,
} as const;

// ─── Entrance variants ─────────────────────────────────────
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.outExpo } },
};

export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.6, ease: easings.outExpo } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easings.smooth } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easings.outExpo } },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.55, ease: easings.outExpo } },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: easings.outExpo } },
};

// ─── Stagger container ─────────────────────────────────────
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

// ─── Word/char stagger for headings ───────────────────────
export const wordReveal: Variants = {
  hidden:  { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.55, ease: easings.outExpo },
  },
};

export const charReveal: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: easings.outExpo },
  },
};

// ─── Hover variants ────────────────────────────────────────
export const hoverLift = {
  rest:  { y: 0,  scale: 1,    transition: springs.snappy },
  hover: { y: -4, scale: 1.01, transition: springs.snappy },
};

export const hoverGlow = {
  rest:  { boxShadow: "0 0 0px rgba(61, 123, 255, 0)" },
  hover: { boxShadow: "0 0 24px rgba(61, 123, 255, 0.45), 0 0 48px rgba(61, 123, 255, 0.15)" },
};

// ─── Page transition ────────────────────────────────────────
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easings.outExpo } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.3,  ease: easings.inExpo  } },
};

// ─── Viewport config ───────────────────────────────────────
export const viewportOnce = { once: true, margin: "-80px 0px" };
export const viewportRepeat = { once: false, margin: "-80px 0px" };
