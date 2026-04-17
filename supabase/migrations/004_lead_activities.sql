-- =====================================================
-- Migration 004: Lead Activity Log
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  type        TEXT NOT NULL, -- call | meeting | note | whatsapp | email | site_visit | status_change
  outcome     TEXT,          -- answered | no_answer | busy | interested | not_interested
  note        TEXT,
  duration_min INTEGER,      -- for calls/meetings
  scheduled_at TIMESTAMPTZ,  -- for upcoming meetings
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id  ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id  ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created  ON public.lead_activities(created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities_select" ON public.lead_activities
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin')
  );

CREATE POLICY "lead_activities_insert" ON public.lead_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "lead_activities_delete" ON public.lead_activities
  FOR DELETE USING (
    user_id = auth.uid()
    OR auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin')
  );
