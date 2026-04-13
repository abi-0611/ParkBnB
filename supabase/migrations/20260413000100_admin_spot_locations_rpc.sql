-- Admin helper: exact coordinates for spot management map
-- Uses SECURITY DEFINER and explicit admin-role check.

CREATE OR REPLACE FUNCTION public.admin_spot_locations(
  p_q TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_coverage TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_featured BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  address_line TEXT,
  fuzzy_landmark TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.address_line,
    s.fuzzy_landmark,
    ST_Y(s.location::geometry) AS latitude,
    ST_X(s.location::geometry) AS longitude
  FROM public.spots s
  WHERE
    (p_q IS NULL OR p_q = '' OR s.title ILIKE '%' || p_q || '%' OR s.fuzzy_landmark ILIKE '%' || p_q || '%' OR s.address_line ILIKE '%' || p_q || '%')
    AND (p_type IS NULL OR p_type = '' OR s.spot_type = p_type)
    AND (p_coverage IS NULL OR p_coverage = '' OR s.coverage = p_coverage)
    AND (
      p_status IS NULL OR p_status = '' OR
      (p_status = 'active' AND s.is_active = TRUE) OR
      (p_status = 'inactive' AND s.is_active = FALSE)
    )
    AND (p_featured = FALSE OR s.is_featured = TRUE)
  ORDER BY s.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_spot_locations(TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated, service_role;

