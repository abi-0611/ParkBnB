# ParkNear Project Overview

## Title

**ParkNear — A Peer-to-Peer Parking Marketplace for Chennai**

## Team / College

- Team members: _Add names here_
- College: _Add college name here_
- Department: _Add department here_
- Academic year: _Add year here_

## Problem Statement

Urban parking in Chennai is often inefficient:

- seekers spend time finding safe parking
- private parking slots remain underutilized
- discovery and trust are fragmented across calls/chat apps

This creates congestion, delays, and lost earning opportunities.

## Solution Overview

ParkNear connects:

- **Seekers** who need parking near a destination
- **Owners** with spare parking space
- **Admins** who moderate trust/safety workflows

The platform supports discovery, booking, payment, check-in/out, reviews, chat, disputes, and admin operations in one system.

## Tech Stack (with justification)

- **React Native + Expo (Mobile):** fast cross-platform development, easy preview builds for demo
- **Next.js 14 (Web):** server components + SEO-friendly landing/admin surfaces
- **Supabase:** Postgres + Auth + Storage + Realtime + Edge Functions in one managed backend
- **Mapbox:** geospatial UX for location-based spot discovery
- **Razorpay (test mode):** payment simulation for end-to-end booking flow

## Key Features

- Owner listing: photos, pricing, availability
- Seeker search: location-driven discovery with filters
- Fuzzy-to-exact location reveal after successful booking/payment
- OTP-enabled access/check-in flow
- Real-time chat, bi-directional reviews, KYC, SOS, disputes
- Admin dashboard for moderation and analytics
- Tamil/English support and push notification foundation

## Repository Structure

- `apps/mobile` — Expo Router app
- `apps/web` — Next.js app (landing + user + admin)
- `packages/shared` — shared TS types, schemas, queries, utilities
- `supabase` — migrations, seed, edge functions
- `docs` — submission/deployment/testing documentation

## Local Setup

1. Clone repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy env:
   - `.env.example` -> `apps/web/.env.local`
   - `.env.example` -> `apps/mobile/.env`

4. Start Supabase local stack (optional local workflow):

   ```bash
   supabase start
   ```

5. Apply schema:

   ```bash
   pnpm supabase:db:push
   ```

6. Seed sample data:

   ```bash
   supabase db seed
   ```

7. Run mobile:

   ```bash
   pnpm dev:mobile
   ```

8. Run web:

   ```bash
   pnpm dev:web
   ```

## Demo Assets

- Demo video link: _Add URL_
- Screenshots: _Add image links or folder path_

## Future Scope

- stronger anti-fraud and moderation automations
- recommendation engine for demand/supply balancing
- production-grade push campaign orchestration
- richer analytics and city-level heatmaps
- dedicated owner payout lifecycle and statements

