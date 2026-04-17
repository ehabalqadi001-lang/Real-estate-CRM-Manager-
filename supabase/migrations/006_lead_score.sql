-- Migration 006: Lead score column
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);
