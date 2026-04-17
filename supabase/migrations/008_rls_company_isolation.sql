-- =====================================================================
-- Migration 008: RLS Complete Fix — Company Isolation
-- =====================================================================
-- المشكلة: السياسات الحالية لا تعزل بيانات الشركات بشكل صحيح
-- شركة A يمكنها رؤية بيانات شركة B في بعض الجداول
-- الحل: دالة موحّدة + سياسات معزولة على مستوى company_id
-- =====================================================================

-- ─── ١. دالة موحّدة للحصول على company_id للمستخدم الحالي ──────────
-- SECURITY DEFINER = تعمل بصلاحيات المالك، لا المستدعي
-- STABLE = نتيجتها ثابتة خلال نفس الـ transaction
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- دالة للحصول على دور المستخدم الحالي (موحّدة)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- دالة للتحقق هل المستخدم مدير في شركته
CREATE OR REPLACE FUNCTION public.is_company_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN (
    'super_admin','platform_admin','company_owner','company_admin',
    'sales_director','admin','company'
  )
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- دالة للتحقق هل المستخدم super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('super_admin','platform_admin')
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ─── ٢. إصلاح جدول profiles ─────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- المستخدم يرى ملفه الشخصي + كل ملفات شركته
CREATE POLICY "profiles_select_v2" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "profiles_update_v2" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (public.is_company_manager() AND company_id = public.current_company_id())
    OR public.is_super_admin()
  );

CREATE POLICY "profiles_insert_v2" ON public.profiles
  FOR INSERT WITH CHECK (true); -- يتحكم فيه auth.signUp

-- ─── ٣. إصلاح جدول leads — عزل كامل على مستوى company_id ──────────
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

-- أضف company_id للـ leads إذا لم يكن موجودًا
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.profiles(id);

-- Backfill: استخرج company_id من المستخدم المنشئ
UPDATE public.leads l
SET company_id = p.company_id
FROM public.profiles p
WHERE l.user_id = p.id
  AND l.company_id IS NULL;

CREATE POLICY "leads_select_v2" ON public.leads
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "leads_insert_v2" ON public.leads
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "leads_update_v2" ON public.leads
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (
      user_id = auth.uid()
      OR assigned_to = auth.uid()
      OR public.is_company_manager()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "leads_delete_v2" ON public.leads
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٤. إصلاح جدول deals — company_id reference خاطئ ──────────────
-- كان يشير لـ auth.users(id) بدل الـ company — نصلح الـ FK
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_company_id_fkey;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "deals_select" ON public.deals;
DROP POLICY IF EXISTS "deals_insert" ON public.deals;
DROP POLICY IF EXISTS "deals_update" ON public.deals;
DROP POLICY IF EXISTS "deals_delete" ON public.deals;
DROP POLICY IF EXISTS "deals_company_isolation" ON public.deals;

CREATE POLICY "deals_select_v2" ON public.deals
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "deals_insert_v2" ON public.deals
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "deals_update_v2" ON public.deals
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (
      agent_id = auth.uid()
      OR public.is_company_manager()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "deals_delete_v2" ON public.deals
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٥. إصلاح commissions ────────────────────────────────────────────
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.profiles(id);

UPDATE public.commissions c
SET company_id = d.company_id
FROM public.deals d
WHERE c.deal_id = d.id
  AND c.company_id IS NULL;

DROP POLICY IF EXISTS "commissions_select" ON public.commissions;
DROP POLICY IF EXISTS "commissions_insert" ON public.commissions;
DROP POLICY IF EXISTS "commissions_update" ON public.commissions;

CREATE POLICY "commissions_select_v2" ON public.commissions
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR agent_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "commissions_insert_v2" ON public.commissions
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "commissions_update_v2" ON public.commissions
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٦. إصلاح commission_rules ────────────────────────────────────────
ALTER TABLE public.commission_rules
  DROP CONSTRAINT IF EXISTS commission_rules_company_id_fkey;

ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_rules_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "commission_rules_select" ON public.commission_rules;
DROP POLICY IF EXISTS "commission_rules_manage" ON public.commission_rules;

CREATE POLICY "commission_rules_select_v2" ON public.commission_rules
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "commission_rules_manage_v2" ON public.commission_rules
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٧. إصلاح inventory ──────────────────────────────────────────────
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "inventory_select" ON public.inventory;
DROP POLICY IF EXISTS "inventory_insert" ON public.inventory;
DROP POLICY IF EXISTS "inventory_update" ON public.inventory;
DROP POLICY IF EXISTS "inventory_delete" ON public.inventory;

-- المخزون: كل المستخدمين المصادق عليهم في الشركة يمكنهم الرؤية
CREATE POLICY "inventory_select_v2" ON public.inventory
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR company_id IS NULL  -- مخزون مشترك (سيُحذف لاحقًا)
    OR public.is_super_admin()
  );

CREATE POLICY "inventory_insert_v2" ON public.inventory
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "inventory_update_v2" ON public.inventory
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "inventory_delete_v2" ON public.inventory
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٨. إصلاح projects ───────────────────────────────────────────────
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_manage" ON public.projects;

CREATE POLICY "projects_select_v2" ON public.projects
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "projects_insert_v2" ON public.projects
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "projects_update_v2" ON public.projects
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "projects_delete_v2" ON public.projects
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ٩. إصلاح buildings (ترث company من project) ──────────────────
DROP POLICY IF EXISTS "buildings_select" ON public.buildings;
DROP POLICY IF EXISTS "buildings_manage" ON public.buildings;

CREATE POLICY "buildings_select_v2" ON public.buildings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.company_id = public.current_company_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "buildings_manage_v2" ON public.buildings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.company_id = public.current_company_id()
        AND public.is_company_manager()
    )
    OR public.is_super_admin()
  );

-- ─── ١٠. إصلاح lead_activities ────────────────────────────────────────
DROP POLICY IF EXISTS "lead_activities_select" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_insert" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_delete" ON public.lead_activities;

CREATE POLICY "lead_activities_select_v2" ON public.lead_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
        AND (l.company_id = public.current_company_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "lead_activities_insert_v2" ON public.lead_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
        AND l.company_id = public.current_company_id()
    )
  );

CREATE POLICY "lead_activities_update_v2" ON public.lead_activities
  FOR UPDATE USING (
    user_id = auth.uid()
    OR public.is_company_manager()
  );

CREATE POLICY "lead_activities_delete_v2" ON public.lead_activities
  FOR DELETE USING (
    user_id = auth.uid()
    OR public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ١١. إصلاح agent_targets ──────────────────────────────────────────
DROP POLICY IF EXISTS "company can manage targets" ON public.agent_targets;
DROP POLICY IF EXISTS "agents can read own targets" ON public.agent_targets;

ALTER TABLE public.agent_targets
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.profiles(id);

CREATE POLICY "targets_select_v2" ON public.agent_targets
  FOR SELECT USING (
    agent_id = auth.uid()
    OR (company_id = public.current_company_id() AND public.is_company_manager())
    OR public.is_super_admin()
  );

CREATE POLICY "targets_manage_v2" ON public.agent_targets
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ١٢. إصلاح resale_listings ────────────────────────────────────────
DROP POLICY IF EXISTS "resale_select" ON public.resale_listings;
DROP POLICY IF EXISTS "resale_insert" ON public.resale_listings;
DROP POLICY IF EXISTS "resale_update" ON public.resale_listings;
DROP POLICY IF EXISTS "resale_delete" ON public.resale_listings;

CREATE POLICY "resale_select_v2" ON public.resale_listings
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "resale_insert_v2" ON public.resale_listings
  FOR INSERT WITH CHECK (
    agent_id = auth.uid()
    AND company_id = public.current_company_id()
  );

CREATE POLICY "resale_update_v2" ON public.resale_listings
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (agent_id = auth.uid() OR public.is_company_manager())
    OR public.is_super_admin()
  );

CREATE POLICY "resale_delete_v2" ON public.resale_listings
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ١٣. إصلاح audit_logs ─────────────────────────────────────────────
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "company owners can read audit logs" ON public.audit_logs;

CREATE POLICY "audit_logs_select_v2" ON public.audit_logs
  FOR SELECT USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- ─── ١٤. إصلاح notifications ──────────────────────────────────────────
-- Notifications صحيحة بالفعل (user_id = auth.uid()) — لا تغيير مطلوب

-- ─── ١٥. Indexes إضافية لتحسين الأداء ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_company_id     ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id_v2  ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_commissions_company  ON public.commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id  ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company    ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_resale_company       ON public.resale_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company        ON public.audit_logs(company_id);

COMMENT ON FUNCTION public.current_company_id() IS
  'Returns the company_id of the currently authenticated user. Used in all RLS policies.';
COMMENT ON FUNCTION public.current_user_role() IS
  'Returns the role of the currently authenticated user.';
