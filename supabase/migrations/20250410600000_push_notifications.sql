-- Phase 6.2: Push notifications support

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
  "booking_confirmed": true,
  "check_in_request": true,
  "check_in_approved": true,
  "booking_reminder": true,
  "session_ending": true,
  "new_review": true,
  "new_chat_message": true,
  "no_show_warning": true,
  "dispute_update": true
}'::jsonb;
