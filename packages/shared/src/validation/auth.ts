import { z } from 'zod';

/** Digits only, 10-digit Indian mobile (starts with 6–9). */
const indianMobileDigits = z
  .string()
  .min(1, 'Mobile number is required')
  .transform((s) => s.replace(/\D/g, ''))
  .refine((s) => /^[6-9]\d{9}$/.test(s), 'Enter a valid 10-digit Indian mobile number');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');

// ── Email + password sign-in ──────────────────────────────────────────────────
export const signInSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: passwordSchema,
});

// ── Registration ──────────────────────────────────────────────────────────────
export const signUpSchema = z.object({
  email:           z.string().email('Enter a valid email address'),
  full_name:       z.string().min(2, 'Name must be at least 2 characters'),
  password:        passwordSchema,
  confirmPassword: z.string(),
  phone:           indianMobileDigits,
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

// ── Profile update ────────────────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  full_name:          z.string().min(2).optional(),
  phone:              z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/)]).optional(),
  avatar_url:         z.string().url().optional().or(z.literal('')),
  preferred_language: z.enum(['en', 'ta']).optional(),
});

// ── Legacy (kept so any stale imports don't hard-crash during the transition) ─
/** @deprecated — use signInSchema instead */
export const loginSchema = z.object({ email: z.string().email() });
/** @deprecated — OTP flow removed */
export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp:   z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
