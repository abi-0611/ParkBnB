"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion-variants";

type Variant = "primary" | "neon" | "ghost" | "outline" | "emerald" | "glass";
type Size    = "sm" | "md" | "lg" | "xl";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-electric text-white border border-electric hover:bg-electric-bright " +
    "shadow-glow-sm hover:shadow-glow-md",
  neon:
    "bg-neon text-bg-base border border-neon hover:bg-neon-bright " +
    "shadow-glow-neon",
  ghost:
    "bg-transparent text-txt-primary border border-transparent " +
    "hover:bg-bg-elevated hover:border-border-token",
  outline:
    "bg-transparent text-electric border border-electric " +
    "hover:bg-electric/10 hover:shadow-glow-xs",
  emerald:
    "bg-emerald text-white border border-emerald " +
    "shadow-glow-emerald hover:brightness-110",
  glass:
    "glass-card text-txt-primary border border-border-token " +
    "hover:border-electric/40 hover:shadow-glow-xs",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8  px-3   text-xs  gap-1.5 rounded-lg",
  md: "h-10 px-5   text-sm  gap-2   rounded-xl",
  lg: "h-12 px-7   text-sm  gap-2   rounded-xl font-semibold",
  xl: "h-14 px-9   text-base gap-2.5 rounded-2xl font-semibold",
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
          "disabled:opacity-50 disabled:pointer-events-none",
          "select-none overflow-hidden",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={springs.snappy}
        {...props}
      >
        {/* Shimmer overlay on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
          }}
          whileHover={{ opacity: 1, x: ["−100%", "100%"] }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {loading ? (
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

GlowButton.displayName = "GlowButton";
