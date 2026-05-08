-- NEXUS 2030 Core Schema
-- feature_flags, company_api_keys, market_intelligence, client_reports, marketing_skills, creative_assets

-- ── Feature Flags ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key        text        NOT NULL UNIQUE,
  label           text        NOT NULL,
  description     text,
  enabled_roles   text[]      NOT NULL DEFAULT '{}',
  enabled_companies uuid[]    NOT NULL DEFAULT '{}',
  is_global       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags_select" ON public.feature_flags FOR SELECT USING (public.is_super_admin() OR true);
CREATE POLICY "flags_manage" ON public.feature_flags FOR ALL USING (public.is_super_admin());

INSERT INTO public.feature_flags (flag_key, label, description, is_global, enabled_roles) VALUES
  ('ai_creative_studio',   'AI Creative Studio',      'HeyGen/ElevenLabs/Image generation',  false, ARRAY['super_admin','company_admin','company_owner','sales_manager']),
  ('market_intelligence',  'Market Intelligence',     'Real estate trend scraping & analysis', false, ARRAY['super_admin','platform_admin','company_admin','company_owner']),
  ('client_reports',       'Client Reports',          'Automated investment reports to clients', false, ARRAY['super_admin','company_admin','company_owner','account_manager']),
  ('ai_lead_scoring',      'AI Lead Scoring 2.0',     'Behavioral lead scoring + classification', false, ARRAY['super_admin','company_admin','sales_manager']),
  ('predictive_analytics', 'Predictive Analytics',    'Price forecasting & cash flow prediction', false, ARRAY['super_admin','company_admin']),
  ('omnichannel_inbox',    'Omnichannel Inbox',       'Unified WhatsApp/Email/SMS inbox',     false, ARRAY['super_admin','company_admin','sales_manager','sales_agent']),
  ('ads_api',              'Ads API Connector',       'Meta & Google Ads real-time management', false, ARRAY['super_admin','company_admin']),
  ('seo_blog_generator',   'SEO Blog Generator',      'Automated blog & landing page generation', false, ARRAY['super_admin','company_admin'])
ON CONFLICT (flag_key) DO NOTHING;

-- ── Company API Vault ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_api_keys (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_name        text        NOT NULL,
  encrypted_value text        NOT NULL,
  hint            text,
  created_by      uuid        REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (company_id, key_name)
);

ALTER TABLE public.company_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select" ON public.company_api_keys
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "api_keys_manage" ON public.company_api_keys
  FOR ALL USING (company_id = public.current_company_id() AND public.is_company_manager() OR public.is_super_admin());

-- ── Market Intelligence ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.market_intelligence (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        REFERENCES public.profiles(id),
  region          text        NOT NULL,
  zone            text,
  avg_price_sqm   numeric(12,2),
  price_change_pct numeric(6,2),
  demand_level    text        DEFAULT 'medium',
  supply_units    integer,
  competitor_data jsonb       DEFAULT '{}',
  source_url      text,
  source_type     text        DEFAULT 'manual',
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_intel_select" ON public.market_intelligence
  FOR SELECT USING (company_id = public.current_company_id() OR company_id IS NULL OR public.is_super_admin());
CREATE POLICY "market_intel_insert" ON public.market_intelligence
  FOR INSERT WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "market_intel_update" ON public.market_intelligence
  FOR UPDATE USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_market_intel_region  ON public.market_intelligence(region);
CREATE INDEX IF NOT EXISTS idx_market_intel_company ON public.market_intelligence(company_id);

-- ── Client Reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.profiles(id),
  client_id       uuid        REFERENCES public.profiles(id),
  report_type     text        NOT NULL DEFAULT 'weekly_insight',
  title           text,
  content_html    text,
  content_url     text,
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  opened_at       timestamptz,
  status          text        NOT NULL DEFAULT 'draft',
  delivery_channel text       DEFAULT 'email',
  created_by      uuid        REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select" ON public.client_reports
  FOR SELECT USING (company_id = public.current_company_id() OR client_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "reports_manage" ON public.client_reports
  FOR ALL USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_reports_company  ON public.client_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_client   ON public.client_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON public.client_reports(status);

-- ── Marketing Skills Library ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_skills (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key       text        NOT NULL UNIQUE,
  department      text        NOT NULL,
  title_ar        text,
  title_en        text        NOT NULL,
  description_en  text,
  content         text        NOT NULL,
  is_active       boolean     DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.marketing_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select" ON public.marketing_skills FOR SELECT USING (true);
CREATE POLICY "skills_manage" ON public.marketing_skills FOR ALL USING (public.is_super_admin());

-- ── Creative Assets ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creative_assets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.profiles(id),
  created_by      uuid        REFERENCES public.profiles(id),
  asset_type      text        NOT NULL,
  title           text,
  prompt_used     text,
  output_url      text,
  output_text     text,
  provider        text,
  property_ref    text,
  status          text        DEFAULT 'completed',
  metadata        jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_select" ON public.creative_assets
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "assets_manage" ON public.creative_assets
  FOR ALL USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_assets_company ON public.creative_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_type    ON public.creative_assets(asset_type);
