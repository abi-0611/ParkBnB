---
name: Release Checklist
about: Track ParkNear release and demo readiness
title: "Release: <version/date>"
labels: ["release", "checklist"]
assignees: []
---

## Release Info

- Target date:
- Release owner:
- Version/tag:
- Environment: `staging` / `production`

## 1) Supabase

- [ ] `supabase link` is configured for target project
- [ ] `pnpm supabase:db:push` completed
- [ ] `supabase db seed` executed (if needed)
- [ ] Secrets set:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
  - [ ] `CRON_SECRET`
- [ ] Functions deployed:
  - [ ] `create-razorpay-order`
  - [ ] `verify-payment`
  - [ ] `cancel-booking`
  - [ ] `detect-no-show`
  - [ ] `send-notification`
- [ ] Realtime enabled for `public.messages`
- [ ] No-show scheduler configured

## 2) Web (Vercel)

- [ ] Project root set to `apps/web`
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
  - [ ] `RAZORPAY_KEY_ID`
- [ ] `pnpm deploy:web:build` passes locally
- [ ] Production deployment is successful
- [ ] Basic smoke checks pass:
  - [ ] landing page + locale switch
  - [ ] login flow
  - [ ] search + booking pages
  - [ ] admin route protection

## 3) Mobile (Expo EAS)

- [ ] `apps/mobile/eas.json` profile verified
- [ ] `pnpm deploy:mobile:android:preview` completed
- [ ] APK installed on physical Android device
- [ ] Mobile smoke checks pass:
  - [ ] auth + onboarding
  - [ ] seeker search + booking
  - [ ] owner listing flow
  - [ ] chat realtime
  - [ ] push token registration
  - [ ] push notification receipt

## 4) Trust & Safety

- [ ] KYC submission + admin review tested
- [ ] dispute create + resolve tested
- [ ] no-show detection tested
- [ ] strike warning behavior verified
- [ ] SOS event capture verified

## 5) Regression / Quality

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (or acceptable warnings documented)
- [ ] key user journeys recorded as manual test evidence
- [ ] known issues documented below

## 6) Demo Readiness (College)

- [ ] demo accounts ready (owner + seeker + admin)
- [ ] sample spots loaded (10-15)
- [ ] walkthrough script rehearsed
- [ ] backup demo video recorded
- [ ] screenshots captured for submission

## Known Issues / Notes

- _Add unresolved items, mitigations, and owner_

## Sign-off

- [ ] Product sign-off
- [ ] Engineering sign-off
- [ ] Demo readiness sign-off

