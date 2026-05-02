-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year         integer NOT NULL,
  leave_type   text NOT NULL DEFAULT 'annual',
  entitled     numeric(5,2) NOT NULL DEFAULT 0,
  used         numeric(5,2) NOT NULL DEFAULT 0,
  remaining    numeric(5,2) GENERATED ALWAYS AS (entitled - used) STORED,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, leave_type)
);
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  task_name    text NOT NULL,
  description  text,
  due_date     date,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  assigned_to  uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
