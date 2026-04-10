# Architecture

## System Overview

ParkNear is a monorepo with a shared domain model across mobile, web, and backend services.

- **Clients**
  - Expo mobile app (`apps/mobile`)
  - Next.js web app (`apps/web`)
- **Backend**
  - Supabase Postgres (core data)
  - Supabase Auth (session + identity)
  - Supabase Storage (spot/KYC/dispute assets)
  - Supabase Realtime (chat/message updates)
  - Supabase Edge Functions (payment, no-show, notifications)
- **Shared package**
  - `packages/shared` for types, schemas, queries, utility logic

## High-Level Flow

1. User authenticates via Supabase Auth.
2. Profile/role determines seeker/owner/admin capabilities.
3. Seekers discover spots via geospatial queries (fuzzy location before booking).
4. Booking flow initializes payment order, verifies payment, confirms booking.
5. Post-booking: exact location visibility, chat, check-in/out, reviews.
6. Trust/safety workflows: KYC, disputes, no-show strikes, SOS events.
7. Admin tools moderate users/spots/bookings/disputes and track KPIs.

## Core Data Model

Key tables (public schema):

- `users` (role, verification flags, ratings, strikes, preferences, push token)
- `spots` (owner listing metadata, pricing, rating, fuzzy location policy)
- `availability` (owner slot/time availability)
- `bookings` (status lifecycle, pricing, OTP, payment refs)
- `reviews` (two-way by booking direction)
- `messages` (booking-scoped chat)
- `transactions` (payments/refunds/penalties)
- `disputes`, `sos_events` (trust/safety extensions)

## Security Model

- **RLS enabled** on core tables
- participant-based access policies for bookings/messages/disputes
- admin role policies for moderation surfaces
- service role reserved for controlled server/edge operations

## Edge Functions

- `create-razorpay-order` — creates payment order with booking validation
- `verify-payment` — verifies signature, confirms booking, issues OTP
- `cancel-booking` — applies cancellation policy and refund transaction
- `detect-no-show` — scheduled no-show detection and strike updates
- `send-notification` — push dispatch with user preference checks

## Frontend Architecture

### Mobile (`apps/mobile`)

- Expo Router route groups: `(auth)`, `(seeker)`, `(owner)`, `(common)`
- Zustand stores for auth/search/chat/owner dashboard state slices
- performance-enhanced lists/images (`FlashList`, `expo-image`)
- global UX layer: error boundary, offline banner, toast feedback

### Web (`apps/web`)

- App Router with server/client component split
- admin section under `/(app)/admin/*` with role guard
- middleware-based route protection
- cookie-based locale switching for EN/TA landing content

## Shared Domain Layer

`packages/shared` centralizes:

- domain types mirroring DB contracts
- validation schemas
- query helpers for repeated data access patterns
- utility methods (pricing/payment/location/storage)

This keeps cross-surface behavior consistent and reduces duplication.

## Deployment Topology

- Supabase hosted project (DB/Auth/Storage/Realtime/Functions)
- Vercel for web
- Expo EAS for mobile preview/production builds

See `docs/DEPLOYMENT.md` for operational steps.

