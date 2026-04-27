-- إنشاء PostGIS في الـ Schema المخصص للإضافات (extensions) لتجنب أخطاء المسارات، ويجب أن تكون خارج الـ BEGIN
-- تأكد من توفر إضافة PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

BEGIN;

-- تعيين مسار البحث ليشمل public و extensions لضمان العثور على دوال وأنواع PostGIS بغض النظر عن مكان تثبيتها
SET LOCAL search_path = public, extensions;

ALTER TABLE public.marketplace_properties
  ADD COLUMN IF NOT EXISTS geom geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS virtual_tour_url text,
  ADD COLUMN IF NOT EXISTS video_url text;

UPDATE public.marketplace_properties
SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_properties_geom ON public.marketplace_properties USING GIST (geom);

COMMIT;
