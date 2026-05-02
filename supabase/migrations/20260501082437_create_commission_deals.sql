-- Applied via Supabase MCP. Tables created as part of HR ERP module.
-- commission_deals table for ERP HR commission tracking
CREATE TABLE IF NOT EXISTS public.commission_deals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  deal_ref        text NOT NULL,
  unit_ref        text,
  client_name     text,
  sale_value      numeric(14,2) NOT NULL DEFAULT 0,
  collected_amount numeric(14,2) NOT NULL DEFAULT 0,
  commission_rate_pct numeric(6,3),
  commission_amount   numeric(14,2) NOT NULL DEFAULT 0,
  triggered_commission numeric(14,2) NOT NULL DEFAULT 0,
  deal_stage      text NOT NULL DEFAULT 'reservation',
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  notes           text,
  recorded_by     uuid REFERENCES auth.users(id),
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  rejection_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_deals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS commission_deals_employee_idx ON public.commission_deals(employee_id);
CREATE INDEX IF NOT EXISTS commission_deals_company_idx  ON public.commission_deals(company_id);
