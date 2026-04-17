-- =====================================================
-- Migration 003: Inventory Hierarchy
-- Project → Building → Unit
-- =====================================================

-- Projects table (top level)
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES public.profiles(id),
  developer_id  UUID REFERENCES public.developers(id),
  name          TEXT NOT NULL,
  location      TEXT,
  district      TEXT,
  city          TEXT DEFAULT 'القاهرة',
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  total_units   INTEGER DEFAULT 0,
  launch_date   DATE,
  delivery_date DATE,
  status        TEXT DEFAULT 'active',  -- active | completed | upcoming
  description   TEXT,
  cover_image   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Buildings table (middle level)
CREATE TABLE IF NOT EXISTS public.buildings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,          -- e.g. "Building A" / "برج 1"
  floors        INTEGER,
  units_per_floor INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Link existing inventory to buildings/projects
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS project_id  UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_project_id  ON public.inventory(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_building_id ON public.inventory(building_id);
CREATE INDEX IF NOT EXISTS idx_buildings_project_id  ON public.buildings(project_id);

-- RLS
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"  ON public.projects  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "buildings_select" ON public.buildings FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_manage" ON public.projects
  FOR ALL USING (auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin'));

CREATE POLICY "buildings_manage" ON public.buildings
  FOR ALL USING (auth.user_role() IN ('admin','Admin','company_admin','company','super_admin','Super_Admin'));
