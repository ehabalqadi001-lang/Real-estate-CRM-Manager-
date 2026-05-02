-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.talent_candidates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text,
  phone         text,
  position      text,
  department_id uuid REFERENCES public.departments(id),
  source        text,
  status        text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offer','hired','rejected')),
  resume_url    text,
  notes         text,
  applied_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_candidates ENABLE ROW LEVEL SECURITY;
