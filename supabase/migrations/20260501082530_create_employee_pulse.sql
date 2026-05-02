-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.employee_pulse (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  engagement_score  numeric(4,1),
  satisfaction_score numeric(4,1),
  nps_score         numeric(4,1),
  comments          text,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_pulse ENABLE ROW LEVEL SECURITY;
