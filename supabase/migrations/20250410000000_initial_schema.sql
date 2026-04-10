-- ParkNear: initial schema (PostGIS + RLS + auth sync)
-- References Phase-01 / Master prompt

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- public.users (profile; id matches auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'owner', 'both', 'admin')),
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  aadhaar_doc_url TEXT,
  selfie_url TEXT,
  strike_count INTEGER NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_role ON public.users (role);

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'car_hatchback', 'car_sedan', 'car_suv', 'ev')),
  number_plate TEXT NOT NULL,
  rc_doc_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user ON public.vehicles (user_id);

-- ---------------------------------------------------------------------------
-- spots
-- ---------------------------------------------------------------------------
CREATE TABLE public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  spot_type TEXT NOT NULL CHECK (spot_type IN ('car', 'bike', 'both', 'ev_charging')),
  coverage TEXT NOT NULL CHECK (coverage IN ('covered', 'open', 'underground')),
  vehicle_size TEXT NOT NULL DEFAULT 'any' CHECK (vehicle_size IN ('hatchback', 'sedan', 'suv', 'any')),
  total_slots INTEGER NOT NULL DEFAULT 1,
  location GEOGRAPHY (POINT, 4326) NOT NULL,
  address_line TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL DEFAULT 'Chennai',
  pincode TEXT,
  fuzzy_landmark TEXT NOT NULL,
  fuzzy_radius_meters INTEGER NOT NULL DEFAULT 500,
  price_per_hour NUMERIC(10, 2),
  price_per_day NUMERIC(10, 2),
  price_per_month NUMERIC(10, 2),
  is_instant_book BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  amenities JSONB NOT NULL DEFAULT '[]'::JSONB,
  photos TEXT[] NOT NULL,
  video_url TEXT,
  avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spots_owner ON public.spots (owner_id);
CREATE INDEX idx_spots_location ON public.spots USING GIST (location);
CREATE INDEX idx_spots_active ON public.spots (is_active);

-- ---------------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------------
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES public.spots (id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  specific_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_spot ON public.availability (spot_id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID NOT NULL REFERENCES public.users (id),
  spot_id UUID NOT NULL REFERENCES public.spots (id),
  vehicle_id UUID REFERENCES public.vehicles (id),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hourly', 'daily', 'monthly')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  service_fee NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  owner_payout NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'confirmed',
      'checked_in',
      'active',
      'completed',
      'cancelled_by_seeker',
      'cancelled_by_owner',
      'no_show',
      'disputed'
    )
  ),
  gate_otp TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_seeker ON public.bookings (seeker_id);
CREATE INDEX idx_bookings_spot ON public.bookings (spot_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users (id),
  reviewee_id UUID NOT NULL REFERENCES public.users (id),
  spot_id UUID NOT NULL REFERENCES public.spots (id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  review_type TEXT NOT NULL CHECK (review_type IN ('seeker_to_owner', 'owner_to_seeker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_spot ON public.reviews (spot_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users (id),
  receiver_id UUID NOT NULL REFERENCES public.users (id),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_booking ON public.messages (booking_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings (id),
  user_id UUID NOT NULL REFERENCES public.users (id),
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'payout', 'penalty')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  razorpay_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON public.transactions (user_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER spots_updated_at
BEFORE UPDATE ON public.spots
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: new user -> public.users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r TEXT := COALESCE(NEW.raw_user_meta_data ->> 'role', 'seeker');
BEGIN
  IF r NOT IN ('seeker', 'owner', 'both', 'admin') THEN
    r := 'seeker';
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      SPLIT_PART(COALESCE(NEW.email, 'user@local'), '@', 1)
    ),
    r
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- spots_public view (no exact address; lat/lng for client-side fuzzing per spec)
-- security_invoker = false so anon/authenticated can read without RLS on base table
-- ---------------------------------------------------------------------------
CREATE VIEW public.spots_public
WITH (security_invoker = FALSE)
AS
SELECT
  s.id,
  s.owner_id,
  s.title,
  s.description,
  s.spot_type,
  s.coverage,
  s.vehicle_size,
  s.total_slots,
  s.fuzzy_landmark,
  s.fuzzy_radius_meters,
  s.price_per_hour,
  s.price_per_day,
  s.price_per_month,
  s.is_instant_book,
  s.is_active,
  s.amenities,
  s.photos,
  s.video_url,
  s.avg_rating,
  s.total_reviews,
  s.created_at,
  ST_Y (s.location::geometry) AS fuzzy_lat,
  ST_X (s.location::geometry) AS fuzzy_lng
FROM public.spots s
WHERE
  s.is_active = TRUE;

GRANT SELECT ON public.spots_public TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Proximity search (fuzzy + distance; never returns address_line)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_spots_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 2000,
  spot_filter TEXT DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  title TEXT,
  description TEXT,
  spot_type TEXT,
  coverage TEXT,
  vehicle_size TEXT,
  total_slots INTEGER,
  fuzzy_landmark TEXT,
  fuzzy_radius_meters INTEGER,
  price_per_hour NUMERIC,
  price_per_day NUMERIC,
  price_per_month NUMERIC,
  is_instant_book BOOLEAN,
  amenities JSONB,
  photos TEXT[],
  video_url TEXT,
  avg_rating NUMERIC,
  total_reviews INTEGER,
  created_at TIMESTAMPTZ,
  fuzzy_lat DOUBLE PRECISION,
  fuzzy_lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.owner_id,
    s.title,
    s.description,
    s.spot_type,
    s.coverage,
    s.vehicle_size,
    s.total_slots,
    s.fuzzy_landmark,
    s.fuzzy_radius_meters,
    s.price_per_hour,
    s.price_per_day,
    s.price_per_month,
    s.is_instant_book,
    s.amenities,
    s.photos,
    s.video_url,
    s.avg_rating,
    s.total_reviews,
    s.created_at,
    ST_Y (s.location::geometry) AS fuzzy_lat,
    ST_X (s.location::geometry) AS fuzzy_lng,
    ST_DISTANCE(
      s.location,
      ST_SETSRID(ST_MAKEPOINT(user_lng, user_lat), 4326)::geography
    ) AS distance_meters
  FROM public.spots s
  WHERE
    s.is_active = TRUE
    AND ST_DWITHIN(
      s.location,
      ST_SETSRID(ST_MAKEPOINT(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
    AND (
      spot_filter IS NULL
      OR s.spot_type = spot_filter::TEXT
    )
    AND (
      max_price IS NULL
      OR s.price_per_hour IS NULL
      OR s.price_per_hour <= max_price
    )
  ORDER BY distance_meters ASC, s.price_per_hour ASC NULLS LAST, s.avg_rating DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.search_spots_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, NUMERIC) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select_self_or_admin ON public.users FOR
SELECT USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY users_update_self ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- vehicles
CREATE POLICY vehicles_all_own ON public.vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- spots: owners manage their rows
CREATE POLICY spots_owner_all ON public.spots FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- availability: via spot ownership
CREATE POLICY availability_owner_all ON public.availability FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = availability.spot_id
      AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = availability.spot_id
      AND s.owner_id = auth.uid()
  )
);

-- bookings
CREATE POLICY bookings_seeker_select ON public.bookings FOR
SELECT USING (auth.uid() = seeker_id);

CREATE POLICY bookings_seeker_insert ON public.bookings FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY bookings_seeker_update ON public.bookings FOR UPDATE USING (auth.uid() = seeker_id) WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY bookings_owner_select ON public.bookings FOR
SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = bookings.spot_id
      AND s.owner_id = auth.uid()
  )
);

CREATE POLICY bookings_owner_update ON public.bookings FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = bookings.spot_id
      AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = bookings.spot_id
      AND s.owner_id = auth.uid()
  )
);

-- reviews
CREATE POLICY reviews_select_all ON public.reviews FOR SELECT USING (TRUE);

CREATE POLICY reviews_insert_participant ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE
      b.id = reviews.booking_id
      AND (
        b.seeker_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.spots s
          WHERE
            s.id = b.spot_id
            AND s.owner_id = auth.uid()
        )
      )
  )
);

-- messages
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
);

CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_update ON public.messages FOR UPDATE USING (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
) WITH CHECK (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
);

-- transactions
CREATE POLICY transactions_own ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- service_role bypasses RLS by default in Supabase
