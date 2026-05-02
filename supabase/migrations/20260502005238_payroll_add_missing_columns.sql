-- Applied via Supabase MCP. Same as 20260501084224 — idempotent re-apply.
ALTER TABLE public.payroll
  ADD COLUMN IF NOT EXISTS company_id      uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS basic_salary    numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS present_days    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS absent_days     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_count      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_salary    numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS generated_by    uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS generated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at     timestamptz;
CREATE INDEX IF NOT EXISTS payroll_company_period_idx
  ON public.payroll(company_id, year DESC, month DESC);
