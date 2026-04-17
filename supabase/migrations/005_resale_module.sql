-- =====================================================
-- Migration 005: Resale Module
-- Tracks secondary-market (resale) listings
-- =====================================================

CREATE TABLE IF NOT EXISTS public.resale_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.profiles(id),
  agent_id        UUID REFERENCES public.profiles(id),

  -- Unit details
  unit_number     TEXT,
  project_name    TEXT NOT NULL,
  building        TEXT,
  floor           INTEGER,
  area_sqm        NUMERIC(8,2),
  unit_type       TEXT DEFAULT 'شقة',  -- شقة | فيلا | دوبلكس | روف | توين هاوس
  bedrooms        INTEGER,
  bathrooms       INTEGER,
  finishing       TEXT,                -- مشطب | نص تشطيب | بدون تشطيب

  -- Pricing
  asking_price    NUMERIC(14,2) NOT NULL,
  original_price  NUMERIC(14,2),       -- what seller paid
  installment_remaining NUMERIC(14,2), -- outstanding balance if any

  -- Seller info
  seller_name     TEXT,
  seller_phone    TEXT,
  seller_notes    TEXT,

  -- Listing status
  status          TEXT DEFAULT 'active',   -- active | under_offer | sold | withdrawn
  is_verified     BOOLEAN DEFAULT false,   -- admin verified listing
  views           INTEGER DEFAULT 0,

  -- Media
  images          TEXT[],                  -- array of Supabase Storage URLs

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  sold_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resale_project  ON public.resale_listings(project_name);
CREATE INDEX IF NOT EXISTS idx_resale_status   ON public.resale_listings(status);
CREATE INDEX IF NOT EXISTS idx_resale_agent    ON public.resale_listings(agent_id);

ALTER TABLE public.resale_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resale_select" ON public.resale_listings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "resale_insert" ON public.resale_listings
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "resale_update" ON public.resale_listings
  FOR UPDATE USING (
    agent_id = auth.uid()
    OR auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin')
  );

CREATE POLICY "resale_delete" ON public.resale_listings
  FOR DELETE USING (
    auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin')
  );
