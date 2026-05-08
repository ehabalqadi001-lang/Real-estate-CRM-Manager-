-- ── installments ────────────────────────────────────────────
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installments_select" ON public.installments
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "installments_insert" ON public.installments
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "installments_update" ON public.installments
  FOR UPDATE USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "installments_delete" ON public.installments
  FOR DELETE USING (
    public.is_super_admin()
  );

-- ── team_members ─────────────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (
    public.is_super_admin()
    OR (company_id = public.current_company_id() AND public.is_company_manager())
  );

-- ── company_settings ─────────────────────────────────────────
-- id IS the company_id (one row per company)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_settings_select" ON public.company_settings
  FOR SELECT USING (
    id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "company_settings_update" ON public.company_settings
  FOR UPDATE USING (
    id = public.current_company_id()
    OR public.is_super_admin()
  );
