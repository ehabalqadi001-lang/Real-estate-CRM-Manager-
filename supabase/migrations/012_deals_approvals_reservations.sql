-- =====================================================================
-- Migration 012: Deal Approvals + Unit Reservations Complete
-- نظام الموافقات على الصفقات وحجوزات الوحدات
-- =====================================================================

-- ─── ١. تحسين مراحل الصفقة (Enum-like) ───────────────────────────────
-- أضف حقول مفقودة لجدول deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS stage           text DEFAULT 'lead',
  -- lead | qualified | site_visit | proposal | negotiation |
  -- reservation | contract | closed_won | closed_lost
  ADD COLUMN IF NOT EXISTS unit_value      numeric(15,2),
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS lost_reason     text,
  ADD COLUMN IF NOT EXISTS expected_close_date date,
  ADD COLUMN IF NOT EXISTS actual_close_date   date,
  ADD COLUMN IF NOT EXISTS contract_id    uuid,  -- FK يُضاف بعد migration 009
  ADD COLUMN IF NOT EXISTS probability    integer DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  ADD COLUMN IF NOT EXISTS source         text,
  ADD COLUMN IF NOT EXISTS tags           text[] DEFAULT '{}';

-- ─── ٢. جدول موافقات الصفقات (Multi-level Approval Workflow) ─────────
CREATE TABLE IF NOT EXISTS public.deal_approvals (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid      NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),

  -- مستوى الموافقة
  level           integer   NOT NULL DEFAULT 1,  -- ١=مدير فريق، ٢=مدير مبيعات، ٣=مدير الشركة
  level_name      text      NOT NULL,             -- "مدير الفريق"، "مدير المبيعات"

  -- الموافقة
  approver_id     uuid      REFERENCES public.profiles(id),  -- من يجب أن يوافق
  approved_by     uuid      REFERENCES public.profiles(id),  -- من وافق فعلًا
  status          text      NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected | skipped

  notes           text,
  decided_at      timestamptz,

  created_at      timestamptz DEFAULT now()
);

-- دالة: إنشاء workflow موافقة تلقائي عند إنشاء صفقة
CREATE OR REPLACE FUNCTION public.create_deal_approval_workflow(
  p_deal_id uuid,
  p_company_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_team_leader uuid;
  v_sales_director uuid;
BEGIN
  -- المستوى ١: مدير الفريق
  SELECT id INTO v_team_leader
  FROM public.profiles
  WHERE company_id = p_company_id AND role = 'team_leader'
  LIMIT 1;

  -- المستوى ٢: مدير المبيعات
  SELECT id INTO v_sales_director
  FROM public.profiles
  WHERE company_id = p_company_id AND role = 'sales_director'
  LIMIT 1;

  INSERT INTO public.deal_approvals(deal_id, company_id, level, level_name, approver_id)
  VALUES
    (p_deal_id, p_company_id, 1, 'مدير الفريق', v_team_leader),
    (p_deal_id, p_company_id, 2, 'مدير المبيعات', v_sales_director)
  ON CONFLICT DO NOTHING;
END;
$$;

-- ─── ٣. حجوزات الوحدات الكاملة (مع Timer وتلقائي الإلغاء) ────────────
CREATE TABLE IF NOT EXISTS public.unit_reservations (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         uuid      NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),
  deal_id         uuid      REFERENCES public.deals(id) ON DELETE SET NULL,
  lead_id         uuid      REFERENCES public.leads(id) ON DELETE SET NULL,
  reserved_by     uuid      NOT NULL REFERENCES public.profiles(id),

  -- معلومات الحجز
  client_name     text,
  client_phone    text,
  reservation_fee numeric(15,2) DEFAULT 0,  -- عربون الحجز
  receipt_url     text,

  -- التوقيت
  reserved_at     timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  -- قابل للتمديد
  extension_count integer     DEFAULT 0,
  max_extensions  integer     DEFAULT 2,

  -- الحالة
  status          text        NOT NULL DEFAULT 'active',
  -- active | expired | converted_to_contract | cancelled

  cancelled_at    timestamptz,
  cancel_reason   text,
  converted_at    timestamptz,

  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Trigger: تحديث حالة الوحدة عند الحجز
CREATE OR REPLACE FUNCTION public.update_unit_on_reservation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory
    SET status = 'reserved'
    WHERE id = NEW.unit_id;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('expired', 'cancelled') AND OLD.status = 'active' THEN
      -- تحرير الوحدة إذا لم تتحول لعقد
      UPDATE public.inventory
      SET status = 'available'
      WHERE id = NEW.unit_id
        AND id NOT IN (
          SELECT unit_id FROM public.unit_reservations
          WHERE status = 'active' AND unit_id = NEW.unit_id AND id != NEW.id
        );
    ELSIF NEW.status = 'converted_to_contract' THEN
      UPDATE public.inventory SET status = 'sold' WHERE id = NEW.unit_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS unit_reservation_sync ON public.unit_reservations;
CREATE TRIGGER unit_reservation_sync
  AFTER INSERT OR UPDATE ON public.unit_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_unit_on_reservation();

-- دالة: تمديد مدة الحجز
CREATE OR REPLACE FUNCTION public.extend_reservation(
  p_reservation_id uuid,
  p_hours integer DEFAULT 24
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reservation public.unit_reservations%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation FROM public.unit_reservations WHERE id = p_reservation_id;

  IF v_reservation.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'الحجز غير نشط');
  END IF;

  IF v_reservation.extension_count >= v_reservation.max_extensions THEN
    RETURN jsonb_build_object('success', false, 'error', 'تم تجاوز الحد الأقصى للتمديدات');
  END IF;

  UPDATE public.unit_reservations
  SET
    expires_at = expires_at + (p_hours || ' hours')::interval,
    extension_count = extension_count + 1
  WHERE id = p_reservation_id;

  RETURN jsonb_build_object('success', true, 'new_expiry', (v_reservation.expires_at + (p_hours || ' hours')::interval));
END;
$$;

-- ─── ٤. سجل مراحل الصفقة ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deal_stage_log (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid      NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  changed_by      uuid      REFERENCES public.profiles(id),
  from_stage      text,
  to_stage        text      NOT NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Trigger: تسجيل كل تغيير في مرحلة الصفقة
CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.deal_stage_log(deal_id, changed_by, from_stage, to_stage)
    VALUES (NEW.id, auth.uid(), OLD.stage, NEW.stage);

    -- تحديث تاريخ الإغلاق الفعلي
    IF NEW.stage = 'closed_won' THEN
      NEW.actual_close_date := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deal_stage_change_log ON public.deals;
CREATE TRIGGER deal_stage_change_log
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_stage_change();

-- ─── ٥. View: لوحة Kanban للصفقات ────────────────────────────────────
CREATE OR REPLACE VIEW public.deals_kanban AS
SELECT
  d.id,
  d.stage,
  d.unit_value,
  d.probability,
  d.expected_close_date,
  d.created_at,
  l.client_name,
  l.phone,
  l.score AS lead_score,
  p.full_name AS agent_name,
  i.unit_name,
  i.unit_type,
  pr.name AS project_name,
  d.company_id,
  d.agent_id,
  -- احسب مدة الصفقة بالأيام
  EXTRACT(day FROM now() - d.created_at)::integer AS age_days
FROM public.deals d
LEFT JOIN public.leads l       ON l.id = d.lead_id
LEFT JOIN public.profiles p    ON p.id = d.agent_id
LEFT JOIN public.inventory i   ON i.id = d.unit_id
LEFT JOIN public.projects pr   ON pr.id = i.project_id;

-- ─── ٦. Dashboard Summary Function ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_deals_summary(p_company_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'total_open', COUNT(*) FILTER (WHERE stage NOT IN ('closed_won','closed_lost')),
    'closed_won_count', COUNT(*) FILTER (WHERE stage = 'closed_won'),
    'closed_won_value', COALESCE(SUM(unit_value) FILTER (WHERE stage = 'closed_won'), 0),
    'pipeline_value', COALESCE(SUM(unit_value) FILTER (WHERE stage NOT IN ('closed_won','closed_lost')), 0),
    'this_month_closed', COUNT(*) FILTER (
      WHERE stage = 'closed_won'
        AND actual_close_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'avg_deal_value', COALESCE(AVG(unit_value) FILTER (WHERE stage = 'closed_won'), 0)
  )
  FROM public.deals
  WHERE company_id = p_company_id;
$$;

-- ─── ٧. RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.deal_approvals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stage_log     ENABLE ROW LEVEL SECURITY;

-- deal_approvals
CREATE POLICY "deal_approvals_select" ON public.deal_approvals
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR approver_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "deal_approvals_update" ON public.deal_approvals
  FOR UPDATE USING (
    (approver_id = auth.uid() OR public.is_company_manager())
    AND company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "deal_approvals_insert" ON public.deal_approvals
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

-- unit_reservations
CREATE POLICY "reservations_select" ON public.unit_reservations
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR reserved_by = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "reservations_insert" ON public.unit_reservations
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    AND reserved_by = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "reservations_update" ON public.unit_reservations
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (reserved_by = auth.uid() OR public.is_company_manager())
    OR public.is_super_admin()
  );

-- deal_stage_log
CREATE POLICY "stage_log_select" ON public.deal_stage_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
        AND (d.company_id = public.current_company_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "stage_log_insert" ON public.deal_stage_log
  FOR INSERT WITH CHECK (true); -- عبر trigger فقط

-- ─── ٨. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deals_stage         ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_agent_id      ON public.deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_close_date    ON public.deals(actual_close_date);
CREATE INDEX IF NOT EXISTS idx_deal_approvals_deal ON public.deal_approvals(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_approvals_appr ON public.deal_approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_unit   ON public.unit_reservations(unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.unit_reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON public.unit_reservations(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stage_log_deal      ON public.deal_stage_log(deal_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unit_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_approvals;
