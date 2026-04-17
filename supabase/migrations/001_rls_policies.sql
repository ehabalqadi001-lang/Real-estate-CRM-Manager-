-- =====================================================
-- Migration 001: Row Level Security Policies
-- Apply in Supabase dashboard → SQL Editor
-- =====================================================

-- Helper: get current user's role from profiles
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: get current user's company_id
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── PROFILES ────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all in company
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR auth.user_company_id() = company_id
  );

-- Users can update only their own profile
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ─── LEADS ───────────────────────────────────────────────────────
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Agents: only their own leads. Admins: all leads in company.
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

-- ─── DEALS ───────────────────────────────────────────────────────
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON public.deals
  FOR SELECT USING (
    agent_id = auth.uid()
    OR user_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "deals_insert" ON public.deals
  FOR INSERT WITH CHECK (
    agent_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "deals_update" ON public.deals
  FOR UPDATE USING (
    agent_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "deals_delete" ON public.deals
  FOR DELETE USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

-- ─── COMMISSIONS ─────────────────────────────────────────────────
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commissions_select" ON public.commissions
  FOR SELECT USING (
    agent_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "commissions_insert" ON public.commissions
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "commissions_update" ON public.commissions
  FOR UPDATE USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

-- ─── INVENTORY ───────────────────────────────────────────────────
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view inventory
CREATE POLICY "inventory_select" ON public.inventory
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify inventory
CREATE POLICY "inventory_insert" ON public.inventory
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "inventory_update" ON public.inventory
  FOR UPDATE USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "inventory_delete" ON public.inventory
  FOR DELETE USING (
    auth.user_role() IN ('super_admin', 'Super_Admin')
  );

-- ─── AGENT_TARGETS ───────────────────────────────────────────────
ALTER TABLE public.agent_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_targets_select" ON public.agent_targets
  FOR SELECT USING (
    agent_id = auth.uid()
    OR auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

CREATE POLICY "agent_targets_manage" ON public.agent_targets
  FOR ALL USING (
    auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
  );

-- ─── NOTIFICATIONS ───────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ─── AUDIT_LOGS ──────────────────────────────────────────────────
-- If you have an audit_logs table:
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
--   FOR SELECT USING (
--     auth.user_role() IN ('admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin')
--   );
