# Phase 4 — Trust, Safety & Communication

> **Goal:** Build the trust layer — reviews/ratings, in-app chat, KYC verification flow, no-show penalties, emergency SOS, and dispute resolution. These features make the marketplace trustworthy and safe for both owners and seekers.

---

## Context for Cursor

```
I'm building "ParkNear", a parking marketplace for Chennai. Phases 0-3 are complete.

Current state:
- Full booking flow working: search → book → pay → get address/OTP → check-in → park → check-out
- Razorpay test mode integration complete
- Owner and seeker flows functional
- Strike system implemented (increments on no-show/cancellation)

This phase adds the trust and safety layers that make users confident using the platform.

Stack: React Native (Expo) + Next.js + Supabase (with Realtime for chat)
```

---

## Step-by-Step Cursor Prompts

### Step 4.1 — Reviews & Ratings System

```
Build the bi-directional review system:

File: apps/mobile/app/(seeker)/booking/review/[bookingId].tsx — Seeker reviews spot/owner
File: apps/mobile/app/(owner)/booking/review/[bookingId].tsx — Owner reviews seeker

Review flow triggers after check-out:
1. Seeker gets prompted: "How was your parking at {spot_title}?"
2. Owner gets prompted: "How was {seeker_name} as a guest?"

Review form (same for both directions):
- Star rating (1-5, interactive stars — tap to select)
- Pre-set tags (quick tap):
  - Seeker reviewing owner: "Clean spot", "Easy to find", "Good communication", "As described", "Would park again"
  - Owner reviewing seeker: "Respectful", "On time", "Clean exit", "Good communication"
- Comment text area (optional, max 500 chars)
- "Submit Review" button
- "Skip" option (reviews are encouraged but optional)

Backend:
- Insert into reviews table with review_type ('seeker_to_owner' or 'owner_to_seeker')
- After insert, update the spots.avg_rating and spots.total_reviews via a database trigger:

CREATE OR REPLACE FUNCTION update_spot_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spots SET
    avg_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE spot_id = NEW.spot_id AND review_type = 'seeker_to_owner'),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE spot_id = NEW.spot_id AND review_type = 'seeker_to_owner')
  WHERE id = NEW.spot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_spot_rating
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_spot_rating();

Also update user's average rating (store on users table: seeker_rating, owner_rating fields — add migration).

Display:
- On spot detail: show seeker-to-owner reviews with avatars, stars, dates
- On seeker profile (visible to owners): show owner-to-seeker reviews
- Pagination: 5 reviews per page, "Load more" button

Prevent duplicate reviews:
- reviews.booking_id has UNIQUE constraint
- Check before showing review prompt: does a review already exist for this booking + direction?

File: apps/mobile/components/ReviewCard.tsx
- Reviewer avatar + name
- Star rating display (filled/unfilled stars)
- Review date (relative: "2 days ago")
- Comment text
- Tags as small chips
```

### Step 4.2 — In-App Chat System

```
Build real-time in-app chat between seekers and owners:

File: apps/mobile/app/(common)/chat/[bookingId].tsx
File: apps/mobile/stores/chat.ts
File: apps/mobile/components/ChatBubble.tsx

Chat is linked to a booking — users can only chat within the context of a booking.

Chat screen layout:
- Header: other user's name + avatar + "Active" status indicator
- Booking context banner at top: "{spot_title} — {date} {time}" (tappable → goes to booking)
- Message list (scrollable, newest at bottom):
  - Sent messages: right-aligned, primary color background
  - Received messages: left-aligned, gray background
  - Each bubble: message text, timestamp, read receipt (✓✓)
  - System messages: centered, small text ("Booking confirmed", "Check-in approved")
- Input bar at bottom:
  - TextInput with placeholder "Type a message..."
  - Send button (icon)
  - No image/file sharing (keep it simple for MVP)

Real-time with Supabase Realtime:
- Subscribe to messages table where booking_id = current booking
- On new message: append to local state, scroll to bottom, vibrate
- Mark messages as read when chat screen is focused

Zustand store (apps/mobile/stores/chat.ts):
- conversations: { [bookingId]: Message[] }
- unreadCounts: { [bookingId]: number }
- fetchMessages(bookingId): initial load
- sendMessage(bookingId, content): insert into messages table
- subscribeToChat(bookingId): Supabase Realtime subscription
- markAsRead(bookingId): update is_read for received messages

Chat list screen:
File: apps/mobile/app/(common)/chat/index.tsx
- List of all active chats (bookings with messages)
- Each row: other user avatar + name, last message preview, time, unread badge
- Sort by most recent message
- Tab in bottom navigation: "Chat" with total unread count badge

Privacy rules:
- Chat only available for bookings with status: confirmed, checked_in, active, completed (within 24h of completion)
- No chat for cancelled bookings
- Phone numbers never shared in chat (auto-detect and mask if user types a phone number? — nice to have)
- RLS: users can only read/write messages where they are sender or receiver
```

### Step 4.3 — KYC Verification Flow

```
Build the KYC document verification flow:

File: apps/mobile/app/(common)/profile/kyc.tsx
File: apps/mobile/components/DocumentUploader.tsx

KYC is optional for MVP but the UI should be built. Verified users get a badge and higher trust.

KYC Steps for Owners:
1. Upload Aadhaar card (front photo) or PAN card
2. Upload a selfie (for face match — manual review for MVP)
3. Upload property proof (electricity bill or society letter)
4. Submit for review → kyc_status changes to 'submitted'

KYC Steps for Seekers:
1. Upload Aadhaar card or PAN card
2. Upload selfie
3. Upload vehicle RC (Registration Certificate)
4. Submit for review → kyc_status changes to 'submitted'

DocumentUploader component:
- Full-screen camera capture or gallery pick
- Shows document type label ("Aadhaar Card — Front")
- Preview of captured/selected image
- "Retake" and "Use This" buttons
- Uploads to Supabase Storage "kyc-documents" bucket (private)
- Stores file path in users table (aadhaar_doc_url, selfie_url)

KYC status display:
- On profile: show KYC badge status:
  - "Not Verified" (gray) → "Verify Now" button
  - "Under Review" (yellow) → "Submitted on {date}"
  - "Verified" (green checkmark) → "Verified Member"
  - "Rejected" (red) → reason + "Resubmit" button

For college project: admin manually verifies by updating kyc_status in admin panel (Phase 5).

Verified badge appears:
- On spot listings (owner verified)
- On seeker profile visible to owners
- Seekers see "Verified Owner" on spot detail
```

### Step 4.4 — No-Show Penalty & Strike System

```
Formalize the no-show detection and penalty system:

File: supabase/functions/detect-no-show/index.ts

Auto-detection logic (run via Supabase cron or Edge Function):
1. Every 15 minutes, check for bookings where:
   - status = 'confirmed'
   - start_time + 30 minutes < NOW()
   - checked_in_at IS NULL
   - Not cancelled

2. For each no-show booking:
   - Update status → 'no_show'
   - Increment seeker's strike_count
   - Create transaction record (payment retained, no refund)
   - Notify owner: "Seeker didn't show up. Payment has been retained."
   - Notify seeker: "You missed your booking. This counts as a strike."

Strike consequences (displayed on user profile):
- 0 strikes: clean record
- 1-2 strikes: warning banner on profile
- 3 strikes: temporary restriction (can't book for 7 days)
- 5 strikes: account banned (is_banned = true)

File: apps/mobile/components/StrikeWarning.tsx
- Shows when user has strikes
- "You have {X} strike(s). {consequence}"
- Explains how to avoid strikes
- Appeal option: "Contact support if you think this was a mistake"

Add ban check to booking creation:
- In create_booking function: IF user.is_banned THEN RAISE EXCEPTION 'Account suspended'
- In the app: show "Your account is suspended" screen if is_banned = true

Migration: Create a cron job or use Supabase's pg_cron extension:
SELECT cron.schedule('detect-no-shows', '*/15 * * * *', $$
  UPDATE bookings SET status = 'no_show'
  WHERE status = 'confirmed'
    AND start_time + INTERVAL '30 minutes' < NOW()
    AND checked_in_at IS NULL;
  -- Increment strikes in a separate query
  UPDATE users SET strike_count = strike_count + 1
  WHERE id IN (
    SELECT seeker_id FROM bookings WHERE status = 'no_show' AND updated_at > NOW() - INTERVAL '15 minutes'
  );
$$);
```

### Step 4.5 — Emergency SOS

```
Build an emergency SOS feature:

File: apps/mobile/components/SOSButton.tsx

SOS button appears on:
- Active booking screen (during parking session)
- Check-in/check-out screens
- Chat screen

When pressed:
1. Confirmation: "Are you sure? This will alert your emergency contacts and app support."
2. If confirmed:
   - Send push notification to user's emergency contacts (stored in profile)
   - Send alert to admin/support (insert into a support_tickets table)
   - Show on-screen: local emergency numbers (Chennai police: 100, women helpline: 181)
   - Option to share live location with emergency contacts
   - Log the SOS event with timestamp, location, booking_id

File: apps/mobile/app/(common)/profile/emergency-contacts.tsx
- Add/edit up to 3 emergency contacts (name + phone)
- Stored in users table as JSONB: emergency_contacts
- Prompt user to add during onboarding: "Add an emergency contact for safety"

For MVP: SOS just sends push notifications + logs the event. No actual emergency service integration.
```

### Step 4.6 — Dispute Resolution

```
Build a basic dispute system:

File: apps/mobile/app/(common)/support/dispute/[bookingId].tsx

When to allow disputes:
- Within 24 hours of booking completion
- Either party can raise a dispute

Dispute form:
- Reason: dropdown (Wrong spot info, Spot unavailable, Damage to vehicle, Payment issue, Rude behavior, Other)
- Description: text area (min 20 chars)
- Evidence: up to 3 photo uploads (optional)
- Submit → creates a dispute record

Create a disputes table (add migration):
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  raised_by UUID REFERENCES users(id),
  against_user UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[],
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved_for_raiser', 'resolved_for_other', 'dismissed')) DEFAULT 'open',
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

After submission:
- Booking status → 'disputed'
- Both parties notified
- Visible in admin panel (Phase 5)
- Auto-response: "Your dispute has been logged. We'll review within 48 hours."
```

---

## Checklist Before Moving to Phase 5

- [ ] Review system working (both directions: seeker↔owner)
- [ ] Average ratings updating on spots and users
- [ ] Real-time chat working with Supabase Realtime
- [ ] Chat list with unread counts
- [ ] KYC upload flow working (documents to private storage)
- [ ] Verified badge displaying for KYC-verified users
- [ ] No-show detection running (cron or scheduled)
- [ ] Strike system incrementing and showing warnings
- [ ] Ban enforcement preventing bookings for banned users
- [ ] SOS button working (sends notifications + logs event)
- [ ] Emergency contacts configurable in profile
- [ ] Dispute creation flow working
- [ ] All trust features visible on web as well
