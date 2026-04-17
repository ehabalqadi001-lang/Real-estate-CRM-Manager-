-- =====================================================================
-- Migration 013: Advanced CRM — Referrals + SMS + Customer Journey
-- نظام CRM المتقدم: الإحالات، رسائل SMS، رحلة العميل
-- =====================================================================

-- ─── ١. مصادر العملاء المحتملين (Lead Sources) ────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),

  name            text      NOT NULL,   -- "فيسبوك"، "تفويض"، "موقع ويب"...
  name_en         text,
  type            text      NOT NULL DEFAULT 'digital',
  -- digital | referral | direct | event | developer | other

  channel         text,   -- facebook | google | instagram | tiktok | whatsapp | email | phone
  cost_per_lead   numeric(10,2) DEFAULT 0,   -- تكلفة الحصول على العميل
  is_active       boolean   DEFAULT true,
  sort_order      integer   DEFAULT 0,

  -- إحصائيات (تُحدَّث تلقائيًا)
  total_leads     integer   DEFAULT 0,
  converted_leads integer   DEFAULT 0,
  conversion_rate numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_leads > 0
    THEN ROUND((converted_leads::numeric / total_leads) * 100, 2)
    ELSE 0 END
  ) STORED,

  created_at      timestamptz DEFAULT now()
);

-- إدراج مصادر نموذجية للسوق المصري
INSERT INTO public.lead_sources(company_id, name, name_en, type, channel)
SELECT
  p.id AS company_id,
  unnest(ARRAY[
    'فيسبوك', 'إنستجرام', 'جوجل', 'تيك توك', 'واتساب',
    'تفويض من عميل', 'معرض عقاري', 'موقع الويب', 'اتصال مباشر',
    'إعلان في الجريدة', 'المطوّر مباشرة', 'شريك وسيط', 'أخرى'
  ]) AS name,
  unnest(ARRAY[
    'Facebook','Instagram','Google','TikTok','WhatsApp',
    'Client Referral','Real Estate Expo','Website','Direct Call',
    'Newspaper Ad','Developer Direct','Partner Broker','Other'
  ]) AS name_en,
  unnest(ARRAY[
    'digital','digital','digital','digital','digital',
    'referral','event','digital','direct',
    'direct','developer','referral','other'
  ]) AS type,
  unnest(ARRAY[
    'facebook','instagram','google','tiktok','whatsapp',
    NULL,'event','website','phone',
    NULL,NULL,NULL,NULL
  ]) AS channel
FROM public.profiles p
WHERE p.role IN ('company_owner','company_admin','admin','company')
ON CONFLICT DO NOTHING;

-- ─── ٢. ربط العميل بمصدره ─────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source_id      uuid REFERENCES public.lead_sources(id),
  ADD COLUMN IF NOT EXISTS utm_source     text,
  ADD COLUMN IF NOT EXISTS utm_medium     text,
  ADD COLUMN IF NOT EXISTS utm_campaign   text,
  ADD COLUMN IF NOT EXISTS referrer_id    uuid REFERENCES public.profiles(id),
  -- الوسيط أو الشخص الذي أحاله
  ADD COLUMN IF NOT EXISTS budget_min     numeric(15,2),
  ADD COLUMN IF NOT EXISTS budget_max     numeric(15,2),
  ADD COLUMN IF NOT EXISTS timeline       text DEFAULT 'flexible',
  -- urgent | 3_months | 6_months | 1_year | flexible
  ADD COLUMN IF NOT EXISTS preferred_area text,
  ADD COLUMN IF NOT EXISTS unit_type_pref text,
  ADD COLUMN IF NOT EXISTS floor_pref     text,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;

-- ─── ٣. نظام الإحالات ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),

  -- من أحال؟
  referrer_type   text      NOT NULL DEFAULT 'client',
  -- client | broker | employee | partner
  referrer_id     uuid      REFERENCES public.profiles(id),
  referrer_name   text,     -- للإحالات الخارجية
  referrer_phone  text,

  -- العميل المُحال
  lead_id         uuid      REFERENCES public.leads(id),
  deal_id         uuid      REFERENCES public.deals(id),

  -- مكافأة الإحالة
  reward_type     text      DEFAULT 'none',
  -- none | percentage | fixed | gift
  reward_value    numeric(10,2),
  reward_status   text      DEFAULT 'pending',
  -- pending | earned | paid | cancelled
  reward_paid_at  timestamptz,

  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ─── ٤. سجل رسائل SMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),
  sent_by         uuid      REFERENCES public.profiles(id),
  lead_id         uuid      REFERENCES public.leads(id),

  recipient_phone text      NOT NULL,
  recipient_name  text,
  message         text      NOT NULL,
  template_key    text,     -- مفتاح القالب المستخدم

  -- الحالة
  status          text      NOT NULL DEFAULT 'queued',
  -- queued | sent | delivered | failed | rejected

  provider        text      DEFAULT 'vodafone',
  -- vodafone | etisalat | we | twilio
  provider_msg_id text,     -- معرّف الرسالة عند المزوّد
  cost            numeric(8,4) DEFAULT 0,

  sent_at         timestamptz,
  delivered_at    timestamptz,
  failed_reason   text,

  created_at      timestamptz DEFAULT now()
);

-- ─── ٥. قوالب الرسائل ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_templates (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),

  key             text      NOT NULL,   -- معرف فريد: 'welcome_new_lead'
  name            text      NOT NULL,   -- اسم القالب
  channel         text      NOT NULL DEFAULT 'whatsapp',
  -- whatsapp | sms | email

  subject         text,     -- للإيميلات
  body_ar         text      NOT NULL,   -- النص بالعربية
  body_en         text,                 -- النص بالإنجليزية
  -- متغيرات: {{client_name}}, {{agent_name}}, {{project_name}}, {{unit_value}}

  is_active       boolean   DEFAULT true,
  usage_count     integer   DEFAULT 0,
  created_at      timestamptz DEFAULT now(),

  UNIQUE(company_id, key, channel)
);

-- إدراج قوالب نموذجية
CREATE OR REPLACE FUNCTION public.seed_message_templates(p_company_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.message_templates(company_id, key, name, channel, body_ar)
  VALUES
    (p_company_id, 'welcome_new_lead', 'ترحيب بعميل جديد', 'whatsapp',
     'مرحباً {{client_name}} 👋
شكراً لتواصلك مع {{company_name}}
سيتواصل معك مستشارنا {{agent_name}} قريباً لمساعدتك في إيجاد وحدتك المثالية.
نحن متخصصون في مشاريع {{area_type}} 🏙️'),

    (p_company_id, 'follow_up_48h', 'متابعة بعد ٤٨ ساعة', 'whatsapp',
     'السلام عليكم {{client_name}} 😊
كيف حال اهتمامك بالوحدة في {{project_name}}؟
هل لديك أي أسئلة يمكنني مساعدتك فيها؟
أنا {{agent_name}} في خدمتك 📞 {{agent_phone}}'),

    (p_company_id, 'reservation_expiry', 'تنبيه انتهاء الحجز', 'whatsapp',
     'تنبيه هام ⚠️ {{client_name}}
حجزك على الوحدة {{unit_name}} في {{project_name}} سينتهي خلال 24 ساعة.
لتأكيد الحجز أو للاستفسار، يرجى التواصل مع {{agent_name}}: {{agent_phone}}'),

    (p_company_id, 'deal_congratulations', 'تهنئة بإتمام الصفقة', 'whatsapp',
     'ألف مبروك {{client_name}} 🎉🏠
يسعدنا إعلامك بنجاح عملية الشراء!
وحدة: {{unit_name}} — {{project_name}}
قيمة العقد: {{contract_value}} جنيه
سيتواصل معك فريقنا لإتمام إجراءات التسليم.
شكراً لثقتك في {{company_name}} ❤️'),

    (p_company_id, 'installment_reminder', 'تذكير قسط', 'sms',
     '{{company_name}}: تذكير — موعد القسط رقم {{installment_no}} بقيمة {{amount}} جنيه في {{due_date}}. للاستفسار: {{phone}}')
  ON CONFLICT (company_id, key, channel) DO NOTHING;
END;
$$;

-- ─── ٦. رحلة العميل (Customer Journey) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_journeys (
  id              uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid      NOT NULL REFERENCES public.profiles(id),
  lead_id         uuid      NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,

  event_type      text      NOT NULL,
  -- created | source_identified | first_contact | qualified |
  -- site_visit | proposal_sent | negotiation | reservation |
  -- contract_signed | payment | handover | survey_sent | referral_made

  event_data      jsonb     DEFAULT '{}',
  -- بيانات إضافية: {unit_id, project_id, deal_value, ...}

  triggered_by    uuid      REFERENCES public.profiles(id), -- من أنشأ الحدث (null = تلقائي)
  created_at      timestamptz DEFAULT now()
);

-- Trigger: تسجيل رحلة العميل تلقائيًا
CREATE OR REPLACE FUNCTION public.log_lead_journey()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.customer_journeys(company_id, lead_id, event_type, event_data)
    VALUES (NEW.company_id, NEW.id, 'created', jsonb_build_object('source', NEW.source));

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.customer_journeys(company_id, lead_id, event_type, event_data, triggered_by)
    VALUES (
      NEW.company_id, NEW.id,
      CASE NEW.status
        WHEN 'contacted'   THEN 'first_contact'
        WHEN 'qualified'   THEN 'qualified'
        WHEN 'contracted'  THEN 'contract_signed'
        WHEN 'lost'        THEN 'lost'
        ELSE 'status_changed'
      END,
      jsonb_build_object('from', OLD.status, 'to', NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_journey_log ON public.leads;
CREATE TRIGGER lead_journey_log
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_journey();

-- ─── ٧. KPI مصادر العملاء ────────────────────────────────────────────
CREATE OR REPLACE VIEW public.lead_source_analytics AS
SELECT
  ls.id,
  ls.name,
  ls.type,
  ls.channel,
  ls.company_id,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'contracted') AS converted,
  ROUND(
    COUNT(l.id) FILTER (WHERE l.status = 'contracted')::numeric
    / NULLIF(COUNT(l.id), 0) * 100, 1
  ) AS conversion_rate_pct,
  COALESCE(SUM(d.unit_value) FILTER (WHERE d.stage = 'closed_won'), 0) AS total_revenue
FROM public.lead_sources ls
LEFT JOIN public.leads l  ON l.source_id = ls.id
LEFT JOIN public.deals d  ON d.lead_id = l.id
GROUP BY ls.id, ls.name, ls.type, ls.channel, ls.company_id;

-- ─── ٨. RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.lead_sources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_journeys  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_sources_select" ON public.lead_sources
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "lead_sources_manage" ON public.lead_sources
  FOR ALL USING (company_id = public.current_company_id() AND public.is_company_manager() OR public.is_super_admin());

CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "referrals_manage" ON public.referrals
  FOR ALL USING (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY "sms_logs_select" ON public.sms_logs
  FOR SELECT USING (company_id = public.current_company_id() AND public.is_company_manager() OR public.is_super_admin());
CREATE POLICY "sms_logs_insert" ON public.sms_logs
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "templates_select" ON public.message_templates
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "templates_manage" ON public.message_templates
  FOR ALL USING (company_id = public.current_company_id() AND public.is_company_manager() OR public.is_super_admin());

CREATE POLICY "journeys_select" ON public.customer_journeys
  FOR SELECT USING (company_id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY "journeys_insert" ON public.customer_journeys
  FOR INSERT WITH CHECK (true); -- عبر trigger فقط

-- ─── ٩. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lead_sources_company   ON public.lead_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_id        ON public.leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_referrer         ON public.leads(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_company      ON public.referrals(company_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_company       ON public.sms_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_lead          ON public.sms_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_journeys_lead          ON public.customer_journeys(lead_id);
CREATE INDEX IF NOT EXISTS idx_journeys_company_event ON public.customer_journeys(company_id, event_type);
CREATE INDEX IF NOT EXISTS idx_templates_company      ON public.message_templates(company_id, channel);
