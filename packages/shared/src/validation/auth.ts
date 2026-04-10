import { z } from 'zod';

const optionalIndianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
  .optional();

export const signUpSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: optionalIndianPhone,
});

export const loginSchema = z.object({
  email: z.string().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/)]).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  preferred_language: z.enum(['en', 'ta']).optional(),
});
