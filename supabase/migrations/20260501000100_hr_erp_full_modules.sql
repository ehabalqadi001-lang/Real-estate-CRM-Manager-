-- ============================================================
-- HR & ERP Full Module Tables
-- Covers: Leave, Onboarding, Performance, Documents,
--         Notifications, Talent, Academy, HRBP, Finance
-- ============================================================

-- Leave types (per company)
CREATE TABLE IF NOT EXISTS leave_types (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL,
  name              text NOT NULL,
  name_ar           text,
  days_per_year     integer NOT NULL DEFAULT 21,
  is_paid           boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT true,
  carry_over_days   integer NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL,
  employee_id   uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  days_count    numeric NOT NULL DEFAULT 0,
  reason        text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by   uuid,
  decided_at    timestamptz,
  manager_notes text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);

-- Leave balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL,
  employee_id    uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id  uuid NOT NULL REFERENCES leave_types(id),
  year           integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  total_days     numeric NOT NULL DEFAULT 21,
  used_days      numeric NOT NULL DEFAULT 0,
  pending_days   numeric NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year)
);

-- Onboarding tasks
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL,
  employee_id      uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_title       text NOT NULL,
  task_description text,
  category         text NOT NULL DEFAULT 'general',
  order_index      integer NOT NULL DEFAULT 0,
  is_required      boolean NOT NULL DEFAULT true,
  due_date         date,
  completed_at     timestamptz,
  completed_by     uuid,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_employee ON onboarding_tasks(employee_id);

-- Performance reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL,
  employee_id         uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id         uuid NOT NULL,
  review_cycle        text NOT NULL DEFAULT 'annual',
  period_label        text NOT NULL,
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  status              text NOT NULL DEFAULT 'draft',
  self_score_sales        numeric CHECK (self_score_sales BETWEEN 1 AND 5),
  self_score_teamwork     numeric CHECK (self_score_teamwork BETWEEN 1 AND 5),
  self_score_attendance   numeric CHECK (self_score_attendance BETWEEN 1 AND 5),
  self_score_initiative   numeric CHECK (self_score_initiative BETWEEN 1 AND 5),
  self_score_knowledge    numeric CHECK (self_score_knowledge BETWEEN 1 AND 5),
  self_notes          text,
  mgr_score_sales         numeric CHECK (mgr_score_sales BETWEEN 1 AND 5),
  mgr_score_teamwork      numeric CHECK (mgr_score_teamwork BETWEEN 1 AND 5),
  mgr_score_attendance    numeric CHECK (mgr_score_attendance BETWEEN 1 AND 5),
  mgr_score_initiative    numeric CHECK (mgr_score_initiative BETWEEN 1 AND 5),
  mgr_score_knowledge     numeric CHECK (mgr_score_knowledge BETWEEN 1 AND 5),
  mgr_notes           text,
  final_score         numeric,
  rating_label        text,
  promotion_flag      boolean NOT NULL DEFAULT false,
  salary_increase_pct numeric,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_employee ON performance_reviews(employee_id);

-- Performance goals
CREATE TABLE IF NOT EXISTS performance_goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL,
  employee_id   uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_id     uuid REFERENCES performance_reviews(id) ON DELETE SET NULL,
  title         text NOT NULL,
  target_value  numeric,
  actual_value  numeric,
  weight_pct    numeric NOT NULL DEFAULT 20,
  status        text NOT NULL DEFAULT 'in_progress',
  due_date      date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Employee documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  doc_type        text NOT NULL,
  title           text NOT NULL,
  file_path       text,
  file_name       text,
  file_size_bytes bigint,
  mime_type       text,
  notes           text,
  expiry_date     date,
  uploaded_by     uuid,
  verified        boolean NOT NULL DEFAULT false,
  verified_by     uuid,
  verified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_docs_employee ON employee_documents(employee_id);

-- HR notifications
CREATE TABLE IF NOT EXISTS hr_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid,
  recipient_id uuid NOT NULL,
  actor_id     uuid,
  type         text NOT NULL,
  title        text NOT NULL,
  body         text,
  link         text,
  is_read      boolean NOT NULL DEFAULT false,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hr_notif_recipient ON hr_notifications(recipient_id);

-- Talent candidates
CREATE TABLE IF NOT EXISTS talent_candidates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid,
  full_name         text NOT NULL,
  phone             text,
  email             text,
  applied_role      text NOT NULL,
  current_company   text,
  experience_years  numeric DEFAULT 0,
  expected_salary   numeric,
  source_channel    text NOT NULL DEFAULT 'manual',
  pipeline_stage    text NOT NULL DEFAULT 'new',
  status            text NOT NULL DEFAULT 'active',
  notes             text,
  stage_updated_at  timestamptz,
  stage_updated_by  uuid,
  added_by          uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Offer letters
CREATE TABLE IF NOT EXISTS offer_letters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid,
  candidate_id     uuid REFERENCES talent_candidates(id) ON DELETE SET NULL,
  candidate_name   text NOT NULL,
  applied_role     text NOT NULL,
  offer_ref        text NOT NULL,
  offered_salary   numeric,
  offer_date       date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date      date,
  status           text NOT NULL DEFAULT 'draft',
  notes            text,
  generated_by     uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Learning courses
CREATE TABLE IF NOT EXISTS learning_courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid,
  title         text NOT NULL,
  description   text,
  target_role   text,
  category      text NOT NULL DEFAULT 'sales_skills',
  duration_hours numeric NOT NULL DEFAULT 1,
  content_url   text,
  is_mandatory  boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid,
  course_id    uuid NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'enrolled',
  score        numeric,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (course_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee ON course_enrollments(employee_id);

-- Skill assessments
CREATE TABLE IF NOT EXISTS skill_assessments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid,
  employee_id    uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_name     text NOT NULL,
  current_level  numeric NOT NULL DEFAULT 0,
  target_level   numeric NOT NULL DEFAULT 10,
  gap            numeric GENERATED ALWAYS AS (GREATEST(target_level - current_level, 0)) STORED,
  category       text NOT NULL DEFAULT 'sales',
  assessed_by    uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Burnout indicators
CREATE TABLE IF NOT EXISTS burnout_indicators (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid,
  employee_id         uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_month        smallint NOT NULL,
  period_year         smallint NOT NULL,
  workload_score      numeric NOT NULL DEFAULT 5,
  overtime_hours      numeric NOT NULL DEFAULT 0,
  absence_days        smallint NOT NULL DEFAULT 0,
  late_check_ins      smallint NOT NULL DEFAULT 0,
  missed_targets_pct  numeric NOT NULL DEFAULT 0,
  burnout_score       numeric NOT NULL DEFAULT 0,
  risk_level          text NOT NULL DEFAULT 'low',
  hr_notes            text,
  recorded_by         uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Employee pulse surveys
CREATE TABLE IF NOT EXISTS employee_pulse (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid,
  employee_id       uuid REFERENCES employees(id) ON DELETE SET NULL,
  engagement_score  numeric NOT NULL DEFAULT 3,
  satisfaction_score numeric NOT NULL DEFAULT 3,
  nps_score         numeric NOT NULL DEFAULT 5,
  comments          text,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

-- ERP Finance: cost centers & budgets
CREATE TABLE IF NOT EXISTS cost_centers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL,
  code        text NOT NULL,
  name_ar     text NOT NULL,
  name        text,
  parent_id   uuid REFERENCES cost_centers(id),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  cost_center_id  uuid REFERENCES cost_centers(id),
  fiscal_year     integer NOT NULL,
  period_month    smallint,
  category        text NOT NULL DEFAULT 'opex',
  description     text NOT NULL,
  budgeted_amount numeric(18,2) NOT NULL DEFAULT 0,
  actual_amount   numeric(18,2) NOT NULL DEFAULT 0,
  variance        numeric(18,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
  status          text NOT NULL DEFAULT 'active',
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE leave_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_candidates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE burnout_indicators    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_pulse        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets               ENABLE ROW LEVEL SECURITY;
