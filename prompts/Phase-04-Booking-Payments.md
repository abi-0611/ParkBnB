# Phase 3 — Booking & Payment Engine

> **Goal:** Build the complete booking flow — time slot selection, Razorpay payment integration (test mode), OTP/gate code generation, exact address reveal, check-in/check-out, and session management. This is the core transaction engine of the marketplace.

---

## Context for Cursor

```
I'm building "ParkNear", a parking marketplace for Chennai. Phases 0-2 are complete.

Current state:
- Owners can list spots with photos, pricing, availability, exact GPS
- Seekers can search nearby spots, see fuzzy locations, filter/sort
- Spot detail screen shows all public info but hides exact address
- PostGIS proximity search working
- Auth, RLS, storage all configured

This phase builds the money flow: seeker selects time → pays via Razorpay → gets exact address + OTP → navigates → checks in → session runs → checks out → owner gets paid.

Stack: React Native (Expo) + Next.js + Supabase + Razorpay (TEST MODE) + Mapbox
Important: Razorpay in test mode is free. Use test API keys only. No real money flows for college project.
```

---

## Step-by-Step Cursor Prompts

### Step 3.1 — Razorpay Setup

```
Set up Razorpay integration for the project (TEST MODE only):

1. Create a Supabase Edge Function: supabase/functions/create-razorpay-order/index.ts
   - Accepts: { booking_id, amount_paise } (Razorpay uses paise, not rupees)
   - Creates a Razorpay order via their Orders API:
     POST https://api.razorpay.com/v1/orders
     Auth: Basic (key_id:key_secret)
     Body: { amount: amount_paise, currency: "INR", receipt: booking_id, notes: { booking_id } }
   - Stores the razorpay_order_id in the bookings table
   - Returns the order_id + amount + key_id to the client
   - Edge Function reads RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Supabase secrets

2. Create a Supabase Edge Function: supabase/functions/verify-payment/index.ts
   - Accepts: { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id }
   - Verifies the payment signature using HMAC SHA256:
     generated_signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
     Compare with razorpay_signature
   - If valid: update booking status to 'confirmed', payment_status to 'paid'
   - Generate a 6-digit gate OTP (random, expires in 4 hours)
   - Store OTP in booking row
   - Return: { success: true, booking details with exact address + gate_otp }
   - If invalid: return error, update payment_status to 'failed'

3. Install Razorpay SDK:
   - Mobile: react-native-razorpay (Expo plugin config in app.config.ts)
   - Web: load Razorpay checkout.js script

4. Create utility: packages/shared/utils/payment.ts
   - amountToPaise(rupees: number): returns paise (multiply by 100)
   - paiseToRupees(paise: number): returns rupees
   - generateGateOTP(): returns 6-digit random string
   - isOTPExpired(createdAt: Date, expiryHours: number = 4): boolean

Note: For testing, use Razorpay test card: 4111 1111 1111 1111, any future expiry, any CVV.
UPI test: success@razorpay for successful payment.
```

### Step 3.2 — Booking Flow UI (Mobile)

```
Create the multi-step booking flow:

File: apps/mobile/app/(seeker)/booking/[spotId].tsx

Step 1 — Select Time Slot:
- Show spot title + thumbnail at top (compact)
- Booking type selector: Hourly / Daily / Monthly tabs
- For Hourly:
  - Date picker (today + next 7 days)
  - Start time picker (in 30-min increments, only available slots shown)
  - Duration selector: 1hr / 2hr / 3hr / 4hr / Custom
  - Show end time calculated
- For Daily:
  - Date picker (single day or date range)
- For Monthly:
  - Start date picker
  - Shows "Renews monthly, cancel anytime"
- Show availability calendar (read-only) below so user can see open slots
- Unavailable time slots are grayed out and non-selectable
- "Next" button at bottom

Step 2 — Select Vehicle:
- Show user's saved vehicles (from vehicles table)
- Radio select: which vehicle will use this spot
- "Add New Vehicle" button → inline form: type, number plate
- Vehicle type must be compatible with spot (e.g., can't book a bike spot with a car)
- "Next" button

Step 3 — Price Summary & Pay:
- Booking summary card:
  - Spot: {title}
  - Date: {date}, Time: {start} - {end}
  - Vehicle: {type} - {number_plate}
  - Duration: {X hours / X days / Monthly}
- Price breakdown:
  - Base price: ₹{base}
  - Service fee (12%): ₹{fee}
  - Total: ₹{total} (bold, large)
- Owner payout note (small text): "Owner receives ₹{payout}"
- Cancellation policy (expandable):
  - "Free cancellation up to 30 min before. After that, 50% charge."
- "Pay ₹{total}" primary button → initiates Razorpay checkout

Create a Zustand store: apps/mobile/stores/booking.ts
- bookingDraft: { spotId, bookingType, startTime, endTime, vehicleId, pricing }
- setBookingType, setTimeSlot, setVehicle
- calculatePricing(): computes base, fee, total, payout using shared utils
- createBooking(): inserts into bookings table with status 'pending'
- initiatePayment(): calls create-razorpay-order Edge Function
- verifyPayment(): calls verify-payment Edge Function
- currentBooking: BookingWithDetails | null (after confirmation)
```

### Step 3.3 — Razorpay Checkout Integration

```
Integrate Razorpay checkout into the booking flow:

File: apps/mobile/hooks/useRazorpay.ts

This hook handles the payment flow:

1. createOrder(bookingId, amountRupees):
   - Calls create-razorpay-order Edge Function
   - Returns { orderId, amount, key }

2. openCheckout(orderDetails):
   - Opens Razorpay native checkout modal (react-native-razorpay)
   - Options: {
       key: RAZORPAY_KEY_ID,
       amount: amount_paise,
       currency: "INR",
       name: "ParkNear",
       description: "Parking Booking #{bookingId}",
       order_id: razorpay_order_id,
       prefill: { email: user.email, contact: user.phone },
       theme: { color: "#0EA5E9" },
       method: { upi: true, card: true, wallet: true, netbanking: true }
     }
   - On success: returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
   - On failure: returns error

3. verifyAndConfirm(paymentResult):
   - Calls verify-payment Edge Function with payment details
   - On success: receives confirmed booking with exact address + gate OTP
   - Updates booking store with confirmed booking
   - Navigates to booking confirmation screen

Error handling:
- Payment cancelled by user: show "Payment cancelled" toast, stay on summary page
- Payment failed: show error message, offer retry
- Verification failed: show "Payment received but verification pending, contact support"
- Network error: show retry with exponential backoff

For web: use Razorpay checkout.js script loaded dynamically.
```

### Step 3.4 — Booking Confirmation Screen (Address Reveal)

```
Create the booking confirmation screen — this is where the exact address is revealed:

File: apps/mobile/app/(seeker)/booking/confirmation/[bookingId].tsx

This screen appears ONLY after successful payment verification.

Layout:
1. Success animation (Lottie checkmark or simple animated check icon)
2. "Booking Confirmed!" heading
3. Booking details card:
   - Spot title
   - Date & time
   - Vehicle
   - Booking ID (short format: PK-XXXXX)

4. ⭐ EXACT ADDRESS SECTION (the big reveal):
   - Section header: "📍 Parking Location" with a subtle reveal animation
   - Full address text (address_line from spots table — NOW accessible)
   - Landmark
   - Small Mapbox map showing EXACT pin (not fuzzy zone anymore)
   - "Navigate" button → deep-links to Google Maps with exact coordinates:
     `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`

5. 🔑 GATE OTP SECTION:
   - Large OTP display: "1 2 3 4 5 6" (big, spaced digits)
   - "Show to owner or enter at gate" instruction
   - Copy OTP button
   - Timer: "Valid for 4 hours"
   - Note: "OTP expires at {time}. A new OTP will be generated if you need it."

6. ACTIONS:
   - "Check In" button (disabled until seeker is within 200m of spot — use GPS)
   - "Chat with Owner" button
   - "Cancel Booking" button (with cancellation policy reminder)
   - "Share with someone" — share booking details (address, OTP) via native share sheet

7. Reminders:
   - "Check-in opens 15 min before your booking starts"
   - "No-show after 30 min = booking forfeited + 1 strike"

Fetch booking data:
- Now the seeker CAN access the spot's exact address (RLS policy allows confirmed booking seekers to see full spot data)
- Create an RLS policy: seekers can read spots.address_line and spots.location WHERE there exists a confirmed booking for that seeker+spot combination

Supabase RLS addition (add to migration):
CREATE POLICY "Seekers can see spot address for confirmed bookings"
ON spots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.spot_id = spots.id
    AND bookings.seeker_id = auth.uid()
    AND bookings.status IN ('confirmed', 'checked_in', 'active')
  )
);
```

### Step 3.5 — Check-In / Check-Out System

```
Build the check-in and check-out flow:

File: apps/mobile/app/(seeker)/booking/active/[bookingId].tsx (Active session screen)
File: apps/mobile/hooks/useCheckIn.ts
File: supabase/functions/check-in/index.ts

CHECK-IN FLOW:
1. Seeker arrives at spot and taps "Check In" button
2. App verifies seeker's GPS is within 200 meters of the spot's exact location
3. If within range:
   - Send check-in request to Supabase Edge Function
   - Edge Function updates booking: status → 'checked_in', checked_in_at → NOW()
   - Owner gets a push notification: "{seeker_name} has checked in at {spot_title}"
   - Owner can approve check-in via notification or app (or auto-approve after 10 min)
4. If outside range:
   - Show "You're too far from the parking spot" error
   - Show distance and direction to spot
5. If owner has "request approval" mode:
   - Show "Waiting for owner approval..." with timer
   - Owner gets notification to approve
   - Auto-approve after 10 minutes if owner doesn't respond

ACTIVE SESSION SCREEN:
- Timer showing elapsed time: "Parked for 2h 15m"
- Countdown to booking end time: "1h 45m remaining"
- Spot details (address, OTP)
- "Extend Booking" button → allows adding hours (same payment flow)
- "Check Out" button (available anytime)
- Warning notification at 15 min before end: "Your parking session ends in 15 min"
- Overstay warning: if past end time, show red warning "You've exceeded your booking by {Xm}. Overstay charges may apply."

CHECK-OUT FLOW:
1. Seeker taps "Check Out" (or booking time expires)
2. Edge Function: update status → 'completed', checked_out_at → NOW()
3. Calculate final amount:
   - If checked out early: no refund for hourly, partial refund for daily
   - If overstayed: charge extra hours at 1.5x rate (future feature, skip for MVP)
4. Navigate to review screen: "Rate your parking experience"
5. Owner gets notification: "{seeker_name} has checked out"

OWNER SIDE (notification handling):
File: apps/mobile/components/CheckInApproval.tsx
- Owner receives push notification for check-in
- In-app: show approval card: "🚗 {seeker_name} wants to check in" + vehicle details
- "Approve" (primary) / "Reject" (with reason) buttons
- If no response in 10 min: auto-approve
```

### Step 3.6 — My Bookings Screen

```
Create the "My Bookings" screen for seekers:

File: apps/mobile/app/(seeker)/bookings.tsx

Tab layout:
1. UPCOMING tab:
   - Confirmed bookings that haven't started yet
   - Each card: spot thumbnail, title, date/time, status badge, vehicle
   - Actions: "Navigate" / "Cancel" / "View Details"
   - Sort by start time (soonest first)

2. ACTIVE tab:
   - Currently checked-in / active session
   - Shows elapsed timer prominently
   - Quick actions: "Check Out" / "Extend"

3. PAST tab:
   - Completed and cancelled bookings
   - Each card: spot thumbnail, title, date, amount paid, rating (if given)
   - "Leave Review" button if not yet reviewed
   - Pagination (load 10 at a time, scroll to load more)

Fetch bookings from Supabase:
- bookings where seeker_id = current user
- JOIN with spots (for thumbnail, title) and vehicles (for number plate)
- Apply appropriate status filters per tab
- Use Supabase Realtime to listen for status changes (e.g., owner approval)

Create a Zustand store: apps/mobile/stores/myBookings.ts
- upcoming, active, past: BookingWithDetails[]
- fetchBookings(): loads all three categories
- cancelBooking(bookingId): calls cancel Edge Function
- subscribeToUpdates(): sets up Realtime subscription
```

### Step 3.7 — Owner Booking Management

```
Create booking management for the owner side:

File: apps/mobile/app/(owner)/bookings.tsx

Owners see bookings for their spots:

Tab layout:
1. PENDING tab:
   - Bookings with status 'pending' (request-to-book mode only)
   - "Accept" / "Decline" buttons
   - Auto-decline after 2 hours if no response

2. TODAY tab:
   - Today's confirmed and active bookings across all owner's spots
   - Timeline view showing when each booking starts/ends
   - "Checked In" indicator for arrived seekers

3. ALL BOOKINGS tab:
   - Full history with search and filters
   - Date range picker
   - Status filter

Each booking card shows:
- Seeker name + avatar + rating
- Vehicle type + number plate
- Spot name (which of owner's spots)
- Date, time, duration
- Amount (owner's payout)
- Status badge
- Actions based on status

Owner actions:
- Accept/Decline pending bookings
- Approve check-in (notification + in-app button)
- Report no-show (if seeker doesn't arrive within 30 min of booking start)
- Report issue (damage, wrong vehicle, etc.)

File: supabase/functions/owner-actions/index.ts
- acceptBooking(bookingId): status → 'confirmed', generate OTP, notify seeker
- declineBooking(bookingId, reason): status → 'cancelled_by_owner', refund seeker
- reportNoShow(bookingId): status → 'no_show', add strike to seeker, retain payment
```

### Step 3.8 — Cancellation & Refund Engine

```
Build the cancellation and refund system:

File: supabase/functions/cancel-booking/index.ts

Cancellation rules:
1. BY SEEKER:
   - More than 30 min before start: full refund
   - Within 30 min of start: 50% refund
   - After start time (no-show): no refund + 1 strike
   - Already checked in: no refund for used time, refund remaining if prepaid

2. BY OWNER:
   - Anytime before check-in: full refund to seeker + ₹50 credit + 1 strike to owner
   - During active session: full refund + ₹100 credit + 1 strike to owner

The Edge Function should:
- Validate who's cancelling (seeker or owner)
- Calculate refund amount based on timing rules
- Update booking status to 'cancelled_by_seeker' or 'cancelled_by_owner'
- Create a transaction record (type: 'refund')
- In test mode: just update the DB (no actual Razorpay refund API call)
- Notify the other party via push notification
- Apply strikes if applicable

File: apps/mobile/components/CancelBookingSheet.tsx
- Bottom sheet with:
  - Reason selection (plans changed, found another spot, emergency, other)
  - Refund amount preview based on cancellation policy
  - "Confirm Cancellation" button
  - "Keep Booking" button

Strike system:
- Add a migration: increment strike_count on users table
- At 3 strikes: show warning to user
- At 5 strikes: set is_banned = true, prevent new bookings
- Add a check in create-booking and verify-payment Edge Functions: reject if user is banned
```

### Step 3.9 — Web Booking Flow

```
Replicate the booking flow for the Next.js web app:

Files:
- apps/web/app/(app)/booking/[spotId]/page.tsx — Booking wizard (same 3 steps)
- apps/web/app/(app)/booking/confirmation/[bookingId]/page.tsx — Confirmation + address reveal
- apps/web/app/(app)/bookings/page.tsx — My bookings page

Web-specific:
- Razorpay: load checkout.js dynamically and use the standard checkout flow
- Use React state (not Zustand) for booking form since it's page-scoped
- Google Maps navigation: open in new tab with directions URL
- Responsive: full-width on mobile, centered card (max-w-2xl) on desktop
- Use Next.js Server Actions for booking creation and payment verification

Reuse all shared validation, pricing utils, and types from packages/shared/.
Edge Functions are the same — called from both mobile and web.
```

---

## Key Implementation Notes

### Race Condition Prevention

```sql
-- When creating a booking, check for overlapping bookings atomically:
CREATE OR REPLACE FUNCTION create_booking(
  p_seeker_id UUID, p_spot_id UUID, p_vehicle_id UUID,
  p_booking_type TEXT, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_slot_count INTEGER;
  v_booked_count INTEGER;
BEGIN
  -- Get total slots for this spot
  SELECT total_slots INTO v_slot_count FROM spots WHERE id = p_spot_id;

  -- Count overlapping confirmed bookings
  SELECT COUNT(*) INTO v_booked_count FROM bookings
  WHERE spot_id = p_spot_id
    AND status IN ('confirmed', 'checked_in', 'active')
    AND tstzrange(start_time, end_time) && tstzrange(p_start, p_end);

  IF v_booked_count >= v_slot_count THEN
    RAISE EXCEPTION 'No available slots for this time period';
  END IF;

  INSERT INTO bookings (seeker_id, spot_id, vehicle_id, booking_type, start_time, end_time, status)
  VALUES (p_seeker_id, p_spot_id, p_vehicle_id, p_booking_type, p_start, p_end, 'pending')
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Payment Timeout Handling

```
- Booking is created with status 'pending' when user starts checkout
- If payment is not completed within 15 minutes, a scheduled function should expire the booking
- Use Supabase cron (pg_cron) or a simple check on each API call:
  DELETE FROM bookings WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes';
```

---

## Checklist Before Moving to Phase 4

- [ ] Razorpay test mode working (create order → checkout → verify)
- [ ] Booking flow: select time → select vehicle → pay → confirmed
- [ ] OTP generated and displayed on confirmation
- [ ] Exact address revealed ONLY after confirmed payment
- [ ] Google Maps navigation deep-link working
- [ ] Check-in working (GPS proximity check + owner approval)
- [ ] Active session timer working
- [ ] Check-out updating booking status
- [ ] Cancellation with correct refund calculation
- [ ] Strike system incrementing on no-shows
- [ ] My Bookings screen (upcoming/active/past tabs)
- [ ] Owner booking management working
- [ ] Race condition prevented for overlapping bookings
- [ ] Payment timeout (pending bookings expired after 15 min)
- [ ] Web booking flow working
