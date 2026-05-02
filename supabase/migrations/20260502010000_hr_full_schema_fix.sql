-- ============================================================
-- HR Full Schema Fix — 2026-05-02
-- Aligns all HR tables with the application code expectations
-- ============================================================

-- ── 1. leave_types ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_types (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  name_ar      text,
  days_per_year numeric(5,2) NOT NULL DEFAULT 21,
  is_paid      boolean     NOT NULL DEFAULT true,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS leave_types_company_idx ON public.leave_types(company_id);

-- Allow nullable company_id for system-wide defaults
ALTER TABLE public.leave_types
  ALTER COLUMN company_id DROP NOT NULL;

-- Seed default global leave types
INSERT INTO public.leave_types (name, name_ar, days_per_year, is_paid) VALUES
  ('Annual Leave',    'إجازة سنوية',     21, true),
  ('Sick Leave',      'إجازة مرضية',     7,  true),
  ('Emergency Leave', 'إجازة طارئة',     3,  true),
  ('Unpaid Leave',    'إجازة بدون راتب', 30, false),
  ('Marriage Leave',  'إجازة زواج',      3,  true),
  ('Maternity Leave', 'إجازة أمومة',     90, true),
  ('Hajj Leave',      'إجازة حج',        15, true)
ON CONFLICT DO NOTHING;

-- ── 2. leave_requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id    uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id  uuid        NOT NULL REFERENCES public.leave_types(id),
  start_date     date        NOT NULL,
  end_date       date        NOT NULL,
  days_count     numeric(5,2) NOT NULL DEFAULT 0,
  reason         text,
  status         text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected','cancelled')),
  manager_notes  text,
  approved_by    uuid        REFERENCES auth.users(id),
  decided_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS leave_requests_company_status_idx ON public.leave_requests(company_id, status);
CREATE INDEX IF NOT EXISTS leave_requests_employee_idx ON public.leave_requests(employee_id);

-- ── 3. Fix leave_balances ───────────────────────────────────
-- The stub migration created columns: leave_type (text), entitled, used, remaining
-- The app code uses: leave_type_id (uuid FK), total_days, used_days, pending_days
ALTER TABLE public.leave_balances
  ADD COLUMN IF NOT EXISTS leave_type_id  uuid  REFERENCES public.leave_types(id),
  ADD COLUMN IF NOT EXISTS total_days     numeric(5,2) NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS used_days      numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_days   numeric(5,2) NOT NULL DEFAULT 0;

-- ── 4. Fix onboarding_tasks ─────────────────────────────────
-- Stub has: task_name, description, status, assigned_to
-- App code uses: task_title, task_description, category, order_index, is_required, completed_at, completed_by
ALTER TABLE public.onboarding_tasks
  ADD COLUMN IF NOT EXISTS task_title        text,
  ADD COLUMN IF NOT EXISTS task_description  text,
  ADD COLUMN IF NOT EXISTS category          text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS order_index       integer NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS is_required       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by      uuid REFERENCES auth.users(id);

-- ── 5. Fix performance_reviews ──────────────────────────────
-- Add all columns the application expects
ALTER TABLE public.performance_reviews
  ADD COLUMN IF NOT EXISTS review_cycle        text DEFAULT 'annual'
                                                CHECK (review_cycle IN ('annual','quarterly','probation')),
  ADD COLUMN IF NOT EXISTS period_label        text,
  ADD COLUMN IF NOT EXISTS period_start        date,
  ADD COLUMN IF NOT EXISTS period_end          date,
  ADD COLUMN IF NOT EXISTS self_score_sales    numeric(3,1),
  ADD COLUMN IF NOT EXISTS self_score_teamwork numeric(3,1),
  ADD COLUMN IF NOT EXISTS self_score_attendance numeric(3,1),
  ADD COLUMN IF NOT EXISTS self_score_initiative numeric(3,1),
  ADD COLUMN IF NOT EXISTS self_score_knowledge  numeric(3,1),
  ADD COLUMN IF NOT EXISTS self_notes          text,
  ADD COLUMN IF NOT EXISTS mgr_score_sales     numeric(3,1),
  ADD COLUMN IF NOT EXISTS mgr_score_teamwork  numeric(3,1),
  ADD COLUMN IF NOT EXISTS mgr_score_attendance numeric(3,1),
  ADD COLUMN IF NOT EXISTS mgr_score_initiative numeric(3,1),
  ADD COLUMN IF NOT EXISTS mgr_score_knowledge  numeric(3,1),
  ADD COLUMN IF NOT EXISTS mgr_notes           text,
  ADD COLUMN IF NOT EXISTS final_score         numeric(3,1),
  ADD COLUMN IF NOT EXISTS rating_label        text,
  ADD COLUMN IF NOT EXISTS promotion_flag      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS salary_increase_pct numeric(5,2);

-- ── 6. performance_goals ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.performance_goals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  review_id    uuid        REFERENCES public.performance_reviews(id) ON DELETE SET NULL,
  title        text        NOT NULL,
  target_value numeric(12,2),
  actual_value numeric(12,2),
  unit         text,
  weight_pct   numeric(5,2) NOT NULL DEFAULT 20,
  status       text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','achieved','missed','cancelled')),
  due_date     date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS performance_goals_employee_idx ON public.performance_goals(employee_id);

-- ── 7. employee_documents ───────────────────────────────────
-- The documents/actions.ts uses employee_documents (not hr_documents)
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  doc_type        text        NOT NULL DEFAULT 'other',
  title           text        NOT NULL,
  file_path       text,
  file_name       text,
  file_size_bytes integer,
  mime_type       text,
  notes           text,
  expiry_date     date,
  verified        boolean     NOT NULL DEFAULT false,
  verified_by     uuid        REFERENCES auth.users(id),
  verified_at     timestamptz,
  uploaded_by     uuid        REFERENCES auth.users(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS employee_documents_employee_idx ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS employee_documents_company_idx  ON public.employee_documents(company_id);

-- ── 8. hr_notifications ─────────────────────────────────────
-- Used by sendHRNotification() in lib/hr-notifications.ts
CREATE TABLE IF NOT EXISTS public.hr_notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id     uuid        REFERENCES auth.users(id),
  type         text        NOT NULL DEFAULT 'general',
  title        text        NOT NULL,
  body         text,
  link         text,
  is_read      boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS hr_notifications_recipient_idx ON public.hr_notifications(recipient_id, is_read);
