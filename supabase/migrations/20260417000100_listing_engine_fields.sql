-- Migration: Advanced Listing Engine Fields
-- Date: 2026-04-17
-- Adds 21 comprehensive property fields to the ads table for the Fast Investment Marketplace

-- ─── LOCATION & PROJECT REFERENCES ──────────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS area_location      text,
  ADD COLUMN IF NOT EXISTS project_id         uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS developer_id       uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS detailed_address   text,
  ADD COLUMN IF NOT EXISTS unit_number        text;

-- ─── UNIT PHYSICAL DETAILS ──────────────────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS rooms              integer CHECK (rooms >= 0),
  ADD COLUMN IF NOT EXISTS features           text CHECK (features IN ('ROOF', 'GARDEN', 'NONE')),
  ADD COLUMN IF NOT EXISTS finishing          text CHECK (finishing IN ('تشطيب كامل', 'نصف تشطيب', 'طوب أحمر')),
  ADD COLUMN IF NOT EXISTS is_furnished       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unit_type          text CHECK (unit_type IN ('سكني', 'تجاري', 'إداري', 'فندقي', 'طبي')),
  ADD COLUMN IF NOT EXISTS internal_area_sqm  numeric(8,2) CHECK (internal_area_sqm > 0),
  ADD COLUMN IF NOT EXISTS external_area_sqm  numeric(8,2) CHECK (external_area_sqm > 0);

-- ─── RENTAL & OCCUPANCY ─────────────────────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS is_rented          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_value       numeric(12,2) CHECK (rental_value >= 0);

-- ─── MARKETING & NOTES ──────────────────────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS marketing_description text,
  ADD COLUMN IF NOT EXISTS special_notes         text;

-- ─── FILES: DOCUMENTS & ARCHITECTURAL ───────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS doc_files          text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS layout_file        text,
  ADD COLUMN IF NOT EXISTS masterplan_file    text;

-- ─── PRICING STRATEGY ───────────────────────────────────────────────────────
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS pricing_strategy   text CHECK (pricing_strategy IN ('كاش', 'أقساط', 'تكملة أقساط')),
  ADD COLUMN IF NOT EXISTS down_payment       numeric(12,2) CHECK (down_payment >= 0),
  ADD COLUMN IF NOT EXISTS installment_amount numeric(12,2) CHECK (installment_amount >= 0),
  ADD COLUMN IF NOT EXISTS total_cash_price   numeric(12,2) CHECK (total_cash_price >= 0);

-- ─── RLS: VIEW (approved listings visible to everyone) ───────────────────────
-- Already handled by existing policy; ensure it covers new columns (no change needed).

-- ─── RLS: EDIT (only owner or admin) ─────────────────────────────────────────
DROP POLICY IF EXISTS ads_owner_update ON public.ads;
CREATE POLICY ads_owner_update ON public.ads
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'Super_Admin', 'admin', 'Admin', 'company_admin')
    )
  );

DROP POLICY IF EXISTS ads_owner_delete ON public.ads;
CREATE POLICY ads_owner_delete ON public.ads
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'Super_Admin', 'admin', 'Admin', 'company_admin')
    )
  );

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run via Supabase dashboard or storage API — SQL cannot create buckets directly.
-- Required buckets:
--   listing-images   (public)   — up to 12 images per listing, max 5MB each
--   listing-docs     (private)  — contracts, payment plans, powers of attorney
--   listing-arch     (private)  — layout and masterplan PDF/image files
