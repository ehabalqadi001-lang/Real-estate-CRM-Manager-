-- ==============================================================================
-- PHASE 1: Create Points Ledger Table & RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'adjusted')),
  points_value integer NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster queries on leaderboard and history
CREATE INDEX IF NOT EXISTS idx_points_ledger_agent_id ON public.points_ledger(agent_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger(created_at);

-- Enable Row Level Security
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- Admins can do everything (Read, Insert, Update, Delete)
CREATE POLICY "Admins have full access to points_ledger"
ON public.points_ledger
FOR ALL
TO authenticated
USING (
  (select auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'platform_admin', 'company_admin')
)
WITH CHECK (
  (select auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'platform_admin', 'company_admin')
);

-- Agents can ONLY READ their own points (Prevent manipulation)
CREATE POLICY "Agents can view own points_ledger"
ON public.points_ledger
FOR SELECT
TO authenticated
USING (
  agent_id = auth.uid()
);

-- ==============================================================================
-- PHASE 2: Backend Automation (Database Triggers)
-- ==============================================================================

-- 1. Trigger for Meeting Bookings (Earn 50 points on completed meeting)
CREATE OR REPLACE FUNCTION public.fn_award_meeting_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.agent_id IS NOT NULL THEN
    INSERT INTO public.points_ledger (agent_id, source_table, source_id, transaction_type, points_value, description)
    VALUES (NEW.agent_id, 'meeting_bookings', NEW.id, 'earned', 50, 'Completed a meeting with client (Site Visit/Office)');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_meeting_points
AFTER UPDATE ON public.meeting_bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_award_meeting_points();

-- 2. Trigger for Call Performance (Earn 20 points for calls > 180 seconds)
CREATE OR REPLACE FUNCTION public.fn_award_call_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' 
     AND NEW.duration_seconds >= 180 AND NEW.agent_id IS NOT NULL THEN
    INSERT INTO public.points_ledger (agent_id, source_table, source_id, transaction_type, points_value, description)
    VALUES (NEW.agent_id, 'masked_call_sessions', NEW.id, 'earned', 20, 'Completed a successful call exceeding KPI threshold (3 mins)');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_call_points
AFTER UPDATE ON public.masked_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.fn_award_call_points();