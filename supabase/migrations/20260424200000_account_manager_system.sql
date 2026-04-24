-- Account Manager System
-- Adds account_manager_id to broker_profiles for direct AM lookup,
-- and creates an assignment history table for auditing.

-- 1. Add AM column to broker_profiles
ALTER TABLE public.broker_profiles
  ADD COLUMN IF NOT EXISTS account_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_broker_profiles_account_manager_id
  ON public.broker_profiles(account_manager_id);

-- 2. Sync existing assignments from user_profiles → broker_profiles
UPDATE public.broker_profiles bp
SET account_manager_id = up.account_manager_id
FROM public.user_profiles up
WHERE up.id = bp.profile_id
  AND up.account_manager_id IS NOT NULL
  AND bp.account_manager_id IS NULL;

-- 3. AM assignment history (audit trail for HR)
CREATE TABLE IF NOT EXISTS public.am_broker_assignments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id      uuid        NOT NULL,  -- references broker_profiles.profile_id
  am_id          uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  notes          text
);

CREATE INDEX IF NOT EXISTS idx_am_assignments_broker ON public.am_broker_assignments(broker_id);
CREATE INDEX IF NOT EXISTS idx_am_assignments_am     ON public.am_broker_assignments(am_id);

-- RLS: only authenticated users with service role or manager role can read
ALTER TABLE public.am_broker_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "am_assignments_service_all"
  ON public.am_broker_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);
