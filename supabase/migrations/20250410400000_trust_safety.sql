-- Phase 5: Trust & safety — reviews (two per booking), user ratings, disputes, SOS, no-show job helpers

-- Allow one review per direction per booking (was UNIQUE(booking_id) only)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_key;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_booking_type_unique UNIQUE (booking_id, review_type);

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS seeker_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB NOT NULL DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS property_proof_url TEXT;

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.users (id),
  against_user UUID NOT NULL REFERENCES public.users (id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'under_review', 'resolved_for_raiser', 'resolved_for_other', 'dismissed')
  ),
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT disputes_one_open_per_booking UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.disputes (booking_id);

CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings (id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_user ON public.sos_events (user_id);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY disputes_participant_select ON public.disputes FOR
SELECT TO authenticated USING (
  raised_by = auth.uid()
  OR against_user = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY disputes_participant_insert ON public.disputes FOR INSERT TO authenticated
WITH CHECK (
  raised_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE
      b.id = booking_id
      AND b.status = 'completed'
      AND b.checked_out_at IS NOT NULL
      AND b.checked_out_at + INTERVAL '24 hours' >= NOW()
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

CREATE POLICY disputes_admin_update ON public.disputes FOR
UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

CREATE POLICY sos_insert_own ON public.sos_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY sos_select_own ON public.sos_events FOR
SELECT TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE
      u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- Spot aggregates from seeker→owner reviews
CREATE OR REPLACE FUNCTION public.update_spot_rating_from_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.review_type = 'seeker_to_owner' THEN
    UPDATE public.spots
    SET
      avg_rating = COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
          FROM public.reviews r
          WHERE
            r.spot_id = NEW.spot_id
            AND r.review_type = 'seeker_to_owner'
        ),
        0
      ),
      total_reviews = (
        SELECT COUNT(*)::INTEGER
        FROM public.reviews r
        WHERE
          r.spot_id = NEW.spot_id
          AND r.review_type = 'seeker_to_owner'
      )
    WHERE
      id = NEW.spot_id;

    UPDATE public.users u
    SET
      owner_rating = COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
          FROM public.reviews r
          WHERE
            r.reviewee_id = NEW.reviewee_id
            AND r.review_type = 'seeker_to_owner'
        ),
        0
      )
    WHERE
      u.id = NEW.reviewee_id;
  END IF;

  IF NEW.review_type = 'owner_to_seeker' THEN
    UPDATE public.users u
    SET
      seeker_rating = COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
          FROM public.reviews r
          WHERE
            r.reviewee_id = NEW.reviewee_id
            AND r.review_type = 'owner_to_seeker'
        ),
        0
      )
    WHERE
      u.id = NEW.reviewee_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_spot_rating ON public.reviews;

CREATE TRIGGER trigger_update_spot_rating
AFTER INSERT ON public.reviews FOR EACH ROW
EXECUTE FUNCTION public.update_spot_rating_from_reviews();

-- Mark booking disputed (optional FK safety)
CREATE OR REPLACE FUNCTION public.apply_dispute_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET
    status = 'disputed',
    updated_at = NOW()
  WHERE
    id = NEW.booking_id
    AND status NOT IN ('cancelled_by_seeker', 'cancelled_by_owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_dispute_booking
AFTER INSERT ON public.disputes FOR EACH ROW
EXECUTE FUNCTION public.apply_dispute_booking_status();

-- No-show batch (call from cron or Edge Function)
CREATE OR REPLACE FUNCTION public.run_no_show_detection()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
  SELECT
    b.id,
    b.seeker_id
  FROM public.bookings b
  WHERE
    b.status = 'confirmed'
    AND b.checked_in_at IS NULL
    AND b.start_time + INTERVAL '30 minutes' < NOW()
  LOOP
    UPDATE public.bookings
    SET
      status = 'no_show',
      updated_at = NOW()
    WHERE
      id = r.id;

    UPDATE public.users
    SET
      strike_count = strike_count + 1,
      updated_at = NOW()
    WHERE
      id = r.seeker_id;

    INSERT INTO public.transactions (booking_id, user_id, type, amount, status, razorpay_ref)
    VALUES (
      r.id,
      r.seeker_id,
      'penalty',
      0,
      'completed',
      'no_show_retained'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_no_show_detection() TO service_role;

-- Private evidence uploads for disputes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dispute-evidence',
  'dispute-evidence',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public;

CREATE POLICY dispute_evidence_select ON storage.objects FOR
SELECT TO authenticated USING (
  bucket_id = 'dispute-evidence'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY dispute_evidence_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

CREATE POLICY dispute_evidence_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'dispute-evidence'
  AND split_part(name, '/', 1) = auth.uid()::TEXT
);

-- Tighter chat: only booking participants can send
DROP POLICY IF EXISTS messages_insert ON public.messages;

CREATE POLICY messages_insert_booking_participant ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE
      b.id = booking_id
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
      AND b.status NOT IN ('cancelled_by_seeker', 'cancelled_by_owner', 'pending', 'disputed', 'no_show')
      AND (
        b.status IN ('confirmed', 'checked_in', 'active')
        OR (
          b.status = 'completed'
          AND b.checked_out_at IS NOT NULL
          AND b.checked_out_at + INTERVAL '24 hours' >= NOW()
        )
      )
  )
);
