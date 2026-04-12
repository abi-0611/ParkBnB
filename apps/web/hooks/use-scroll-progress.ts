"use client";

import { useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";

export function useScrollProgress(outputRange: [number, number] = [0, 1]) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });
  const value = useTransform(scrollYProgress, [0, 1], outputRange);
  return { ref, scrollYProgress, value };
}

export function useParallax(
  inputRange: [number, number] = [0, 1],
  outputRange: [number | string, number | string] = ["-10%", "10%"]
): { ref: RefObject<HTMLDivElement>; y: MotionValue<number | string> } {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, inputRange, outputRange);
  return { ref, y };
}
