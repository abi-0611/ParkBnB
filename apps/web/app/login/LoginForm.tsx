'use client';

import { loginSchema, otpVerifySchema } from '@parknear/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/stores/auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const signInWithOtp = useAuthStore((s) => s.signInWithOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid email');
      return;
    }
    setPending(true);
    const { error: err } = await signInWithOtp(parsed.data.email, fullName.trim() || undefined);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep('otp');
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = otpVerifySchema.safeParse({ email, otp });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid OTP');
      return;
    }
    setPending(true);
    const { error: err } = await verifyOtp(parsed.data.email, parsed.data.otp);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-sky-400">ParkNear</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in with email OTP</p>

        {step === 'email' ? (
          <form onSubmit={onSendOtp} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">Full name (first time)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="mt-8 space-y-4">
            <p className="text-sm text-slate-400">Code sent to {email}</p>
            <div>
              <label className="block text-xs font-medium text-slate-400">6-digit OTP</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm tracking-widest outline-none focus:border-sky-500"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {pending ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-slate-400 hover:text-slate-200"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError(null);
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-sky-400 hover:underline">
            ← Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
