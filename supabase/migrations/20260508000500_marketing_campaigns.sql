-- Marketing Campaigns table for tracking marketing department campaigns

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by   uuid        REFERENCES public.profiles(id),
  name         text        NOT NULL,
  department   text        NOT NULL DEFAULT 'Copywriting',
  status       text        NOT NULL DEFAULT 'draft',
  budget_egp   numeric(12,2),
  start_date   date,
  end_date     date,
  goals        text,
  notes        text,
  metadata     jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON public.marketing_campaigns
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY "campaigns_insert" ON public.marketing_campaigns
  FOR INSERT WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY "campaigns_update" ON public.marketing_campaigns
  FOR UPDATE USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY "campaigns_delete" ON public.marketing_campaigns
  FOR DELETE USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_campaigns_company ON public.marketing_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_dept    ON public.marketing_campaigns(department);
CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON public.marketing_campaigns(status);
