BEGIN;

ALTER TABLE public.paymob_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS paymob_settings_admin_read ON public.paymob_settings;
CREATE POLICY paymob_settings_admin_read ON public.paymob_settings
  FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS paymob_settings_admin_write ON public.paymob_settings;
CREATE POLICY paymob_settings_admin_write ON public.paymob_settings
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE INDEX IF NOT EXISTS idx_point_packages_active_sort_order
  ON public.point_packages(is_active, sort_order, created_at);

COMMIT;
