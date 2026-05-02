-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id   uuid REFERENCES public.talent_candidates(id) ON DELETE CASCADE,
  position       text NOT NULL,
  department_id  uuid REFERENCES public.departments(id),
  offered_salary numeric(12,2),
  start_date     date,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  letter_url     text,
  notes          text,
  issued_by      uuid REFERENCES auth.users(id),
  issued_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
