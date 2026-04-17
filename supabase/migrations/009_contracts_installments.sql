-- =====================================================================
-- Migration 009: Contracts + Installment Plans + Contract Milestones
-- نظام إدارة العقود الكامل
-- =====================================================================

-- ─── ١. جدول العقود الرئيسي ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES public.profiles(id),
  deal_id             uuid        REFERENCES public.deals(id) ON DELETE SET NULL,
  agent_id            uuid        REFERENCES public.profiles(id),
  unit_id             uuid        REFERENCES public.inventory(id),

  -- معلومات العميل
  client_name         text        NOT NULL,
  client_phone        text,
  client_national_id  text,
  client_address      text,

  -- معلومات العقد
  contract_number     text        UNIQUE,
  contract_type       text        NOT NULL DEFAULT 'new_unit',
  -- new_unit | resale | rental | reservation

  -- القيم المالية
  total_value         numeric(15,2) NOT NULL DEFAULT 0,
  down_payment        numeric(15,2) NOT NULL DEFAULT 0,
  remaining_amount    numeric(15,2) GENERATED ALWAYS AS (total_value - down_payment) STORED,
  installment_months  integer     DEFAULT 0,
  maintenance_fee     numeric(15,2) DEFAULT 0,
  club_membership_fee numeric(15,2) DEFAULT 0,

  -- التواريخ
  contract_date       date,
  handover_date       date,
  signed_at           timestamptz,

  -- الحالة
  status              text        NOT NULL DEFAULT 'draft',
  -- draft | sent_to_client | signed | active | completed | cancelled | disputed

  -- الوثائق
  pdf_url             text,         -- رابط PDF العقد
  signed_pdf_url      text,         -- رابط العقد الموقّع
  esign_reference     text,         -- مرجع التوقيع الإلكتروني

  -- ملاحظات
  notes               text,
  internal_notes      text,         -- ملاحظات داخلية (لا يراها العميل)
  metadata            jsonb         DEFAULT '{}',

  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now()
);

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CNT-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('public.contract_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS public.contract_number_seq START 1000;

DROP TRIGGER IF EXISTS set_contract_number ON public.contracts;
CREATE TRIGGER set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_updated_at ON public.contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ٢. جدول خطط الأقساط ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  company_id          uuid        NOT NULL REFERENCES public.profiles(id),

  -- تفاصيل القسط
  installment_number  integer     NOT NULL,       -- رقم القسط (١، ٢، ٣...)
  installment_type    text        NOT NULL DEFAULT 'regular',
  -- regular | down_payment | maintenance | delivery | finishing

  amount              numeric(15,2) NOT NULL,
  due_date            date        NOT NULL,

  -- حالة الدفع
  status              text        NOT NULL DEFAULT 'pending',
  -- pending | paid | overdue | partially_paid | waived

  paid_amount         numeric(15,2) DEFAULT 0,
  paid_at             timestamptz,
  payment_method      text,
  -- cash | bank_transfer | check | card | installment_company

  receipt_number      text,
  receipt_url         text,
  notes               text,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS installments_updated_at ON public.installment_plans;
CREATE TRIGGER installments_updated_at
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ٣. مراحل العقد (Milestones) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_milestones (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  company_id          uuid        NOT NULL REFERENCES public.profiles(id),

  title               text        NOT NULL,     -- مثال: "تسليم الوحدة"، "التشطيبات"
  description         text,
  planned_date        date,
  actual_date         date,
  status              text        NOT NULL DEFAULT 'pending',
  -- pending | in_progress | completed | delayed

  sort_order          integer     DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

-- ─── ٤. سجل حالات العقد (Audit Trail) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_status_log (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  changed_by          uuid        REFERENCES public.profiles(id),
  from_status         text,
  to_status           text        NOT NULL,
  notes               text,
  created_at          timestamptz DEFAULT now()
);

-- Trigger: تسجيل كل تغيير في حالة العقد تلقائيًا
CREATE OR REPLACE FUNCTION public.log_contract_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.contract_status_log(contract_id, changed_by, from_status, to_status)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_status_change_log ON public.contracts;
CREATE TRIGGER contract_status_change_log
  AFTER UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_contract_status_change();

-- ─── ٥. دالة حساب الأقساط المتأخرة ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_overdue_installments(p_company_id uuid)
RETURNS TABLE(
  contract_id uuid,
  contract_number text,
  client_name text,
  installment_number integer,
  amount numeric,
  due_date date,
  days_overdue integer
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id,
    c.contract_number,
    c.client_name,
    i.installment_number,
    i.amount,
    i.due_date,
    (CURRENT_DATE - i.due_date)::integer AS days_overdue
  FROM public.installment_plans i
  JOIN public.contracts c ON c.id = i.contract_id
  WHERE i.status = 'pending'
    AND i.due_date < CURRENT_DATE
    AND c.company_id = p_company_id
  ORDER BY i.due_date ASC;
$$;

-- ─── ٦. دالة ملخص مالي للعقد ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_contract_financial_summary(p_contract_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'total_value', c.total_value,
    'total_paid', COALESCE(SUM(i.paid_amount), 0),
    'total_remaining', c.total_value - COALESCE(SUM(i.paid_amount), 0),
    'overdue_amount', COALESCE(SUM(CASE WHEN i.status='overdue' THEN i.amount - i.paid_amount ELSE 0 END), 0),
    'next_installment_date', MIN(CASE WHEN i.status='pending' THEN i.due_date END),
    'completion_percentage', ROUND(
      (COALESCE(SUM(i.paid_amount), 0) / NULLIF(c.total_value, 0)) * 100, 1
    )
  )
  FROM public.contracts c
  LEFT JOIN public.installment_plans i ON i.contract_id = c.id
  WHERE c.id = p_contract_id
  GROUP BY c.id, c.total_value;
$$;

-- ─── ٧. RLS للجداول الجديدة ───────────────────────────────────────────
ALTER TABLE public.contracts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_milestones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_status_log   ENABLE ROW LEVEL SECURITY;

-- contracts
CREATE POLICY "contracts_select" ON public.contracts
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR agent_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (agent_id = auth.uid() OR public.is_company_manager())
    OR public.is_super_admin()
  );

CREATE POLICY "contracts_delete" ON public.contracts
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- installment_plans
CREATE POLICY "installments_select" ON public.installment_plans
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "installments_manage" ON public.installment_plans
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- contract_milestones
CREATE POLICY "milestones_select" ON public.contract_milestones
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "milestones_manage" ON public.contract_milestones
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- contract_status_log (قراءة فقط للمستخدمين)
CREATE POLICY "contract_log_select" ON public.contract_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.company_id = public.current_company_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "contract_log_insert" ON public.contract_status_log
  FOR INSERT WITH CHECK (true); -- يتم عبر trigger فقط

-- ─── ٨. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_company        ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id        ON public.contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_agent_id       ON public.contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id        ON public.contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status         ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_number         ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_installments_contract    ON public.installment_plans(contract_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date    ON public.installment_plans(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status      ON public.installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_milestones_contract      ON public.contract_milestones(contract_id);

-- Realtime للأقساط
ALTER PUBLICATION supabase_realtime ADD TABLE public.installment_plans;
