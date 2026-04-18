-- ═══════════════════════════════════════════════════════════════════════════════
-- FAST INVESTMENT ERP
-- Migration: 20260418210000_enterprise_saas_erp
-- Author: Principal Architect
--
-- ARCHITECTURAL OVERVIEW
-- ─────────────────────────────────────────────────────────────────────────────
-- Tenant isolation key: company_id (already exists on ~60% of tables).
-- Strategy: formalize the pattern — upgrade the companies table into a
-- full tenant registry, add company_id to the 12 tables that are missing it,
-- and create all new ERP modules with company_id from the start.
--
-- RLS ISOLATION MODEL (three-tier)
--   Tier 1 – Platform (service_role)  → bypasses ALL RLS (implicit Supabase)
--   Tier 2 – Super Admin              → reads ALL tenants; never writes cross-tenant
--   Tier 3 – Tenant User              → scoped strictly to auth_company_id()
--
-- auth_company_id() reads profiles.company_id via SECURITY DEFINER so it
-- bypasses any RLS on the profiles table itself, preventing recursion.
-- The function result is STABLE-cached per transaction for performance.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 0 ── HELPER FUNCTIONS
-- Must be created before any RLS policy references them.
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns the company_id of the currently authenticated user.
-- SECURITY DEFINER: runs as the function owner (postgres) so the SELECT on
-- profiles bypasses RLS, avoiding circular dependency.
CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM   public.profiles
  WHERE  id = auth.uid()
  LIMIT  1
$$;

-- Returns true if the current user has the super_admin platform role.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.profiles
    WHERE  id   = auth.uid()
    AND    role = 'super_admin'
  )
$$;

-- Convenience: true when the caller is service_role OR super_admin.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_super_admin()
      OR (auth.jwt() ->> 'role') = 'service_role'
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 ── TENANT REGISTRY UPGRADE (companies → tenants)
-- The companies table IS the tenant registry. We upgrade it in place.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS slug             text UNIQUE,
  ADD COLUMN IF NOT EXISTS owner_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logo_url         text,
  ADD COLUMN IF NOT EXISTS website          text,
  ADD COLUMN IF NOT EXISTS country          text NOT NULL DEFAULT 'EG',
  ADD COLUMN IF NOT EXISTS timezone         text NOT NULL DEFAULT 'Africa/Cairo',
  ADD COLUMN IF NOT EXISTS locale           text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS plan_tier        text NOT NULL DEFAULT 'trial'
                                             CHECK (plan_tier IN ('trial','basic','pro','enterprise')),
  ADD COLUMN IF NOT EXISTS max_users        integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_listings     integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS feature_flags    jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_suspended     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at     timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS trial_ends_at    timestamptz DEFAULT (now() + interval '14 days'),
  ADD COLUMN IF NOT EXISTS onboarded_at     timestamptz,
  ADD COLUMN IF NOT EXISTS metadata         jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

-- Ensure RLS is on the companies table so tenants can only read their own row.
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_tenant_select"  ON companies;
DROP POLICY IF EXISTS "companies_platform_all"   ON companies;

CREATE POLICY "companies_tenant_select" ON companies
  FOR SELECT USING (
    id = auth_company_id() OR is_platform_admin()
  );

CREATE POLICY "companies_platform_all" ON companies
  FOR ALL USING ( is_platform_admin() )
  WITH CHECK ( is_platform_admin() );


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 ── SUBSCRIPTION & BILLING ENGINE
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 Plan Catalog (platform-level, no company_id)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        NOT NULL UNIQUE,
  description      text,
  price_monthly    numeric(10,2) NOT NULL DEFAULT 0,
  price_annual     numeric(10,2) NOT NULL DEFAULT 0,
  currency         text        NOT NULL DEFAULT 'EGP',
  max_users        integer     NOT NULL DEFAULT 5,
  max_listings     integer     NOT NULL DEFAULT 50,
  max_storage_gb   integer     NOT NULL DEFAULT 5,
  feature_flags    jsonb       NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  sort_order       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed standard tiers
INSERT INTO subscription_plans (name, slug, price_monthly, price_annual, max_users, max_listings, max_storage_gb, feature_flags, sort_order)
VALUES
  ('تجريبي',    'trial',      0,       0,       3,   20,   2,  '{"hr":false,"gl":false,"legal":false,"whatsapp":false}', 0),
  ('أساسي',     'basic',      1499,    14990,   10,  100,  10, '{"hr":false,"gl":false,"legal":true,"whatsapp":false}',  1),
  ('محترف',     'pro',        2999,    29990,   30,  500,  50, '{"hr":true,"gl":false,"legal":true,"whatsapp":true}',    2),
  ('مؤسسي',    'enterprise',  5999,    59990,   -1,  -1,   -1, '{"hr":true,"gl":true,"legal":true,"whatsapp":true,"api":true}', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2.2 Active Subscription per Tenant
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid        NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan_id                 uuid        NOT NULL REFERENCES subscription_plans(id),
  status                  text        NOT NULL DEFAULT 'trial'
                                       CHECK (status IN ('trial','active','past_due','suspended','cancelled')),
  billing_cycle           text        NOT NULL DEFAULT 'monthly'
                                       CHECK (billing_cycle IN ('monthly','annual')),
  amount                  numeric(10,2) NOT NULL DEFAULT 0,
  currency                text        NOT NULL DEFAULT 'EGP',
  trial_ends_at           timestamptz,
  current_period_start    timestamptz NOT NULL DEFAULT now(),
  current_period_end      timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  next_billing_date       date,
  grace_period_ends_at    timestamptz,
  payment_provider        text        DEFAULT 'manual',   -- paymob | manual
  provider_customer_id    text,
  provider_subscription_id text,
  payment_method_last4    text,
  payment_method_type     text,
  cancelled_at            timestamptz,
  cancel_reason           text,
  cancel_at_period_end    boolean     NOT NULL DEFAULT false,
  metadata                jsonb       NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- 2.3 Invoice History
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id  uuid        NOT NULL REFERENCES tenant_subscriptions(id),
  invoice_number   text        NOT NULL,
  period_start     date        NOT NULL,
  period_end       date        NOT NULL,
  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount       numeric(10,2) NOT NULL DEFAULT 0,
  total_amount     numeric(10,2) NOT NULL DEFAULT 0,
  currency         text        NOT NULL DEFAULT 'EGP',
  status           text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('draft','pending','paid','void','overdue','uncollectible')),
  due_date         date,
  paid_at          timestamptz,
  payment_method   text,
  payment_reference text,
  pdf_url          text,
  attempt_count    integer     NOT NULL DEFAULT 0,
  last_attempt_at  timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, invoice_number)
);

-- 2.4 Billing Event Log (webhooks, status changes)
CREATE TABLE IF NOT EXISTS billing_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        REFERENCES companies(id) ON DELETE SET NULL,
  subscription_id uuid        REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  event_type      text        NOT NULL, -- subscription.created, payment.succeeded, payment.failed …
  payload         jsonb       NOT NULL DEFAULT '{}',
  provider        text,
  provider_event_id text,
  is_processed    boolean     NOT NULL DEFAULT false,
  processed_at    timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events           ENABLE ROW LEVEL SECURITY;

-- Plans are public-readable (marketing pages need them)
DROP POLICY IF EXISTS "plans_public_read"   ON subscription_plans;
DROP POLICY IF EXISTS "plans_platform_all"  ON subscription_plans;
CREATE POLICY "plans_public_read"  ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "plans_platform_all" ON subscription_plans FOR ALL   USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Subscriptions: tenant reads own; platform manages all
DROP POLICY IF EXISTS "sub_tenant_read"    ON tenant_subscriptions;
DROP POLICY IF EXISTS "sub_platform_all"   ON tenant_subscriptions;
CREATE POLICY "sub_tenant_read"  ON tenant_subscriptions FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "sub_platform_all" ON tenant_subscriptions FOR ALL   USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Invoices: tenant reads own
DROP POLICY IF EXISTS "inv_tenant_read"    ON subscription_invoices;
DROP POLICY IF EXISTS "inv_platform_all"   ON subscription_invoices;
CREATE POLICY "inv_tenant_read"  ON subscription_invoices FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "inv_platform_all" ON subscription_invoices FOR ALL   USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- Billing events: platform only
DROP POLICY IF EXISTS "billing_events_platform" ON billing_events;
CREATE POLICY "billing_events_platform" ON billing_events FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 ── PATCH EXISTING TABLES (add missing company_id)
-- All columns are nullable for safe migration of existing rows.
-- A follow-up data migration should populate them before making NOT NULL.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE activities            ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE clients               ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE buildings             ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE broker_deals          ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE chat_messages         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE client_meetings       ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE contract_status_log   ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE deal_activities       ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE deal_stage_log        ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE installments          ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE lead_activities       ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE lead_reports          ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE notifications         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE payout_items          ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE units                 ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE user_permission_overrides ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE whatsapp_logs         ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);
ALTER TABLE whatsapp_ai_logs      ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 ── HR & PAYROLL MODULE
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1 Employee Registry (HR extension of profiles)
-- One row per employee. id = profiles.id.
CREATE TABLE IF NOT EXISTS employees (
  id                      uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_id              uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_number         text        NOT NULL,
  department_id           uuid        REFERENCES departments(id),
  job_title               text,
  employment_type         text        NOT NULL DEFAULT 'full_time'
                                       CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  hire_date               date        NOT NULL,
  probation_end_date      date,
  termination_date        date,
  termination_reason      text,
  base_salary             numeric(12,2) NOT NULL DEFAULT 0,
  salary_currency         text        NOT NULL DEFAULT 'EGP',
  pay_cycle               text        NOT NULL DEFAULT 'monthly'
                                       CHECK (pay_cycle IN ('monthly','biweekly','weekly')),
  bank_name               text,
  bank_account_name       text,
  bank_account_number     text,
  bank_iban               text,
  tax_id                  text,
  social_insurance_no     text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  annual_leave_balance    numeric(5,2) NOT NULL DEFAULT 0,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_number)
);

-- 4.2 Daily Attendance
CREATE TABLE IF NOT EXISTS attendance_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  log_date        date        NOT NULL,
  check_in        timestamptz,
  check_out       timestamptz,
  break_minutes   integer     NOT NULL DEFAULT 0,
  -- work_hours is computed by the app layer (check_out - check_in - break_minutes)
  status          text        NOT NULL DEFAULT 'present'
                               CHECK (status IN ('present','absent','late','half_day','holiday','remote','leave')),
  notes           text,
  recorded_by     uuid        REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, log_date)
);

-- 4.3 Leave Types (company-configurable)
CREATE TABLE IF NOT EXISTS leave_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  name_ar          text,
  days_per_year    integer     NOT NULL DEFAULT 21,
  is_paid          boolean     NOT NULL DEFAULT true,
  requires_approval boolean   NOT NULL DEFAULT true,
  carry_over_days  integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 4.4 Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id   uuid        NOT NULL REFERENCES leave_types(id),
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  days_count      numeric(4,1) NOT NULL,
  reason          text,
  status          text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by     uuid        REFERENCES profiles(id),
  decided_at      timestamptz,
  manager_notes   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- 4.5 KPI Templates (define what to measure per role)
CREATE TABLE IF NOT EXISTS kpi_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  name_ar         text,
  description     text,
  applies_to_role text,        -- e.g. 'users_am', 'ads_am', or NULL = all
  metric_type     text        NOT NULL DEFAULT 'currency'
                               CHECK (metric_type IN ('count','currency','percentage','rating','custom')),
  weight_pct      numeric(5,2) NOT NULL DEFAULT 100
                               CHECK (weight_pct BETWEEN 0 AND 100),
  target_formula  text        NOT NULL DEFAULT 'fixed'
                               CHECK (target_formula IN ('fixed','tiered','rolling_avg')),
  is_active       boolean     NOT NULL DEFAULT true,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4.6 KPI Records (actual measurements per period)
CREATE TABLE IF NOT EXISTS kpi_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     uuid          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id     uuid          NOT NULL REFERENCES kpi_templates(id),
  period_month    integer       NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year     integer       NOT NULL CHECK (period_year >= 2020),
  target_value    numeric(15,2) NOT NULL DEFAULT 0,
  actual_value    numeric(15,2) NOT NULL DEFAULT 0,
  -- achievement_pct computed: CASE WHEN target_value > 0 THEN actual_value/target_value*100 ELSE 0
  notes           text,
  recorded_by     uuid          REFERENCES profiles(id),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, template_id, period_month, period_year)
);

-- 4.7 Commission Tier Structures (tiered targets)
-- Example: 0–5M → 2%, 5M–10M → 3%, 10M+ → 4% + 5000 flat bonus
CREATE TABLE IF NOT EXISTS commission_tiers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  applies_to_role text,
  from_amount     numeric(15,2) NOT NULL DEFAULT 0,
  to_amount       numeric(15,2),           -- NULL = no upper bound
  commission_pct  numeric(6,3)  NOT NULL DEFAULT 0,
  bonus_flat      numeric(10,2) NOT NULL DEFAULT 0,
  period_type     text          NOT NULL DEFAULT 'monthly'
                                 CHECK (period_type IN ('monthly','quarterly','annual','per_deal')),
  is_active       boolean       NOT NULL DEFAULT true,
  sort_order      integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT chk_tier_range CHECK (to_amount IS NULL OR to_amount > from_amount)
);

-- 4.8 Payroll Runs (monthly batch processing)
CREATE TABLE IF NOT EXISTS payroll_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_number      text          NOT NULL,
  period_month    integer       NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year     integer       NOT NULL CHECK (period_year >= 2020),
  run_date        date          NOT NULL DEFAULT CURRENT_DATE,
  status          text          NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft','processing','approved','paid','cancelled')),
  total_gross     numeric(15,2) NOT NULL DEFAULT 0,
  total_deductions numeric(15,2) NOT NULL DEFAULT 0,
  total_net       numeric(15,2) NOT NULL DEFAULT 0,
  total_tax       numeric(15,2) NOT NULL DEFAULT 0,
  employee_count  integer       NOT NULL DEFAULT 0,
  notes           text,
  created_by      uuid          NOT NULL REFERENCES profiles(id),
  approved_by     uuid          REFERENCES profiles(id),
  approved_at     timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, run_number)
);

-- 4.9 Payroll Line Items (per employee per run)
CREATE TABLE IF NOT EXISTS payroll_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_id              uuid          NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id         uuid          NOT NULL REFERENCES employees(id),
  base_salary         numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount   numeric(12,2) NOT NULL DEFAULT 0,
  bonus_amount        numeric(12,2) NOT NULL DEFAULT 0,
  overtime_amount     numeric(12,2) NOT NULL DEFAULT 0,
  allowances          numeric(12,2) NOT NULL DEFAULT 0,
  deduction_tax       numeric(12,2) NOT NULL DEFAULT 0,
  deduction_insurance numeric(12,2) NOT NULL DEFAULT 0,
  deduction_advances  numeric(12,2) NOT NULL DEFAULT 0,
  deduction_other     numeric(12,2) NOT NULL DEFAULT 0,
  gross_salary        numeric(12,2) GENERATED ALWAYS AS
                        (base_salary + commission_amount + bonus_amount + overtime_amount + allowances) STORED,
  net_salary          numeric(12,2) GENERATED ALWAYS AS
                        (base_salary + commission_amount + bonus_amount + overtime_amount + allowances
                         - deduction_tax - deduction_insurance - deduction_advances - deduction_other) STORED,
  attendance_days     integer       NOT NULL DEFAULT 0,
  absent_days         integer       NOT NULL DEFAULT 0,
  overtime_hours      numeric(6,2)  NOT NULL DEFAULT 0,
  notes               text,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (run_id, employee_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 ── LEGAL & CONTRACTS MODULE
-- Builds on the existing contracts table; adds templates, e-signature,
-- EOIs, and formal payment receipts.
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 Contract Templates (reusable, variable-driven HTML/Markdown)
CREATE TABLE IF NOT EXISTS contract_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        REFERENCES companies(id) ON DELETE CASCADE,
  -- NULL company_id = global platform template available to all tenants
  name            text        NOT NULL,
  name_ar         text,
  contract_type   text        NOT NULL DEFAULT 'sales'
                               CHECK (contract_type IN ('sales','eoi','receipt','nda','rental','addendum','agency')),
  language        text        NOT NULL DEFAULT 'ar'
                               CHECK (language IN ('ar','en','ar_en')),
  body_html       text        NOT NULL DEFAULT '',
  -- {{client_name}}, {{unit_number}}, {{total_price}} … placeholder list
  variables       jsonb       NOT NULL DEFAULT '[]',
  version         integer     NOT NULL DEFAULT 1,
  is_active       boolean     NOT NULL DEFAULT true,
  is_global       boolean     NOT NULL DEFAULT false,
  created_by      uuid        REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 5.2 Generated Legal Documents (instances of templates)
CREATE TABLE IF NOT EXISTS legal_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id         uuid        REFERENCES contract_templates(id),
  document_type       text        NOT NULL
                                   CHECK (document_type IN ('contract','eoi','receipt','addendum','nda','other')),
  document_number     text        NOT NULL,
  deal_id             uuid        REFERENCES deals(id),
  unit_id             uuid        REFERENCES units(id),
  client_id           uuid        REFERENCES clients(id),
  client_name         text,
  title               text        NOT NULL,
  status              text        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft','pending_signature','partially_signed','signed','cancelled','expired')),
  generated_html      text,
  pdf_url             text,
  signed_pdf_url      text,
  -- snapshot of variable values at generation time (immutable record)
  variables_snapshot  jsonb       NOT NULL DEFAULT '{}',
  valid_until         date,
  signed_at           timestamptz,
  cancelled_at        timestamptz,
  cancel_reason       text,
  notes               text,
  generated_by        uuid        NOT NULL REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document_number)
);

-- 5.3 Document Signatories (ordered e-signature workflow)
CREATE TABLE IF NOT EXISTS document_signatories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id      uuid        NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  signer_type      text        NOT NULL CHECK (signer_type IN ('client','agent','manager','witness','legal')),
  signer_name      text        NOT NULL,
  signer_email     text,
  signer_phone     text,
  order_number     integer     NOT NULL DEFAULT 1,
  status           text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','sent','viewed','signed','declined')),
  sent_at          timestamptz,
  viewed_at        timestamptz,
  signed_at        timestamptz,
  declined_at      timestamptz,
  decline_reason   text,
  ip_address       inet,
  user_agent       text,
  signature_image_url text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 5.4 Expression of Interest Records
CREATE TABLE IF NOT EXISTS eoi_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  eoi_number            text          NOT NULL,
  client_id             uuid          REFERENCES clients(id),
  unit_id               uuid          REFERENCES units(id),
  lead_id               uuid          REFERENCES leads(id),
  agent_id              uuid          REFERENCES profiles(id),
  eoi_date              date          NOT NULL DEFAULT CURRENT_DATE,
  eoi_amount            numeric(12,2) NOT NULL DEFAULT 0,
  currency              text          NOT NULL DEFAULT 'EGP',
  payment_method        text,
  bank_reference        text,
  receipt_url           text,
  status                text          NOT NULL DEFAULT 'active'
                                       CHECK (status IN ('active','converted','refunded','cancelled','expired')),
  notes                 text,
  expires_at            timestamptz,
  converted_to_deal_id  uuid          REFERENCES deals(id),
  converted_at          timestamptz,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, eoi_number)
);

-- 5.5 Payment Receipts (formal, printable/PDF receipt per payment)
CREATE TABLE IF NOT EXISTS payment_receipts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  receipt_number   text          NOT NULL,
  receipt_type     text          NOT NULL DEFAULT 'installment'
                                  CHECK (receipt_type IN ('eoi','installment','commission','maintenance','other')),
  source_type      text,          -- 'installment_plan' | 'eoi_record' | 'manual'
  source_id        uuid,
  client_name      text          NOT NULL,
  client_phone     text,
  client_national_id text,
  amount           numeric(12,2) NOT NULL,
  currency         text          NOT NULL DEFAULT 'EGP',
  payment_date     date          NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text,
  bank_reference   text,
  issued_by        uuid          NOT NULL REFERENCES profiles(id),
  pdf_url          text,
  notes            text,
  is_void          boolean       NOT NULL DEFAULT false,
  voided_by        uuid          REFERENCES profiles(id),
  voided_at        timestamptz,
  void_reason      text,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, receipt_number)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 ── ADVANCED FINANCE / GENERAL LEDGER
-- Double-entry bookkeeping: every financial event posts a journal entry
-- with balancing debit/credit lines. AR and AP are structured facades on top.
-- ─────────────────────────────────────────────────────────────────────────────

-- 6.1 Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            text        NOT NULL,     -- e.g. "يناير 2026"
  period_start    date        NOT NULL,
  period_end      date        NOT NULL,
  status          text        NOT NULL DEFAULT 'open'
                               CHECK (status IN ('open','closed','locked')),
  closed_by       uuid        REFERENCES profiles(id),
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, period_start),
  CONSTRAINT chk_period_range CHECK (period_end >= period_start)
);

-- 6.2 Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code        text        NOT NULL,     -- e.g. "1100"
  name        text        NOT NULL,
  name_ar     text,
  type        text        NOT NULL
               CHECK (type IN ('asset','liability','equity','revenue','expense')),
  sub_type    text,        -- cash | receivable | payable | fixed_asset | revenue | cogs …
  parent_id   uuid        REFERENCES chart_of_accounts(id),
  is_active   boolean     NOT NULL DEFAULT true,
  is_system   boolean     NOT NULL DEFAULT false,  -- system accounts cannot be deleted
  normal_balance text     NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit','credit')),
  sort_order  integer     NOT NULL DEFAULT 0,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- Seed standard COA for every new company via trigger (see Section 9).
-- Accounts follow Egyptian accounting standards (EAS).

-- 6.3 Journal Entries (GL header)
CREATE TABLE IF NOT EXISTS journal_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_number    text        NOT NULL,
  fiscal_period_id uuid       REFERENCES fiscal_periods(id),
  entry_date      date        NOT NULL DEFAULT CURRENT_DATE,
  description     text        NOT NULL,
  reference       text,        -- deal ID, invoice number, etc.
  source          text        NOT NULL DEFAULT 'manual'
                               CHECK (source IN ('manual','commission','payout','invoice','receipt','payroll','adjustment')),
  source_id       uuid,        -- polymorphic FK to the originating record
  is_posted       boolean     NOT NULL DEFAULT false,
  posted_by       uuid        REFERENCES profiles(id),
  posted_at       timestamptz,
  is_reversed     boolean     NOT NULL DEFAULT false,
  reversal_of_id  uuid        REFERENCES journal_entries(id),
  created_by      uuid        NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, entry_number)
);

-- 6.4 Journal Lines (debit / credit legs — must balance per entry)
CREATE TABLE IF NOT EXISTS journal_lines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_id    uuid          NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id  uuid          NOT NULL REFERENCES chart_of_accounts(id),
  description text,
  debit       numeric(15,2) NOT NULL DEFAULT 0 CHECK (debit  >= 0),
  credit      numeric(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  -- A line must be debit-only or credit-only, not both non-zero.
  CONSTRAINT chk_debit_xor_credit CHECK (NOT (debit > 0 AND credit > 0)),
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Enforce double-entry balance via trigger (Section 9).

-- 6.5 Accounts Receivable – Invoices (money owed TO the company BY developers)
CREATE TABLE IF NOT EXISTS ar_invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number   text          NOT NULL,
  developer_id     uuid          REFERENCES developers(id),
  deal_id          uuid          REFERENCES deals(id),
  description      text          NOT NULL,
  subtotal         numeric(15,2) NOT NULL DEFAULT 0,
  tax_pct          numeric(5,2)  NOT NULL DEFAULT 0,
  tax_amount       numeric(15,2) GENERATED ALWAYS AS (ROUND(subtotal * tax_pct / 100, 2)) STORED,
  total_amount     numeric(15,2) GENERATED ALWAYS AS (subtotal + ROUND(subtotal * tax_pct / 100, 2)) STORED,
  currency         text          NOT NULL DEFAULT 'EGP',
  issue_date       date          NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  status           text          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled','disputed')),
  paid_amount      numeric(15,2) NOT NULL DEFAULT 0,
  journal_entry_id uuid          REFERENCES journal_entries(id),
  notes            text,
  created_by       uuid          NOT NULL REFERENCES profiles(id),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, invoice_number)
);

-- 6.6 AR Payments (receipts against AR invoices)
CREATE TABLE IF NOT EXISTS ar_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id       uuid          NOT NULL REFERENCES ar_invoices(id) ON DELETE CASCADE,
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  payment_date     date          NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text,
  bank_reference   text,
  receipt_url      text,
  journal_entry_id uuid          REFERENCES journal_entries(id),
  recorded_by      uuid          NOT NULL REFERENCES profiles(id),
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- 6.7 Accounts Payable – Bills (money the company OWES to brokers / agents)
CREATE TABLE IF NOT EXISTS ap_bills (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bill_number      text          NOT NULL,
  vendor_type      text          NOT NULL DEFAULT 'agent'
                                  CHECK (vendor_type IN ('agent','broker','supplier','other')),
  vendor_id        uuid,          -- polymorphic: profiles.id or broker_profiles.id
  vendor_name      text          NOT NULL,
  description      text          NOT NULL,
  subtotal         numeric(15,2) NOT NULL DEFAULT 0,
  tax_pct          numeric(5,2)  NOT NULL DEFAULT 0,
  tax_amount       numeric(15,2) GENERATED ALWAYS AS (ROUND(subtotal * tax_pct / 100, 2)) STORED,
  total_amount     numeric(15,2) GENERATED ALWAYS AS (subtotal + ROUND(subtotal * tax_pct / 100, 2)) STORED,
  currency         text          NOT NULL DEFAULT 'EGP',
  bill_date        date          NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  status           text          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','approved','partial','paid','cancelled')),
  paid_amount      numeric(15,2) NOT NULL DEFAULT 0,
  commission_id    uuid          REFERENCES commissions(id),
  journal_entry_id uuid          REFERENCES journal_entries(id),
  notes            text,
  created_by       uuid          NOT NULL REFERENCES profiles(id),
  approved_by      uuid          REFERENCES profiles(id),
  approved_at      timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (company_id, bill_number)
);

-- 6.8 AP Payments (disbursements against AP bills)
CREATE TABLE IF NOT EXISTS ap_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bill_id          uuid          NOT NULL REFERENCES ap_bills(id) ON DELETE CASCADE,
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  payment_date     date          NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text,
  bank_reference   text,
  receipt_url      text,
  journal_entry_id uuid          REFERENCES journal_entries(id),
  paid_by          uuid          NOT NULL REFERENCES profiles(id),
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- 6.9 Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name       text          NOT NULL,
  account_name    text          NOT NULL,
  account_number  text,
  iban            text,
  swift           text,
  currency        text          NOT NULL DEFAULT 'EGP',
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  gl_account_id   uuid          REFERENCES chart_of_accounts(id),
  is_primary      boolean       NOT NULL DEFAULT false,
  is_active       boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- 6.10 Bank Transactions (raw bank feed for reconciliation)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id     uuid          NOT NULL REFERENCES bank_accounts(id),
  transaction_date    date          NOT NULL,
  value_date          date,
  description         text          NOT NULL,
  amount              numeric(15,2) NOT NULL,
  type                text          NOT NULL CHECK (type IN ('credit','debit')),
  reference           text,
  is_reconciled       boolean       NOT NULL DEFAULT false,
  reconciled_at       timestamptz,
  reconciliation_id   uuid,
  journal_entry_id    uuid          REFERENCES journal_entries(id),
  created_at          timestamptz   NOT NULL DEFAULT now()
);

-- 6.11 Reconciliation Runs
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id  uuid          NOT NULL REFERENCES bank_accounts(id),
  period_start     date          NOT NULL,
  period_end       date          NOT NULL,
  opening_balance  numeric(15,2) NOT NULL DEFAULT 0,
  closing_balance  numeric(15,2) NOT NULL DEFAULT 0,
  gl_balance       numeric(15,2) NOT NULL DEFAULT 0,
  difference       numeric(15,2) GENERATED ALWAYS AS (closing_balance - gl_balance) STORED,
  status           text          NOT NULL DEFAULT 'in_progress'
                                  CHECK (status IN ('in_progress','completed','discrepancy')),
  completed_by     uuid          REFERENCES profiles(id),
  completed_at     timestamptz,
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7 ── ROW LEVEL SECURITY (all new tables + patched tables)
--
-- PATTERN: every table gets four named policies — one per DML verb.
-- This is more verbose than a single ALL policy but gives fine-grained
-- control and avoids INSERT not being covered by USING-only policies.
--
-- DROP POLICY IF EXISTS guards against re-running this migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Macro: enable RLS on all new tables ──────────────────────────────────────
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE eoi_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_bills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs    ENABLE ROW LEVEL SECURITY;

-- ── Helper: generate standard four-policy set for a company-scoped table ─────
-- (We write them explicitly per table for clarity in pg_policies.)

-- ─ HR Module ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "employees_select"  ON employees;
DROP POLICY IF EXISTS "employees_insert"  ON employees;
DROP POLICY IF EXISTS "employees_update"  ON employees;
DROP POLICY IF EXISTS "employees_delete"  ON employees;
CREATE POLICY "employees_select" ON employees FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "employees_insert" ON employees FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY "employees_update" ON employees FOR UPDATE USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());
CREATE POLICY "employees_delete" ON employees FOR DELETE USING (company_id = auth_company_id() AND is_platform_admin() = false OR is_platform_admin());

DROP POLICY IF EXISTS "attendance_select" ON attendance_logs;
DROP POLICY IF EXISTS "attendance_insert" ON attendance_logs;
DROP POLICY IF EXISTS "attendance_update" ON attendance_logs;
CREATE POLICY "attendance_select" ON attendance_logs FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "attendance_insert" ON attendance_logs FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY "attendance_update" ON attendance_logs FOR UPDATE USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "leave_types_select" ON leave_types;
DROP POLICY IF EXISTS "leave_types_write"  ON leave_types;
CREATE POLICY "leave_types_select" ON leave_types FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "leave_types_write"  ON leave_types FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "leave_req_select"  ON leave_requests;
DROP POLICY IF EXISTS "leave_req_insert"  ON leave_requests;
DROP POLICY IF EXISTS "leave_req_update"  ON leave_requests;
CREATE POLICY "leave_req_select" ON leave_requests FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "leave_req_insert" ON leave_requests FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY "leave_req_update" ON leave_requests FOR UPDATE USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "kpi_tmpl_select"  ON kpi_templates;
DROP POLICY IF EXISTS "kpi_tmpl_write"   ON kpi_templates;
CREATE POLICY "kpi_tmpl_select" ON kpi_templates FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "kpi_tmpl_write"  ON kpi_templates FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "kpi_rec_select"  ON kpi_records;
DROP POLICY IF EXISTS "kpi_rec_write"   ON kpi_records;
CREATE POLICY "kpi_rec_select" ON kpi_records FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "kpi_rec_write"  ON kpi_records FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "comm_tiers_select" ON commission_tiers;
DROP POLICY IF EXISTS "comm_tiers_write"  ON commission_tiers;
CREATE POLICY "comm_tiers_select" ON commission_tiers FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "comm_tiers_write"  ON commission_tiers FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "payroll_runs_select" ON payroll_runs;
DROP POLICY IF EXISTS "payroll_runs_write"  ON payroll_runs;
CREATE POLICY "payroll_runs_select" ON payroll_runs FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "payroll_runs_write"  ON payroll_runs FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "payroll_items_select" ON payroll_items;
DROP POLICY IF EXISTS "payroll_items_write"  ON payroll_items;
CREATE POLICY "payroll_items_select" ON payroll_items FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "payroll_items_write"  ON payroll_items FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

-- ─ Legal Module ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "contract_tmpl_select" ON contract_templates;
DROP POLICY IF EXISTS "contract_tmpl_write"  ON contract_templates;
-- Global templates (company_id IS NULL) are readable by all authenticated users
CREATE POLICY "contract_tmpl_select" ON contract_templates
  FOR SELECT USING (company_id IS NULL OR company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "contract_tmpl_write"  ON contract_templates
  FOR ALL USING (company_id = auth_company_id() OR is_platform_admin())
  WITH CHECK (company_id = auth_company_id() OR is_platform_admin());

DROP POLICY IF EXISTS "legal_docs_select" ON legal_documents;
DROP POLICY IF EXISTS "legal_docs_write"  ON legal_documents;
CREATE POLICY "legal_docs_select" ON legal_documents FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "legal_docs_write"  ON legal_documents FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "signatories_select" ON document_signatories;
DROP POLICY IF EXISTS "signatories_write"  ON document_signatories;
CREATE POLICY "signatories_select" ON document_signatories FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "signatories_write"  ON document_signatories FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "eoi_select" ON eoi_records;
DROP POLICY IF EXISTS "eoi_write"  ON eoi_records;
CREATE POLICY "eoi_select" ON eoi_records FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "eoi_write"  ON eoi_records FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "receipts_select" ON payment_receipts;
DROP POLICY IF EXISTS "receipts_write"  ON payment_receipts;
CREATE POLICY "receipts_select" ON payment_receipts FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "receipts_write"  ON payment_receipts FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

-- ─ Finance / GL Module ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "fiscal_periods_select" ON fiscal_periods;
DROP POLICY IF EXISTS "fiscal_periods_write"  ON fiscal_periods;
CREATE POLICY "fiscal_periods_select" ON fiscal_periods FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "fiscal_periods_write"  ON fiscal_periods FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "coa_select" ON chart_of_accounts;
DROP POLICY IF EXISTS "coa_write"  ON chart_of_accounts;
CREATE POLICY "coa_select" ON chart_of_accounts FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "coa_write"  ON chart_of_accounts FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

-- Journal entries: locked periods cannot be posted to (enforced by app layer
-- and can be hardened with a trigger if desired).
DROP POLICY IF EXISTS "je_select" ON journal_entries;
DROP POLICY IF EXISTS "je_write"  ON journal_entries;
CREATE POLICY "je_select" ON journal_entries FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "je_write"  ON journal_entries FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "jl_select" ON journal_lines;
DROP POLICY IF EXISTS "jl_write"  ON journal_lines;
CREATE POLICY "jl_select" ON journal_lines FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "jl_write"  ON journal_lines FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "ar_inv_select" ON ar_invoices;
DROP POLICY IF EXISTS "ar_inv_write"  ON ar_invoices;
CREATE POLICY "ar_inv_select" ON ar_invoices FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "ar_inv_write"  ON ar_invoices FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "ar_pay_select" ON ar_payments;
DROP POLICY IF EXISTS "ar_pay_write"  ON ar_payments;
CREATE POLICY "ar_pay_select" ON ar_payments FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "ar_pay_write"  ON ar_payments FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "ap_bill_select" ON ap_bills;
DROP POLICY IF EXISTS "ap_bill_write"  ON ap_bills;
CREATE POLICY "ap_bill_select" ON ap_bills FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "ap_bill_write"  ON ap_bills FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "ap_pay_select" ON ap_payments;
DROP POLICY IF EXISTS "ap_pay_write"  ON ap_payments;
CREATE POLICY "ap_pay_select" ON ap_payments FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "ap_pay_write"  ON ap_payments FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "bank_acc_select" ON bank_accounts;
DROP POLICY IF EXISTS "bank_acc_write"  ON bank_accounts;
CREATE POLICY "bank_acc_select" ON bank_accounts FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "bank_acc_write"  ON bank_accounts FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "bank_tx_select" ON bank_transactions;
DROP POLICY IF EXISTS "bank_tx_write"  ON bank_transactions;
CREATE POLICY "bank_tx_select" ON bank_transactions FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "bank_tx_write"  ON bank_transactions FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());

DROP POLICY IF EXISTS "recon_select" ON reconciliation_runs;
DROP POLICY IF EXISTS "recon_write"  ON reconciliation_runs;
CREATE POLICY "recon_select" ON reconciliation_runs FOR SELECT USING (company_id = auth_company_id() OR is_platform_admin());
CREATE POLICY "recon_write"  ON reconciliation_runs FOR ALL   USING (company_id = auth_company_id()) WITH CHECK (company_id = auth_company_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8 ── PERFORMANCE INDEXES
-- Rule: index every company_id FK + every FK + every high-cardinality filter.
-- ─────────────────────────────────────────────────────────────────────────────

-- Subscription
CREATE INDEX IF NOT EXISTS idx_tenant_sub_company    ON tenant_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_status     ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_inv_company       ON subscription_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sub_inv_status        ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_events_company ON billing_events(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type   ON billing_events(event_type);

-- HR
CREATE INDEX IF NOT EXISTS idx_employees_company     ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept        ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_company    ON attendance_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee   ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON attendance_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_leave_req_company     ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_req_employee    ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_req_status      ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_kpi_records_company   ON kpi_records(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_records_employee  ON kpi_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpi_records_period    ON kpi_records(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company  ON payroll_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period   ON payroll_runs(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run     ON payroll_items(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);

-- Legal
CREATE INDEX IF NOT EXISTS idx_legal_docs_company    ON legal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_docs_deal       ON legal_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_legal_docs_status     ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_eoi_company           ON eoi_records(company_id);
CREATE INDEX IF NOT EXISTS idx_eoi_unit              ON eoi_records(unit_id);
CREATE INDEX IF NOT EXISTS idx_eoi_client            ON eoi_records(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_company      ON payment_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_source       ON payment_receipts(source_type, source_id);

-- Finance / GL
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company ON fiscal_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_coa_company           ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_coa_type              ON chart_of_accounts(type);
CREATE INDEX IF NOT EXISTS idx_je_company            ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_je_date               ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_je_period             ON journal_entries(fiscal_period_id);
CREATE INDEX IF NOT EXISTS idx_jl_entry              ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_account            ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_ar_inv_company        ON ar_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_ar_inv_developer      ON ar_invoices(developer_id);
CREATE INDEX IF NOT EXISTS idx_ar_inv_status         ON ar_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ar_pay_invoice        ON ar_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ap_bill_company       ON ap_bills(company_id);
CREATE INDEX IF NOT EXISTS idx_ap_bill_status        ON ap_bills(status);
CREATE INDEX IF NOT EXISTS idx_ap_pay_bill           ON ap_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_account       ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_date          ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_tx_reconciled    ON bank_transactions(is_reconciled) WHERE is_reconciled = false;
CREATE INDEX IF NOT EXISTS idx_recon_account         ON reconciliation_runs(bank_account_id);

-- Patched tables (new company_id columns)
CREATE INDEX IF NOT EXISTS idx_activities_company    ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company       ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_units_company         ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_company ON whatsapp_logs(company_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9 ── TRIGGERS & AUTOMATION
-- ─────────────────────────────────────────────────────────────────────────────

-- 9.1 Auto-update updated_at on any table that has the column.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'employees','payroll_runs','kpi_records','contract_templates',
    'legal_documents','eoi_records','ar_invoices','ap_bills',
    'bank_accounts','journal_entries','companies','tenant_subscriptions'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- 9.2 Journal Entry Balance Guard
-- Prevents posting an unbalanced entry (total debits ≠ total credits).
CREATE OR REPLACE FUNCTION public.check_journal_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_debit  numeric;
  v_credit numeric;
BEGIN
  -- Only enforce on the transition to is_posted = true
  IF NEW.is_posted = true AND (OLD.is_posted IS DISTINCT FROM true) THEN
    SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO   v_debit, v_credit
    FROM   journal_lines
    WHERE  entry_id = NEW.id;

    IF ABS(v_debit - v_credit) > 0.005 THEN
      RAISE EXCEPTION
        'Journal entry % is unbalanced: debits=% credits=%',
        NEW.entry_number, v_debit, v_credit;
    END IF;

    IF v_debit = 0 THEN
      RAISE EXCEPTION 'Journal entry % has no lines', NEW.entry_number;
    END IF;
  END IF;

  NEW.posted_at := CASE WHEN NEW.is_posted AND OLD.is_posted IS DISTINCT FROM true
                        THEN now() ELSE NEW.posted_at END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_je_balance ON journal_entries;
CREATE TRIGGER trg_check_je_balance
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance();

-- 9.3 Auto-seed COA when a new company is created
-- Seeds the minimum Egyptian Accounting Standard (EAS) chart of accounts.
CREATE OR REPLACE FUNCTION public.seed_default_coa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO chart_of_accounts (company_id, code, name, name_ar, type, sub_type, normal_balance, is_system, sort_order)
  VALUES
    -- Assets
    (NEW.id, '1000', 'Assets',                   'الأصول',                    'asset',     'header',      'debit',  true,  10),
    (NEW.id, '1100', 'Cash & Bank',               'النقدية والبنوك',           'asset',     'cash',        'debit',  true,  11),
    (NEW.id, '1200', 'Accounts Receivable',       'ذمم مدينة - مطورون',        'asset',     'receivable',  'debit',  true,  12),
    (NEW.id, '1300', 'Prepaid Expenses',          'مصروفات مدفوعة مقدماً',     'asset',     'prepaid',     'debit',  false, 13),
    -- Liabilities
    (NEW.id, '2000', 'Liabilities',               'الخصوم',                    'liability', 'header',      'credit', true,  20),
    (NEW.id, '2100', 'Accounts Payable',          'ذمم دائنة - وسطاء وعملاء', 'liability', 'payable',     'credit', true,  21),
    (NEW.id, '2200', 'Accrued Commissions',       'عمولات مستحقة',             'liability', 'accrued',     'credit', true,  22),
    (NEW.id, '2300', 'VAT Payable',               'ضريبة القيمة المضافة',      'liability', 'tax',         'credit', false, 23),
    -- Equity
    (NEW.id, '3000', 'Equity',                    'حقوق الملكية',              'equity',    'header',      'credit', true,  30),
    (NEW.id, '3100', 'Retained Earnings',         'الأرباح المحتجزة',          'equity',    'retained',    'credit', true,  31),
    -- Revenue
    (NEW.id, '4000', 'Revenue',                   'الإيرادات',                 'revenue',   'header',      'credit', true,  40),
    (NEW.id, '4100', 'Commission Revenue',        'إيرادات العمولات',          'revenue',   'commission',  'credit', true,  41),
    (NEW.id, '4200', 'Service Fees',              'رسوم الخدمات',              'revenue',   'service',     'credit', false, 42),
    (NEW.id, '4300', 'Subscription Revenue',      'إيرادات الاشتراكات',        'revenue',   'subscription','credit', false, 43),
    -- Expenses
    (NEW.id, '5000', 'Expenses',                  'المصروفات',                 'expense',   'header',      'debit',  true,  50),
    (NEW.id, '5100', 'Salaries & Wages',          'الرواتب والأجور',           'expense',   'payroll',     'debit',  true,  51),
    (NEW.id, '5200', 'Marketing Expenses',        'مصروفات التسويق',           'expense',   'marketing',   'debit',  false, 52),
    (NEW.id, '5300', 'Office & Admin Expenses',   'مصروفات إدارية ومكتبية',    'expense',   'admin',       'debit',  false, 53),
    (NEW.id, '5400', 'Agent Commissions Paid',    'عمولات مدفوعة للوسطاء',    'expense',   'commission',  'debit',  true,  54)
  ON CONFLICT (company_id, code) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_coa ON companies;
CREATE TRIGGER trg_seed_coa
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION seed_default_coa();

-- 9.4 Auto-create tenant subscription (trial) when company is created
CREATE OR REPLACE FUNCTION public.seed_trial_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM subscription_plans WHERE slug = 'trial' LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO tenant_subscriptions (company_id, plan_id, status, trial_ends_at, current_period_end)
    VALUES (NEW.id, v_plan_id, 'trial', now() + interval '14 days', now() + interval '14 days')
    ON CONFLICT (company_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_trial ON companies;
CREATE TRIGGER trg_seed_trial
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION seed_trial_subscription();

-- 9.5 Sequence generators for human-readable numbers
-- entry_number for journal entries
CREATE SEQUENCE IF NOT EXISTS seq_journal_entry_no START 1000 INCREMENT 1;

CREATE OR REPLACE FUNCTION public.next_journal_entry_number(p_company_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'JE-' || TO_CHAR(now(), 'YYMM') || '-' || LPAD(nextval('seq_journal_entry_no')::text, 4, '0')
$$;

-- receipt_number for payment receipts
CREATE SEQUENCE IF NOT EXISTS seq_receipt_no START 1000 INCREMENT 1;

CREATE OR REPLACE FUNCTION public.next_receipt_number(p_company_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RCP-' || TO_CHAR(now(), 'YYMM') || '-' || LPAD(nextval('seq_receipt_no')::text, 4, '0')
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10 ── ADVISORY VIEW: Tenant Health Dashboard (super admin only)
-- A fast summary view for the platform admin to monitor all tenants.
-- security_invoker = true prevents RLS bypass for regular users.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_tenant_health;
CREATE VIEW v_tenant_health
WITH (security_invoker = true)
AS
SELECT
  c.id                       AS company_id,
  c.name                     AS company_name,
  c.plan_tier,
  c.is_suspended,
  ts.status                  AS subscription_status,
  ts.current_period_end      AS subscription_expires,
  ts.trial_ends_at,
  sp.name                    AS plan_name,
  COUNT(DISTINCT p.id)       AS user_count,
  COUNT(DISTINCT d.id)       AS total_deals,
  COUNT(DISTINCT l.id)       AS total_leads,
  c.created_at               AS onboarded_at
FROM companies c
LEFT JOIN tenant_subscriptions ts ON ts.company_id = c.id
LEFT JOIN subscription_plans   sp ON sp.id = ts.plan_id
LEFT JOIN profiles             p  ON p.company_id = c.id
LEFT JOIN deals                d  ON d.company_id = c.id
LEFT JOIN leads                l  ON l.company_id = c.id
GROUP BY c.id, ts.status, ts.current_period_end, ts.trial_ends_at, sp.name;

COMMENT ON VIEW v_tenant_health IS
  'Super admin overview of all tenants. Requires is_platform_admin() = true via RLS on underlying tables.';


COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION CHECKLIST (run manually after applying)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Backfill company_id on patched tables:
--    UPDATE activities SET company_id = (SELECT company_id FROM leads WHERE leads.id = activities.lead_id) WHERE company_id IS NULL;
--    UPDATE clients SET company_id = ... (from deals or direct assignment)
--    UPDATE units SET company_id = (SELECT company_id FROM projects WHERE projects.id = units.project_id) WHERE company_id IS NULL;
-- 2. After backfill verification, make columns NOT NULL:
--    ALTER TABLE clients ADD CONSTRAINT clients_company_id_nn CHECK (company_id IS NOT NULL) NOT VALID;
-- 3. Set app_metadata.company_id for all existing users via Supabase Admin API
--    so JWT-based fast-path in auth_company_id() works without a DB roundtrip.
-- 4. Invoke seed_default_coa() manually for all existing companies:
--    SELECT seed_default_coa() FROM companies; -- NOT a real function signature,
--    use: INSERT INTO chart_of_accounts ... SELECT ... FROM companies for bulk seed.
-- ═══════════════════════════════════════════════════════════════════════════════
