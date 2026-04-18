-- FAST INVESTMENT Marketplace Ads Points Economy + Paymob Mapping

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  points_balance bigint NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_points_earned bigint NOT NULL DEFAULT 0 CHECK (lifetime_points_earned >= 0),
  lifetime_points_spent bigint NOT NULL DEFAULT 0 CHECK (lifetime_points_spent >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.point_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  package_kind text NOT NULL DEFAULT 'one_time' CHECK (package_kind IN ('one_time', 'subscription')),
  paymob_package_code text UNIQUE,
  amount_egp numeric(10,2) NOT NULL CHECK (amount_egp >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  points_amount bigint NOT NULL CHECK (points_amount > 0),
  billing_interval text CHECK (billing_interval IN ('month', 'year')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  package_id uuid REFERENCES public.point_packages(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('paymob_topup', 'subscription_topup', 'ad_spend', 'manual_grant', 'manual_deduct', 'refund', 'adjustment')),
  points_delta bigint NOT NULL,
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  money_amount numeric(10,2),
  currency text NOT NULL DEFAULT 'EGP',
  paymob_transaction_id text,
  paymob_order_id text,
  paymob_integration_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_paymob_transaction_unique_idx
  ON public.wallet_transactions (paymob_transaction_id)
  WHERE paymob_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ad_cost_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  regular_points_cost integer NOT NULL DEFAULT 10 CHECK (regular_points_cost >= 0),
  premium_points_cost integer NOT NULL DEFAULT 50 CHECK (premium_points_cost >= 0),
  regular_duration_days integer NOT NULL DEFAULT 30 CHECK (regular_duration_days > 0),
  premium_duration_days integer NOT NULL DEFAULT 30 CHECK (premium_duration_days > 0),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.ad_cost_config (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.point_packages (name, description, package_kind, amount_egp, points_amount, sort_order)
VALUES
  ('Trial Boost', '150 EGP = 1,500 marketplace ad points', 'one_time', 150, 1500, 1),
  ('Starter Pack', '500 EGP = 5,000 marketplace ad points', 'one_time', 500, 5000, 2),
  ('Growth Pack', '1,000 EGP = 12,000 marketplace ad points', 'one_time', 1000, 12000, 3),
  ('Monthly Pro Subscription', '3,000 EGP/mo = 50,000 marketplace ad points monthly', 'subscription', 3000, 50000, 4),
  ('Enterprise Ads Bank', '10,000 EGP = 200,000 marketplace ad points', 'one_time', 10000, 200000, 5)
ON CONFLICT DO NOTHING;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN IF NOT EXISTS points_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS wallet_transaction_id uuid REFERENCES public.wallet_transactions(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ads_listing_type_check'
      AND conrelid = 'public.ads'::regclass
  ) THEN
    ALTER TABLE public.ads
      ADD CONSTRAINT ads_listing_type_check
      CHECK (listing_type IN ('REGULAR', 'PREMIUM'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ads_marketplace_rank
  ON public.ads (listing_type DESC, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_ads_expires_at
  ON public.ads (expires_at)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_packages_paymob_package_code ON public.point_packages(paymob_package_code);

CREATE OR REPLACE FUNCTION public.set_wallet_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

DROP TRIGGER IF EXISTS trg_point_packages_updated_at ON public.point_packages;
CREATE TRIGGER trg_point_packages_updated_at
  BEFORE UPDATE ON public.point_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

DROP TRIGGER IF EXISTS trg_ad_cost_config_updated_at ON public.ad_cost_config;
CREATE TRIGGER trg_ad_cost_config_updated_at
  BEFORE UPDATE ON public.ad_cost_config
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_user_wallet(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_tenant_id uuid;
BEGIN
  SELECT COALESCE(tenant_id, company_id) INTO v_tenant_id
  FROM public.profiles
  WHERE id = p_user_id;

  INSERT INTO public.user_wallets (user_id, tenant_id, company_id)
  VALUES (p_user_id, v_tenant_id, v_tenant_id)
  ON CONFLICT (user_id) DO UPDATE
  SET tenant_id = COALESCE(public.user_wallets.tenant_id, EXCLUDED.tenant_id),
      company_id = COALESCE(public.user_wallets.company_id, EXCLUDED.company_id)
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet_points(
  p_user_id uuid,
  p_package_id uuid,
  p_points bigint,
  p_type text,
  p_money_amount numeric,
  p_currency text,
  p_paymob_transaction_id text DEFAULT NULL,
  p_paymob_order_id text DEFAULT NULL,
  p_paymob_integration_id text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.user_wallets%ROWTYPE;
  v_new_balance bigint;
  v_tx_id uuid;
BEGIN
  IF p_paymob_transaction_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE paymob_transaction_id = p_paymob_transaction_id
  ) THEN
    SELECT id INTO v_tx_id
    FROM public.wallet_transactions
    WHERE paymob_transaction_id = p_paymob_transaction_id
    LIMIT 1;
    RETURN v_tx_id;
  END IF;

  PERFORM public.ensure_user_wallet(p_user_id);

  SELECT *
  INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := v_wallet.points_balance + p_points;

  UPDATE public.user_wallets
  SET points_balance = v_new_balance,
      lifetime_points_earned = lifetime_points_earned + GREATEST(p_points, 0)
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    tenant_id,
    package_id,
    type,
    points_delta,
    balance_after,
    money_amount,
    currency,
    paymob_transaction_id,
    paymob_order_id,
    paymob_integration_id,
    reason,
    metadata,
    created_by
  )
  VALUES (
    v_wallet.id,
    p_user_id,
    v_wallet.tenant_id,
    p_package_id,
    p_type,
    p_points,
    v_new_balance,
    p_money_amount,
    COALESCE(p_currency, 'EGP'),
    p_paymob_transaction_id,
    p_paymob_order_id,
    p_paymob_integration_id,
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb),
    auth.uid()
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_points_for_marketplace_ad(
  p_user_id uuid,
  p_ad_id uuid,
  p_listing_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.user_wallets%ROWTYPE;
  v_cost integer;
  v_duration integer;
  v_balance bigint;
  v_tx_id uuid;
BEGIN
  IF p_listing_type NOT IN ('REGULAR', 'PREMIUM') THEN
    RAISE EXCEPTION 'Invalid listing type';
  END IF;

  PERFORM public.ensure_user_wallet(p_user_id);

  SELECT *
  INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT
    CASE WHEN p_listing_type = 'PREMIUM' THEN premium_points_cost ELSE regular_points_cost END,
    CASE WHEN p_listing_type = 'PREMIUM' THEN premium_duration_days ELSE regular_duration_days END
  INTO v_cost, v_duration
  FROM public.ad_cost_config
  WHERE id = true;

  IF v_wallet.points_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient points: required %, available %', v_cost, v_wallet.points_balance;
  END IF;

  v_balance := v_wallet.points_balance - v_cost;

  UPDATE public.user_wallets
  SET points_balance = v_balance,
      lifetime_points_spent = lifetime_points_spent + v_cost
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    tenant_id,
    ad_id,
    type,
    points_delta,
    balance_after,
    reason
  )
  VALUES (
    v_wallet.id,
    p_user_id,
    v_wallet.tenant_id,
    p_ad_id,
    'ad_spend',
    -v_cost,
    v_balance,
    'Marketplace ad publication: ' || p_listing_type
  )
  RETURNING id INTO v_tx_id;

  UPDATE public.ads
  SET listing_type = p_listing_type,
      is_featured = (p_listing_type = 'PREMIUM'),
      status = 'approved',
      points_spent = v_cost,
      wallet_transaction_id = v_tx_id,
      published_at = now(),
      expires_at = now() + make_interval(days => v_duration)
  WHERE id = p_ad_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ad not found for user';
  END IF;

  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_marketplace_ads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.ads
  SET status = 'expired',
      expired_at = now()
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_cost_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_wallets_own_read ON public.user_wallets;
CREATE POLICY user_wallets_own_read ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS user_wallets_platform_all ON public.user_wallets;
CREATE POLICY user_wallets_platform_all ON public.user_wallets
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS point_packages_public_read ON public.point_packages;
CREATE POLICY point_packages_public_read ON public.point_packages
  FOR SELECT USING (is_active = true OR public.is_platform_admin());

DROP POLICY IF EXISTS point_packages_platform_all ON public.point_packages;
CREATE POLICY point_packages_platform_all ON public.point_packages
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS wallet_transactions_own_read ON public.wallet_transactions;
CREATE POLICY wallet_transactions_own_read ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS wallet_transactions_platform_all ON public.wallet_transactions;
CREATE POLICY wallet_transactions_platform_all ON public.wallet_transactions
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS ad_cost_config_public_read ON public.ad_cost_config;
CREATE POLICY ad_cost_config_public_read ON public.ad_cost_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS ad_cost_config_platform_all ON public.ad_cost_config;
CREATE POLICY ad_cost_config_platform_all ON public.ad_cost_config
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

REVOKE ALL ON FUNCTION public.credit_wallet_points(uuid, uuid, bigint, text, numeric, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_wallet_points(uuid, uuid, bigint, text, numeric, text, text, text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.spend_points_for_marketplace_ad(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_points_for_marketplace_ad(uuid, uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.expire_marketplace_ads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_marketplace_ads() TO service_role;

COMMIT;
