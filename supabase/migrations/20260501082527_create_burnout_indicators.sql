-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.burnout_indicators (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month      integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year       integer NOT NULL,
  workload_score    numeric(4,1),
  overtime_hours    numeric(6,2),
  absence_days      integer,
  late_check_ins    integer,
  missed_targets_pct numeric(5,2),
  burnout_score     numeric(4,1),
  risk_level        text CHECK (risk_level IN ('low','medium','high')),
  hr_notes          text,
  recorded_by       uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_month, period_year)
);
ALTER TABLE public.burnout_indicators ENABLE ROW LEVEL SECURITY;
