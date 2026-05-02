-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.skill_assessments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_name   text NOT NULL,
  assessed_by  uuid REFERENCES auth.users(id),
  score        numeric(4,1) CHECK (score BETWEEN 0 AND 10),
  notes        text,
  assessed_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
