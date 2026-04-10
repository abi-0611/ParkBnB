# Testing Checklist

Use this checklist before demo/submission.

## 1) Environment and Setup

- [ ] `pnpm install` succeeds
- [ ] `.env` values set for web/mobile
- [ ] `supabase db push` applied without errors
- [ ] `supabase db seed` loaded sample rows

## 2) Mobile App

### Auth

- [ ] OTP request works
- [ ] OTP verify logs user in
- [ ] role onboarding persists

### Seeker flow

- [ ] search returns nearby spots
- [ ] booking creation succeeds
- [ ] payment order + verify flow succeeds (test mode)
- [ ] confirmation shows expected booking details
- [ ] check-in/check-out flow works
- [ ] review submission works

### Owner flow

- [ ] create spot flow works (details/photos/pricing)
- [ ] owner dashboard loads stats/listings
- [ ] pause/activate listing works

### Common trust/safety

- [ ] chat sends/receives messages realtime
- [ ] KYC document upload submits
- [ ] emergency contacts save/load
- [ ] dispute submission works for completed booking
- [ ] strike warning appears when strike count > 0

### UX resilience

- [ ] offline banner shows when internet is off
- [ ] toast appears for success/error actions
- [ ] skeleton states appear on loading screens
- [ ] global error fallback renders when error is thrown

## 3) Web App

- [ ] landing page loads with EN/TA switch
- [ ] owner dashboard works post-login
- [ ] admin routes blocked for non-admin users
- [ ] admin pages load (users/spots/bookings/disputes/analytics)

## 4) Edge Functions

- [ ] `create-razorpay-order` returns order id
- [ ] `verify-payment` confirms booking on valid signature
- [ ] `cancel-booking` returns expected refund amount
- [ ] `detect-no-show` runs and returns processed count
- [ ] `send-notification` sends/skips based on preferences

## 5) Deployment Verification

- [ ] web deploy builds on Vercel
- [ ] mobile preview APK builds on EAS
- [ ] Supabase functions deployed successfully
- [ ] Realtime enabled for `public.messages`
- [ ] push token writes to `users.push_token`
- [ ] test push notification received on device

## 6) Demo Readiness

- [ ] two demo accounts prepared (owner + seeker)
- [ ] sample spots distributed across Chennai areas
- [ ] walkthrough script rehearsed
- [ ] fallback demo video recorded

