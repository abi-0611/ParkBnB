# Phase 6 — Polish, Internationalization & Deployment

> **Goal:** Add final polish — Tamil + English language support, push notifications, landing page, performance optimizations, and deploy everything. By the end of this phase, the project is demo-ready for college presentation.

---

## Context for Cursor

```
I'm building "ParkNear", a parking marketplace for Chennai. All core features (Phases 0-5) are complete.

This final phase is about polish and deployment. The app is functionally complete but needs:
1. Tamil language support (i18n)
2. Push notifications
3. A marketing landing page
4. Performance optimizations
5. Deployment to free-tier services

Stack: React Native (Expo) + Next.js 14 + Supabase + Mapbox + Razorpay
Deployment: Vercel (web) + Expo EAS (mobile builds) + Supabase (hosted)
```

---

## Step-by-Step Cursor Prompts

### Step 6.1 — Internationalization (Tamil + English)

```
Add Tamil + English language support to both mobile and web apps:

MOBILE APP:
1. Install: expo-localization + i18next + react-i18next
2. Create translation files:
   - apps/mobile/i18n/en.json (English — default)
   - apps/mobile/i18n/ta.json (Tamil)
3. Setup i18next in apps/mobile/i18n/config.ts:
   - Detect device language (expo-localization)
   - Fallback to English
   - Lazy load Tamil translations

4. Replace ALL hardcoded strings across the mobile app with translation keys.

Key translation categories:
- auth: "Sign In", "Enter OTP", "Verify", etc.
- home: "Find Parking Near You", "Search", "Filter", etc.
- spots: "List Your Spot", "Covered", "Open", "Car", "Bike", etc.
- booking: "Book Now", "Pay", "Check In", "Check Out", etc.
- profile: "My Profile", "Vehicles", "Reviews", etc.
- common: "Cancel", "Save", "Loading", "Error", etc.

Tamil translations — use natural conversational Tamil, not formal:
- "Find Parking" → "பார்க்கிங் தேடுங்கள்"
- "Book Now" → "இப்போதே புக் செய்யுங்கள்"
- "Near you" → "உங்கள் அருகில்"
- "Check In" → "செக் இன்"
- etc. (provide comprehensive translations for all keys)

5. Language switcher:
   - In Settings screen: toggle between English / தமிழ்
   - Save preference to user's profile (preferred_language) and MMKV
   - App restarts with new language immediately

WEB APP:
1. Use next-intl for Next.js i18n
2. Same translation files (shared or duplicated)
3. Language switcher in header/footer
4. URL-based locale: /en/search, /ta/search (or use cookie-based)
```

### Step 6.2 — Push Notifications

```
Set up push notifications using Expo Push Notifications (free):

File: apps/mobile/hooks/usePushNotifications.ts
File: supabase/functions/send-notification/index.ts

Setup:
1. Register for push tokens on app launch (after auth):
   - Use expo-notifications to get ExpoPushToken
   - Store token in users table: push_token TEXT field (add migration)
   - Update token on each app launch (tokens can change)

2. Create a Supabase Edge Function: send-notification
   - Accepts: { userId, title, body, data }
   - Fetches user's push_token from DB
   - Sends via Expo Push API:
     POST https://exp.host/--/api/v2/push/send
     Body: { to: pushToken, title, body, data }
   - Handle errors (invalid token, etc.)

3. Trigger notifications for these events:
   - Booking confirmed: "Your parking at {spot} is confirmed!"
   - Check-in request: "A seeker wants to check in at {spot}" (to owner)
   - Check-in approved: "Check-in approved! You're all set." (to seeker)
   - Booking reminder (15 min before): "Your parking starts in 15 minutes"
   - Session ending: "Your parking session ends in 15 minutes"
   - New review: "You received a new review!"
   - New chat message: "{name}: {preview}" (only if app is in background)
   - No-show warning: "You missed your booking. A strike has been applied."
   - Dispute update: "Your dispute has been resolved."

4. Notification handling in-app:
   - Tap notification → navigate to relevant screen (booking detail, chat, etc.)
   - Use data field to pass navigation params: { screen: 'booking', bookingId: '...' }
   - Handle foreground notifications (show in-app banner, don't show system notification)

5. Notification preferences:
   - In Settings: toggles for each notification type
   - Store in users table as JSONB: notification_preferences
   - Check preferences before sending
```

### Step 6.3 — Landing Page

```
Build a marketing landing page for the Next.js web app:

File: apps/web/app/page.tsx (root page — public, no auth needed)

This is the first thing visitors see. Make it compelling for a college project demo.

Sections (single-page scroll):

1. HERO:
   - Headline: "Your Parking Spot, a Tap Away"
   - Subtext: "Connect with nearby parking spaces in Chennai. Book instantly, park securely."
   - CTA buttons: "Find Parking" (primary) + "List Your Space" (secondary)
   - Background: illustration or photo of Chennai cityscape with parking overlay
   - Animated counter: "500+ spots listed" (or actual count from DB)

2. HOW IT WORKS (3 steps, with icons/illustrations):
   - Step 1: "Search" — Find parking near your destination
   - Step 2: "Book & Pay" — Secure your spot with instant payment
   - Step 3: "Park" — Get the exact location and park stress-free

3. FOR OWNERS:
   - "Turn your empty parking into income"
   - Benefits: extra income, flexible schedule, simple management
   - "List Your Space" CTA

4. FEATURES:
   - Grid of feature cards: Secure Payments, Real-time Availability, Verified Users, In-App Navigation, etc.

5. AREAS WE COVER:
   - Map of Chennai with pin clusters showing covered areas
   - Or list of area names: Anna Nagar, T. Nagar, OMR, Velachery, Adyar, etc.

6. TRUST & SAFETY:
   - KYC verification, reviews, SOS, dispute resolution highlights

7. DOWNLOAD / SIGN UP:
   - App store badges (placeholder for college project)
   - "Or use the web app" link
   - Email signup for launch updates

8. FOOTER:
   - About, Contact, Privacy Policy, Terms
   - Social links (placeholder)
   - "Made as a college project" note

Style: modern, clean, sky-blue primary, lots of whitespace, subtle animations on scroll.
Use Next.js Image for optimized loading. Make it fully responsive.
```

### Step 6.4 — Performance Optimization

```
Optimize the app for performance:

MOBILE APP:
1. Image optimization:
   - Use expo-image (instead of React Native Image) for caching and progressive loading
   - Show blurhash placeholders while images load
   - Lazy load images in lists (only load visible + 2 buffer)

2. List performance:
   - Use FlashList (from @shopify/flash-list) instead of FlatList for spot lists and booking lists
   - Implement proper keyExtractor and getItemType
   - Memoize SpotCard and BookingCard components with React.memo

3. State management:
   - Use Zustand selectors to prevent unnecessary re-renders
   - Split stores by feature (don't use one giant store)

4. Navigation:
   - Lazy load screens with React.lazy where appropriate
   - Preload common routes

5. Network:
   - Cache Supabase queries using React Query or SWR:
     Install @tanstack/react-query
     Wrap Supabase calls in useQuery hooks with stale times
   - Spot search results: staleTime 30s, cacheTime 5min
   - User profile: staleTime 5min
   - Bookings: staleTime 10s (more dynamic)

6. Bundle size:
   - Check with expo-doctor
   - Remove unused dependencies

WEB APP:
1. Next.js optimizations:
   - Use Server Components for data fetching (no client-side fetch for initial load)
   - Static generation (SSG) for landing page
   - Dynamic imports for Mapbox GL JS (heavy library)
   - Image optimization with next/image

2. API response optimization:
   - Select only needed columns in Supabase queries (never SELECT *)
   - Pagination everywhere (no unbounded queries)

3. Lighthouse audit:
   - Target: 90+ on Performance, Accessibility, Best Practices, SEO
   - Fix any issues flagged
```

### Step 6.5 — Error Handling & Loading States

```
Add comprehensive error handling and loading states across the app:

1. Global error boundary:
   File: apps/mobile/components/ErrorBoundary.tsx
   - Catches JS errors, shows friendly error screen
   - "Something went wrong" + "Try Again" button
   - Report error to console (Sentry integration for production)

2. Network error handling:
   File: apps/mobile/components/NetworkStatus.tsx
   - Detect offline status using @react-native-community/netinfo
   - Show persistent banner: "You're offline. Some features may be unavailable."
   - Queue write operations (bookings, messages) and retry when online

3. Loading states for every screen:
   - Skeleton loaders (not spinners) for lists and cards
   - Shimmer effect on skeleton placeholders
   - File: apps/mobile/components/Skeleton.tsx — reusable skeleton component

4. Empty states for every list:
   - No spots found: "No parking spots nearby. Try expanding your search area."
   - No bookings: "You haven't booked any parking yet. Start searching!"
   - No reviews: "No reviews yet. Be the first to leave one!"
   - No messages: "No messages yet."
   - Each with a relevant illustration/icon and action button

5. Toast notifications:
   - Use react-native-toast-message for in-app toasts
   - Success: green (e.g., "Booking confirmed!")
   - Error: red (e.g., "Payment failed. Please try again.")
   - Warning: orange (e.g., "Your session expires in 15 minutes")
   - Info: blue (e.g., "New spot available nearby!")
```

### Step 6.6 — Deployment

```
Deploy the entire project:

1. SUPABASE (already hosted):
   - Verify all migrations are applied: supabase db push
   - Verify seed data is loaded
   - Set Edge Function secrets:
     supabase secrets set RAZORPAY_KEY_ID=rzp_test_...
     supabase secrets set RAZORPAY_KEY_SECRET=...
   - Verify RLS policies are active (run test queries)
   - Enable pg_cron for no-show detection
   - Set up Supabase Realtime for messages table

2. NEXT.JS WEB APP → VERCEL:
   - Connect GitHub repo to Vercel
   - Set environment variables in Vercel dashboard:
     NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
     SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN,
     RAZORPAY_KEY_ID
   - Build settings: root directory = apps/web
   - Custom domain (optional): parknear.vercel.app
   - Verify build succeeds and preview deployment works

3. MOBILE APP → EXPO EAS:
   - Configure apps/mobile/eas.json for preview builds:
     {
       "build": {
         "preview": {
           "distribution": "internal",
           "android": { "buildType": "apk" },
           "ios": { "simulator": true }
         }
       }
     }
   - Run: eas build --platform android --profile preview
   - This generates an APK for demo purposes (free with Expo account)
   - For iOS: run on simulator or use TestFlight (requires Apple Developer account)
   - Share APK link for college presentation demo

4. POST-DEPLOYMENT CHECKS:
   - [ ] Web app loads at Vercel URL
   - [ ] Auth flow works on deployed web
   - [ ] Map loads with Mapbox tiles
   - [ ] Supabase queries work (check CORS)
   - [ ] Mobile APK installs and runs on physical Android device
   - [ ] Location services work on device
   - [ ] Razorpay test checkout works
   - [ ] Push notifications work
   - [ ] Chat real-time updates work
   - [ ] Admin panel accessible

5. DEMO PREPARATION:
   - Create 2 demo accounts: one owner, one seeker
   - Pre-load 10-15 spots across Chennai
   - Have a walkthrough script:
     a. Owner lists a spot (show form, photos, pricing)
     b. Seeker searches nearby (show map, filters)
     c. Seeker books (show payment, address reveal, OTP)
     d. Check-in flow (show GPS verification)
     e. Review + chat demo
     f. Admin panel (show analytics, KYC review)
   - Record a demo video as backup (in case live demo fails)
```

### Step 6.7 — Documentation

```
Create project documentation for college submission:

File: docs/README.md — Project overview
File: docs/ARCHITECTURE.md — Technical architecture (copy from master prompt)
File: docs/API.md — Edge Function API documentation
File: docs/DEPLOYMENT.md — Deployment guide
File: docs/TESTING.md — Testing checklist

README.md should include:
- Project title, team members, college name
- Problem statement
- Solution overview
- Tech stack with justification
- Screenshots (capture key screens)
- How to run locally:
  1. Clone repo
  2. Install dependencies: pnpm install
  3. Set up .env.local (copy from .env.example)
  4. Start Supabase: supabase start (local) or use hosted
  5. Run migrations: supabase db push
  6. Seed data: supabase db seed
  7. Start mobile: pnpm dev:mobile
  8. Start web: pnpm dev:web
- Demo video link
- Future scope

Create these as markdown files in the docs/ folder of the repo.
```

---

## Final Checklist — Project Complete

### Core Features
- [ ] Owner can list spots with photos, pricing, availability
- [ ] Seeker can search by location with map + filters
- [ ] Fuzzy location shown pre-booking, exact address revealed post-payment
- [ ] Razorpay payment integration (test mode)
- [ ] Gate OTP generated and displayed on confirmation
- [ ] Check-in with GPS proximity verification
- [ ] Active session timer
- [ ] Check-out with review prompt
- [ ] Cancellation with proper refund calculation

### Trust & Safety
- [ ] Bi-directional reviews and ratings
- [ ] Real-time in-app chat
- [ ] KYC document upload and admin review
- [ ] No-show detection and strike system
- [ ] Emergency SOS button
- [ ] Dispute creation and admin resolution

### Admin
- [ ] Dashboard with KPIs and charts
- [ ] User, spot, booking management
- [ ] KYC review queue
- [ ] Dispute resolution panel
- [ ] Analytics page

### Polish
- [ ] Tamil + English language support
- [ ] Push notifications for key events
- [ ] Landing page
- [ ] Error handling and loading states
- [ ] Performance optimized (skeleton loaders, caching, lazy loading)

### Deployment
- [ ] Web app deployed on Vercel
- [ ] Mobile APK built with Expo EAS
- [ ] Supabase hosted and configured
- [ ] Documentation complete
- [ ] Demo script prepared
- [ ] Demo video recorded

---

🎉 **Congratulations! ParkNear is complete and ready for your college presentation.**
