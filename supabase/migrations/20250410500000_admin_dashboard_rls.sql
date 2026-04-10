-- Phase 6: Admin dashboard — RLS so authenticated admins can manage the platform (used with session client or service role)

-- ---------------------------------------------------------------------------
-- Helper: policies use EXISTS on public.users for role = 'admin'
-- ---------------------------------------------------------------------------

-- Spots: admin full read/update/delete (owners keep spots_owner_all)
CREATE POLICY spots_admin_select ON public.spots FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY spots_admin_update ON public.spots FOR
UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY spots_admin_delete ON public.spots FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Bookings: admin read/update
CREATE POLICY bookings_admin_select ON public.bookings FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY bookings_admin_update ON public.bookings FOR
UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Availability: admin manage any row
CREATE POLICY availability_admin_all ON public.availability FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Messages: admin read-only (for dispute/booking review)
CREATE POLICY messages_admin_select ON public.messages FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Transactions: admin read
CREATE POLICY transactions_admin_select ON public.transactions FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Vehicles: admin read (KYC / user profile)
CREATE POLICY vehicles_admin_select ON public.vehicles FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Users: admin update/delete (self-update policy unchanged)
CREATE POLICY users_admin_update ON public.users FOR
UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY users_admin_delete ON public.users FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ---------------------------------------------------------------------------
-- Read-only views for analytics (respect RLS when queried as non-service user)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_revenue_daily AS
SELECT
  DATE_TRUNC('day', b.checked_out_at AT TIME ZONE 'UTC')::DATE AS day,
  COALESCE(SUM(b.service_fee), 0)::NUMERIC(12, 2) AS revenue
FROM
  public.bookings b
WHERE
  b.status = 'completed'
  AND b.checked_out_at IS NOT NULL
GROUP BY
  1;

CREATE OR REPLACE VIEW public.admin_bookings_per_day AS
SELECT
  DATE_TRUNC('day', b.created_at AT TIME ZONE 'UTC')::DATE AS day,
  COUNT(*)::BIGINT AS booking_count
FROM
  public.bookings b
GROUP BY
  1;

GRANT SELECT ON public.admin_revenue_daily TO authenticated, service_role;
GRANT SELECT ON public.admin_bookings_per_day TO authenticated, service_role;
