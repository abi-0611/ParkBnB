-- Phase 4: booking creation with overlap guard, seeker spot address RLS, OTP expiry

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS gate_otp_expires_at TIMESTAMPTZ;

-- Seekers with an active/confirmed booking may read full spot row (exact address + location)
CREATE POLICY spots_seeker_select_when_booked ON public.spots FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE
      b.spot_id = spots.id
      AND b.seeker_id = auth.uid()
      AND b.status IN ('confirmed', 'checked_in', 'active')
  )
);

CREATE OR REPLACE FUNCTION public.expire_stale_pending_bookings()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.bookings
  WHERE
    status = 'pending'
    AND payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '15 minutes';
$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_spot_id UUID,
  p_vehicle_id UUID,
  p_booking_type TEXT,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user RECORD;
  v_spot RECORD;
  v_vehicle RECORD;
  v_overlap INTEGER;
  v_slots INTEGER;
  v_base NUMERIC(10, 2);
  v_hours DOUBLE PRECISION;
  v_days NUMERIC;
  v_service NUMERIC(10, 2);
  v_total NUMERIC(10, 2);
  v_payout NUMERIC(10, 2);
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.expire_stale_pending_bookings();

  SELECT * INTO v_user FROM public.users WHERE id = v_uid;
  IF NOT FOUND OR v_user.is_banned THEN
    RAISE EXCEPTION 'User cannot book';
  END IF;

  SELECT * INTO v_spot FROM public.spots WHERE id = p_spot_id AND is_active = TRUE FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spot not found';
  END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id AND user_id = v_uid FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle not found';
  END IF;

  -- Simple vehicle vs spot compatibility
  IF v_spot.spot_type = 'bike' AND v_vehicle.vehicle_type <> 'bike' THEN
    RAISE EXCEPTION 'Vehicle not allowed for this spot';
  END IF;
  IF v_spot.spot_type IN ('car', 'both', 'ev_charging') AND v_vehicle.vehicle_type = 'bike' THEN
    RAISE EXCEPTION 'Vehicle not allowed for this spot';
  END IF;

  IF p_end <= p_start THEN
    RAISE EXCEPTION 'Invalid time range';
  END IF;

  v_slots := v_spot.total_slots;

  SELECT COUNT(*)::INTEGER INTO v_overlap
  FROM public.bookings b
  WHERE
    b.spot_id = p_spot_id
    AND b.status IN ('pending', 'confirmed', 'checked_in', 'active')
    AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(p_start, p_end, '[)');

  IF v_overlap >= v_slots THEN
    RAISE EXCEPTION 'No available slots for this time period';
  END IF;

  IF p_booking_type = 'hourly' THEN
    v_hours := GREATEST(EXTRACT(EPOCH FROM (p_end - p_start)) / 3600.0, 1.0 / 60.0);
    IF v_spot.price_per_hour IS NULL THEN
      RAISE EXCEPTION 'Hourly pricing not available';
    END IF;
    v_base := ROUND((v_hours * v_spot.price_per_hour::NUMERIC)::NUMERIC, 2);
  ELSIF p_booking_type = 'daily' THEN
    v_days := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (p_end - p_start)) / 86400.0));
    IF v_spot.price_per_day IS NULL THEN
      RAISE EXCEPTION 'Daily pricing not available';
    END IF;
    v_base := ROUND((v_days * v_spot.price_per_day::NUMERIC)::NUMERIC, 2);
  ELSIF p_booking_type = 'monthly' THEN
    IF v_spot.price_per_month IS NULL THEN
      RAISE EXCEPTION 'Monthly pricing not available';
    END IF;
    v_base := v_spot.price_per_month::NUMERIC;
  ELSE
    RAISE EXCEPTION 'Invalid booking type';
  END IF;

  v_service := GREATEST(5::NUMERIC, ROUND((v_base * 0.12)::NUMERIC, 2));
  v_total := ROUND((v_base + v_service)::NUMERIC, 2);
  v_payout := ROUND((v_base * 0.9)::NUMERIC, 2);

  INSERT INTO public.bookings (
    seeker_id,
    spot_id,
    vehicle_id,
    booking_type,
    start_time,
    end_time,
    base_price,
    service_fee,
    total_price,
    owner_payout,
    status,
    payment_status
  )
  VALUES (
    v_uid,
    p_spot_id,
    p_vehicle_id,
    p_booking_type::TEXT,
    p_start,
    p_end,
    v_base,
    v_service,
    v_total,
    v_payout,
    'pending',
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_in_booking(p_booking_id UUID, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seeker UUID := auth.uid();
  v_booking RECORD;
  v_spot RECORD;
  v_dist DOUBLE PRECISION;
BEGIN
  IF v_seeker IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND seeker_id = v_seeker FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status NOT IN ('confirmed') THEN
    RAISE EXCEPTION 'Invalid booking status for check-in';
  END IF;

  SELECT * INTO v_spot FROM public.spots WHERE id = v_booking.spot_id FOR SHARE;

  v_dist := ST_DISTANCE(
    v_spot.location,
    ST_SETSRID(ST_MAKEPOINT(p_lng, p_lat), 4326)::geography
  );

  IF v_dist > 200 THEN
    RAISE EXCEPTION 'Too far from spot: % meters', ROUND(v_dist);
  END IF;

  UPDATE public.bookings
  SET
    status = 'checked_in',
    checked_in_at = NOW(),
    updated_at = NOW()
  WHERE
    id = p_booking_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_booking(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_out_booking(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seeker UUID := auth.uid();
BEGIN
  IF v_seeker IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings
  SET
    status = 'completed',
    checked_out_at = NOW(),
    updated_at = NOW()
  WHERE
    id = p_booking_id
    AND seeker_id = v_seeker
    AND status IN ('checked_in', 'active');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot check out';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_out_booking(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_spot_coordinates_for_seeker(p_spot_id UUID)
RETURNS TABLE (lat DOUBLE PRECISION, lng DOUBLE PRECISION)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ST_Y (s.location::geometry) AS lat,
    ST_X (s.location::geometry) AS lng
  FROM public.spots s
  WHERE
    s.id = p_spot_id
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE
        b.spot_id = s.id
        AND b.seeker_id = auth.uid()
        AND b.status IN ('confirmed', 'checked_in', 'active')
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_spot_coordinates_for_seeker(UUID) TO authenticated;
