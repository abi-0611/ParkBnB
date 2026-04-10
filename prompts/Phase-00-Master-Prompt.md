# ParkNear Chennai — Master Project Prompt

## Project Identity

**Name:** ParkNear (or ParkChennai / SpotNear — pick your brand)
**Tagline:** "Your parking spot, a tap away."
**Type:** Location-based two-sided marketplace connecting parking-space owners with seekers in Chennai.
**Platform:** Cross-platform mobile app (React Native) + Web app (Next.js) — college project, 100% free-tier infrastructure.

---

## Problem Statement

Chennai faces a severe urban parking shortage. Thousands of residential homes, apartments, and commercial buildings have underutilized parking spaces (during work hours, weekends, etc.), while drivers circle blocks wasting fuel and time searching for parking. There is no organized peer-to-peer marketplace to bridge this gap.

---

## Core Concept

1. **Parking space owners** list their available spots (home driveways, apartment basement slots, commercial compound spaces) with photos, availability windows, and pricing.
2. **Parking seekers** search for nearby spots using their live GPS location.
3. The app shows **fuzzy distances** ("~500m near Anna Nagar Tower") — the **exact address, GPS pin, and one-time gate code/OTP are revealed ONLY after payment + booking confirmation**.
4. A **check-in system** confirms the seeker has arrived (owner approves via app, or auto-approves after a configurable time window).
5. **Platform monetization** through commissions, subscriptions, and add-ons.

---

## Detailed Feature Specification

### 1. User Roles

| Role | Description |
|------|-------------|
| **Seeker** | Searches for parking, books, pays, navigates to spot |
| **Owner** | Lists spot(s), sets availability/pricing, approves check-ins, receives payouts |
| **Admin** | Manages users, resolves disputes, views analytics (dashboard) |

### 2. Authentication & Verification

- **Sign-up/Login:** Email + OTP or Google OAuth (via Supabase Auth — free tier).
- **Mandatory KYC (post-MVP but design schema now):**
  - Owner: Aadhaar or PAN upload + selfie + property proof (electricity bill / society letter).
  - Seeker: Aadhaar or PAN upload + selfie + vehicle RC (Registration Certificate) upload.
- **Vehicle Management:** Seeker can save multiple vehicles (bike, car, SUV) with number plates.

### 3. Spot Listing (Owner Side)

- **Spot details:**
  - Type: Car / Bike / Both / EV-charging (premium category).
  - Covered / Open / Underground.
  - Vehicle size supported: Hatchback / Sedan / SUV / Any.
  - Number of spots available (housing society bulk listing: one owner lists 10+ slots).
  - Photos (min 2, max 6) + optional 30-second video walkthrough.
  - Amenities: CCTV, security guard, shade, EV charger, wash bay nearby.
- **Availability:**
  - Real-time availability calendar (daily / weekly recurring slots).
  - Hourly / Daily / Monthly pricing set by owner (app suggests range based on locality).
  - Instant book vs. Request-to-book toggle.
- **Location:**
  - Owner pins exact location on map during listing (stored encrypted in DB).
  - Public-facing: only fuzzy zone shown (e.g., "Near Phoenix Mall, 400m radius").

### 4. Search & Discovery (Seeker Side)

- **Live location** (with explicit consent) to show nearby spots.
- **Fuzzy distance display:** "Within 800m — near XYZ landmark" (never exact address pre-booking).
- **Search filters:**
  - Vehicle type, covered/open, price range, availability (now / schedule), rating, EV charging.
- **Sort options:** Proximity → Price → Rating (default weighted combo).
- **Map view:** Fuzzy circles on map (not exact pins) with price labels.
- **List view:** Cards with spot photo, distance, price/hr, rating, amenities icons.

### 5. Booking & Payment Flow

```
Seeker searches → Selects spot → Chooses time slot → Pays via UPI/Card/Wallet
    ↓
Payment confirmed → Exact address + GPS pin + one-time gate OTP revealed
    ↓
Seeker navigates (Google Maps deep-link) → Arrives → Taps "Check-in"
    ↓
Owner approves check-in (or auto-approve after 10-min window)
    ↓
Parking session active → Timer runs → Session ends (manual or auto at booked time)
    ↓
Both parties rate each other → Payout released to owner (minus commission)
```

- **Booking types:**
  - Hourly (minimum 1 hour).
  - Daily (flat rate).
  - Monthly pass (recurring subscription).
- **Cancellation policy:**
  - Free cancellation up to 30 min before slot.
  - After that: 50% charge to seeker.
  - Owner cancellation: full refund + penalty to owner.

### 6. Monetization Model

| Revenue Stream | Details |
|----------------|---------|
| **Commission** | 10–15% per booking (charged to seeker as "service fee") |
| **Owner subscription** | ₹199–499/month for priority listing + analytics dashboard + verified badge |
| **Convenience fee** | ₹5–15 flat fee per booking to seeker |
| **Monthly pass premium** | Small markup on monthly bookings |
| **EV charging spots** | Premium category with higher commission |
| **Add-on insurance** | Partner with insurers for minor damage/theft claims (future) |
| **Featured listings** | Owners pay to appear at top of search results |

### 7. Trust & Safety

- **Verification badges** for KYC-verified owners and seekers.
- **Photo/video proof** of spot condition (mandatory for owners).
- **Reviews & ratings** (both directions: owner rates seeker, seeker rates owner).
- **In-app chat** (text only, no phone number exchange before booking).
- **Emergency SOS button** — triggers alert to local contacts + app support.
- **No-show penalty system:**
  - Seeker no-show: forfeits booking amount + 1 strike.
  - Owner no-show (spot unavailable): full refund + ₹50 credit to seeker + 1 strike to owner.
  - 3 strikes = temporary ban, 5 strikes = permanent ban.
- **Dispute resolution:** Admin panel to review disputes with photo evidence.

### 8. Nice-to-Have (MVP+ Features)

- **Navigation integration:** Deep-link to Google Maps / Apple Maps after booking.
- **Tamil + English UI** (i18n from day 1 — use next-intl or react-i18next).
- **Push notifications:** Booking confirmations, check-in reminders, new spots nearby.
- **Housing society bulk listings:** One owner account manages multiple spots with sub-slot management.
- **Smart pricing suggestions:** Based on demand, time of day, events nearby.
- **IoT barrier integration (future):** Low-cost Bluetooth/WiFi barrier that auto-opens on valid OTP — premium owner feature.
- **Analytics dashboard for owners:** Views, bookings, revenue, occupancy rate.
- **Referral program:** "Invite an owner, get ₹50 credit."

---

## Technical Architecture

### Free-Tier Tech Stack

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| **Mobile App** | React Native + Expo | Free (open source) |
| **Web Frontend** | Next.js 14 (App Router) | Vercel free tier (100GB bandwidth) |
| **Backend / API** | Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage) | Free tier: 500MB DB, 1GB storage, 50K auth users, 500K edge function invocations |
| **Database** | Supabase PostgreSQL + PostGIS extension | Included in Supabase free tier |
| **Auth** | Supabase Auth (Email OTP, Google OAuth) | Included |
| **File Storage** | Supabase Storage (spot photos, KYC docs) | 1GB free |
| **Maps** | Mapbox GL JS + React Native Mapbox | 50K free map loads/month |
| **Geocoding** | Mapbox Geocoding API | 100K free requests/month |
| **Payments** | Razorpay (test mode for college project) | Free in test mode |
| **OTP / SMS** | Supabase Auth (email OTP) — or Twilio free trial for SMS | Free tier |
| **Push Notifications** | Expo Push Notifications | Free |
| **Hosting (Web)** | Vercel | Free tier |
| **CI/CD** | GitHub Actions | 2000 min/month free |
| **Email** | Resend (transactional emails) | 3000 emails/month free |
| **Monitoring** | Sentry (error tracking) | 5K events/month free |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ React Native │  │  Next.js    │  │  Admin Dashboard    │  │
│  │  (Expo)      │  │  (Vercel)   │  │  (Next.js)          │  │
│  │  iOS+Android │  │  Web App    │  │  Web App            │  │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼─────────────────┼────────────────────┼─────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     SUPABASE PLATFORM                         │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐  │
│  │   Auth   │  │Edge        │  │ Realtime   │  │ Storage  │  │
│  │  (Login  │  │Functions   │  │ (Live      │  │ (Photos, │  │
│  │   OTP)   │  │(API Logic) │  │  updates)  │  │  KYC)    │  │
│  └────┬─────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  │
│       │              │               │              │         │
│       ▼              ▼               ▼              ▼         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          PostgreSQL + PostGIS                          │   │
│  │  ┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │ Users   │ │Spots │ │Bookings  │ │Reviews/Ratings│ │   │
│  │  │ + KYC   │ │+ Geo │ │+ Payments│ │+ Disputes    │  │   │
│  │  └─────────┘ └──────┘ └──────────┘ └──────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────┐  ┌─────────────────┐
│   Mapbox     │  │   Razorpay      │
│  (Maps, Geo) │  │  (Payments)     │
└──────────────┘  └─────────────────┘
```

### Database Schema (Core Tables)

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('seeker', 'owner', 'both', 'admin')) DEFAULT 'seeker',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')) DEFAULT 'pending',
  aadhaar_doc_url TEXT,
  selfie_url TEXT,
  strike_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles (seeker's vehicles)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT CHECK (vehicle_type IN ('bike', 'car_hatchback', 'car_sedan', 'car_suv', 'ev')) NOT NULL,
  number_plate TEXT NOT NULL,
  rc_doc_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parking Spots
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  spot_type TEXT CHECK (spot_type IN ('car', 'bike', 'both', 'ev_charging')) NOT NULL,
  coverage TEXT CHECK (coverage IN ('covered', 'open', 'underground')) NOT NULL,
  vehicle_size TEXT CHECK (vehicle_size IN ('hatchback', 'sedan', 'suv', 'any')) DEFAULT 'any',
  total_slots INTEGER DEFAULT 1,
  -- Exact location (encrypted/hidden until booking)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address_line TEXT NOT NULL,
  landmark TEXT,
  city TEXT DEFAULT 'Chennai',
  pincode TEXT,
  -- Fuzzy display info
  fuzzy_landmark TEXT NOT NULL,
  fuzzy_radius_meters INTEGER DEFAULT 500,
  -- Pricing
  price_per_hour DECIMAL(10,2),
  price_per_day DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  -- Settings
  is_instant_book BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  -- Amenities (JSONB for flexibility)
  amenities JSONB DEFAULT '[]',
  -- Photos
  photos TEXT[] NOT NULL,
  video_url TEXT,
  -- Ratings
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for proximity search
CREATE INDEX idx_spots_location ON spots USING GIST (location);

-- Availability slots
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE, -- for one-off availability
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID REFERENCES users(id),
  spot_id UUID REFERENCES spots(id),
  vehicle_id UUID REFERENCES vehicles(id),
  booking_type TEXT CHECK (booking_type IN ('hourly', 'daily', 'monthly')) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  -- Pricing breakdown
  base_price DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  owner_payout DECIMAL(10,2) NOT NULL,
  -- Status
  status TEXT CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'active',
    'completed', 'cancelled_by_seeker', 'cancelled_by_owner',
    'no_show', 'disputed'
  )) DEFAULT 'pending',
  -- OTP & check-in
  gate_otp TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  -- Payment
  payment_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) UNIQUE,
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  spot_id UUID REFERENCES spots(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  review_type TEXT CHECK (review_type IN ('seeker_to_owner', 'owner_to_seeker')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (payment log)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('payment', 'refund', 'payout', 'penalty')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  razorpay_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key PostGIS Query: Find Nearest Spots

```sql
-- Find spots within X meters of seeker's location, sorted by distance
SELECT
  s.id,
  s.title,
  s.fuzzy_landmark,
  s.spot_type,
  s.price_per_hour,
  s.avg_rating,
  s.photos[1] as thumbnail,
  ST_Distance(s.location, ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)::geography) AS distance_meters
FROM spots s
WHERE
  s.is_active = TRUE
  AND ST_DWithin(
    s.location,
    ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)::geography,
    $radius_meters  -- e.g., 2000 for 2km
  )
ORDER BY
  distance_meters ASC,
  s.price_per_hour ASC,
  s.avg_rating DESC
LIMIT 20;
```

---

## Project Folder Structure

```
parknear/
├── apps/
│   ├── mobile/                   # React Native (Expo) app
│   │   ├── app/                  # Expo Router file-based routing
│   │   │   ├── (auth)/           # Auth screens (login, signup, verify)
│   │   │   ├── (seeker)/         # Seeker tab screens
│   │   │   │   ├── home.tsx      # Map + search
│   │   │   │   ├── search.tsx    # Search results
│   │   │   │   ├── spot/[id].tsx # Spot detail
│   │   │   │   ├── booking.tsx   # Booking flow
│   │   │   │   └── bookings.tsx  # My bookings
│   │   │   ├── (owner)/          # Owner tab screens
│   │   │   │   ├── dashboard.tsx # Owner home
│   │   │   │   ├── spots/       # Manage spots
│   │   │   │   └── earnings.tsx  # Earnings
│   │   │   ├── (common)/         # Shared screens
│   │   │   │   ├── profile.tsx
│   │   │   │   ├── chat/
│   │   │   │   └── settings.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/           # Reusable UI components
│   │   ├── hooks/                # Custom hooks
│   │   ├── lib/                  # Supabase client, utils
│   │   ├── stores/               # Zustand state stores
│   │   ├── constants/            # Colors, config
│   │   └── i18n/                 # Tamil + English translations
│   │
│   └── web/                      # Next.js web app
│       ├── app/                  # App Router
│       │   ├── (marketing)/      # Landing page, about, pricing
│       │   ├── (app)/            # Authenticated app pages
│       │   │   ├── search/
│       │   │   ├── spot/[id]/
│       │   │   ├── dashboard/
│       │   │   └── admin/        # Admin panel
│       │   └── api/              # API routes (if needed beyond Supabase)
│       ├── components/
│       └── lib/
│
├── packages/
│   └── shared/                   # Shared types, utils, validation schemas
│       ├── types/
│       ├── utils/
│       └── validation/           # Zod schemas shared between web & mobile
│
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── functions/                # Supabase Edge Functions
│   │   ├── create-booking/
│   │   ├── process-payment/
│   │   ├── generate-otp/
│   │   └── calculate-payout/
│   ├── seed.sql                  # Sample data for development
│   └── config.toml
│
└── docs/                         # Documentation
    ├── api.md
    ├── deployment.md
    └── testing.md
```

---

## Build Phases Overview

| Phase | Name | Duration | Key Deliverables |
|-------|------|----------|-----------------|
| **Phase 0** | Project Setup & Infrastructure | 2–3 days | Monorepo, Supabase project, DB schema, auth |
| **Phase 1** | Owner Flow — Spot Listing | 3–4 days | Create/edit/manage parking spot listings |
| **Phase 2** | Seeker Flow — Search & Discovery | 3–4 days | Map view, proximity search, filters, spot detail |
| **Phase 3** | Booking & Payment Engine | 4–5 days | Booking flow, Razorpay integration, OTP reveal |
| **Phase 4** | Trust, Safety & Communication | 3–4 days | Reviews, chat, no-show penalties, SOS |
| **Phase 5** | Admin Dashboard & Analytics | 2–3 days | Admin panel, dispute resolution, metrics |
| **Phase 6** | Polish, i18n & Deployment | 2–3 days | Tamil/English, push notifications, deploy |

---

## Best Practices for Building with Cursor

### General Workflow

1. **Always start each phase by pasting the phase prompt** into Cursor's chat.
2. **Work in small, testable increments** — don't build everything at once. Commit after each working feature.
3. **Use Cursor's Composer mode** for multi-file changes (e.g., creating a new feature with component + hook + types + migration).
4. **Reference existing files** in your prompts — Cursor works best when it can see the context. Use `@filename` to reference files.
5. **Test after every change** — run the app, check the database, verify the UI.

### Prompting Tips for Cursor

- **Be specific:** "Create a React Native component for the spot listing card that shows thumbnail, fuzzy distance, price/hr, and rating" beats "make a card component."
- **Include context:** "Using the `spots` table schema from supabase/migrations/001_initial.sql, create a Supabase Edge Function that..."
- **Reference the stack:** "Using Supabase client from `lib/supabase.ts` and Zustand store pattern from `stores/auth.ts`, create..."
- **Ask for types first:** Before building UI, ask Cursor to generate TypeScript types from your DB schema.
- **Iterate, don't restart:** If something is wrong, describe the specific issue rather than regenerating everything.

### Git Strategy

```
main (production)
  └── develop (integration)
       ├── feature/auth-flow
       ├── feature/spot-listing
       ├── feature/search-map
       ├── feature/booking-engine
       └── feature/admin-panel
```

- Commit after every working feature.
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Never commit API keys or secrets.

### Environment Variables

```env
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Free Tier Limits to Watch

| Service | Limit | Mitigation |
|---------|-------|------------|
| Supabase DB | 500MB | Keep photos in Storage, not DB. Archive old bookings. |
| Supabase Storage | 1GB | Compress images client-side before upload (max 500KB each). |
| Supabase Edge Functions | 500K invocations/month | Cache frequently accessed data. Batch operations. |
| Mapbox | 50K map loads/month | Lazy-load maps. Use static map images for list views. |
| Vercel | 100GB bandwidth | Optimize images. Use CDN. SSG where possible. |
| Razorpay | Test mode only | No real transactions for college project. |

---

## Security Checklist

- [ ] Row Level Security (RLS) enabled on ALL Supabase tables.
- [ ] Exact spot locations NEVER exposed in client queries before booking confirmation.
- [ ] OTP codes are short-lived (15 min expiry) and single-use.
- [ ] KYC documents stored in private Supabase Storage bucket (not publicly accessible).
- [ ] Input validation with Zod on both client and server (Edge Functions).
- [ ] Rate limiting on auth endpoints and booking creation.
- [ ] SQL injection prevention via parameterized queries (Supabase handles this).
- [ ] CORS configured to allow only your domains.

---

*This master prompt serves as the single source of truth for the entire project. Each phase prompt references back to this document for schema, architecture, and conventions. Always keep this updated as the project evolves.*
