-- =========================================================
-- Migration: EOI Requests + Unit Reservations patch + Sale Claims
-- =========================================================

-- ─── 1. eoi_requests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eoi_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eoi_number        text        NOT NULL,
  company_id        uuid        NOT NULL REFERENCES public.profiles(id),
  agent_id          uuid        REFERENCES public.profiles(id),
  unit_id           uuid        REFERENCES public.inventory(id) ON DELETE SET NULL,

  client_name       text        NOT NULL,
  client_phone      text,
  client_email      text,

  amount            numeric(15,2),
  notes             text,
  status            text        NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected | converted | expired

  expiry_date       timestamptz,
  converted_deal_id uuid        REFERENCES public.deals(id) ON DELETE SET NULL,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.eoi_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eoi_select" ON public.eoi_requests
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR agent_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "eoi_insert" ON public.eoi_requests
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "eoi_update" ON public.eoi_requests
  FOR UPDATE USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE INDEX IF NOT EXISTS idx_eoi_company   ON public.eoi_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_eoi_agent     ON public.eoi_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_eoi_status    ON public.eoi_requests(status);
CREATE INDEX IF NOT EXISTS idx_eoi_unit      ON public.eoi_requests(unit_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.eoi_requests;

-- ─── 2. unit_reservations — patch missing columns ────────
ALTER TABLE public.unit_reservations
  ADD COLUMN IF NOT EXISTS agent_id       uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(15,2);

-- ─── 3. sale_claims ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sale_claims (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number        text        NOT NULL,
  company_id          uuid        NOT NULL REFERENCES public.profiles(id),
  agent_id            uuid        NOT NULL REFERENCES public.profiles(id),

  -- links to pipeline
  unit_id             uuid        REFERENCES public.inventory(id)      ON DELETE SET NULL,
  reservation_id      uuid        REFERENCES public.unit_reservations(id) ON DELETE SET NULL,
  deal_id             uuid        REFERENCES public.deals(id)           ON DELETE SET NULL,

  -- buyer
  buyer_name          text        NOT NULL,
  buyer_phone         text,
  buyer_email         text,
  buyer_national_id   text,

  -- financials
  sale_price          numeric(15,2) NOT NULL,
  down_payment        numeric(15,2),
  commission_rate     numeric(5,2),   -- percentage, e.g. 2.5
  commission_amount   numeric(15,2),

  -- contract meta
  contract_date       date,
  installment_years   integer,
  notes               text,

  -- workflow
  status              text        NOT NULL DEFAULT 'draft',
  -- draft | submitted | under_review | approved | rejected | paid

  reviewed_by         uuid        REFERENCES public.profiles(id),
  reviewed_at         timestamptz,
  review_notes        text,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.sale_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims_select" ON public.sale_claims
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR agent_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "claims_insert" ON public.sale_claims
  FOR INSERT WITH CHECK (
    company_id = public.current_company_id()
    AND agent_id = auth.uid()
    OR public.is_super_admin()
  );

CREATE POLICY "claims_update" ON public.sale_claims
  FOR UPDATE USING (
    company_id = public.current_company_id()
    AND (agent_id = auth.uid() OR public.is_company_manager())
    OR public.is_super_admin()
  );

CREATE INDEX IF NOT EXISTS idx_claims_company  ON public.sale_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_claims_agent    ON public.sale_claims(agent_id);
CREATE INDEX IF NOT EXISTS idx_claims_status   ON public.sale_claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_unit     ON public.sale_claims(unit_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_claims;
