-- Migration: Marketplace Ads System
-- Date: 2026-04-17
-- Description: Add tables for public marketplace, ad management, and monetization

-- =====================================================================
-- 1. AD PACKAGES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ad_packages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text        NOT NULL, -- e.g., "Individual Basic", "Company Premium"
  type          text        NOT NULL CHECK (type IN ('individual', 'company')),
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  ads_included  integer     NOT NULL CHECK (ads_included > 0),
  featured_ads  integer     DEFAULT 0 CHECK (featured_ads >= 0),
  description   text,
  is_active     boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. USER BALANCES TABLE (Points Wallet)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_balances (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance       numeric(12,2) DEFAULT 0 CHECK (balance >= 0),
  total_earned  numeric(12,2) DEFAULT 0,
  total_spent   numeric(12,2) DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================================
-- 3. ADS TABLE (Property Listings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ads (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id      uuid        REFERENCES public.ad_packages(id),

  -- Property Details
  title           text        NOT NULL,
  description     text        NOT NULL,
  property_type   text        NOT NULL, -- apartment, villa, etc.
  price           numeric(12,2) NOT NULL CHECK (price > 0),
  currency        text        DEFAULT 'EGP',
  location        text        NOT NULL,
  area_sqm        numeric(8,2),
  bedrooms        integer,
  bathrooms       integer,
  images          text[]      DEFAULT '{}', -- Supabase Storage URLs
  documents       text[]      DEFAULT '{}', -- Additional docs

  -- Ad Settings
  is_featured     boolean     DEFAULT false,
  is_urgent       boolean     DEFAULT false,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'sold')),
  expires_at      timestamptz,

  -- Approval
  reviewed_by     uuid        REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  rejection_reason text,

  -- Metadata
  views_count     integer     DEFAULT 0,
  favorites_count integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. TRANSACTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id      uuid        REFERENCES public.ad_packages(id),
  ad_id           uuid        REFERENCES public.ads(id),

  type            text        NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus')),
  amount          numeric(10,2) NOT NULL,
  currency        text        DEFAULT 'EGP',
  points_earned   numeric(10,2) DEFAULT 0,
  points_spent    numeric(10,2) DEFAULT 0,

  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method  text, -- stripe, paypal, bank_transfer, etc.
  payment_id      text, -- external payment reference

  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =====================================================================
-- 5. CHAT MESSAGES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id           uuid        NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  message         text        NOT NULL,
  message_type    text        DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
  attachment_url  text, -- Supabase Storage URL

  is_read         boolean     DEFAULT false,
  read_at         timestamptz,

  created_at      timestamptz DEFAULT now()
);

-- =====================================================================
-- 6. USER ROLES TABLE (Employee Specializations)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type       text        NOT NULL CHECK (role_type IN ('ad_approval', 'finance', 'customer_service', 'super_admin')),

  assigned_by     uuid        REFERENCES auth.users(id),
  assigned_at     timestamptz DEFAULT now(),
  is_active       boolean     DEFAULT true,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE(user_id, role_type)
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON public.ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_property_type ON public.ads(property_type);
CREATE INDEX IF NOT EXISTS idx_ads_location ON public.ads USING gin (to_tsvector('arabic', location));
CREATE INDEX IF NOT EXISTS idx_ads_price ON public.ads(price);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.ads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_ad_id ON public.chat_messages(ad_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver ON public.chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON public.user_roles(role_type);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Ad Packages: Public read, admin write
ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_packages_public_read" ON public.ad_packages FOR SELECT USING (true);
CREATE POLICY "ad_packages_admin_write" ON public.ad_packages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- User Balances: Users can read/write their own, finance team can read all
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_balances_own" ON public.user_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_balances_finance_read" ON public.user_balances FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_type = 'finance' AND is_active = true
  )
);

-- Ads: Public can read approved ads, owners can manage their ads, approval team can manage all
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_public_read" ON public.ads FOR SELECT USING (status = 'approved');
CREATE POLICY "ads_own_manage" ON public.ads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ads_approval_team" ON public.ads FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_type = 'ad_approval' AND is_active = true
  )
);

-- Transactions: Users can read their own, finance team can read all
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_finance" ON public.transactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_type = 'finance' AND is_active = true
  )
);

-- Chat Messages: Only participants can read/write
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_participants" ON public.chat_messages FOR ALL USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- User Roles: Super admins can manage, users can read their own
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_own_read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_super_admin" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_type = 'super_admin' AND is_active = true
  )
);

-- =====================================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ad_packages_updated_at ON public.ad_packages;
CREATE TRIGGER ad_packages_updated_at
  BEFORE UPDATE ON public.ad_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_balances_updated_at ON public.user_balances;
CREATE TRIGGER user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS ads_updated_at ON public.ads;
CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- INITIAL DATA: AD PACKAGES
-- =====================================================================
INSERT INTO public.ad_packages (name, type, price, ads_included, featured_ads, description) VALUES
-- Individual Plans
('إعلان فردي أساسي', 'individual', 150.00, 1, 0, 'إعلان واحد للأفراد'),
('إعلان فردي متوسط', 'individual', 500.00, 4, 0, '4 إعلانات للأفراد'),
('إعلان فردي متميز', 'individual', 1000.00, 12, 0, '12 إعلان للأفراد'),

-- Company Plans
('باقة شركات أساسية', 'company', 3000.00, 15, 3, '15 إعلان مع 3 مميزة'),
('باقة شركات متميزة', 'company', 10000.00, 60, 6, '60 إعلان مع 6 مميزة وبادج موثق')
ON CONFLICT DO NOTHING;