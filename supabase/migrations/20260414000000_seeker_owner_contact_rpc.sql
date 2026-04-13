-- Seeker can read spot owner name + phone only for their own booking in an active lifecycle state.

CREATE OR REPLACE FUNCTION public.get_owner_contact_for_seeker_booking(p_booking_id UUID)
RETURNS TABLE (
  full_name TEXT,
  phone TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT u.full_name::TEXT, u.phone::TEXT
  FROM public.bookings b
  INNER JOIN public.spots s ON s.id = b.spot_id
  INNER JOIN public.users u ON u.id = s.owner_id
  WHERE
    b.id = p_booking_id
    AND b.seeker_id = v_uid
    AND b.status IN (
      'confirmed',
      'checked_in',
      'active',
      'completed'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_owner_contact_for_seeker_booking(UUID) TO authenticated;
