# Phase 2 — Seeker Flow: Search & Discovery

> **Goal:** Build the seeker's experience — searching for nearby parking spots using live GPS, viewing results on a map with fuzzy pins, filtering/sorting, and viewing spot details. The exact address remains hidden until booking confirmation (Phase 3).

---

## Context for Cursor

```
I'm building "ParkNear", a parking marketplace for Chennai. Phase 0 (setup) and Phase 1 (owner flow) are complete.

Current state:
- Owners can list spots with photos, pricing, availability, and exact GPS location
- Spots are stored with PostGIS GEOGRAPHY points
- spots_public VIEW excludes exact address/location
- search_spots_nearby() RPC function exists for proximity search
- Supabase RLS is active — seekers cannot see address_line or exact location pre-booking

This phase focuses on the SEEKER experience: searching, browsing, filtering, and viewing spot details — but NOT booking (that's Phase 3).

Stack reminder: React Native (Expo Router) + Next.js 14 + Supabase + Mapbox + Zustand
Colors: Primary #0EA5E9, Secondary #10B981, Background #F8FAFC
```

---

## Step-by-Step Cursor Prompts

### Step 2.1 — Location Permission & GPS

```
Set up location services for the React Native app:

File: apps/mobile/hooks/useLocation.ts

Create a custom hook that:
1. Requests location permission (foreground only) using expo-location
2. Gets the user's current GPS coordinates
3. Watches position updates (for real-time tracking when app is open)
4. Returns: { latitude, longitude, isLoading, error, permissionStatus, requestPermission, refreshLocation }
5. If permission denied, returns a default Chennai center (13.0827, 80.2707) and shows a banner "Enable location for better results"
6. Stores last known location in MMKV (react-native-mmkv) so the app loads faster next time

File: apps/mobile/components/LocationBanner.tsx
- Shows "Enable location services" banner when permission is denied
- Tapping opens device settings
- Dismissible with "Use Chennai center" fallback option

Important: Ask for permission with a clear explanation screen BEFORE the system dialog:
"ParkNear needs your location to find parking spots near you. We only use your location while the app is open."
+ "Allow" button → triggers system permission dialog
+ "Not now" → uses default Chennai center
```

### Step 2.2 — Search Spots Hook & Store

```
Create the search functionality:

File: apps/mobile/stores/search.ts (Zustand store)

State:
- spots: SearchSpotsResult[] (results)
- isLoading: boolean
- filters: {
    spotType: 'car' | 'bike' | 'both' | 'ev_charging' | null,
    coverage: 'covered' | 'open' | 'underground' | null,
    maxPricePerHour: number | null,
    vehicleSize: 'hatchback' | 'sedan' | 'suv' | null,
    hasEVCharging: boolean,
    isInstantBook: boolean | null,
    minRating: number | null,
    availableNow: boolean
  }
- sortBy: 'distance' | 'price_low' | 'price_high' | 'rating' (default: 'distance')
- searchRadius: number (default: 2000 meters, max: 5000)
- userLocation: { lat: number, lng: number } | null
- selectedSpotId: string | null (for map highlight)

Actions:
- searchNearby(lat, lng): calls search_spots_nearby RPC with current filters
- setFilter(key, value): update a filter and re-search
- setSortBy(sort): update sort and re-sort results client-side
- setSearchRadius(meters): update radius and re-search
- clearFilters(): reset all filters
- selectSpot(id): set selected spot for map highlight

The search_spots_nearby RPC should:
- Return spots within radius, sorted by distance
- Apply filters server-side (spot_type, max_price, etc.)
- Return FUZZY data only: fuzzy_landmark, fuzzy_lat/lng (randomized within fuzzy_radius), price, rating, photos, distance
- NEVER return address_line or exact location coordinates

File: packages/shared/queries/spots.ts
- Export the search function that both mobile and web can use
- Handle the Supabase RPC call with proper typing
```

### Step 2.3 — Map View (Seeker Home Screen)

```
Build the main seeker home screen with map and search:

File: apps/mobile/app/(seeker)/home.tsx

Layout (top to bottom):
1. Search bar at top (overlaying map):
   - Tapping opens a search/filter sheet
   - Shows current area name (reverse geocoded from user location)
   - Small filter icon on the right → opens filter bottom sheet

2. Full-screen Mapbox map:
   - Centered on user's GPS location (blue pulsing dot)
   - Fuzzy spot markers: circular zones (not exact pins) showing:
     - Price label inside circle (e.g., "₹30/hr")
     - Color-coded: green (available now), orange (available later), gray (fully booked)
   - Tapping a fuzzy zone opens a mini card at the bottom
   - Map zooms and pans smoothly
   - "Re-center" button (bottom-right) to go back to user location

3. Bottom sheet (starts as collapsed bar, draggable up):
   - Collapsed: shows "X spots nearby" + toggle icon for list view
   - Half-expanded: shows scrollable list of spot cards
   - Full-expanded: full list view with filters at top

The fuzzy zones on the map:
- Use Mapbox circle layers, NOT exact pin markers
- Center of each circle = fuzzy_lat/lng (already randomized)
- Radius of circle = fuzzy_radius_meters (typically 300-500m)
- Opacity: 0.15 fill, 0.4 border
- Show price label at center

Use @rnmapbox/maps for React Native Mapbox integration.
Fetch spots using the search store from Step 2.2.
Re-fetch when user pans the map significantly (debounced, 500ms).
```

### Step 2.4 — Spot Card Component

```
Create a reusable spot card component used in both list and map views:

File: apps/mobile/components/SpotCard.tsx

Two variants:
1. SpotCardMini — shown when tapping a map marker (compact):
   - Horizontal layout: thumbnail (80x80) | title, price/hr, distance, rating (inline)
   - Tapping navigates to spot detail

2. SpotCardFull — shown in list view:
   - Vertical card with:
     - Photo carousel (horizontal scroll, first 3 photos, dots indicator)
     - Title (bold)
     - Row: spot type icon + coverage badge + vehicle size badge
     - Row: "~500m near Anna Nagar Tower" (fuzzy distance + landmark)
     - Row: ₹30/hr · ₹200/day · ₹4,000/mo (show available pricing tiers)
     - Row: ★ 4.5 (23 reviews) · Instant Book badge (if applicable)
     - Amenity icons row (CCTV, shade, etc. — show up to 4, "+3 more")
     - "Book Now" button (navigates to spot detail → then booking in Phase 3)

Props for both:
- spot: SearchSpotsResult (includes fuzzy data + distance)
- onPress: () => void

Style:
- White card with subtle shadow (elevation 2)
- Rounded corners (12px)
- Primary color accents for price and rating
- Use skeleton loader while photos load
```

### Step 2.5 — Filter & Sort Bottom Sheet

```
Create the filter and sort interface:

File: apps/mobile/components/SearchFilters.tsx

Use a bottom sheet (react-native-bottom-sheet or @gorhom/bottom-sheet).

Filter sections:
1. Vehicle Type: chip selector (Car / Bike / EV)
2. Coverage: chip selector (Covered / Open / Underground / Any)
3. Price Range: dual slider (₹0 - ₹200/hr) with labels
4. Rating: "4+ stars" / "3+ stars" / "Any"
5. Availability: toggle "Available Right Now"
6. Booking Type: toggle "Instant Book Only"
7. Search Radius: slider (500m - 5km) with distance label

Bottom bar:
- "Clear All" (left) — resets filters
- "Show X results" (right, primary button) — applies and closes sheet
- Results count updates live as filters change (debounced query)

File: apps/mobile/components/SortOptions.tsx
- Horizontal chip row shown above the spot list:
  - "Nearest" (default) / "Price: Low-High" / "Price: High-Low" / "Top Rated"
- Tapping a chip re-sorts results and highlights the active sort

Both components should update the search Zustand store, which triggers a re-query.
```

### Step 2.6 — Spot Detail Screen

```
Create the spot detail screen for seekers:

File: apps/mobile/app/(seeker)/spot/[id].tsx

This screen shows full spot information but STILL hides the exact address.

Layout (scrollable):
1. Photo gallery (full-width carousel with pagination dots + pinch-to-zoom)
2. Title + owner info:
   - Spot title (large)
   - "Listed by {owner_name}" with avatar (if verified: show blue checkmark)
   - Member since date
3. Quick info row:
   - Spot type icon + label
   - Coverage icon + label
   - Vehicle size icon + label
   - "Instant Book" badge if applicable
4. Location section:
   - Small static Mapbox map showing the fuzzy zone circle (NOT exact pin)
   - Text: "📍 Near {fuzzy_landmark}" + "~{distance}m from you"
   - Note: "Exact location revealed after booking confirmation"
5. Pricing section:
   - Cards for each available tier: Hourly / Daily / Monthly
   - Each card shows: price, "Select" button
   - Highlight best value (if monthly = daily * 22 or less, show "Best Value" badge)
6. Amenities section:
   - Grid of amenity icons with labels (CCTV, Security Guard, Shade, etc.)
7. Availability section:
   - Use AvailabilityCalendar component (read-only mode)
   - Show available time slots for the next 7 days
8. Reviews section:
   - Average rating (large) + star visualization + total count
   - List of recent reviews (3 most recent, "See all" link)
   - Each review: reviewer name, rating stars, date, comment text
9. Bottom sticky bar:
   - "₹XX/hr" price display
   - "Book Now" button (primary) → navigates to booking flow (Phase 3)
   - "Chat with Owner" button (secondary) → opens chat (Phase 4)

Fetch spot data:
- Use spots_public view for fuzzy data
- Fetch reviews separately
- Fetch availability separately
- Do NOT fetch or display address_line or exact coordinates
```

### Step 2.7 — Web Search Experience

```
Build the seeker search experience for the Next.js web app:

File: apps/web/app/(app)/search/page.tsx

Split-panel layout (desktop):
- Left panel (40%): scrollable list of spot cards with filters at top
- Right panel (60%): full-height Mapbox GL JS map with fuzzy zones

Mobile web: map on top (40vh), list below (scrollable)

Features:
- URL-based search: /search?lat=13.08&lng=80.27&radius=2000&type=car&maxPrice=50
- Server-side initial fetch (SSR with Supabase server client for fast first paint)
- Client-side re-fetches on filter/map changes
- Map uses Mapbox GL JS (browser version) with:
  - Circle layers for fuzzy zones (same as mobile)
  - Clustered markers when zoomed out (show count)
  - "Search this area" button when user pans map
- Hovering over a list card highlights the map circle (and vice versa)
- Responsive: works on mobile browsers too

File: apps/web/app/(app)/spot/[id]/page.tsx
- Same spot detail layout as mobile but web-optimized
- Use Next.js Image component for optimized photo loading
- Generate OpenGraph meta tags for link sharing
```

### Step 2.8 — Search Autocomplete & Recent Searches

```
Add search autocomplete and recent searches:

File: apps/mobile/components/SearchBar.tsx

When user taps the search bar, show:
1. Recent searches (stored in MMKV, max 5):
   - "Anna Nagar" / "Near Phoenix Mall" etc.
   - Each with distance from current location
   - "Clear history" option

2. As user types, show autocomplete results:
   - Use Mapbox Geocoding API to search for places in Chennai
   - Show results: place name + area
   - Tapping a result centers the map on that location and searches for spots nearby

3. Quick location chips (below search bar):
   - "Near Me" (uses GPS)
   - Popular areas: "T. Nagar", "Anna Nagar", "OMR", "Velachery", "Adyar"
   - Tapping chips searches that area

Store search history in MMKV (not Supabase — purely local for privacy).
Debounce geocoding API calls by 300ms.
```

---

## Key Implementation Notes

### Fuzzy Location Randomization

The `spots_public` view returns the actual lat/lng from the geography column. You need to randomize it on the client or in the view:

```sql
-- Option 1: Randomize in the VIEW (preferred — consistent per session)
CREATE OR REPLACE VIEW spots_public AS
SELECT
  id, owner_id, title, description, spot_type, coverage, vehicle_size,
  total_slots, fuzzy_landmark, fuzzy_radius_meters,
  price_per_hour, price_per_day, price_per_month,
  is_instant_book, is_active, amenities, photos, video_url,
  avg_rating, total_reviews, created_at,
  -- Randomized coordinates within fuzzy_radius
  ST_Y(location::geometry) + (random() - 0.5) * (fuzzy_radius_meters / 111000.0) as fuzzy_lat,
  ST_X(location::geometry) + (random() - 0.5) * (fuzzy_radius_meters / 111000.0) as fuzzy_lng
FROM spots
WHERE is_active = true;
```

Note: `random()` in the view will give different values per query. For consistency within a session, randomize once on the client and cache.

### Distance Calculation in Search

```sql
-- The search_spots_nearby function calculates real distance using exact location
-- but returns fuzzy coordinates:
CREATE OR REPLACE FUNCTION search_spots_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 2000,
  p_spot_type TEXT DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  fuzzy_landmark TEXT,
  fuzzy_lat DOUBLE PRECISION,
  fuzzy_lng DOUBLE PRECISION,
  spot_type TEXT,
  coverage TEXT,
  price_per_hour DECIMAL,
  price_per_day DECIMAL,
  price_per_month DECIMAL,
  avg_rating DECIMAL,
  photos TEXT[],
  amenities JSONB,
  is_instant_book BOOLEAN,
  distance_meters DOUBLE PRECISION
) AS $$
SELECT
  s.id, s.title, s.fuzzy_landmark,
  ST_Y(s.location::geometry) + (random()-0.5)*(s.fuzzy_radius_meters/111000.0),
  ST_X(s.location::geometry) + (random()-0.5)*(s.fuzzy_radius_meters/111000.0),
  s.spot_type, s.coverage,
  s.price_per_hour, s.price_per_day, s.price_per_month,
  s.avg_rating, s.photos, s.amenities, s.is_instant_book,
  ST_Distance(s.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
FROM spots s
WHERE s.is_active = true
  AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_meters)
  AND (p_spot_type IS NULL OR s.spot_type = p_spot_type)
  AND (p_max_price IS NULL OR s.price_per_hour <= p_max_price)
ORDER BY ST_Distance(s.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
LIMIT 20;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Checklist Before Moving to Phase 3

- [ ] Location permission flow working (with graceful fallback)
- [ ] search_spots_nearby RPC returning fuzzy results correctly
- [ ] Map view showing fuzzy zones (circles, not pins)
- [ ] Spot cards (mini + full) rendering correctly
- [ ] Filter bottom sheet working with live result count
- [ ] Sort options working (distance, price, rating)
- [ ] Spot detail screen showing all public info + fuzzy map
- [ ] Address and exact coordinates NEVER exposed to seekers
- [ ] Search autocomplete with Mapbox geocoding
- [ ] Web search page working with split-panel layout
- [ ] "Re-center" and "Search this area" buttons working
- [ ] Performance: search results load in < 2 seconds
