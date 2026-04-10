-- Seeker search: extended RPC, fuzzy coords (deterministic), seeker availability read, detail RPC

DROP FUNCTION IF EXISTS public.search_spots_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION public.search_spots_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 2000,
  spot_filter TEXT DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  coverage_filter TEXT DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  instant_book_only BOOLEAN DEFAULT NULL,
  vehicle_size_filter TEXT DEFAULT NULL
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
  is_active BOOLEAN,
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
    s.is_active,
    (
      ST_Y (s.location::geometry) + (
        ((ABS(HASHTEXT(s.id::TEXT || 'lat')) % 1000) / 1000.0 - 0.5)
        * 2
        * (s.fuzzy_radius_meters::DOUBLE PRECISION / 111000.0)
      )
    ) AS fuzzy_lat,
    (
      ST_X (s.location::geometry) + (
        ((ABS(HASHTEXT(s.id::TEXT || 'lng')) % 1000) / 1000.0 - 0.5)
        * 2
        * (s.fuzzy_radius_meters::DOUBLE PRECISION / (111000.0 * COS(RADIANS(ST_Y (s.location::geometry)))))
      )
    ) AS fuzzy_lng,
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
    AND (
      coverage_filter IS NULL
      OR s.coverage = coverage_filter::TEXT
    )
    AND (
      min_rating IS NULL
      OR s.avg_rating >= min_rating
    )
    AND (
      instant_book_only IS NOT TRUE
      OR s.is_instant_book = TRUE
    )
    AND (
      vehicle_size_filter IS NULL
      OR s.vehicle_size = 'any'
      OR s.vehicle_size = vehicle_size_filter::TEXT
    )
  ORDER BY distance_meters ASC, s.price_per_hour ASC NULLS LAST, s.avg_rating DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.search_spots_nearby(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  TEXT,
  NUMERIC,
  TEXT,
  NUMERIC,
  BOOLEAN,
  TEXT
) TO anon, authenticated, service_role;

-- Seekers can read availability for active spots (for calendars)
CREATE POLICY availability_seeker_read ON public.availability FOR
SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE
      s.id = availability.spot_id
      AND s.is_active = TRUE
  )
);

-- Public spot detail for seekers (no address / exact geometry)
CREATE OR REPLACE FUNCTION public.get_spot_seeker_detail(p_spot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r JSONB;
BEGIN
  SELECT
    jsonb_build_object(
      'id',
      s.id,
      'owner_id',
      s.owner_id,
      'title',
      s.title,
      'description',
      s.description,
      'spot_type',
      s.spot_type,
      'coverage',
      s.coverage,
      'vehicle_size',
      s.vehicle_size,
      'total_slots',
      s.total_slots,
      'fuzzy_landmark',
      s.fuzzy_landmark,
      'fuzzy_radius_meters',
      s.fuzzy_radius_meters,
      'price_per_hour',
      s.price_per_hour,
      'price_per_day',
      s.price_per_day,
      'price_per_month',
      s.price_per_month,
      'is_instant_book',
      s.is_instant_book,
      'amenities',
      s.amenities,
      'photos',
      to_jsonb(s.photos),
      'video_url',
      s.video_url,
      'avg_rating',
      s.avg_rating,
      'total_reviews',
      s.total_reviews,
      'created_at',
      s.created_at,
      'fuzzy_lat',
      (
        ST_Y (s.location::geometry) + (
          ((ABS(HASHTEXT(s.id::TEXT || 'lat')) % 1000) / 1000.0 - 0.5)
          * 2
          * (s.fuzzy_radius_meters::DOUBLE PRECISION / 111000.0)
        )
      ),
      'fuzzy_lng',
      (
        ST_X (s.location::geometry) + (
          ((ABS(HASHTEXT(s.id::TEXT || 'lng')) % 1000) / 1000.0 - 0.5)
          * 2
          * (s.fuzzy_radius_meters::DOUBLE PRECISION / (111000.0 * COS(RADIANS(ST_Y (s.location::geometry)))))
        )
      ),
      'owner_name',
      u.full_name,
      'owner_avatar_url',
      u.avatar_url,
      'owner_verified',
      u.is_verified,
      'owner_member_since',
      u.created_at,
      'reviews',
      (
        SELECT
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'rating',
                sub.rating,
                'comment',
                sub.comment,
                'created_at',
                sub.created_at,
                'reviewer_name',
                sub.reviewer_name
              )
              ORDER BY sub.created_at DESC
            ),
            '[]'::JSONB
          )
        FROM (
          SELECT
            r.rating,
            r.comment,
            r.created_at,
            ru.full_name AS reviewer_name
          FROM public.reviews r
          INNER JOIN public.users ru ON ru.id = r.reviewer_id
          WHERE
            r.spot_id = s.id
            AND r.review_type = 'seeker_to_owner'
          ORDER BY r.created_at DESC
          LIMIT 10
        ) sub
      )
    )
  INTO r
  FROM public.spots s
  JOIN public.users u ON u.id = s.owner_id
  WHERE
    s.id = p_spot_id
    AND s.is_active = TRUE;

  RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_spot_seeker_detail(UUID) TO anon, authenticated, service_role;
