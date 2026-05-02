-- ============================================================
-- HR Full RLS Policies — 2026-05-02
-- Covers every table created in the HR module migrations
-- that was left without a policy.
-- ============================================================

-- ── Helper: is_hr_role() ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_hr_role()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN (
    'super_admin','platform_admin',
    'hr_manager','hr_staff','hr_officer',
    'finance_manager'
  )
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ── Helper: my_employee_id() ─────────────────────────────────
-- Returns the employees.id for the current user (may be null)
CREATE OR REPLACE FUNCTION public.my_employee_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. leave_types
--    company_id is nullable (NULL = system global defaults)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lt_read"   ON public.leave_types;
DROP POLICY IF EXISTS "lt_manage" ON public.leave_types;

CREATE POLICY "lt_read" ON public.leave_types
  FOR SELECT USING (
    company_id IS NULL                          -- global defaults visible to all
    OR company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "lt_manage" ON public.leave_types
  FOR ALL USING (public.is_hr_role())
  WITH CHECK (public.is_hr_role());

-- ─────────────────────────────────────────────────────────────
-- 2. leave_requests
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lr_read"       ON public.leave_requests;
DROP POLICY IF EXISTS "lr_self_write" ON public.leave_requests;
DROP POLICY IF EXISTS "lr_hr_manage"  ON public.leave_requests;

CREATE POLICY "lr_read" ON public.leave_requests
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "lr_self_write" ON public.leave_requests
  FOR INSERT WITH CHECK (
    employee_id = public.my_employee_id()
    AND company_id = public.current_company_id()
  );

CREATE POLICY "lr_hr_manage" ON public.leave_requests
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 3. leave_balances
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lb_read"    ON public.leave_balances;
DROP POLICY IF EXISTS "lb_manage"  ON public.leave_balances;

CREATE POLICY "lb_read" ON public.leave_balances
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "lb_manage" ON public.leave_balances
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 4. onboarding_tasks
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ot_read"    ON public.onboarding_tasks;
DROP POLICY IF EXISTS "ot_manage"  ON public.onboarding_tasks;

CREATE POLICY "ot_read" ON public.onboarding_tasks
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "ot_manage" ON public.onboarding_tasks
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 5. performance_reviews
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pr_read"    ON public.performance_reviews;
DROP POLICY IF EXISTS "pr_manage"  ON public.performance_reviews;

CREATE POLICY "pr_read" ON public.performance_reviews
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
    OR reviewer_id = auth.uid()
  );

CREATE POLICY "pr_manage" ON public.performance_reviews
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR reviewer_id = auth.uid()
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR reviewer_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- 6. performance_goals
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pg_read"    ON public.performance_goals;
DROP POLICY IF EXISTS "pg_manage"  ON public.performance_goals;

CREATE POLICY "pg_read" ON public.performance_goals
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "pg_manage" ON public.performance_goals
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 7. employee_documents
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ed_read"    ON public.employee_documents;
DROP POLICY IF EXISTS "ed_manage"  ON public.employee_documents;

CREATE POLICY "ed_read" ON public.employee_documents
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "ed_manage" ON public.employee_documents
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 9. hr_notifications  (recipient-private)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "hn_read"    ON public.hr_notifications;
DROP POLICY IF EXISTS "hn_mark"    ON public.hr_notifications;
DROP POLICY IF EXISTS "hn_insert"  ON public.hr_notifications;

CREATE POLICY "hn_read" ON public.hr_notifications
  FOR SELECT USING (
    recipient_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "hn_mark" ON public.hr_notifications
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "hn_insert" ON public.hr_notifications
  FOR INSERT WITH CHECK (
    public.is_hr_role()
    OR public.is_super_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 10. talent_candidates
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tc_read"    ON public.talent_candidates;
DROP POLICY IF EXISTS "tc_manage"  ON public.talent_candidates;

CREATE POLICY "tc_read" ON public.talent_candidates
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

CREATE POLICY "tc_manage" ON public.talent_candidates
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 11. offer_letters
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ol_read"    ON public.offer_letters;
DROP POLICY IF EXISTS "ol_manage"  ON public.offer_letters;

CREATE POLICY "ol_read" ON public.offer_letters
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR candidate_id IN (
      SELECT id FROM public.talent_candidates
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ol_manage" ON public.offer_letters
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 12. learning_courses
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lc_read"    ON public.learning_courses;
DROP POLICY IF EXISTS "lc_manage"  ON public.learning_courses;

CREATE POLICY "lc_read" ON public.learning_courses
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id = public.current_company_id()
    OR company_id IS NULL   -- global courses
  );

CREATE POLICY "lc_manage" ON public.learning_courses
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 13. course_enrollments
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ce_read"    ON public.course_enrollments;
DROP POLICY IF EXISTS "ce_self"    ON public.course_enrollments;
DROP POLICY IF EXISTS "ce_manage"  ON public.course_enrollments;

CREATE POLICY "ce_read" ON public.course_enrollments
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "ce_self" ON public.course_enrollments
  FOR INSERT WITH CHECK (
    employee_id = public.my_employee_id()
    AND company_id = public.current_company_id()
  );

CREATE POLICY "ce_manage" ON public.course_enrollments
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 14. skill_assessments
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sa_read"    ON public.skill_assessments;
DROP POLICY IF EXISTS "sa_manage"  ON public.skill_assessments;

CREATE POLICY "sa_read" ON public.skill_assessments
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "sa_manage" ON public.skill_assessments
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 15. burnout_indicators
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bi_read"    ON public.burnout_indicators;
DROP POLICY IF EXISTS "bi_manage"  ON public.burnout_indicators;

CREATE POLICY "bi_read" ON public.burnout_indicators
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "bi_manage" ON public.burnout_indicators
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 16. employee_pulse  (employees fill their own; HR reads all)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ep_read"    ON public.employee_pulse;
DROP POLICY IF EXISTS "ep_self"    ON public.employee_pulse;
DROP POLICY IF EXISTS "ep_manage"  ON public.employee_pulse;

CREATE POLICY "ep_read" ON public.employee_pulse
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "ep_self" ON public.employee_pulse
  FOR INSERT WITH CHECK (
    employee_id = public.my_employee_id()
    AND company_id = public.current_company_id()
  );

CREATE POLICY "ep_manage" ON public.employee_pulse
  FOR UPDATE USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

-- ─────────────────────────────────────────────────────────────
-- 17. cost_centers
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cc_read"    ON public.cost_centers;
DROP POLICY IF EXISTS "cc_manage"  ON public.cost_centers;

CREATE POLICY "cc_read" ON public.cost_centers
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id = public.current_company_id()
  );

CREATE POLICY "cc_manage" ON public.cost_centers
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 18. budgets
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bud_read"    ON public.budgets;
DROP POLICY IF EXISTS "bud_manage"  ON public.budgets;

CREATE POLICY "bud_read" ON public.budgets
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id = public.current_company_id()
  );

CREATE POLICY "bud_manage" ON public.budgets
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- 19. commission_deals
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cd_read"    ON public.commission_deals;
DROP POLICY IF EXISTS "cd_manage"  ON public.commission_deals;

CREATE POLICY "cd_read" ON public.commission_deals
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
    OR employee_id = public.my_employee_id()
  );

CREATE POLICY "cd_manage" ON public.commission_deals
  FOR ALL USING (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_hr_role() AND company_id = public.current_company_id())
  );

-- ─────────────────────────────────────────────────────────────
-- Grant execute on new helper functions
-- ─────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.is_hr_role()     TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_employee_id() TO authenticated;
