-- ============================================================
--  FAST INVESTMENT — Enterprise RBAC Schema
--  Migration: 20260418130000
-- ============================================================

-- ── 1. Departments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO public.departments (name, slug, description) VALUES
  ('Ad Approvals',      'ad-approvals',      'Review and approve property listings'),
  ('Account Management','account-management','Manage client and partner accounts'),
  ('Finance',           'finance',           'Financial operations and commissions'),
  ('Data Entry',        'data-entry',        'Bulk data management for inventory'),
  ('Marketing',         'marketing',         'Campaign management and outreach'),
  ('Customer Service',  'customer-service',  'Client support and communications'),
  ('Executive',         'executive',         'Platform-level administration')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Roles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES public.departments(id),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  is_system     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

INSERT INTO public.roles (name, slug, description, is_system, department_id)
SELECT 'Ad Reviewer',          'ad_reviewer',        'Reviews pending ad submissions',          false, id FROM public.departments WHERE slug = 'ad-approvals'
UNION ALL
SELECT 'Ad Manager',           'ad_manager',         'Manages ad approval workflow',            true,  id FROM public.departments WHERE slug = 'ad-approvals'
UNION ALL
SELECT 'Users/Companies AM',   'users_am',           'Account manager for user/company accounts',false,id FROM public.departments WHERE slug = 'account-management'
UNION ALL
SELECT 'Ads Account Manager',  'ads_am',             'Manages advertising accounts',            false, id FROM public.departments WHERE slug = 'account-management'
UNION ALL
SELECT 'AM Supervisor',        'am_supervisor',      'Supervises account management team',      true,  id FROM public.departments WHERE slug = 'account-management'
UNION ALL
SELECT 'Collection Rep',       'collection_rep',     'Processes collections and payments',      false, id FROM public.departments WHERE slug = 'finance'
UNION ALL
SELECT 'Finance Manager',      'finance_manager',    'Approves payouts and commissions',        true,  id FROM public.departments WHERE slug = 'finance'
UNION ALL
SELECT 'Inventory Rep',        'inventory_rep',      'Enters and updates property inventory',   false, id FROM public.departments WHERE slug = 'data-entry'
UNION ALL
SELECT 'Data Manager',         'data_manager',       'Manages bulk data operations',            true,  id FROM public.departments WHERE slug = 'data-entry'
UNION ALL
SELECT 'Campaign Specialist',  'campaign_specialist','Runs marketing campaigns',                false, id FROM public.departments WHERE slug = 'marketing'
UNION ALL
SELECT 'Marketing Manager',    'marketing_manager',  'Oversees marketing operations',           true,  id FROM public.departments WHERE slug = 'marketing'
UNION ALL
SELECT 'CS Agent',             'cs_agent',           'Handles customer support tickets',        false, id FROM public.departments WHERE slug = 'customer-service'
UNION ALL
SELECT 'CS Supervisor',        'cs_supervisor',      'Supervises customer service team',        true,  id FROM public.departments WHERE slug = 'customer-service'
UNION ALL
SELECT 'Super Admin',          'super_admin_fi',     'Full platform access',                    true,  id FROM public.departments WHERE slug = 'executive'
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Permissions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  resource    text NOT NULL,
  action      text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO public.permissions (key, resource, action, description) VALUES
  -- Ads
  ('ads.read',                'ads',          'read',           'View all ads'),
  ('ads.create',              'ads',          'create',         'Submit new ad listings'),
  ('ads.update',              'ads',          'update',         'Edit existing ads'),
  ('ads.delete',              'ads',          'delete',         'Delete ads'),
  ('ads.approve',             'ads',          'approve',        'Approve pending ads'),
  ('ads.reject',              'ads',          'reject',         'Reject ads with reason'),
  -- Projects
  ('projects.read',           'projects',     'read',           'View all projects'),
  ('projects.create',         'projects',     'create',         'Add new projects'),
  ('projects.update',         'projects',     'update',         'Edit project details'),
  ('projects.delete',         'projects',     'delete',         'Delete projects'),
  -- Transactions
  ('transactions.read',       'transactions', 'read',           'View transaction records'),
  ('transactions.create',     'transactions', 'create',         'Create transactions'),
  ('transactions.update',     'transactions', 'update',         'Update transaction status'),
  ('transactions.delete',     'transactions', 'delete',         'Delete transactions'),
  ('transactions.approve_payout','transactions','approve_payout','Approve commission payouts (2FA required)'),
  ('transactions.export',     'transactions', 'export',         'Export financial reports'),
  -- Users
  ('users.read',              'users',        'read',           'View all users'),
  ('users.create',            'users',        'create',         'Create user accounts'),
  ('users.update',            'users',        'update',         'Edit user profiles'),
  ('users.delete',            'users',        'delete',         'Deactivate/delete users'),
  ('users.impersonate',       'users',        'impersonate',    'Log in as another user'),
  ('users.grant_permissions', 'users',        'grant_permissions','Grant or revoke permissions'),
  -- Inventory
  ('inventory.read',          'inventory',    'read',           'View inventory / units'),
  ('inventory.create',        'inventory',    'create',         'Bulk-add inventory'),
  ('inventory.update',        'inventory',    'update',         'Update inventory data'),
  ('inventory.delete',        'inventory',    'delete',         'Remove inventory entries'),
  ('inventory.import',        'inventory',    'import',         'Bulk import via CSV/Excel'),
  -- Messages
  ('messages.read',           'messages',     'read',           'View all messages'),
  ('messages.create',         'messages',     'create',         'Send individual messages'),
  ('messages.broadcast',      'messages',     'broadcast',      'Send bulk broadcast messages'),
  ('messages.whatsapp',       'messages',     'whatsapp',       'Send WhatsApp API messages'),
  -- Commissions
  ('commissions.read',        'commissions',  'read',           'View commission reports'),
  ('commissions.update',      'commissions',  'update',         'Update commission records'),
  ('commissions.approve',     'commissions',  'approve',        'Approve commission release'),
  -- Platform
  ('platform.manage',         'platform',     'manage',         'Full platform administration'),
  ('platform.audit',          'platform',     'audit',          'View audit logs'),
  ('platform.reports',        'platform',     'reports',        'Access all reports')
ON CONFLICT (key) DO NOTHING;

-- ── 4. Role-Permission mappings ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted       boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

DO $$
DECLARE
  r_id uuid;
  p_id uuid;
BEGIN
  -- ad_reviewer: view + approve/reject
  SELECT id INTO r_id FROM public.roles WHERE slug = 'ad_reviewer';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('ads.read','ads.approve','ads.reject') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- ad_manager: full ads control
  SELECT id INTO r_id FROM public.roles WHERE slug = 'ad_manager';
  FOR p_id IN SELECT id FROM public.permissions WHERE resource = 'ads' LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- users_am: read users/ads, update users
  SELECT id INTO r_id FROM public.roles WHERE slug = 'users_am';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('users.read','users.update','ads.read','commissions.read','projects.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- ads_am: manage ad accounts
  SELECT id INTO r_id FROM public.roles WHERE slug = 'ads_am';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('ads.read','ads.create','ads.update','users.read','commissions.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- am_supervisor: full account management
  SELECT id INTO r_id FROM public.roles WHERE slug = 'am_supervisor';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('users.read','users.create','users.update','ads.read','ads.update','commissions.read','projects.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- collection_rep: read transactions + create
  SELECT id INTO r_id FROM public.roles WHERE slug = 'collection_rep';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('transactions.read','transactions.create','commissions.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- finance_manager: full finance access
  SELECT id INTO r_id FROM public.roles WHERE slug = 'finance_manager';
  FOR p_id IN SELECT id FROM public.permissions WHERE resource IN ('transactions','commissions') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;
  -- also export + reports
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('platform.reports','users.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- inventory_rep: inventory CRUD + projects read
  SELECT id INTO r_id FROM public.roles WHERE slug = 'inventory_rep';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('inventory.read','inventory.create','inventory.update','inventory.import','projects.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- data_manager: full inventory + projects
  SELECT id INTO r_id FROM public.roles WHERE slug = 'data_manager';
  FOR p_id IN SELECT id FROM public.permissions WHERE resource IN ('inventory','projects') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- campaign_specialist: messages + ads/users read
  SELECT id INTO r_id FROM public.roles WHERE slug = 'campaign_specialist';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('messages.read','messages.create','messages.broadcast','ads.read','users.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- marketing_manager: full messages + read everything
  SELECT id INTO r_id FROM public.roles WHERE slug = 'marketing_manager';
  FOR p_id IN SELECT id FROM public.permissions WHERE resource = 'messages' OR key IN ('ads.read','users.read','platform.reports','projects.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- cs_agent: messages + read
  SELECT id INTO r_id FROM public.roles WHERE slug = 'cs_agent';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN ('messages.read','messages.create','users.read','ads.read') LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- cs_supervisor: cs_agent + whatsapp + broadcast + update users
  SELECT id INTO r_id FROM public.roles WHERE slug = 'cs_supervisor';
  FOR p_id IN SELECT id FROM public.permissions WHERE key IN (
    'messages.read','messages.create','messages.broadcast','messages.whatsapp',
    'users.read','users.update','ads.read'
  ) LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- super_admin_fi: all permissions
  SELECT id INTO r_id FROM public.roles WHERE slug = 'super_admin_fi';
  FOR p_id IN SELECT id FROM public.permissions LOOP
    INSERT INTO public.role_permissions(role_id, permission_id) VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── 5. User-Role assignments ─────────────────────────────────
-- NOTE: user_roles already exists in this DB with a different schema (role_name-based).
-- This new table is named user_role_assignments to avoid conflict.
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  company_id uuid,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, role_id)
);

-- ── 6. Per-user permission overrides (Super Admin power) ─────
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted       boolean NOT NULL,
  granted_by    uuid REFERENCES auth.users(id),
  reason        text,
  created_at    timestamptz DEFAULT now(),
  expires_at    timestamptz,
  UNIQUE(user_id, permission_id)
);

-- ── 7. RLS ──────────────────────────────────────────────────
ALTER TABLE public.departments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables (needed by permission engine)
CREATE POLICY "departments_read_all"    ON public.departments            FOR SELECT USING (true);
CREATE POLICY "roles_read_all"          ON public.roles                  FOR SELECT USING (true);
CREATE POLICY "permissions_read_all"    ON public.permissions            FOR SELECT USING (true);
CREATE POLICY "role_permissions_read"   ON public.role_permissions       FOR SELECT USING (true);

-- user_role_assignments: own read + service role full access
CREATE POLICY "ura_read_own"            ON public.user_role_assignments   FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ura_service_all"         ON public.user_role_assignments   USING (auth.role() = 'service_role');

-- user_permission_overrides: own read + service role full access
CREATE POLICY "overrides_read_own"      ON public.user_permission_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "overrides_sa_all"        ON public.user_permission_overrides USING (auth.role() = 'service_role');

-- ── 8. Tight RLS on transactions & commissions ──────────────
-- Only Finance Manager / Super Admin can UPDATE transactions
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "transactions_finance_update" ON public.transactions;
    CREATE POLICY "transactions_finance_update" ON public.transactions
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin','finance_manager','finance_officer')
        )
      );

    DROP POLICY IF EXISTS "transactions_super_delete" ON public.transactions;
    CREATE POLICY "transactions_super_delete" ON public.transactions
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
      );

    -- Finance + Super Admin can read all transactions; others read own
    DROP POLICY IF EXISTS "transactions_read" ON public.transactions;
    CREATE POLICY "transactions_read" ON public.transactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin','finance_manager','finance_officer','collection_rep')
        )
        OR user_id = auth.uid()
      );
  END IF;
END $$;

-- commissions: Finance Manager + Super Admin only
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commissions') THEN
    ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "commissions_finance_rw" ON public.commissions;
    CREATE POLICY "commissions_finance_rw" ON public.commissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin','finance_manager','finance_officer')
        )
      );

    DROP POLICY IF EXISTS "commissions_own_read" ON public.commissions;
    CREATE POLICY "commissions_own_read" ON public.commissions
      FOR SELECT USING (
        user_id = auth.uid()
      );
  END IF;
END $$;

-- ── 9. Helper view: effective user permissions ───────────────
-- Combines role-based + override-based permissions for a user
CREATE OR REPLACE VIEW public.v_user_effective_permissions AS
SELECT
  ur.user_id,
  p.key          AS permission_key,
  p.resource,
  p.action,
  true           AS granted,
  'role'         AS source
FROM public.user_role_assignments ur
JOIN public.role_permissions rp ON rp.role_id = ur.role_id AND rp.granted = true
JOIN public.permissions p       ON p.id = rp.permission_id

UNION

SELECT
  upo.user_id,
  p.key,
  p.resource,
  p.action,
  upo.granted,
  'override'     AS source
FROM public.user_permission_overrides upo
JOIN public.permissions p ON p.id = upo.permission_id;
