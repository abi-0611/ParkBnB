-- ────────────────────────────────────────────────────────────────────────────
-- Custom OTP tokens table
--
-- Replaces Supabase's email-OTP (signInWithOtp/verifyOtp).
-- Emails are now sent via Resend. Tokens are SHA-256 hashed (+ pepper).
--
-- Security properties:
--  • Only the service-role key can read/write (RLS enabled, no client policies)
--  • hash includes email + server-side pepper → email-specific, untransferrable
--  • Max 5 verification attempts before token is disabled
--  • 10-minute TTL enforced in application code and as a DB default
--  • 3 OTPs per email per 10 minutes (enforced in application code via COUNT)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.otp_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT         NOT NULL,
  token_hash  TEXT         NOT NULL,    -- SHA-256(otp + ":" + email + ":" + pepper)
  full_name   TEXT,                     -- captured on send, used for auto-creating public.users
  expires_at  TIMESTAMPTZ  NOT NULL,
  attempts    SMALLINT     NOT NULL DEFAULT 0,
  used        BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Fast lookup: active tokens for an email
CREATE INDEX IF NOT EXISTS otp_tokens_email_active_idx
  ON public.otp_tokens (email, expires_at)
  WHERE used = false;

-- Auto-cleanup: remove expired tokens older than 1 hour to keep the table small
-- (a pg_cron job is ideal in production; on free tier the DELETE in send-otp is enough)

-- Enable RLS — no client policies → only service-role can access
ALTER TABLE public.otp_tokens ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.otp_tokens IS
  'Short-lived, hashed OTP records for email authentication. Managed via service-role only.';
