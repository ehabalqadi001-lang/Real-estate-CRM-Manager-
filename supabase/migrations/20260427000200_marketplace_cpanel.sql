-- ============================================================
-- Marketplace CPanel: Ticker + Admin Ad Controls + Review Logs
-- ============================================================

-- ── 1. Ticker table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_ticker (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL CHECK (type IN ('text', 'logo', 'launch')),
  content       text,
  logo_url      text,
  developer_name text,
  badge_color   text        NOT NULL DEFAULT '#10b981',
  is_active     boolean     NOT NULL DEFAULT true,
  display_order integer     NOT NULL DEFAULT 0,
  created_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Ad review logs table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_review_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           uuid        NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  action          text        NOT NULL CHECK (action IN (
    'approved','rejected','edit_requested',
    'featured','unfeatured','pinned','unpinned',
    'hidden','unhidden','category_changed','suspended_client'
  )),
  previous_status text,
  new_status      text,
  reason          text,
  notes           text,
  performed_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Extend ads table with admin-control columns ───────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS rejection_reason     text,
  ADD COLUMN IF NOT EXISTS edit_request_notes   text,
  ADD COLUMN IF NOT EXISTS reviewed_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS is_pinned            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured_admin    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hidden_admin      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_category       text,
  ADD COLUMN IF NOT EXISTS admin_notes          text;

-- ── 4. RLS ───────────────────────────────────────────────────
ALTER TABLE public.marketplace_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_review_logs     ENABLE ROW LEVEL SECURITY;

-- Ticker: anyone authenticated can read active items (marketplace display)
DROP POLICY IF EXISTS "ticker_select_public"  ON public.marketplace_ticker;
DROP POLICY IF EXISTS "ticker_write_admin"    ON public.marketplace_ticker;
DROP POLICY IF EXISTS "ticker_update_admin"   ON public.marketplace_ticker;
DROP POLICY IF EXISTS "ticker_delete_admin"   ON public.marketplace_ticker;

CREATE POLICY "ticker_select_public" ON public.marketplace_ticker
  FOR SELECT USING (is_active = true OR public.is_platform_admin());

CREATE POLICY "ticker_write_admin" ON public.marketplace_ticker
  FOR INSERT WITH CHECK (public.is_platform_admin());

CREATE POLICY "ticker_update_admin" ON public.marketplace_ticker
  FOR UPDATE USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY "ticker_delete_admin" ON public.marketplace_ticker
  FOR DELETE USING (public.is_platform_admin());

-- Review logs: platform admin only
DROP POLICY IF EXISTS "review_logs_admin_all" ON public.ad_review_logs;

CREATE POLICY "review_logs_admin_all" ON public.ad_review_logs
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- ── 5. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_marketplace_ticker_order
  ON public.marketplace_ticker(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_ad_review_logs_ad
  ON public.ad_review_logs(ad_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ads_is_pinned
  ON public.ads(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_ads_is_hidden_admin
  ON public.ads(is_hidden_admin) WHERE is_hidden_admin = true;

CREATE INDEX IF NOT EXISTS idx_ads_is_featured_admin
  ON public.ads(is_featured_admin) WHERE is_featured_admin = true;

-- ── 6. Seed: one default ticker welcome item ─────────────────
INSERT INTO public.marketplace_ticker (type, content, display_order)
VALUES ('text', '🏠 مرحباً بك في سوق FAST INVESTMENT العقاري — أكبر منصة عقارية موثوقة في مصر', 0)
ON CONFLICT DO NOTHING;
