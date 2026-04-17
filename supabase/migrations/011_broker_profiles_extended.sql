-- =====================================================================
-- Migration 011: Broker Profiles Extended + Documents + Stats
-- نظام الوسطاء الكامل
-- =====================================================================

-- ─── ١. توسعة جدول broker_profiles ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id                    uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            uuid      NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id            uuid      REFERENCES public.profiles(id),

  -- البيانات الشخصية
  display_name          text,
  bio                   text,
  photo_url             text,
  phone_secondary       text,

  -- الهوية والتوثيق
  national_id           text,
  national_id_url       text,     -- Supabase Storage URL
  national_id_expiry    date,
  tax_card_number       text,
  tax_card_url          text,
  commercial_license    text,
  commercial_license_url text,

  -- البنك
  bank_name             text,
  bank_account_name     text,
  bank_account_number   text,
  bank_iban             text,

  -- الوضع والتوثيق
  verification_status   text      NOT NULL DEFAULT 'pending',
  -- pending | under_review | verified | rejected | suspended
  verified_at           timestamptz,
  verified_by           uuid      REFERENCES public.profiles(id),
  rejection_reason      text,

  -- الأداء والإحصائيات
  rating                numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_deals           integer   DEFAULT 0,
  total_sales_value     numeric(15,2) DEFAULT 0,
  total_commissions_earned numeric(15,2) DEFAULT 0,
  pending_commissions   numeric(15,2) DEFAULT 0,
  active_leads          integer   DEFAULT 0,

  -- الإعدادات
  preferred_areas       text[]    DEFAULT '{}',
  -- ['new_capital', 'new_cairo', 'north_coast', ...]
  unit_types_interest   text[]    DEFAULT '{}',
  notification_prefs    jsonb     DEFAULT '{"email": true, "whatsapp": true, "push": true}',

  -- Onboarding
  onboarding_completed  boolean   DEFAULT false,
  onboarding_step       integer   DEFAULT 1,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS broker_profiles_updated_at ON public.broker_profiles;
CREATE TRIGGER broker_profiles_updated_at
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ٢. وثائق الوسيط ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_documents (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       uuid      NOT NULL REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  company_id      uuid      REFERENCES public.profiles(id),

  type            text      NOT NULL,
  -- national_id | tax_card | commercial_license | bank_statement | other

  name            text      NOT NULL,
  url             text      NOT NULL,
  file_size       bigint,
  mime_type       text,

  status          text      NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected | expired

  reviewed_by     uuid      REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  rejection_reason text,
  expiry_date     date,

  created_at      timestamptz DEFAULT now()
);

-- ─── ٣. تقييمات الوسيط من العملاء والإدارة ──────────────────────────
CREATE TABLE IF NOT EXISTS public.broker_ratings (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       uuid      NOT NULL REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  company_id      uuid      REFERENCES public.profiles(id),
  deal_id         uuid      REFERENCES public.deals(id),
  rated_by        uuid      REFERENCES public.profiles(id),

  rating          integer   NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback        text,
  rating_type     text      DEFAULT 'client',  -- client | internal | auto

  created_at      timestamptz DEFAULT now()
);

-- ─── ٤. دالة تحديث إحصائيات الوسيط تلقائيًا ─────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_broker_stats(p_broker_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT profile_id INTO v_profile_id
  FROM public.broker_profiles
  WHERE id = p_broker_id;

  UPDATE public.broker_profiles
  SET
    total_deals = (
      SELECT COUNT(*) FROM public.deals
      WHERE agent_id = v_profile_id AND stage = 'closed_won'
    ),
    total_sales_value = (
      SELECT COALESCE(SUM(unit_value), 0) FROM public.deals
      WHERE agent_id = v_profile_id AND stage = 'closed_won'
    ),
    total_commissions_earned = (
      SELECT COALESCE(SUM(amount), 0) FROM public.commissions
      WHERE agent_id = v_profile_id AND status = 'paid'
    ),
    pending_commissions = (
      SELECT COALESCE(SUM(amount), 0) FROM public.commissions
      WHERE agent_id = v_profile_id AND status IN ('pending', 'approved')
    ),
    active_leads = (
      SELECT COUNT(*) FROM public.leads
      WHERE (user_id = v_profile_id OR assigned_to = v_profile_id)
        AND status NOT IN ('contracted', 'lost', 'cancelled')
    ),
    rating = (
      SELECT COALESCE(AVG(rating::numeric), 0)
      FROM public.broker_ratings
      WHERE broker_id = p_broker_id
    ),
    updated_at = now()
  WHERE id = p_broker_id;
END;
$$;

-- ─── ٥. Trigger: تحديث الإحصائيات عند إغلاق صفقة ───────────────────
CREATE OR REPLACE FUNCTION public.update_broker_stats_on_deal()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_broker_id uuid;
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    SELECT id INTO v_broker_id
    FROM public.broker_profiles
    WHERE profile_id = NEW.agent_id;

    IF v_broker_id IS NOT NULL THEN
      PERFORM public.refresh_broker_stats(v_broker_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_stats_on_deal ON public.deals;
CREATE TRIGGER broker_stats_on_deal
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_broker_stats_on_deal();

-- ─── ٦. Trigger: إنشاء broker_profile تلقائيًا عند تسجيل وسيط ────────
CREATE OR REPLACE FUNCTION public.create_broker_profile_on_register()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IN ('broker', 'freelancer') THEN
    INSERT INTO public.broker_profiles(profile_id, company_id, display_name)
    VALUES (NEW.id, NEW.company_id, NEW.full_name)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_create_broker_profile ON public.profiles;
CREATE TRIGGER auto_create_broker_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_broker_profile_on_register();

-- ─── ٧. Leaderboard View ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.broker_leaderboard AS
SELECT
  bp.id AS broker_id,
  p.full_name,
  p.email,
  bp.photo_url,
  bp.rating,
  bp.total_deals,
  bp.total_sales_value,
  bp.total_commissions_earned,
  bp.pending_commissions,
  bp.active_leads,
  bp.verification_status,
  p.company_id,
  RANK() OVER (PARTITION BY p.company_id ORDER BY bp.total_sales_value DESC) AS rank_by_sales,
  RANK() OVER (PARTITION BY p.company_id ORDER BY bp.total_deals DESC) AS rank_by_deals
FROM public.broker_profiles bp
JOIN public.profiles p ON p.id = bp.profile_id
WHERE bp.verification_status = 'verified';

-- ─── ٨. RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.broker_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_ratings   ENABLE ROW LEVEL SECURITY;

-- broker_profiles: الوسيط يرى ملفه، المدراء يرون شركتهم
CREATE POLICY "broker_profiles_select" ON public.broker_profiles
  FOR SELECT USING (
    profile_id = auth.uid()
    OR company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "broker_profiles_insert" ON public.broker_profiles
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    OR public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "broker_profiles_update" ON public.broker_profiles
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR (company_id = public.current_company_id() AND public.is_company_manager())
    OR public.is_super_admin()
  );

-- broker_documents
CREATE POLICY "broker_docs_select" ON public.broker_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.broker_profiles bp
      WHERE bp.id = broker_id
        AND (bp.profile_id = auth.uid()
          OR bp.company_id = public.current_company_id()
          OR public.is_super_admin())
    )
  );

CREATE POLICY "broker_docs_insert" ON public.broker_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.broker_profiles bp
      WHERE bp.id = broker_id AND bp.profile_id = auth.uid()
    )
    OR public.is_company_manager()
    OR public.is_super_admin()
  );

CREATE POLICY "broker_docs_update" ON public.broker_documents
  FOR UPDATE USING (
    (company_id = public.current_company_id() AND public.is_company_manager())
    OR public.is_super_admin()
  );

-- broker_ratings
CREATE POLICY "broker_ratings_select" ON public.broker_ratings
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "broker_ratings_insert" ON public.broker_ratings
  FOR INSERT WITH CHECK (
    rated_by = auth.uid()
    AND company_id = public.current_company_id()
  );

-- ─── ٩. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_broker_profiles_profile   ON public.broker_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_broker_profiles_company   ON public.broker_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_broker_profiles_status    ON public.broker_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_broker_docs_broker        ON public.broker_documents(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_ratings_broker     ON public.broker_ratings(broker_id);
