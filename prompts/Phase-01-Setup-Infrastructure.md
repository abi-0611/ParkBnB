# Phase 0 — Project Setup & Infrastructure

> **Goal:** Set up the monorepo, initialize Supabase, create the database schema with PostGIS, configure authentication, and establish the shared code foundation. By the end of this phase you should have a running Expo app and Next.js web app both connected to Supabase with working auth.

---

## Prerequisites

Before starting, ensure you have these installed locally:

```
Node.js >= 18
npm or pnpm (prefer pnpm for monorepo)
Git
Expo CLI: npm install -g expo-cli
Supabase CLI: npm install -g supabase
```

And create accounts (all free tier):
- **Supabase:** https://supabase.com → Create new project (region: Mumbai for lowest latency to Chennai)
- **Mapbox:** https://mapbox.com → Get access token
- **Razorpay:** https://razorpay.com → Create test-mode account
- **Vercel:** https://vercel.com → Connect GitHub repo
- **GitHub:** Create the repo `parknear`

---

## Step-by-Step Cursor Prompts

### Step 0.1 — Initialize Monorepo

Paste this into Cursor:

```
Create a pnpm monorepo for a project called "parknear" with this structure:

parknear/
├── apps/
│   ├── mobile/        # React Native Expo app (Expo SDK 51, Expo Router v3)
│   └── web/           # Next.js 14 app (App Router, TypeScript, Tailwind CSS)
├── packages/
│   └── shared/        # Shared TypeScript types, validation schemas (Zod), utilities
├── supabase/
│   ├── migrations/    # SQL migrations
│   ├── functions/     # Edge Functions (Deno/TypeScript)
│   └── config.toml
├── pnpm-workspace.yaml
├── package.json       # Root package.json with workspace scripts
├── .gitignore         # Include node_modules, .env*, .expo, .next, supabase/.temp
├── .env.example       # Template for env vars (Supabase URL, keys, Mapbox, Razorpay)
└── README.md

For the mobile app:
- Use `npx create-expo-app` with TypeScript template
- Install: expo-router, react-native-screens, react-native-safe-area-context
- Install: @supabase/supabase-js, zustand, react-native-mmkv (for secure storage)
- Set up Expo Router with file-based routing in apps/mobile/app/

For the web app:
- Use `npx create-next-app` with App Router, TypeScript, Tailwind, ESLint
- Install: @supabase/supabase-js, @supabase/ssr, zustand
- Configure path alias "@/" pointing to apps/web/

For the shared package:
- TypeScript-only package with Zod for validation
- Export types and schemas that both apps import

Set up the pnpm-workspace.yaml to link all packages. Add root scripts:
- "dev:mobile": "pnpm --filter mobile start"
- "dev:web": "pnpm --filter web dev"
- "typecheck": runs tsc across all packages
```

### Step 0.2 — Supabase Project & Database Schema

Paste this into Cursor:

```
Create the Supabase database migration file at supabase/migrations/001_initial_schema.sql with the following:

1. Enable the PostGIS extension for geospatial queries.

2. Create these tables with the exact schema:

USERS table:
- id: UUID primary key (default gen_random_uuid())
- email: TEXT unique not null
- phone: TEXT
- full_name: TEXT not null
- role: TEXT check ('seeker', 'owner', 'both', 'admin') default 'seeker'
- avatar_url: TEXT
- is_verified: BOOLEAN default false
- kyc_status: TEXT check ('pending', 'submitted', 'verified', 'rejected') default 'pending'
- aadhaar_doc_url, selfie_url: TEXT (for KYC docs)
- strike_count: INTEGER default 0
- is_banned: BOOLEAN default false
- preferred_language: TEXT default 'en'
- created_at, updated_at: TIMESTAMPTZ

VEHICLES table:
- id UUID PK
- user_id → users(id) ON DELETE CASCADE
- vehicle_type: check ('bike', 'car_hatchback', 'car_sedan', 'car_suv', 'ev')
- number_plate: TEXT not null
- rc_doc_url: TEXT
- is_default: BOOLEAN default false

SPOTS table:
- id UUID PK
- owner_id → users(id) ON DELETE CASCADE
- title, description: TEXT
- spot_type: check ('car', 'bike', 'both', 'ev_charging')
- coverage: check ('covered', 'open', 'underground')
- vehicle_size: check ('hatchback', 'sedan', 'suv', 'any') default 'any'
- total_slots: INTEGER default 1
- location: GEOGRAPHY(POINT, 4326) NOT NULL — exact location
- address_line: TEXT NOT NULL — exact address
- landmark, city (default 'Chennai'), pincode: TEXT
- fuzzy_landmark: TEXT NOT NULL — shown to seekers before booking
- fuzzy_radius_meters: INTEGER default 500
- price_per_hour, price_per_day, price_per_month: DECIMAL(10,2)
- is_instant_book: BOOLEAN default true
- is_active, is_featured: BOOLEAN
- amenities: JSONB default '[]'
- photos: TEXT[] NOT NULL
- video_url: TEXT
- avg_rating: DECIMAL(3,2) default 0
- total_reviews: INTEGER default 0
- created_at, updated_at: TIMESTAMPTZ

Create a GIST spatial index on spots.location.

AVAILABILITY table:
- id UUID PK
- spot_id → spots(id) ON DELETE CASCADE
- day_of_week: INTEGER (0-6)
- start_time, end_time: TIME
- is_recurring: BOOLEAN default true
- specific_date: DATE (for one-off)

BOOKINGS table:
- id UUID PK
- seeker_id → users(id), spot_id → spots(id), vehicle_id → vehicles(id)
- booking_type: check ('hourly', 'daily', 'monthly')
- start_time, end_time: TIMESTAMPTZ
- base_price, service_fee, total_price, owner_payout: DECIMAL(10,2)
- status: check ('pending', 'confirmed', 'checked_in', 'active', 'completed', 'cancelled_by_seeker', 'cancelled_by_owner', 'no_show', 'disputed') default 'pending'
- gate_otp: TEXT
- checked_in_at, checked_out_at: TIMESTAMPTZ
- payment_id, payment_status, razorpay_order_id, razorpay_payment_id: TEXT
- cancelled_at: TIMESTAMPTZ, cancellation_reason: TEXT, refund_amount: DECIMAL
- created_at, updated_at: TIMESTAMPTZ

REVIEWS table:
- id UUID PK
- booking_id → bookings(id) UNIQUE
- reviewer_id, reviewee_id → users(id), spot_id → spots(id)
- rating: INTEGER (1-5), comment: TEXT
- review_type: check ('seeker_to_owner', 'owner_to_seeker')

MESSAGES table:
- id UUID PK
- booking_id → bookings(id)
- sender_id, receiver_id → users(id)
- content: TEXT, is_read: BOOLEAN default false

TRANSACTIONS table:
- id UUID PK
- booking_id → bookings(id), user_id → users(id)
- type: check ('payment', 'refund', 'payout', 'penalty')
- amount: DECIMAL(10,2)
- status: check ('pending', 'completed', 'failed')
- razorpay_ref: TEXT

3. Add Row Level Security (RLS) policies:
- Users: can read own profile, update own profile. Admins can read all.
- Spots: anyone can read active spots (but EXCLUDE address_line and exact location fields — create a VIEW called spots_public that omits these). Owners can CRUD their own spots.
- Bookings: seekers see own bookings, owners see bookings for their spots. On confirmed bookings, seekers CAN see spot address.
- Reviews: anyone can read. Only booking participants can create.
- Messages: only sender/receiver can read/create.

4. Create the spots_public VIEW:
   SELECT id, owner_id, title, description, spot_type, coverage, vehicle_size,
          total_slots, fuzzy_landmark, fuzzy_radius_meters,
          price_per_hour, price_per_day, price_per_month,
          is_instant_book, is_active, amenities, photos, video_url,
          avg_rating, total_reviews, created_at,
          ST_Y(location::geometry) as fuzzy_lat,
          ST_X(location::geometry) as fuzzy_lng
   FROM spots WHERE is_active = true;
   (Note: fuzzy_lat/lng will be randomized within fuzzy_radius in the client)

5. Create a function for proximity search:
   CREATE OR REPLACE FUNCTION search_spots_nearby(
     user_lat DOUBLE PRECISION,
     user_lng DOUBLE PRECISION,
     radius_meters INTEGER DEFAULT 2000,
     spot_filter TEXT DEFAULT NULL,
     max_price DECIMAL DEFAULT NULL
   ) RETURNS TABLE (...) — return fuzzy info + distance, never exact address.

Also create supabase/seed.sql with 10 sample parking spots scattered across Chennai (Anna Nagar, T. Nagar, Adyar, Velachery, OMR, Tambaram, etc.) with realistic data.
```

### Step 0.3 — Supabase Auth Setup

```
Set up Supabase authentication for the project:

1. In apps/mobile/lib/supabase.ts:
   - Create and export the Supabase client using @supabase/supabase-js
   - Use react-native-mmkv as the async storage adapter for auth session persistence
   - Read SUPABASE_URL and SUPABASE_ANON_KEY from environment (use expo-constants or app.config.ts)

2. In apps/web/lib/supabase.ts:
   - Create a browser client using @supabase/ssr createBrowserClient
   - Create a server client helper using createServerClient for Server Components

3. In packages/shared/validation/auth.ts:
   - Create Zod schemas for:
     - signUpSchema: email (required), full_name (min 2 chars), phone (optional, Indian format)
     - loginSchema: email (required)
     - otpVerifySchema: email, otp (6 digits)
     - profileUpdateSchema: full_name, phone, avatar_url, preferred_language ('en' | 'ta')

4. Create a Zustand auth store in both apps (apps/mobile/stores/auth.ts and apps/web/stores/auth.ts):
   - State: user, session, isLoading, isAuthenticated
   - Actions: signInWithOtp(email), verifyOtp(email, token), signOut(), refreshSession()
   - On sign-up, auto-create a row in the users table using a Supabase database trigger

5. Create the Supabase database trigger + function:
   Add to migrations: a function handle_new_user() that inserts into public.users when auth.users gets a new row:
   - Extract email and full_name from raw_user_meta_data
   - Set default role as 'seeker'

6. Create auth screens for the mobile app:
   - apps/mobile/app/(auth)/login.tsx — Email input + "Send OTP" button
   - apps/mobile/app/(auth)/verify.tsx — OTP input (6 digits) + "Verify" button
   - apps/mobile/app/(auth)/onboarding.tsx — Choose role (Seeker / Owner / Both) + set name
   - Use clean, minimal UI with the ParkNear brand colors (primary: #0EA5E9 sky-blue, secondary: #10B981 emerald)

7. Set up auth middleware in the web app:
   - apps/web/middleware.ts — protect routes under (app)/ requiring authenticated session
   - Redirect unauthenticated users to /login
```

### Step 0.4 — Shared Types & Utilities

```
In packages/shared/, create TypeScript types derived from the database schema:

1. packages/shared/types/database.ts:
   - Export types for all tables: User, Vehicle, Spot, SpotPublic (from the view), Booking, Review, Message, Transaction
   - Use the exact column names and types matching the SQL schema
   - Include enum types: UserRole, SpotType, Coverage, VehicleType, BookingStatus, BookingType, PaymentStatus, KycStatus, ReviewType

2. packages/shared/types/api.ts:
   - SearchSpotsParams: { lat, lng, radius_meters, spot_type?, max_price?, vehicle_type?, sort_by? }
   - SearchSpotsResult: SpotPublic & { distance_meters: number }
   - CreateBookingParams: { spot_id, vehicle_id, booking_type, start_time, end_time }
   - BookingWithDetails: Booking & { spot: SpotPublic, seeker: User, vehicle: Vehicle }

3. packages/shared/utils/pricing.ts:
   - calculateServiceFee(basePrice): returns 12% service fee (min ₹5)
   - calculateOwnerPayout(basePrice): returns base - 10% commission
   - calculateTotalPrice(basePrice): returns base + service fee
   - formatINR(amount): returns "₹XXX" formatted string

4. packages/shared/utils/location.ts:
   - fuzzyLocation(lat, lng, radiusMeters): returns randomized lat/lng within radius (for display)
   - formatDistance(meters): returns "200m" or "1.2km"
   - getDistanceDescription(meters, landmark): returns "~500m near Anna Nagar Tower"

5. packages/shared/validation/ — Zod schemas for all create/update operations:
   - spotSchema, bookingSchema, reviewSchema, vehicleSchema
   - All schemas should be importable by both mobile and web apps

Make sure the shared package has a proper tsconfig.json and package.json with "main" and "types" exports that both apps can resolve.
```

### Step 0.5 — Verify Everything Works

```
Create a simple test to verify the full setup:

1. Run the Supabase migrations:
   supabase db push (or supabase migration up for local dev)

2. Seed the database:
   Run supabase/seed.sql to insert 10 sample spots in Chennai

3. In the mobile app, create a simple home screen (apps/mobile/app/(seeker)/home.tsx) that:
   - Shows "Welcome to ParkNear" text
   - Shows logged-in user's name from auth store
   - Fetches and displays the count of active spots from Supabase
   - Has a "Sign Out" button

4. In the web app, create a landing page (apps/web/app/page.tsx) that:
   - Shows "ParkNear — Your parking spot, a tap away" hero section
   - Has Login / Sign Up buttons
   - Fetches and shows "X spots available in Chennai" from Supabase

5. Verify RLS: Try querying the spots table from the client — should see public fields only, not address_line or exact location.

Run both apps simultaneously and confirm:
- Auth flow works (sign up → OTP → verify → redirected to home)
- Supabase connection works (data fetched)
- Shared types are importable in both apps
- No TypeScript errors
```

---

## Checklist Before Moving to Phase 1

- [ ] Monorepo runs with `pnpm dev:mobile` and `pnpm dev:web`
- [ ] Supabase project created with PostGIS enabled
- [ ] All tables created with correct schema and relationships
- [ ] RLS policies active on all tables
- [ ] `spots_public` view created (no sensitive location data)
- [ ] `search_spots_nearby` function working
- [ ] Auth flow working (email OTP → session → user row created)
- [ ] Shared types and validation schemas importable by both apps
- [ ] Seed data inserted (10 Chennai spots)
- [ ] `.env.local` set up (never committed)
- [ ] Git repo initialized with first commit on `develop` branch
