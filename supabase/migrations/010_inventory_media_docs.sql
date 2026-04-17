-- =====================================================================
-- Migration 010: Inventory Media + Project Documents + Amenities
-- وسائط المخزون والوثائق والمرافق
-- =====================================================================

-- ─── ١. وسائط الوحدة (صور + مخططات + جولات ثلاثية الأبعاد) ──────────
CREATE TABLE IF NOT EXISTS public.unit_media (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       uuid      NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  company_id    uuid      NOT NULL REFERENCES public.profiles(id),

  type          text      NOT NULL DEFAULT 'image',
  -- image | floor_plan | 3d_tour | video | brochure | document

  url           text      NOT NULL,    -- Supabase Storage URL
  thumbnail_url text,                  -- نسخة مصغّرة
  title         text,                  -- اسم وصفي (مثال: "غرفة المعيشة")
  description   text,
  sort_order    integer   DEFAULT 0,   -- ترتيب العرض
  is_primary    boolean   DEFAULT false, -- هل هي الصورة الرئيسية؟

  width         integer,               -- أبعاد الصورة
  height        integer,
  file_size     bigint,               -- حجم الملف بالبايت
  mime_type     text,

  created_at    timestamptz DEFAULT now()
);

-- Trigger: تأكد أن وحدة واحدة فقط لها is_primary = true
CREATE OR REPLACE FUNCTION public.ensure_single_primary_media()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.unit_media
    SET is_primary = false
    WHERE unit_id = NEW.unit_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS single_primary_media ON public.unit_media;
CREATE TRIGGER single_primary_media
  AFTER INSERT OR UPDATE ON public.unit_media
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_media();

-- ─── ٢. وثائق المشروع ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_documents (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid      NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id    uuid      NOT NULL REFERENCES public.profiles(id),

  name          text      NOT NULL,
  type          text      NOT NULL DEFAULT 'brochure',
  -- brochure | price_list | master_plan | floor_plan | legal | presentation | other

  url           text      NOT NULL,
  file_size     bigint,
  mime_type     text,
  language      text      DEFAULT 'ar',  -- ar | en | both

  is_public     boolean   DEFAULT false,  -- متاح للعملاء عبر البوابة؟
  is_active     boolean   DEFAULT true,
  download_count integer  DEFAULT 0,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── ٣. صور ومعرض المشروع ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_media (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid      NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id    uuid      NOT NULL REFERENCES public.profiles(id),

  type          text      NOT NULL DEFAULT 'image',
  -- image | video | 3d_tour | drone | render

  url           text      NOT NULL,
  thumbnail_url text,
  title         text,
  sort_order    integer   DEFAULT 0,
  is_primary    boolean   DEFAULT false,  -- صورة الغلاف الرئيسية

  created_at    timestamptz DEFAULT now()
);

-- ─── ٤. مرافق وخدمات المشروع ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_amenities (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid      NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  category      text      NOT NULL DEFAULT 'services',
  -- services | sports | education | security | transport | commercial

  name_ar       text      NOT NULL,  -- اسم المرفق بالعربية
  name_en       text,
  icon          text,                -- Lucide icon name
  is_available  boolean   DEFAULT true,

  sort_order    integer   DEFAULT 0
);

-- إدراج مرافق نموذجية شائعة في مشاريع العاصمة/القاهرة الجديدة
CREATE OR REPLACE FUNCTION public.insert_default_amenities(p_project_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.project_amenities(project_id, category, name_ar, name_en, icon)
  VALUES
    (p_project_id, 'sports',     'حمام سباحة',         'Swimming Pool',      'waves'),
    (p_project_id, 'sports',     'نادي رياضي',          'Gym & Health Club',  'dumbbell'),
    (p_project_id, 'services',   'أمن وحراسة ٢٤ ساعة', '24/7 Security',      'shield'),
    (p_project_id, 'services',   'كاميرات مراقبة',      'CCTV Surveillance',  'camera'),
    (p_project_id, 'commercial', 'منطقة تجارية',        'Commercial Area',    'store'),
    (p_project_id, 'education',  'مدرسة دولية',         'International School','school'),
    (p_project_id, 'transport',  'بوابة إلكترونية',     'Smart Gates',        'gate'),
    (p_project_id, 'services',   'مواقف سيارات',        'Parking',            'car')
  ON CONFLICT DO NOTHING;
END;
$$;

-- ─── ٥. إضافة حقول إضافية لجدول inventory (units) ────────────────────
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS orientation       text,    -- شمال | جنوب | شرق | غرب | إطلالة حديقة
  ADD COLUMN IF NOT EXISTS finishing_type    text     DEFAULT 'semi_finished',
  -- fully_finished | semi_finished | core_and_shell | ultra_luxury
  ADD COLUMN IF NOT EXISTS bedrooms          integer,
  ADD COLUMN IF NOT EXISTS bathrooms         integer,
  ADD COLUMN IF NOT EXISTS reception_count   integer  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS has_garden        boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS garden_area       numeric(8,2),
  ADD COLUMN IF NOT EXISTS has_roof          boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS roof_area         numeric(8,2),
  ADD COLUMN IF NOT EXISTS payment_plan      jsonb,   -- خطة الأقساط [{percentage, months, description}]
  ADD COLUMN IF NOT EXISTS maintenance_pct   numeric(5,2) DEFAULT 8,  -- نسبة صيانة %
  ADD COLUMN IF NOT EXISTS delivery_date     date,
  ADD COLUMN IF NOT EXISTS view_type         text,    -- garden | sea | pool | street | open_view
  ADD COLUMN IF NOT EXISTS notes             text,
  ADD COLUMN IF NOT EXISTS tags              text[]   DEFAULT '{}';

-- ─── ٦. إضافة حقول إضافية لجدول projects ─────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS developer_name    text,    -- اسم المطوّر (نصي للعرض السريع)
  ADD COLUMN IF NOT EXISTS area_type         text     DEFAULT 'new_capital',
  -- new_capital | new_cairo | north_coast | october | other
  ADD COLUMN IF NOT EXISTS min_price         numeric(15,2),
  ADD COLUMN IF NOT EXISTS max_price         numeric(15,2),
  ADD COLUMN IF NOT EXISTS min_area          numeric(8,2),
  ADD COLUMN IF NOT EXISTS max_area          numeric(8,2),
  ADD COLUMN IF NOT EXISTS payment_years     integer,
  ADD COLUMN IF NOT EXISTS down_payment_pct  numeric(5,2),
  ADD COLUMN IF NOT EXISTS commission_pct    numeric(5,2),
  ADD COLUMN IF NOT EXISTS tags              text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured       boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug              text     UNIQUE;

-- ─── ٧. RLS للجداول الجديدة ───────────────────────────────────────────
ALTER TABLE public.unit_media           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_amenities    ENABLE ROW LEVEL SECURITY;

-- unit_media
CREATE POLICY "unit_media_select" ON public.unit_media
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "unit_media_manage" ON public.unit_media
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- project_documents
CREATE POLICY "project_docs_select" ON public.project_documents
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR is_public = true
    OR public.is_super_admin()
  );

CREATE POLICY "project_docs_manage" ON public.project_documents
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- project_media
CREATE POLICY "project_media_select" ON public.project_media
  FOR SELECT USING (
    company_id = public.current_company_id()
    OR public.is_super_admin()
  );

CREATE POLICY "project_media_manage" ON public.project_media
  FOR ALL USING (
    company_id = public.current_company_id()
    AND public.is_company_manager()
    OR public.is_super_admin()
  );

-- project_amenities (قراءة للجميع، كتابة للمدراء)
CREATE POLICY "amenities_select" ON public.project_amenities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "amenities_manage" ON public.project_amenities
  FOR ALL USING (public.is_company_manager() OR public.is_super_admin());

-- ─── ٨. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_unit_media_unit_id     ON public.unit_media(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_media_type        ON public.unit_media(type);
CREATE INDEX IF NOT EXISTS idx_unit_media_primary     ON public.unit_media(unit_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_proj_docs_project_id   ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_docs_type         ON public.project_documents(type);
CREATE INDEX IF NOT EXISTS idx_proj_media_project_id  ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_amenities_proj    ON public.project_amenities(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bedrooms     ON public.inventory(bedrooms);
CREATE INDEX IF NOT EXISTS idx_inventory_finishing    ON public.inventory(finishing_type);
CREATE INDEX IF NOT EXISTS idx_projects_area_type     ON public.projects(area_type);
CREATE INDEX IF NOT EXISTS idx_projects_featured      ON public.projects(is_featured) WHERE is_featured = true;
