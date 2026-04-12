import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // ─── Color Tokens (matching reference dark-neon-blue aesthetic) ───
      colors: {
        // shadcn/ui compatibility aliases
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border:  "hsl(var(--border))",
        input:   "hsl(var(--input))",
        ring:    "hsl(var(--ring))",

        // ─── ParkNear design tokens ───
        bg: {
          base:     "#05050E",   // deepest black-navy
          surface:  "#090917",   // card/surface
          elevated: "#0E0E22",   // elevated panels
          overlay:  "#13132E",   // modals / overlays
        },
        "border-token": {
          DEFAULT: "rgba(99, 126, 255, 0.12)",
          bright:  "rgba(99, 126, 255, 0.30)",
          subtle:  "rgba(99, 126, 255, 0.06)",
        },
        // Electric blue (primary brand glow)
        electric: {
          DEFAULT:  "#3D7BFF",
          bright:   "#5C96FF",
          dim:      "#2558CC",
          glow:     "rgba(61, 123, 255, 0.35)",
        },
        // Neon cyan blue (underglow, map highlight)
        neon: {
          DEFAULT: "#00AAFF",
          soft:    "rgba(0, 170, 255, 0.15)",
          bright:  "#33BBFF",
        },
        // Brand emerald accent (kept from original)
        emerald: {
          DEFAULT:    "#10B981",
          soft:       "rgba(16, 185, 129, 0.15)",
          foreground: "#FFFFFF",
        },
        // Text scale
        txt: {
          primary:   "#FFFFFF",
          secondary: "#8B9FD4",
          muted:     "#4E5B87",
          disabled:  "#2D3558",
        },
        // Status
        success: "#10B981",
        warning: "#F59E0B",
        danger:  "#EF4444",
      },

      // ─── Font Family ───
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },

      // ─── Type Scale ───
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem",    letterSpacing: "0.02em" }],
        xs:    ["0.75rem",  { lineHeight: "1.125rem", letterSpacing: "0.01em" }],
        sm:    ["0.875rem", { lineHeight: "1.375rem" }],
        base:  ["1rem",     { lineHeight: "1.625rem" }],
        lg:    ["1.125rem", { lineHeight: "1.75rem"  }],
        xl:    ["1.25rem",  { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem"     }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.75rem"  }],
        "5xl": ["3rem",     { lineHeight: "3.5rem"   }],
        "6xl": ["3.75rem",  { lineHeight: "4.25rem"  }],
        "7xl": ["4.5rem",   { lineHeight: "5rem"     }],
        "8xl": ["6rem",     { lineHeight: "6.5rem"   }],
      },

      // ─── Border Radius ───
      borderRadius: {
        none: "0",
        sm:   "0.375rem",
        DEFAULT: "var(--radius)",
        md:   "0.625rem",
        lg:   "var(--radius-lg)",
        xl:   "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },

      // ─── Spacing extras ───
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
      },

      // ─── Box Shadows / Glows ───
      boxShadow: {
        "glow-xs":      "0 0 6px rgba(61, 123, 255, 0.25)",
        "glow-sm":      "0 0 12px rgba(61, 123, 255, 0.35)",
        "glow-md":      "0 0 24px rgba(61, 123, 255, 0.45), 0 0 48px rgba(61, 123, 255, 0.15)",
        "glow-lg":      "0 0 40px rgba(61, 123, 255, 0.55), 0 0 80px rgba(61, 123, 255, 0.20)",
        "glow-neon":    "0 0 16px rgba(0, 170, 255, 0.65), 0 0 48px rgba(0, 170, 255, 0.25)",
        "glow-emerald": "0 0 16px rgba(16, 185, 129, 0.45), 0 0 36px rgba(16, 185, 129, 0.15)",
        "underglow":    "0 20px 80px rgba(0, 102, 255, 0.55), 0 40px 120px rgba(0, 60, 200, 0.30)",
        "surface":      "0 1px 3px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card":         "0 2px 8px rgba(0,0,0,0.50), 0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
        "elevated":     "0 4px 16px rgba(0,0,0,0.60), 0 16px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
        "pill":         "0 2px 12px rgba(61, 123, 255, 0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
      },

      // ─── Background Images ───
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary":  "linear-gradient(135deg, #3D7BFF 0%, #5C96FF 100%)",
        "gradient-neon":     "linear-gradient(135deg, #0066FF 0%, #00AAFF 100%)",
        "gradient-surface":  "linear-gradient(160deg, rgba(14,14,34,0.80) 0%, rgba(9,9,23,0.95) 100%)",
        "gradient-card":     "linear-gradient(135deg, rgba(14,14,34,0.70) 0%, rgba(9,9,23,0.90) 100%)",
        "map-underglow":     "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,102,255,0.30) 0%, transparent 70%)",
        "hero-radial":       "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(61,123,255,0.15) 0%, transparent 60%)",
        "grid-lines":        "linear-gradient(rgba(99,126,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,126,255,0.05) 1px, transparent 1px)",
      },

      // ─── Easing Curves ───
      transitionTimingFunction: {
        "spring":    "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth":    "cubic-bezier(0.4, 0, 0.2, 1)",
        "snappy":    "cubic-bezier(0.2, 0, 0, 1)",
        "out-expo":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-expo":   "cubic-bezier(0.7, 0, 0.84, 0)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },

      // ─── Duration scale ───
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "800": "800ms",
        "1000": "1000ms",
        "1200": "1200ms",
      },

      // ─── Keyframes ───
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":       { opacity: "1",   transform: "scale(1.04)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":      { transform: "translateY(-6px) rotate(1deg)" },
          "66%":      { transform: "translateY(-3px) rotate(-0.5deg)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        "fade-down": {
          "0%":   { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)"      },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)"    },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)"      },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)"    },
        },
        "ping-slow": {
          "0%":    { transform: "scale(1)",    opacity: "0.8" },
          "75%,100%": { transform: "scale(2)", opacity: "0"   },
        },
        "neon-flicker": {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": {
            opacity: "1",
            filter: "drop-shadow(0 0 8px rgba(0, 170, 255, 0.8))",
          },
          "20%, 24%, 55%": {
            opacity: "0.7",
            filter: "none",
          },
        },
        "marquee": {
          "0%":   { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "counter-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(61, 123, 255, 0.3)" },
          "50%":      { borderColor: "rgba(61, 123, 255, 0.7)" },
        },
        "scan-line": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },

      // ─── Animation shortcuts ───
      animation: {
        "glow-pulse":       "glow-pulse 2.5s ease-in-out infinite",
        "float":            "float 3s ease-in-out infinite",
        "float-slow":       "float-slow 5s ease-in-out infinite",
        "shimmer":          "shimmer 2.2s linear infinite",
        "gradient-shift":   "gradient-shift 6s ease infinite",
        "fade-up":          "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-down":        "fade-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":          "fade-in 0.4s ease forwards",
        "scale-in":         "scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-left":    "slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right":   "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "ping-slow":        "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "neon-flicker":     "neon-flicker 4s linear infinite",
        "marquee":          "marquee 25s linear infinite",
        "border-glow":      "border-glow 2s ease-in-out infinite",
        "spin-slow":        "spin 4s linear infinite",
        "scan-line":        "scan-line 6s linear infinite",
      },

      // ─── Backdrop Blur extras ───
      backdropBlur: {
        xs: "4px",
        "4xl": "80px",
      },

      // ─── Background Size ───
      backgroundSize: {
        "200%": "200% 200%",
        "grid":  "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
