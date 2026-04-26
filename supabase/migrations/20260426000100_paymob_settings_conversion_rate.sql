-- paymob_settings: stores Paymob API credentials in DB so Super Admin can update without re-deploying
CREATE TABLE IF NOT EXISTS public.paymob_settings (
  id                   boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  api_key              text,
  hmac_secret          text,
  card_integration_id  text,
  wallet_integration_id text,
  card_iframe_id       text,
  updated_by           uuid REFERENCES auth.users(id),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.paymob_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS paymob_settings_platform_all ON public.paymob_settings;
CREATE POLICY paymob_settings_platform_all ON public.paymob_settings
  USING (public.has_permission(auth.uid(), 'platform.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'platform.manage'));

-- Seed singleton row so upsert always has a target
INSERT INTO public.paymob_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- points_per_egp: how many points the client receives per 1 EGP paid
ALTER TABLE public.ad_cost_config
  ADD COLUMN IF NOT EXISTS points_per_egp numeric(10,4) NOT NULL DEFAULT 10;

-- Wallet transactions: ensure money_amount and currency columns exist (already created in prior migration, but defensive)
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS money_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EGP';
