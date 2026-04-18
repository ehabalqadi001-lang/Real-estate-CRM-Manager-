-- FAST INVESTMENT subdomain-based multi-tenancy and white-label fields.

BEGIN;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS company_name text;

UPDATE public.tenants
SET
  primary_color = COALESCE(primary_color, primary_brand_color, '#0f766e'),
  company_name = COALESCE(company_name, NULLIF(metadata->>'company_name', '')),
  subdomain = COALESCE(
    subdomain,
    lower(
      regexp_replace(
        regexp_replace(COALESCE(domain, company_name, 'tenant-' || left(id::text, 8)), '^https?://', ''),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    )
  )
WHERE subdomain IS NULL
   OR primary_color IS NULL
   OR company_name IS NULL;

UPDATE public.tenants
SET subdomain = trim(both '-' from subdomain)
WHERE subdomain IS NOT NULL;

ALTER TABLE public.tenants
  ALTER COLUMN company_name SET NOT NULL,
  ALTER COLUMN primary_color SET DEFAULT '#0f766e';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_subdomain_format'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_subdomain_format
      CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_primary_color_hex'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_primary_color_hex
      CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdomain_unique_idx
  ON public.tenants (lower(subdomain))
  WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS tenants_domain_idx
  ON public.tenants (lower(domain))
  WHERE domain IS NOT NULL;

COMMENT ON COLUMN public.tenants.subdomain IS 'Tenant subdomain slug, e.g. apex for apex.fastinvestment.com.';
COMMENT ON COLUMN public.tenants.primary_color IS 'Tenant primary brand color as a #RRGGBB hex value.';
COMMENT ON COLUMN public.tenants.logo_url IS 'Tenant white-label logo URL.';
COMMENT ON COLUMN public.tenants.company_name IS 'Tenant display company name.';

CREATE OR REPLACE FUNCTION public.get_tenant_branding(p_subdomain text)
RETURNS TABLE (
  id uuid,
  subdomain text,
  company_name text,
  primary_color text,
  logo_url text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.subdomain,
    t.company_name,
    COALESCE(t.primary_color, t.primary_brand_color, '#0f766e') AS primary_color,
    t.logo_url,
    t.status
  FROM public.tenants t
  WHERE lower(t.subdomain) = lower(p_subdomain)
    AND t.status IN ('trial', 'active', 'past_due')
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_tenant_branding(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_branding(text) TO anon, authenticated;

DROP VIEW IF EXISTS public.v_saas_tenant_metrics;
CREATE VIEW public.v_saas_tenant_metrics
WITH (security_invoker = true)
AS
SELECT
  t.id AS tenant_id,
  t.company_name,
  t.subdomain,
  t.domain,
  t.logo_url,
  COALESCE(t.primary_color, t.primary_brand_color, '#0f766e') AS primary_color,
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

COMMIT;
