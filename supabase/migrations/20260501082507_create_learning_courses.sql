-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  category    text,
  duration_hours numeric(6,2),
  is_mandatory bool NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
