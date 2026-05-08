ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS approval_pin_hash text;
