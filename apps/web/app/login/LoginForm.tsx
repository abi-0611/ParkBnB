"use client";

import { loginSchema, otpVerifySchema } from "@parknear/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Mail, ArrowRight, ArrowLeft, Shield, Zap, Star, KeyRound } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { GlowButton } from "@/components/ui/glow-button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { springs, staggerContainer, fadeUp } from "@/lib/motion-variants";

// ─── Floating input ─────────────────────────────────────────
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 font-medium transition-all duration-200 select-none",
          lifted
            ? "top-2 text-2xs text-electric-bright"
            : "top-1/2 -translate-y-1/2 text-sm text-txt-muted"
        )}
        animate={{ y: lifted ? 0 : 0 }}
      >
        {label}
      </motion.label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={lifted ? placeholder : ""}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        className={cn(
          "w-full rounded-xl border bg-bg-elevated px-4 pb-3 pt-6 text-sm text-txt-primary outline-none transition-all duration-200",
          "placeholder:text-txt-disabled",
          focused
            ? "border-electric shadow-glow-xs"
            : "border-border-token hover:border-border-token-bright"
        )}
      />
    </div>
  );
}

// ─── OTP digit boxes ────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !refs.current[i]?.value && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next.padEnd(6, "").slice(0, 6).replace(/ /g, ""));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2">
      {[...Array(6)].map((_, i) => {
        const digit = value[i] ?? "";
        const filled = digit !== "";
        return (
          <motion.input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            className={cn(
              "h-13 w-full rounded-xl border text-center text-lg font-bold text-txt-primary outline-none transition-all duration-200",
              "bg-bg-elevated",
              filled
                ? "border-electric bg-electric/10 shadow-glow-xs text-electric-bright"
                : "border-border-token focus:border-electric focus:shadow-glow-xs"
            )}
            animate={filled ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ─── Left panel (decorative) ─────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: Zap,    label: "Instant booking",    sub: "Confirm in under 3 seconds"    },
    { icon: Shield, label: "Verified spots",      sub: "KYC-checked every owner"       },
    { icon: Star,   label: "4.9 avg rating",      sub: "From 1,200+ reviews"           },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-12">
      {/* Layered bg */}
      <div className="absolute inset-0 bg-bg-elevated" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_10%_80%,rgba(61,123,255,0.15)_0%,transparent_65%)]" />
      <div className="absolute inset-0 bg-grid-sm opacity-60" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/40 to-transparent" />

      {/* Floating orbs */}
      <motion.div
        className="absolute right-8 top-24 h-48 w-48 rounded-full bg-electric/8 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-24 left-8 h-40 w-40 rounded-full bg-neon/8 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      <div className="relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
            <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-white">
            Park<span className="text-gradient">Near</span>
          </span>
        </Link>
      </div>

      {/* Middle copy */}
      <motion.div
        className="relative"
        variants={staggerContainer(0.1, 0.3)}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-2">
          <Pill variant="neon" pulse>Chennai&#39;s #1 parking app</Pill>
        </motion.div>
        <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-bold text-white">
          Park smarter,{" "}
          <span className="text-gradient">stress less</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-txt-secondary">
          Join thousands of Chennai drivers finding verified parking spots in seconds.
        </motion.p>

        <motion.ul variants={staggerContainer(0.08, 0.6)} className="mt-8 space-y-4">
          {features.map((f) => (
            <motion.li
              key={f.label}
              variants={fadeUp}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric/10">
                <f.icon className="h-4 w-4 text-electric-bright" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-txt-primary">{f.label}</p>
                <p className="text-xs text-txt-muted">{f.sub}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Bottom note */}
      <motion.p
        className="relative text-xs text-txt-disabled"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Made as a college project · Chennai, India
      </motion.p>
    </div>
  );
}

// ─── Main form ──────────────────────────────────────────────
export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") || "/dashboard";

  const signInWithOtp = useAuthStore((s) => s.signInWithOtp);
  const verifyOtp     = useAuthStore((s) => s.verifyOtp);

  const [step, setStep]         = useState<"email" | "otp">("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [pending, setPending]   = useState(false);

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid email");
      return;
    }
    setPending(true);
    const { error: err } = await signInWithOtp(parsed.data.email, fullName.trim() || undefined);
    setPending(false);
    if (err) { setError(err.message); return; }
    setStep("otp");
    setOtp("");
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = otpVerifySchema.safeParse({ email, otp });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid OTP");
      return;
    }
    setPending(true);
    const { error: err } = await verifyOtp(parsed.data.email, parsed.data.otp);
    setPending(false);
    if (err) { setError(err.message); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen bg-bg-base">
      {/* Left panel — decorative, hidden on tablet/mobile */}
      <div className="hidden w-[45%] shrink-0 border-r border-border-token lg:block">
        <LeftPanel />
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric shadow-glow-sm">
            <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-white">
            Park<span className="text-gradient">Near</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
            {(["email", "otp"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    step === s || (s === "email" && step === "otp")
                      ? "bg-electric text-white shadow-glow-xs"
                      : "border border-border-token text-txt-disabled"
                  )}
                >
                  {i + 1}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  step === s ? "text-txt-primary" : "text-txt-disabled"
                )}>
                  {s === "email" ? "Email" : "Verify"}
                </span>
                {i === 0 && (
                  <div className={cn(
                    "h-px w-8 transition-all duration-500",
                    step === "otp" ? "bg-electric" : "bg-border-token"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Form heading */}
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-head"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={springs.smooth}
              >
                <h1 className="text-2xl font-bold text-white">Sign in</h1>
                <p className="mt-1 text-sm text-txt-muted">We&#39;ll send a one-time code to your email</p>
              </motion.div>
            ) : (
              <motion.div
                key="otp-head"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={springs.smooth}
              >
                <h1 className="text-2xl font-bold text-white">Check your email</h1>
                <p className="mt-1 text-sm text-txt-muted">
                  Code sent to{" "}
                  <span className="font-medium text-electric-bright">{email}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form body — animated transition between steps */}
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-form"
                onSubmit={onSendOtp}
                className="mt-8 space-y-4"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={springs.smooth}
              >
                <FloatingInput
                  id="name"
                  label="Full name (first time only)"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your name"
                  autoComplete="name"
                />
                <FloatingInput
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                {error && (
                  <motion.p
                    className="flex items-center gap-2 rounded-xl bg-danger/8 border border-danger/20 px-3 py-2.5 text-xs text-danger"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    {error}
                  </motion.p>
                )}

                <GlowButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={pending}
                  icon={<Mail className="h-4 w-4" />}
                >
                  Send OTP
                </GlowButton>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                onSubmit={onVerify}
                className="mt-8 space-y-6"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={springs.smooth}
              >
                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-txt-muted">
                    <KeyRound className="mr-1.5 inline h-3 w-3" />
                    6-digit code
                  </label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {error && (
                  <motion.p
                    className="flex items-center gap-2 rounded-xl bg-danger/8 border border-danger/20 px-3 py-2.5 text-xs text-danger"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    {error}
                  </motion.p>
                )}

                <GlowButton
                  type="submit"
                  variant="emerald"
                  size="lg"
                  fullWidth
                  loading={pending}
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Verify & continue
                </GlowButton>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-txt-muted transition-colors hover:text-txt-secondary"
                  onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use a different email
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-txt-disabled">
            <Link href="/" className="text-electric-bright hover:underline">
              ← Back home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
