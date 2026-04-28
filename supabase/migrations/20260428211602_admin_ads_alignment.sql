BEGIN;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS edit_request_notes text,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hidden_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_category text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE TABLE IF NOT EXISTS public.ad_review_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'approved', 'rejected', 'edit_requested',
    'featured', 'unfeatured', 'pinned', 'unpinned',
    'hidden', 'unhidden', 'category_changed', 'suspended_client'
  )),
  previous_status text,
  new_status text,
  reason text,
  notes text,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY (con.conkey)
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ad_review_logs'
    AND con.contype = 'f'
    AND attr.attname = 'ad_id'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ad_review_logs DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.ad_review_logs
  ADD CONSTRAINT ad_review_logs_ad_id_fkey
  FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY (con.conkey)
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ad_review_logs'
    AND con.contype = 'f'
    AND attr.attname = 'performed_by'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ad_review_logs DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.ad_review_logs
  ADD CONSTRAINT ad_review_logs_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.ad_review_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_review_logs_admin_all ON public.ad_review_logs;
CREATE POLICY ad_review_logs_admin_all ON public.ad_review_logs
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_ads_is_pinned ON public.ads(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_ads_is_hidden_admin ON public.ads(is_hidden_admin) WHERE is_hidden_admin = true;
CREATE INDEX IF NOT EXISTS idx_ads_is_featured_admin ON public.ads(is_featured_admin) WHERE is_featured_admin = true;
CREATE INDEX IF NOT EXISTS idx_ads_admin_review_status ON public.ads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_review_logs_ad_created_at ON public.ad_review_logs(ad_id, created_at DESC);

COMMIT;
