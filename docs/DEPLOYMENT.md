# Deployment Guide

This project deploys across three surfaces:

- **Supabase** for database, auth, storage, realtime, edge functions
- **Vercel** for `apps/web`
- **Expo EAS** for `apps/mobile` preview APKs

## 1) Supabase

### Prerequisites

- Supabase CLI installed and logged in
- Project linked (`supabase link --project-ref <ref>`)
- `SUPABASE_ACCESS_TOKEN` available in environment (optional but recommended)

### Apply schema and seed

```bash
pnpm supabase:db:push
supabase db seed
```

### Set Edge Function secrets

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set RAZORPAY_KEY_ID=...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set CRON_SECRET=...
```

### Deploy edge functions

```bash
pnpm supabase:functions:deploy
```

### Email login OTP (6 digits)

The web and mobile apps only accept a **6-digit** email code (`otpVerifySchema` + UI).

- **Local** (`supabase start`): `[auth.email] otp_length = 6` in `supabase/config.toml` (already the default). Run `supabase stop` then `supabase start` after changing it. If you see **“email rate limit exceeded”**, raise `[auth.rate_limit] email_sent` in the same file (defaults were raised in-repo for dev); restart local Supabase after edits.
- **Hosted (supabase.co)**: In the dashboard go to **Authentication** → **Providers** → **Email** (wording can vary). Set **OTP length** to **6** — not only a “minimum” of 6, or Auth may still generate longer codes (e.g. 8 digits), which will not match the app until the project emits six-digit tokens. Use the Magic Link template with `{{ .Token }}` for OTP emails.

### Post-deploy checks

- Enable Realtime replication for `public.messages`
- Validate RLS behavior as seeker/owner/admin
- Schedule no-show detector (`detect-no-show`) using cron or external scheduler
- For web (Auth.js): keep authenticated DB writes behind server routes/actions (`/api/owner/*`, `/api/booking/*`) instead of browser `createClient()` writes.

---

## 2) Web (Vercel)

### Vercel project settings

- **Root directory**: `apps/web`
- **Framework**: Next.js
- **Build command**: default (`next build`)

### Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `RAZORPAY_KEY_ID`

### Build locally before deploy

```bash
pnpm deploy:web:build
```

### Verify after deploy

- Landing page loads
- Auth works
- Search + map data load
- Admin routes protected and accessible for admin users only

---

## 3) Mobile (Expo EAS)

`apps/mobile/eas.json` contains:

- `preview` profile with Android APK (`distribution: internal`)
- iOS simulator preview profile

### Build preview Android APK

```bash
pnpm deploy:mobile:android:preview
```

### Verify on device

- Login works
- Location permission and map load
- Booking flow and payment test
- Chat realtime updates
- Push token registration and notification delivery

---

## Deployment Checklist

- [ ] Supabase Auth email OTP length is **6** (hosted dashboard) so login emails match the app
- [ ] Supabase migrations applied
- [ ] Supabase edge functions deployed
- [ ] Realtime enabled for messages
- [ ] Web deployed to Vercel
- [ ] Mobile preview APK built and installed
- [ ] Push notifications verified
- [ ] Admin dashboard verified

