# Phase 1 — Owner Flow: Spot Listing & Management

> **Goal:** Build the complete owner experience — listing a parking spot with photos, setting pricing and availability, managing existing listings, and viewing a basic dashboard. By the end, an owner can create, edit, activate/deactivate, and delete parking spots.

---

## Context for Cursor

When starting this phase, paste the following context first:

```
I'm building "ParkNear", a parking marketplace app for Chennai. I've completed Phase 0 (setup). Here's my current state:

Stack: React Native (Expo Router) + Next.js 14 + Supabase (PostgreSQL + PostGIS + Auth + Storage + Edge Functions)
Auth: Working email OTP via Supabase Auth
Database: All tables created (users, vehicles, spots, availability, bookings, reviews, messages, transactions) with RLS
Shared package: Types, Zod validation, utility functions

Key conventions:
- Supabase client: apps/mobile/lib/supabase.ts and apps/web/lib/supabase.ts
- State management: Zustand stores
- Validation: Zod schemas from packages/shared/validation/
- Types: packages/shared/types/
- Colors: Primary #0EA5E9 (sky-blue), Secondary #10B981 (emerald), Background #F8FAFC
- All photos stored in Supabase Storage bucket "spot-photos" (private for KYC, public for spot photos)
```

---

## Step-by-Step Cursor Prompts

### Step 1.1 — Supabase Storage Buckets

```
Set up Supabase Storage buckets for the project:

1. Create a migration file supabase/migrations/002_storage_buckets.sql:
   - Create public bucket "spot-photos" (for parking spot images/videos — publicly readable)
   - Create private bucket "kyc-documents" (for Aadhaar, PAN, RC uploads — only owner + admin can read)
   - Set file size limits: spot-photos max 5MB, kyc-documents max 10MB
   - Set allowed MIME types: images (jpg, png, webp, heic) and video (mp4) for spot-photos

2. Create RLS policies for storage:
   - spot-photos: anyone can read, authenticated users can upload to their own folder (user_id/*)
   - kyc-documents: only the uploading user and admins can read, authenticated users can upload to their own folder

3. Create a utility function in packages/shared/utils/storage.ts:
   - getSpotPhotoUrl(path): returns public URL for spot photo
   - generateUploadPath(userId, filename): returns "userId/timestamp-filename"
   - compressImage(uri, maxWidth=1200, quality=0.8): for client-side compression before upload
```

### Step 1.2 — Image Upload Component

```
Create a reusable image upload component for the React Native mobile app:

File: apps/mobile/components/ImagePicker.tsx

Requirements:
- Use expo-image-picker for selecting from gallery or taking a photo
- Allow multi-select (min 2, max 6 photos for spot listing)
- Show thumbnail previews of selected images in a horizontal scroll
- Allow removing individual photos (tap X button on thumbnail)
- Allow reordering photos (first photo = thumbnail shown in search results)
- Compress images client-side before upload (max 1200px width, 80% quality) using expo-image-manipulator
- Upload to Supabase Storage "spot-photos" bucket on selection
- Show upload progress per image
- Return array of uploaded file paths

Props:
- maxImages: number (default 6)
- minImages: number (default 2)
- existingPhotos?: string[] (for editing existing spot)
- onPhotosChange: (photos: string[]) => void

Use a clean card-based UI. Show a dashed-border "+" card to add more photos. Show photo count "2/6".
```

### Step 1.3 — Create Spot Form (Mobile)

```
Build the "List Your Spot" multi-step form for the mobile app:

File: apps/mobile/app/(owner)/spots/create.tsx

This is a multi-step wizard form with 4 steps. Use a Zustand store (apps/mobile/stores/createSpot.ts) to hold form state across steps.

STEP 1 — Location:
- Full-screen Mapbox map centered on Chennai (13.0827, 80.2707)
- "Drop a pin on your parking spot" instruction text
- User taps map to place a pin (draggable marker)
- Below map: auto-filled address from reverse geocoding (Mapbox Geocoding API)
- Editable fields: Address line (auto-filled, can edit), Landmark (manual input), Pincode
- "Fuzzy landmark" field: what nearby landmark should seekers see? (e.g., "Near Phoenix Mall")
- Next button (disabled until pin placed and landmark entered)

STEP 2 — Spot Details:
- Spot title: TextInput (e.g., "Covered car parking in Anna Nagar")
- Description: TextInput multiline (optional)
- Spot type: segmented control (Car / Bike / Both / EV Charging)
- Coverage: segmented control (Covered / Open / Underground)
- Vehicle size supported: segmented control (Hatchback / Sedan / SUV / Any)
- Number of slots: numeric stepper (1-20)
- Amenities: multi-select chips (CCTV, Security Guard, Shade, EV Charger, Wash Bay, Well Lit, Easy Access)

STEP 3 — Photos:
- Use the ImagePicker component from Step 1.2
- Minimum 2 photos required to proceed
- Optional: video URL field (YouTube/direct link)

STEP 4 — Pricing & Availability:
- Pricing section:
  - Price per hour: TextInput numeric with ₹ prefix (suggested range shown based on area)
  - Price per day: TextInput numeric (auto-suggest = hourly * 8)
  - Price per month: TextInput numeric (auto-suggest = daily * 25)
  - At least one pricing tier required
- Availability section:
  - Toggle: "Available all day" vs custom hours
  - If custom: day-of-week checkboxes + start time / end time pickers
  - Default: Mon-Sat, 8:00 AM - 8:00 PM
- Booking mode: toggle between "Instant Book" and "Request to Book"

SUBMIT:
- Validate all fields using spotSchema from packages/shared/validation/
- Show validation errors inline
- Insert into spots table + availability table
- Show success screen with "View Your Listing" button
- Navigate to owner dashboard

Use the Supabase client to insert. Make sure the location is stored as PostGIS geography point:
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)

Use @react-native-community/datetimepicker for time pickers.
```

### Step 1.4 — Owner Dashboard

```
Build the owner dashboard for the mobile app:

File: apps/mobile/app/(owner)/dashboard.tsx

Layout:
- Top: greeting "Hello, {name}" + avatar
- Stats row (horizontal scroll cards):
  - Active Listings: count
  - Total Bookings: count (this month)
  - Earnings: ₹XXX (this month)
  - Average Rating: X.X stars
- Section: "Your Spots" — vertical list of spot cards

Each spot card shows:
- Thumbnail (first photo)
- Title
- Type icon + coverage
- Price/hr
- Rating (stars)
- Status badge: Active (green) / Inactive (gray)
- Quick actions: Edit / Toggle Active / Delete (with confirmation)

Tapping a spot card navigates to the spot detail/edit screen.

At the bottom: FAB (Floating Action Button) "+" to create new spot.

Fetch data from Supabase:
- spots where owner_id = current user
- bookings count for those spots (this month)
- sum of owner_payout for completed bookings (this month)

Create a Zustand store: apps/mobile/stores/ownerDashboard.ts
- spots: Spot[]
- stats: { activeListings, totalBookings, monthlyEarnings, avgRating }
- fetchDashboard(): loads all data in parallel
- toggleSpotActive(spotId): updates is_active
- deleteSpot(spotId): soft delete (set is_active = false + mark deleted)
```

### Step 1.5 — Edit Spot Screen

```
Create the edit spot screen for the mobile app:

File: apps/mobile/app/(owner)/spots/[id].tsx

This reuses the same multi-step form from create.tsx but pre-filled with existing data.

Requirements:
- Fetch spot data by ID from Supabase (including availability rows)
- Pre-fill all form fields
- Map shows existing pin (draggable to update location)
- Photos show existing photos + ability to add/remove
- "Save Changes" button at each step (not just at the end)
- "Delete Listing" button with confirmation dialog ("Are you sure? Active bookings will be cancelled.")
- Show a diff/preview of changes before saving

Also create:
- A "Spot Preview" component that shows what seekers will see (fuzzy location, public info only)
- Owner can tap "Preview as Seeker" to see their listing from the seeker's perspective
```

### Step 1.6 — Availability Calendar Component

```
Create a real-time availability calendar component:

File: apps/mobile/components/AvailabilityCalendar.tsx

Requirements:
- Weekly view showing Mon-Sun
- Each day shows available time blocks as colored bars
- Green = available, Gray = unavailable, Blue = booked
- Owner can tap a day to edit availability for that day
- Support recurring availability (same every week) and one-off overrides
- "Block dates" feature: owner can mark specific dates as unavailable (holidays, etc.)
- Shows existing bookings as non-editable blue blocks

Data flow:
- Read from availability table (recurring rules) + bookings table (confirmed bookings)
- Write to availability table when owner changes schedule
- Real-time updates using Supabase Realtime subscription on bookings table

Props:
- spotId: string
- isEditable: boolean (true for owner, false for seeker view)
- onAvailabilityChange?: (slots: AvailabilitySlot[]) => void

Use react-native-calendars for the base calendar if needed, or build a custom weekly grid.
```

### Step 1.7 — Owner Flow on Web (Next.js)

```
Replicate the core owner flow for the Next.js web app:

Files:
- apps/web/app/(app)/dashboard/page.tsx — Owner dashboard (same stats + spot list)
- apps/web/app/(app)/spots/new/page.tsx — Create spot form (same 4 steps, web-optimized)
- apps/web/app/(app)/spots/[id]/page.tsx — Edit spot
- apps/web/app/(app)/spots/[id]/availability/page.tsx — Manage availability

Web-specific differences:
- Use Mapbox GL JS (not React Native Mapbox) for the map
- Use Next.js file upload with Supabase Storage (drag-and-drop zone for photos)
- Multi-step form uses URL params or state (?step=1, ?step=2) for browser back/forward
- Responsive layout: sidebar on desktop, bottom tabs on mobile web
- Use shadcn/ui components for form elements (or build with Tailwind)

Reuse:
- Same Zod validation schemas from packages/shared/
- Same Supabase queries (extract into packages/shared/queries/ if not already)
- Same types from packages/shared/types/
```

---

## Key Implementation Notes

### Storing Location Securely

```typescript
// When inserting a spot, use raw SQL via Supabase RPC for PostGIS:
const { data, error } = await supabase.rpc('create_spot', {
  p_owner_id: user.id,
  p_title: formData.title,
  p_lat: formData.latitude,
  p_lng: formData.longitude,
  // ... other fields
});

// The RPC function in SQL:
CREATE OR REPLACE FUNCTION create_spot(
  p_owner_id UUID, p_title TEXT, p_lat FLOAT, p_lng FLOAT, ...
) RETURNS UUID AS $$
  INSERT INTO spots (owner_id, title, location, ...)
  VALUES (p_owner_id, p_title, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, ...)
  RETURNING id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Photo Compression Before Upload

```typescript
// In ImagePicker component, compress before uploading:
import * as ImageManipulator from 'expo-image-manipulator';

const compressed = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 1200 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
// Then upload compressed.uri to Supabase Storage
```

---

## Checklist Before Moving to Phase 2

- [ ] Storage buckets created with correct RLS
- [ ] Image upload component working with compression
- [ ] Create spot form (all 4 steps) working → data saved to DB
- [ ] Location pin placement working with Mapbox
- [ ] Availability slots saved correctly
- [ ] Owner dashboard showing real stats from DB
- [ ] Edit spot working (pre-fill + update)
- [ ] Toggle active/inactive working
- [ ] Delete spot working with confirmation
- [ ] Availability calendar component working
- [ ] Web version of owner flow working
- [ ] At least 5 manually created spots in DB for testing Phase 2
