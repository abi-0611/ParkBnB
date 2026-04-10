-- Storage buckets + RLS + create/update spot RPCs (PostGIS)

-- ---------------------------------------------------------------------------
-- Buckets (Supabase storage)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spot-photos',
  'spot-photos',
  TRUE,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  FALSE,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies: spot-photos
-- ---------------------------------------------------------------------------
CREATE POLICY spot_photos_public_read ON storage.objects FOR
SELECT TO public USING (bucket_id = 'spot-photos');

CREATE POLICY spot_photos_authenticated_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'spot-photos'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY spot_photos_owner_update ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'spot-photos'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
)
WITH CHECK (
  bucket_id = 'spot-photos'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY spot_photos_owner_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'spot-photos'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

-- ---------------------------------------------------------------------------
-- Storage policies: kyc-documents (private)
-- ---------------------------------------------------------------------------
CREATE POLICY kyc_select_own_or_admin ON storage.objects FOR
SELECT TO authenticated USING (
  bucket_id = 'kyc-documents'
  AND (
    split_part(name, '/', 1) = auth.uid()::TEXT
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE
        u.id = auth.uid()
        AND u.role = 'admin'
    )
  )
);

CREATE POLICY kyc_insert_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY kyc_update_own ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'kyc-documents'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY kyc_delete_own ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'kyc-documents'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

-- ---------------------------------------------------------------------------
-- RPC: create_spot — owner = auth.uid()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_spot(
  p_title TEXT,
  p_description TEXT,
  p_spot_type TEXT,
  p_coverage TEXT,
  p_vehicle_size TEXT,
  p_total_slots INTEGER,
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_address_line TEXT,
  p_landmark TEXT,
  p_pincode TEXT,
  p_fuzzy_landmark TEXT,
  p_fuzzy_radius_meters INTEGER,
  p_price_per_hour NUMERIC,
  p_price_per_day NUMERIC,
  p_price_per_month NUMERIC,
  p_is_instant_book BOOLEAN,
  p_amenities JSONB,
  p_photos TEXT[],
  p_video_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID := gen_random_uuid();
  v_owner UUID := auth.uid();
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_spot_type NOT IN ('car', 'bike', 'both', 'ev_charging') THEN
    RAISE EXCEPTION 'Invalid spot_type';
  END IF;

  IF p_coverage NOT IN ('covered', 'open', 'underground') THEN
    RAISE EXCEPTION 'Invalid coverage';
  END IF;

  IF p_vehicle_size NOT IN ('hatchback', 'sedan', 'suv', 'any') THEN
    RAISE EXCEPTION 'Invalid vehicle_size';
  END IF;

  INSERT INTO public.spots (
    id,
    owner_id,
    title,
    description,
    spot_type,
    coverage,
    vehicle_size,
    total_slots,
    location,
    address_line,
    landmark,
    city,
    pincode,
    fuzzy_landmark,
    fuzzy_radius_meters,
    price_per_hour,
    price_per_day,
    price_per_month,
    is_instant_book,
    is_active,
    amenities,
    photos,
    video_url
  )
  VALUES (
    v_id,
    v_owner,
    p_title,
    NULLIF(TRIM(p_description), ''),
    p_spot_type,
    p_coverage,
    p_vehicle_size,
    GREATEST(1, LEAST(500, COALESCE(p_total_slots, 1))),
    ST_SETSRID(ST_MAKEPOINT(p_longitude, p_latitude), 4326)::geography,
    p_address_line,
    NULLIF(TRIM(p_landmark), ''),
    'Chennai',
    NULLIF(TRIM(p_pincode), ''),
    p_fuzzy_landmark,
    COALESCE(p_fuzzy_radius_meters, 500),
    p_price_per_hour,
    p_price_per_day,
    p_price_per_month,
    COALESCE(p_is_instant_book, TRUE),
    TRUE,
    COALESCE(p_amenities, '[]'::JSONB),
    p_photos,
    NULLIF(TRIM(p_video_url), '')
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spot(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  JSONB,
  TEXT[],
  TEXT
) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: update_spot — only owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_spot(
  p_spot_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_spot_type TEXT,
  p_coverage TEXT,
  p_vehicle_size TEXT,
  p_total_slots INTEGER,
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_address_line TEXT,
  p_landmark TEXT,
  p_pincode TEXT,
  p_fuzzy_landmark TEXT,
  p_fuzzy_radius_meters INTEGER,
  p_price_per_hour NUMERIC,
  p_price_per_day NUMERIC,
  p_price_per_month NUMERIC,
  p_is_instant_book BOOLEAN,
  p_is_active BOOLEAN,
  p_amenities JSONB,
  p_photos TEXT[],
  p_video_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID := auth.uid();
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.spots s
  SET
    title = p_title,
    description = NULLIF(TRIM(p_description), ''),
    spot_type = p_spot_type,
    coverage = p_coverage,
    vehicle_size = p_vehicle_size,
    total_slots = GREATEST(1, LEAST(500, COALESCE(p_total_slots, 1))),
    location = ST_SETSRID(ST_MAKEPOINT(p_longitude, p_latitude), 4326)::geography,
    address_line = p_address_line,
    landmark = NULLIF(TRIM(p_landmark), ''),
    pincode = NULLIF(TRIM(p_pincode), ''),
    fuzzy_landmark = p_fuzzy_landmark,
    fuzzy_radius_meters = COALESCE(p_fuzzy_radius_meters, 500),
    price_per_hour = p_price_per_hour,
    price_per_day = p_price_per_day,
    price_per_month = p_price_per_month,
    is_instant_book = COALESCE(p_is_instant_book, TRUE),
    is_active = COALESCE(p_is_active, TRUE),
    amenities = COALESCE(p_amenities, '[]'::JSONB),
    photos = p_photos,
    video_url = NULLIF(TRIM(p_video_url), '')
  WHERE
    s.id = p_spot_id
    AND s.owner_id = v_owner;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_spot(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  BOOLEAN,
  JSONB,
  TEXT[],
  TEXT
) TO authenticated;

-- Realtime: bookings (for availability calendar)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
