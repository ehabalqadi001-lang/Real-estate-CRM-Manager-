-- Applied via Supabase MCP.
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id     uuid REFERENCES auth.users(id),
  review_period   text,
  review_year     integer,
  review_quarter  integer,
  overall_score   numeric(4,1),
  goals_score     numeric(4,1),
  behavior_score  numeric(4,1),
  skills_score    numeric(4,1),
  comments        text,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','acknowledged')),
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.hr_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  doc_type     text NOT NULL,
  doc_name     text NOT NULL,
  doc_url      text,
  expiry_date  date,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending')),
  verified_by  uuid REFERENCES auth.users(id),
  verified_at  timestamptz,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;
