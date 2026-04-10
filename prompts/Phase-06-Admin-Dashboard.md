# Phase 5 — Admin Dashboard & Analytics

> **Goal:** Build the admin panel for managing users, spots, bookings, disputes, KYC verification, and viewing platform analytics. This is the operational backbone of the marketplace.

---

## Context for Cursor

```
I'm building "ParkNear", a parking marketplace for Chennai. Phases 0-4 are complete.

Current state: Full marketplace functional — owners list, seekers search & book, payments work, reviews/chat/KYC/disputes all built.

This phase builds the admin panel as a section of the Next.js web app (NOT a separate app — saves free-tier resources). Only users with role='admin' can access it.

Stack: Next.js 14 (App Router) + Supabase + Tailwind CSS
Admin routes: apps/web/app/(app)/admin/
```

---

## Step-by-Step Cursor Prompts

### Step 5.1 — Admin Layout & Auth Guard

```
Create the admin section layout with role-based access:

File: apps/web/app/(app)/admin/layout.tsx
- Server-side auth check: fetch user from Supabase, verify role = 'admin'
- If not admin: redirect to /dashboard with "Access denied" toast
- Sidebar layout:
  - Logo "ParkNear Admin"
  - Nav links: Dashboard, Users, Spots, Bookings, Disputes, KYC Review, Settings
  - Active link highlight
  - Collapsed sidebar on mobile (hamburger menu)
- Top bar: admin name + avatar + sign out button
- Main content area (right of sidebar)

Style: clean, professional. Use Tailwind. Dark sidebar (#1E293B) + white content area.
No external UI libraries — build with Tailwind for zero dependency.

File: apps/web/middleware.ts
- Add admin route protection: /admin/* requires role='admin'
- Redirect non-admins to /dashboard

Seed an admin user:
- Add to supabase/seed.sql: INSERT INTO users with role='admin'
- Or create a script to promote a user to admin role
```

### Step 5.2 — Admin Dashboard (Overview)

```
Build the admin dashboard home page:

File: apps/web/app/(app)/admin/page.tsx

KPI Cards (top row, 4 cards):
1. Total Users — count from users table (with % change from last month)
2. Active Spots — count of is_active spots
3. Bookings This Month — count of bookings created this month
4. Revenue This Month — sum of service_fee from completed bookings this month

Charts section (2 columns):
1. Bookings Over Time — line chart (last 30 days, daily count)
2. Revenue Over Time — bar chart (last 30 days, daily sum of service_fee)
3. Top Areas — horizontal bar chart (bookings by Chennai area/pincode)
4. User Growth — line chart (cumulative users over last 90 days)

Use Recharts (already available in the React artifact setup) for charts.

Recent Activity Feed (below charts):
- Last 10 events: new bookings, disputes, KYC submissions, cancellations
- Each event: icon + description + timestamp + link to detail
- Auto-refresh every 60 seconds

Data fetching:
- Use Supabase server client with service_role_key (bypasses RLS for admin)
- Server Components for initial load, client-side refresh for auto-update
- Create a packages/shared/queries/admin.ts for admin-specific queries
```

### Step 5.3 — User Management

```
Build the user management page:

File: apps/web/app/(app)/admin/users/page.tsx

Table with columns:
- Avatar + Name
- Email
- Role (badge: seeker/owner/both/admin)
- KYC Status (badge: pending/submitted/verified/rejected)
- Strikes (count, red if >= 3)
- Banned (yes/no)
- Joined (date)
- Actions

Search: by name, email, or phone
Filters: role, KYC status, banned status
Sort: by name, join date, strikes

Pagination: 20 per page with page numbers

Actions per user:
- View Profile (modal or new page): full details, booking history, reviews, vehicles
- Change Role: dropdown (seeker/owner/both/admin) — with confirmation
- Reset Strikes: button with confirmation
- Ban/Unban: toggle with reason input
- Delete User: dangerous action with double confirmation

File: apps/web/app/(app)/admin/users/[id]/page.tsx
- Full user profile view:
  - Personal info, KYC docs (viewable images), vehicles
  - Booking history table
  - Reviews given and received
  - Dispute history
  - Strike log
  - Chat access (read-only for admin)
```

### Step 5.4 — KYC Review Queue

```
Build the KYC verification review queue:

File: apps/web/app/(app)/admin/kyc/page.tsx

Queue of users with kyc_status = 'submitted', sorted by submission date (oldest first).

Each item in the queue shows:
- User name + email + role
- Submitted date
- Document previews (clickable to enlarge):
  - Aadhaar/PAN card image
  - Selfie
  - Property proof (for owners) or Vehicle RC (for seekers)
- Side-by-side comparison: selfie vs Aadhaar photo

Admin actions:
- "Approve" button → kyc_status = 'verified', is_verified = true, notify user
- "Reject" button → opens reason input (unclear document, mismatch, invalid document)
  → kyc_status = 'rejected', notify user with reason

Batch actions: select multiple and approve/reject in bulk.

Stats at top:
- Pending reviews: count
- Avg review time: average time from submission to decision
- Today's reviews: count completed today
```

### Step 5.5 — Spot Management

```
Build the spots management page:

File: apps/web/app/(app)/admin/spots/page.tsx

Table with columns:
- Thumbnail (first photo)
- Title
- Owner name
- Area (fuzzy_landmark)
- Type + Coverage
- Price/hr
- Rating
- Status (Active/Inactive)
- Total Bookings
- Actions

Search: by title, owner name, area
Filters: spot_type, coverage, status, featured
Sort: by created date, rating, bookings count

Actions:
- View Details: full spot info including EXACT address + map
- Toggle Active/Inactive
- Toggle Featured (premium listing)
- Delete (with confirmation, cancels active bookings)
- View Bookings for this spot

Map view toggle:
- Switch between table view and map view
- Map shows all spots as pins (admin can see exact locations)
- Color-coded: green (active), gray (inactive), gold (featured)
- Clicking a pin shows spot details popup
```

### Step 5.6 — Booking Management

```
Build the bookings management page:

File: apps/web/app/(app)/admin/bookings/page.tsx

Table with columns:
- Booking ID (short: PK-XXXXX)
- Seeker name
- Spot title
- Owner name
- Date/Time
- Type (hourly/daily/monthly)
- Amount (total)
- Status (colored badge)
- Actions

Filters: status, date range, booking type, spot, seeker, owner
Search: by booking ID, seeker name, owner name

Actions per booking:
- View Details: full booking info, payment details, chat history
- Force Cancel: admin cancellation with full refund
- Override Status: change status (for edge cases)
- View Payment: Razorpay payment details
- View Chat: read-only access to booking chat

File: apps/web/app/(app)/admin/bookings/[id]/page.tsx
- Full booking detail view:
  - Booking timeline (created → confirmed → checked in → completed)
  - Payment details (amount, Razorpay IDs, refunds)
  - Spot details with exact location
  - Chat transcript (read-only)
  - Review (if submitted)
  - Dispute (if any)
```

### Step 5.7 — Dispute Resolution Panel

```
Build the dispute resolution interface:

File: apps/web/app/(app)/admin/disputes/page.tsx

Queue view (similar to KYC review):
- Open disputes at top, sorted by creation date
- Each dispute card shows:
  - Dispute ID
  - Raised by (name + role) → against (name + role)
  - Booking ID (linked)
  - Reason category
  - Created date
  - Status badge

File: apps/web/app/(app)/admin/disputes/[id]/page.tsx
- Full dispute view:
  - Left column: dispute details
    - Reason, description, evidence photos (enlargeable)
    - Raiser's profile + history + rating
    - Against user's profile + history + rating
  - Right column: booking context
    - Full booking details
    - Chat transcript between the two users
    - Spot details with photos
  - Bottom: resolution section
    - Admin notes (textarea)
    - Resolution options:
      - "Resolve in favor of raiser": select action (refund, credit, strike to other user)
      - "Resolve in favor of other party": dismiss dispute
      - "Dismiss": no action, close dispute
    - "Resolve" button with confirmation

After resolution:
- Update dispute status
- Apply chosen actions (refund, credit, strike)
- Notify both parties: "Your dispute has been resolved. {outcome}"
- Add admin_notes and resolution to dispute record
```

### Step 5.8 — Platform Analytics

```
Build a detailed analytics page:

File: apps/web/app/(app)/admin/analytics/page.tsx

Sections:

1. Revenue Analytics:
   - Total revenue (all-time, this month, this week)
   - Revenue by booking type (hourly/daily/monthly pie chart)
   - Revenue trend (line chart, last 6 months)
   - Top earning spots (table: spot, owner, total revenue, booking count)
   - Average booking value

2. User Analytics:
   - User growth chart (line, cumulative)
   - Active users (users with bookings in last 30 days)
   - Seeker vs Owner distribution (pie chart)
   - KYC verification rate
   - User retention (% users with > 1 booking)

3. Spot Analytics:
   - Total spots by area (bar chart per Chennai area)
   - Spot utilization rate (booked hours / available hours)
   - Average price by area
   - New listings trend

4. Booking Analytics:
   - Bookings per day trend
   - Completion rate (completed / total)
   - Cancellation rate (+ breakdown: by seeker vs by owner)
   - No-show rate
   - Average booking duration
   - Peak hours heatmap (day of week × hour)

5. Area Heatmap:
   - Mapbox map showing demand density (where seekers search most)
   - vs supply density (where spots are listed)
   - Identify underserved areas for growth

All charts use Recharts. Data fetched server-side with Supabase service role.
Add date range selector (last 7 days / 30 days / 90 days / all time) that applies globally.

Create SQL views or functions for complex aggregations to keep the code clean:
- CREATE VIEW admin_revenue_daily AS ...
- CREATE VIEW admin_bookings_summary AS ...
- CREATE VIEW admin_area_stats AS ...
```

---

## Checklist Before Moving to Phase 6

- [ ] Admin layout with sidebar and route protection working
- [ ] Dashboard KPIs showing real data from DB
- [ ] Charts rendering with Recharts
- [ ] User management: search, filter, view, ban, role change
- [ ] KYC review queue: view docs, approve/reject
- [ ] Spot management: view, toggle active, toggle featured
- [ ] Booking management: view details, force cancel
- [ ] Dispute resolution: review, resolve with actions
- [ ] Analytics page with all chart sections
- [ ] Admin actions trigger notifications to affected users
- [ ] Admin can only be accessed by users with role='admin'
