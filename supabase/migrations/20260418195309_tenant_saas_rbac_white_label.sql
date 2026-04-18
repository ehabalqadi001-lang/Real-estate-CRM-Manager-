-- FAST INVESTMENT B2B SaaS tenant architecture
-- Adds first-class tenants/tenant_id while preserving the existing company_id model.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  domain text UNIQUE,
  logo_url text,
  primary_brand_color text NOT NULL DEFAULT '#0f766e',
  plan_tier text NOT NULL DEFAULT 'basic'
    CHECK (plan_tier IN ('basic', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'canceled')),
  max_users integer NOT NULL DEFAULT 5,
  max_listings integer NOT NULL DEFAULT 50,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_tier text NOT NULL DEFAULT 'basic'
    CHECK (plan_tier IN ('basic', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'canceled')),
  billing_cycle text NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual')),
  currency text NOT NULL DEFAULT 'EGP',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  canceled_at timestamptz,
  provider text NOT NULL DEFAULT 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_tiers (
  slug text PRIMARY KEY CHECK (slug IN ('basic', 'pro', 'enterprise')),
  name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  annual_price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  max_users integer NOT NULL,
  max_listings integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plan_tiers (slug, name, monthly_price, annual_price, max_users, max_listings, features, sort_order)
VALUES
  ('basic', 'Basic', 1499, 14990, 10, 100, '{"crm":true,"marketplace":true,"white_label":true,"advanced_reporting":false,"api":false}'::jsonb, 1),
  ('pro', 'Pro', 2999, 29990, 30, 500, '{"crm":true,"marketplace":true,"white_label":true,"advanced_reporting":true,"api":false}'::jsonb, 2),
  ('enterprise', 'Enterprise', 5999, 59990, -1, -1, '{"crm":true,"marketplace":true,"white_label":true,"advanced_reporting":true,"api":true}'::jsonb, 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  max_users = EXCLUDED.max_users,
  max_listings = EXCLUDED.max_listings,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_brand_color text DEFAULT '#0f766e';

-- Backfill tenants from the existing companies registry when present.
DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    INSERT INTO public.tenants (
      id,
      company_name,
      domain,
      logo_url,
      primary_brand_color,
      plan_tier,
      status,
      max_users,
      max_listings,
      metadata,
      created_at,
      updated_at
    )
    SELECT
      c.id,
      COALESCE(to_jsonb(c)->>'name', to_jsonb(c)->>'company_name', 'Tenant ' || left(c.id::text, 8)),
      NULLIF(to_jsonb(c)->>'domain', ''),
      COALESCE(to_jsonb(c)->>'logo_url', to_jsonb(c)->>'logo'),
      COALESCE(to_jsonb(c)->>'primary_brand_color', '#0f766e'),
      CASE WHEN to_jsonb(c)->>'plan_tier' IN ('basic', 'pro', 'enterprise') THEN to_jsonb(c)->>'plan_tier' ELSE 'basic' END,
      CASE
        WHEN COALESCE((to_jsonb(c)->>'is_suspended')::boolean, false) THEN 'suspended'
        WHEN to_jsonb(c)->>'status' IN ('trial', 'active', 'past_due', 'suspended', 'canceled') THEN to_jsonb(c)->>'status'
        ELSE 'active'
      END,
      COALESCE(NULLIF(to_jsonb(c)->>'max_users', '')::integer, 5),
      COALESCE(NULLIF(to_jsonb(c)->>'max_listings', '')::integer, 50),
      jsonb_build_object('source', 'companies'),
      COALESCE(NULLIF(to_jsonb(c)->>'created_at', '')::timestamptz, now()),
      COALESCE(NULLIF(to_jsonb(c)->>'updated_at', '')::timestamptz, now())
    FROM public.companies c
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      domain = COALESCE(public.tenants.domain, EXCLUDED.domain),
      logo_url = COALESCE(EXCLUDED.logo_url, public.tenants.logo_url),
      primary_brand_color = COALESCE(EXCLUDED.primary_brand_color, public.tenants.primary_brand_color),
      plan_tier = EXCLUDED.plan_tier,
      status = EXCLUDED.status,
      max_users = EXCLUDED.max_users,
      max_listings = EXCLUDED.max_listings,
      updated_at = now();
  END IF;
END $$;

-- Backfill tenants from company-owner profiles for older installs that model company as profile.id.
INSERT INTO public.tenants (id, company_name, logo_url, primary_brand_color, plan_tier, status, metadata)
SELECT
  p.id,
  COALESCE(NULLIF(p.company_name, ''), NULLIF(p.full_name, ''), 'Tenant ' || left(p.id::text, 8)),
  p.logo_url,
  COALESCE(p.primary_brand_color, '#0f766e'),
  'basic',
  CASE WHEN COALESCE(p.is_active, true) THEN 'active' ELSE 'suspended' END,
  jsonb_build_object('source', 'profiles')
FROM public.profiles p
WHERE COALESCE(p.company_id, p.id) = p.id
  AND p.role IN ('super_admin', 'platform_admin', 'company_owner', 'company_admin', 'company', 'admin', 'Admin')
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p
SET tenant_id = COALESCE(p.company_id, p.id)
WHERE p.tenant_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = COALESCE(p.company_id, p.id)
  );

-- Keep companies and tenants interoperable for the current codebase.
DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
      ADD COLUMN IF NOT EXISTS primary_brand_color text DEFAULT '#0f766e';

    UPDATE public.companies c
    SET tenant_id = c.id
    WHERE c.tenant_id IS NULL
      AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = c.id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(tenant_id, company_id, id)
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'platform_admin', 'Super_Admin', 'Super Admin')
  )
  OR auth.role() = 'service_role'
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_updated_at();

DROP TRIGGER IF EXISTS trg_plan_tiers_updated_at ON public.plan_tiers;
CREATE TRIGGER trg_plan_tiers_updated_at
  BEFORE UPDATE ON public.plan_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_updated_at();

-- Add tenant_id to core CRM, marketplace, finance, and settings tables.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'properties',
    'leads',
    'clients',
    'deals',
    'transactions',
    'settings',
    'projects',
    'units',
    'resale_listings',
    'broker_profiles',
    'commissions',
    'commission_rules',
    'payouts',
    'payout_items',
    'expenses',
    'targets',
    'activities',
    'lead_activities',
    'deal_activities',
    'notifications',
    'ads',
    'chat_messages',
    'employees',
    'payroll_runs',
    'legal_documents',
    'journal_entries',
    'ar_invoices',
    'ap_bills'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)', tbl);

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id'
      ) THEN
        EXECUTE format(
          'UPDATE public.%I SET tenant_id = company_id WHERE tenant_id IS NULL AND company_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = company_id)',
          tbl
        );
      END IF;

      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- Mirror active tenant subscriptions from the older tenant_subscriptions engine.
DO $$
BEGIN
  IF to_regclass('public.tenant_subscriptions') IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      tenant_id,
      plan_tier,
      status,
      billing_cycle,
      amount,
      currency,
      trial_ends_at,
      current_period_start,
      current_period_end,
      provider,
      provider_customer_id,
      provider_subscription_id,
      metadata,
      created_at,
      updated_at
    )
    SELECT
      ts.company_id,
      CASE
        WHEN sp.slug IN ('basic', 'pro', 'enterprise') THEN sp.slug
        WHEN ts.status = 'trial' THEN 'basic'
        ELSE 'basic'
      END,
      CASE WHEN ts.status = 'cancelled' THEN 'canceled' ELSE ts.status END,
      ts.billing_cycle,
      ts.amount,
      ts.currency,
      ts.trial_ends_at,
      ts.current_period_start,
      ts.current_period_end,
      COALESCE(ts.payment_provider, 'manual'),
      ts.provider_customer_id,
      ts.provider_subscription_id,
      jsonb_build_object('source', 'tenant_subscriptions'),
      ts.created_at,
      ts.updated_at
    FROM public.tenant_subscriptions ts
    LEFT JOIN public.subscription_plans sp ON sp.id = ts.plan_id
    WHERE EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = ts.company_id)
    ON CONFLICT (tenant_id) DO UPDATE SET
      plan_tier = EXCLUDED.plan_tier,
      status = EXCLUDED.status,
      billing_cycle = EXCLUDED.billing_cycle,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now();
  END IF;
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select_isolated ON public.tenants;
DROP POLICY IF EXISTS tenants_platform_all ON public.tenants;
DROP POLICY IF EXISTS tenants_admin_update_branding ON public.tenants;

CREATE POLICY tenants_select_isolated ON public.tenants
  FOR SELECT
  USING (id = public.auth_tenant_id() OR public.is_platform_admin());

CREATE POLICY tenants_admin_update_branding ON public.tenants
  FOR UPDATE
  USING (
    id = public.auth_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('company_owner', 'company_admin', 'company', 'admin', 'Admin')
    )
  )
  WITH CHECK (id = public.auth_tenant_id());

CREATE POLICY tenants_platform_all ON public.tenants
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS subscriptions_tenant_read ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_platform_all ON public.subscriptions;

CREATE POLICY subscriptions_tenant_read ON public.subscriptions
  FOR SELECT
  USING (tenant_id = public.auth_tenant_id() OR public.is_platform_admin());

CREATE POLICY subscriptions_platform_all ON public.subscriptions
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS plan_tiers_read_active ON public.plan_tiers;
DROP POLICY IF EXISTS plan_tiers_platform_all ON public.plan_tiers;

CREATE POLICY plan_tiers_read_active ON public.plan_tiers
  FOR SELECT
  USING (is_active = true OR public.is_platform_admin());

CREATE POLICY plan_tiers_platform_all ON public.plan_tiers
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS profiles_tenant_select ON public.profiles;
DROP POLICY IF EXISTS profiles_tenant_update ON public.profiles;
DROP POLICY IF EXISTS profiles_tenant_guard ON public.profiles;
DROP POLICY IF EXISTS profiles_platform_all ON public.profiles;

CREATE POLICY profiles_tenant_guard ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  USING (
    id = auth.uid()
    OR tenant_id = public.auth_tenant_id()
    OR public.is_platform_admin()
  )
  WITH CHECK (
    tenant_id = public.auth_tenant_id()
    OR public.is_platform_admin()
  );

CREATE POLICY profiles_tenant_select ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR tenant_id = public.auth_tenant_id()
    OR public.is_platform_admin()
  );

CREATE POLICY profiles_tenant_update ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (
      tenant_id = public.auth_tenant_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('company_owner', 'company_admin', 'company', 'admin', 'Admin')
      )
    )
  )
  WITH CHECK (tenant_id = public.auth_tenant_id() OR public.is_platform_admin());

CREATE POLICY profiles_platform_all ON public.profiles
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Strict tenant isolation for every table carrying tenant_id.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'properties',
    'leads',
    'clients',
    'deals',
    'transactions',
    'settings',
    'projects',
    'units',
    'resale_listings',
    'broker_profiles',
    'commissions',
    'commission_rules',
    'payouts',
    'payout_items',
    'expenses',
    'targets',
    'activities',
    'lead_activities',
    'deal_activities',
    'notifications',
    'ads',
    'chat_messages',
    'employees',
    'payroll_runs',
    'legal_documents',
    'journal_entries',
    'ar_invoices',
    'ap_bills'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_select', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_insert', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_update', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_delete', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant_guard', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_platform_all', tbl);

      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL USING (tenant_id = public.auth_tenant_id() OR public.is_platform_admin()) WITH CHECK (tenant_id = public.auth_tenant_id() OR public.is_platform_admin())',
        tbl || '_tenant_guard',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (tenant_id = public.auth_tenant_id() OR public.is_platform_admin())',
        tbl || '_tenant_select',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id() OR public.is_platform_admin())',
        tbl || '_tenant_insert',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (tenant_id = public.auth_tenant_id() OR public.is_platform_admin()) WITH CHECK (tenant_id = public.auth_tenant_id() OR public.is_platform_admin())',
        tbl || '_tenant_update',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (tenant_id = public.auth_tenant_id() OR public.is_platform_admin())',
        tbl || '_tenant_delete',
        tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin())',
        tbl || '_platform_all',
        tbl
      );
    END IF;
  END LOOP;
END $$;

DROP VIEW IF EXISTS public.v_saas_tenant_metrics;
CREATE VIEW public.v_saas_tenant_metrics
WITH (security_invoker = true)
AS
SELECT
  t.id AS tenant_id,
  t.company_name,
  t.domain,
  t.logo_url,
  t.primary_brand_color,
  t.plan_tier,
  t.status AS tenant_status,
  s.status AS subscription_status,
  s.billing_cycle,
  s.amount,
  s.currency,
  s.current_period_end,
  COUNT(DISTINCT p.id) AS user_count,
  COUNT(DISTINCT l.id) AS lead_count,
  COUNT(DISTINCT d.id) AS deal_count,
  COUNT(DISTINCT u.id) AS listing_count,
  t.created_at,
  t.updated_at
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
LEFT JOIN public.profiles p ON p.tenant_id = t.id
LEFT JOIN public.leads l ON l.tenant_id = t.id
LEFT JOIN public.deals d ON d.tenant_id = t.id
LEFT JOIN public.units u ON u.tenant_id = t.id
GROUP BY t.id, s.status, s.billing_cycle, s.amount, s.currency, s.current_period_end;

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_tier ON public.tenants(plan_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

COMMIT;
