-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed','failed')),
  progress_pct numeric(5,2) NOT NULL DEFAULT 0,
  completed_at timestamptz,
  score       numeric(5,2),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, employee_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
