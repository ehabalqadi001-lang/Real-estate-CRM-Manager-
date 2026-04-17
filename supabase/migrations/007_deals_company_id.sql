-- Migration 007: Add company_id to deals for multi-tenancy
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);

-- Backfill: set company_id from the related lead's company_id
UPDATE public.deals d
SET company_id = l.company_id
FROM public.leads l
WHERE d.lead_id = l.id AND d.company_id IS NULL;

-- RLS: agents/admins can only see their company's deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_company_isolation" ON public.deals;
CREATE POLICY "deals_company_isolation" ON public.deals
  USING (
    company_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  );
