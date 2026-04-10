-- Owner-only payload for editing a spot (includes exact coordinates)

CREATE OR REPLACE FUNCTION public.get_spot_for_owner_edit(p_id UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT
      s.id,
      s.owner_id,
      s.title,
      s.description,
      s.spot_type,
      s.coverage,
      s.vehicle_size,
      s.total_slots,
      ST_Y (s.location::geometry) AS latitude,
      ST_X (s.location::geometry) AS longitude,
      s.address_line,
      s.landmark,
      s.city,
      s.pincode,
      s.fuzzy_landmark,
      s.fuzzy_radius_meters,
      s.price_per_hour,
      s.price_per_day,
      s.price_per_month,
      s.is_instant_book,
      s.is_active,
      s.is_featured,
      s.amenities,
      s.photos,
      s.video_url,
      s.avg_rating,
      s.total_reviews,
      s.created_at,
      s.updated_at
    FROM public.spots s
    WHERE
      s.id = p_id
      AND s.owner_id = auth.uid()
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.get_spot_for_owner_edit(UUID) TO authenticated;
