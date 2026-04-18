-- Add notification_prefs JSONB column to profiles for per-user toggle persistence
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"late_followup":true,"deal_closed":true,"target_alert":true,"score_drop":false}'::jsonb;
