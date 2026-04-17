-- =====================================================
-- Migration 002: Commission Rule Engine
-- =====================================================

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES public.profiles(id),
  name          TEXT NOT NULL,                  -- e.g. "Standard Agent 2%"
  commission_type TEXT NOT NULL DEFAULT 'agent', -- agent | manager | company | developer
  developer_id  UUID REFERENCES public.developers(id), -- null = applies to all developers
  project_name  TEXT,                           -- null = applies to all projects
  percentage    NUMERIC(5,2) NOT NULL,          -- e.g. 2.50 means 2.5%
  flat_amount   NUMERIC(14,2),                  -- alternative: fixed amount instead of %
  use_percentage BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_rules_select" ON public.commission_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "commission_rules_manage" ON public.commission_rules
  FOR ALL USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

-- Add rule_id FK to commissions table so each commission traces back to its rule
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES public.commission_rules(id),
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active, commission_type);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON public.commissions(agent_id);
