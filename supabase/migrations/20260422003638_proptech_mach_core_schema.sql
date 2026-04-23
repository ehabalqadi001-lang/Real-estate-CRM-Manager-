-- FAST INVESTMENT PropTech MACH Core Schema
-- Hybrid Marketplace + CRM for Primary and Resale operations.

create schema if not exists app_private;

create or replace function app_private.current_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role();
$$;

create or replace function app_private.current_company()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_company_id();
$$;

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role() in ('super_admin', 'platform_admin');
$$;

create or replace function app_private.is_company_operator()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role() in (
    'super_admin',
    'platform_admin',
    'company_owner',
    'company_admin',
    'sales_director',
    'branch_manager',
    'team_leader',
    'admin',
    'company'
  );
$$;

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- Users / profile extensions.
alter table public.user_profiles
  add column if not exists assigned_cell_id uuid,
  add column if not exists sales_quota_monthly numeric(14,2) default 0,
  add column if not exists lead_visibility_scope text not null default 'cell'
    check (lead_visibility_scope in ('own','cell','company','platform'));

-- Roles catalog enrichment for enterprise departments.
alter table public.roles
  add column if not exists role_family text default 'crm'
    check (role_family in ('platform','company','cell','sales','finance','hr','marketing','support','data','crm')),
  add column if not exists hierarchy_level integer not null default 50,
  add column if not exists permissions jsonb not null default '{}'::jsonb;

insert into public.roles (name, slug, description, is_system, role_family, hierarchy_level)
values
  ('Sales Cell Leader', 'cell_leader', 'Leads one sales work cell', true, 'cell', 35),
  ('Resale Verification Officer', 'resale_verifier', 'Verifies resale owner data and documents', true, 'data', 45),
  ('AVM Analyst', 'avm_analyst', 'Reviews automated valuation models', true, 'data', 45),
  ('Investment Consultant', 'investment_consultant', 'Prepares ROI and payback scenarios', true, 'sales', 50)
on conflict (slug) do update
set
  description = excluded.description,
  role_family = excluded.role_family,
  hierarchy_level = excluded.hierarchy_level;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  name_ar text,
  city text,
  address text,
  manager_id uuid references auth.users(id) on delete set null,
  status text not null default 'active'
    check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- Multi-tenant sales cells.
create table if not exists public.work_cells (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  name_ar text not null,
  leader_id uuid references auth.users(id) on delete set null,
  monthly_gmv_target numeric(14,2) not null default 0,
  monthly_leads_target integer not null default 0,
  conversion_target_pct numeric(5,2) not null default 0,
  territory jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.work_cell_members (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.work_cells(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_in_cell text not null default 'agent'
    check (role_in_cell in ('leader','senior_agent','agent','coordinator','viewer')),
  commission_weight numeric(7,4) not null default 1,
  joined_at date not null default current_date,
  left_at date,
  status text not null default 'active'
    check (status in ('active','inactive','transferred')),
  created_at timestamptz not null default now(),
  unique (cell_id, user_id)
);

create or replace function app_private.has_cell_access(p_company_id uuid, p_cell_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    app_private.is_platform_admin()
    or (
      p_company_id = app_private.current_company()
      and app_private.is_company_operator()
    )
    or exists (
      select 1
      from public.work_cell_members wcm
      where wcm.cell_id = p_cell_id
        and wcm.user_id = auth.uid()
        and wcm.status = 'active'
    );
$$;

grant execute on function app_private.has_cell_access(uuid, uuid) to authenticated;

alter table public.user_profiles
  add constraint user_profiles_assigned_cell_id_fkey
  foreign key (assigned_cell_id)
  references public.work_cells(id)
  on delete set null;

-- API-first developer gateway and inventory feeds.
create table if not exists public.api_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete cascade,
  name text not null,
  provider text not null,
  integration_type text not null
    check (integration_type in ('inventory','prices','payment_plans','availability','leads','webhook')),
  base_url text,
  auth_type text not null default 'api_key'
    check (auth_type in ('api_key','oauth2','basic','none','webhook_secret')),
  secret_ref text,
  sync_frequency_minutes integer not null default 60,
  last_sync_at timestamptz,
  last_status text default 'pending'
    check (last_status in ('pending','success','failed','disabled')),
  health_payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_feed_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.api_integrations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  external_reference text,
  event_type text not null
    check (event_type in ('unit_created','unit_updated','price_changed','availability_changed','payment_plan_changed','sync_failed')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','processed','failed','ignored')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Headless marketplace property abstraction over primary units and resale listings.
create table if not exists public.marketplace_properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  cell_id uuid references public.work_cells(id) on delete set null,
  developer_id uuid references public.developers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  source_type text not null
    check (source_type in ('primary','resale')),
  listing_channel text not null default 'marketplace'
    check (listing_channel in ('marketplace','private_crm','developer_feed','broker_feed')),
  title text not null,
  title_ar text not null,
  description text,
  property_type text not null
    check (property_type in ('residential','commercial','administrative','medical','mixed','land')),
  unit_type text
    check (unit_type in ('apartment','villa','duplex','penthouse','studio','office','shop','clinic','chalet','townhouse','land')),
  city text not null default 'القاهرة',
  district text,
  location_text text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  area_sqm numeric(10,2),
  bedrooms smallint,
  bathrooms smallint,
  finishing text
    check (finishing in ('fully_finished','semi_finished','core_shell','furnished','unknown')),
  list_price numeric(14,2) not null default 0,
  currency text not null default 'EGP',
  down_payment numeric(14,2),
  monthly_installment numeric(14,2),
  delivery_date date,
  scarcity_remaining_units integer,
  scarcity_label text,
  social_proof_score numeric(7,2) not null default 0,
  views_count integer not null default 0,
  inquiries_count integer not null default 0,
  saves_count integer not null default 0,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','needs_review')),
  listing_status text not null default 'draft'
    check (listing_status in ('draft','published','reserved','sold','archived','rejected')),
  search_vector tsvector,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_payment_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.marketplace_properties(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  down_payment_pct numeric(5,2),
  installment_years integer,
  installment_frequency text not null default 'monthly'
    check (installment_frequency in ('monthly','quarterly','semi_annual','annual')),
  maintenance_fee_pct numeric(5,2),
  total_price numeric(14,2),
  monthly_installment numeric(14,2),
  plan_rank integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Resale verification and AVM.
create table if not exists public.resale_verifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.marketplace_properties(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  seller_user_id uuid references auth.users(id) on delete set null,
  verifier_id uuid references auth.users(id) on delete set null,
  ownership_document_url text,
  national_id_url text,
  utility_bill_url text,
  verification_score numeric(5,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','needs_more_info')),
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resale_valuations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.marketplace_properties(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  valuation_type text not null default 'avm'
    check (valuation_type in ('avm','manual','hybrid')),
  estimated_value numeric(14,2) not null,
  low_value numeric(14,2),
  high_value numeric(14,2),
  confidence_score numeric(5,2) not null default 0,
  comparable_count integer not null default 0,
  comparable_property_ids uuid[] not null default '{}'::uuid[],
  model_version text,
  factors jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Lead intelligence, cells, search, recommendations.
alter table public.leads
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists cell_id uuid references public.work_cells(id) on delete set null,
  add column if not exists assigned_agent_id uuid references auth.users(id) on delete set null,
  add column if not exists source_property_id uuid references public.marketplace_properties(id) on delete set null,
  add column if not exists lead_temperature text default 'warm'
    check (lead_temperature in ('cold','warm','hot','vip')),
  add column if not exists budget_min numeric(14,2),
  add column if not exists budget_max numeric(14,2),
  add column if not exists parsed_search_query jsonb not null default '{}'::jsonb,
  add column if not exists ai_intent_summary text;

create table if not exists public.lead_cell_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  cell_id uuid not null references public.work_cells(id) on delete cascade,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  assignment_reason text,
  source text not null default 'manual'
    check (source in ('manual','round_robin','ai_routing','import','campaign')),
  status text not null default 'active'
    check (status in ('active','transferred','closed')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);

create table if not exists public.property_search_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  session_id text,
  raw_query text,
  parsed_query jsonb not null default '{}'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  clicked_property_id uuid references public.marketplace_properties(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.property_recommendations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  property_id uuid not null references public.marketplace_properties(id) on delete cascade,
  score numeric(8,4) not null default 0,
  reason_ar text,
  model_version text,
  source text not null default 'behavioral'
    check (source in ('behavioral','similarity','ai','manual')),
  status text not null default 'active'
    check (status in ('active','dismissed','converted')),
  created_at timestamptz not null default now(),
  unique (lead_id, property_id, source)
);

-- ROI and investment advisory tools.
create table if not exists public.roi_scenarios (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.marketplace_properties(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  purchase_price numeric(14,2) not null,
  down_payment numeric(14,2) not null default 0,
  expected_rent_monthly numeric(14,2) not null default 0,
  annual_appreciation_pct numeric(6,3) not null default 0,
  holding_years integer not null default 5,
  maintenance_annual numeric(14,2) not null default 0,
  alternative_investment text default 'bank_certificate',
  alternative_return_pct numeric(6,3) not null default 0,
  roi_pct numeric(8,3),
  payback_months integer,
  net_profit numeric(14,2),
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Deals and transactions.
alter table public.deals
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists cell_id uuid references public.work_cells(id) on delete set null,
  add column if not exists marketplace_property_id uuid references public.marketplace_properties(id) on delete set null,
  add column if not exists sale_channel text default 'crm'
    check (sale_channel in ('crm','marketplace','developer_feed','referral')),
  add column if not exists sale_type text default 'primary'
    check (sale_type in ('primary','resale')),
  add column if not exists gross_margin numeric(14,2) default 0;

create table if not exists public.crm_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cell_id uuid references public.work_cells(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.marketplace_properties(id) on delete set null,
  transaction_type text not null
    check (transaction_type in ('primary_sale','resale_sale','reservation','cancellation','refund','commission_payout')),
  stage text not null default 'pending'
    check (stage in ('pending','reserved','contracted','closed','cancelled','refunded')),
  gross_value numeric(14,2) not null default 0,
  net_value numeric(14,2) not null default 0,
  platform_fee numeric(14,2) not null default 0,
  brokerage_fee numeric(14,2) not null default 0,
  developer_commission numeric(14,2) not null default 0,
  resale_spread numeric(14,2) not null default 0,
  currency text not null default 'EGP',
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commission_schemes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  sale_type text not null
    check (sale_type in ('primary','resale','both')),
  basis text not null default 'gross_value'
    check (basis in ('gross_value','net_value','brokerage_fee','developer_commission','resale_spread')),
  rate_pct numeric(7,4) not null default 0,
  min_value numeric(14,2) not null default 0,
  max_value numeric(14,2),
  effective_from date not null default current_date,
  effective_to date,
  active boolean not null default true,
  split_template jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint commission_schemes_range_check check (max_value is null or max_value > min_value)
);

create table if not exists public.commission_splits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid references public.crm_transactions(id) on delete cascade,
  commission_id uuid references public.commissions(id) on delete cascade,
  scheme_id uuid references public.commission_schemes(id) on delete set null,
  cell_id uuid references public.work_cells(id) on delete set null,
  beneficiary_user_id uuid references auth.users(id) on delete set null,
  beneficiary_type text not null
    check (beneficiary_type in ('agent','cell_leader','company','platform','partner','referrer')),
  split_basis text not null default 'percentage'
    check (split_basis in ('percentage','fixed','weight')),
  percentage numeric(7,4) not null default 0,
  fixed_amount numeric(14,2) not null default 0,
  calculated_amount numeric(14,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','approved','paid','disputed','cancelled')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cell_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cell_id uuid not null references public.work_cells(id) on delete cascade,
  period_month integer not null check (period_month between 1 and 12),
  period_year integer not null check (period_year >= 2020),
  leads_count integer not null default 0,
  qualified_leads_count integer not null default 0,
  deals_count integer not null default 0,
  closed_deals_count integer not null default 0,
  gmv numeric(14,2) not null default 0,
  conversion_rate_pct numeric(7,3) not null default 0,
  avg_deal_size numeric(14,2) not null default 0,
  total_commissions numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (cell_id, period_month, period_year)
);

-- Search indexes.
create index if not exists work_cells_company_idx on public.work_cells(company_id, status);
create index if not exists work_cell_members_user_idx on public.work_cell_members(user_id, status);
create index if not exists work_cell_members_cell_idx on public.work_cell_members(cell_id, status);
create index if not exists api_integrations_developer_idx on public.api_integrations(developer_id, integration_type, active);
create index if not exists inventory_feed_events_status_idx on public.inventory_feed_events(status, created_at desc);
create index if not exists marketplace_properties_lookup_idx on public.marketplace_properties(company_id, source_type, listing_status, property_type, city);
create index if not exists marketplace_properties_cell_idx on public.marketplace_properties(cell_id, listing_status);
create index if not exists marketplace_properties_price_idx on public.marketplace_properties(list_price, area_sqm);
create index if not exists marketplace_properties_search_idx on public.marketplace_properties using gin(search_vector);
create index if not exists resale_valuations_property_idx on public.resale_valuations(property_id, created_at desc);
create index if not exists lead_cell_assignments_lead_idx on public.lead_cell_assignments(lead_id, status);
create index if not exists property_search_events_lead_idx on public.property_search_events(lead_id, created_at desc);
create index if not exists property_recommendations_lead_score_idx on public.property_recommendations(lead_id, score desc);
create index if not exists roi_scenarios_lead_idx on public.roi_scenarios(lead_id, created_at desc);
create index if not exists crm_transactions_company_stage_idx on public.crm_transactions(company_id, stage, created_at desc);
create index if not exists commission_splits_transaction_idx on public.commission_splits(transaction_id, status);
create index if not exists cell_performance_period_idx on public.cell_performance_snapshots(company_id, period_year, period_month);

-- RLS.
alter table public.branches enable row level security;
alter table public.work_cells enable row level security;
alter table public.work_cell_members enable row level security;
alter table public.api_integrations enable row level security;
alter table public.inventory_feed_events enable row level security;
alter table public.marketplace_properties enable row level security;
alter table public.property_payment_plans enable row level security;
alter table public.resale_verifications enable row level security;
alter table public.resale_valuations enable row level security;
alter table public.lead_cell_assignments enable row level security;
alter table public.property_search_events enable row level security;
alter table public.property_recommendations enable row level security;
alter table public.roi_scenarios enable row level security;
alter table public.crm_transactions enable row level security;
alter table public.commission_schemes enable row level security;
alter table public.commission_splits enable row level security;
alter table public.cell_performance_snapshots enable row level security;

drop policy if exists "branches_select" on public.branches;
drop policy if exists "branches_write" on public.branches;
create policy "branches_select" on public.branches
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "branches_write" on public.branches
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "work_cells_select" on public.work_cells;
drop policy if exists "work_cells_write" on public.work_cells;
create policy "work_cells_select" on public.work_cells
  for select to authenticated
  using (app_private.has_cell_access(company_id, id));
create policy "work_cells_write" on public.work_cells
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "work_cell_members_select" on public.work_cell_members;
drop policy if exists "work_cell_members_write" on public.work_cell_members;
create policy "work_cell_members_select" on public.work_cell_members
  for select to authenticated
  using (app_private.has_cell_access(company_id, cell_id));
create policy "work_cell_members_write" on public.work_cell_members
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "api_integrations_select" on public.api_integrations;
drop policy if exists "api_integrations_write" on public.api_integrations;
create policy "api_integrations_select" on public.api_integrations
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "api_integrations_write" on public.api_integrations
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "inventory_feed_events_select" on public.inventory_feed_events;
drop policy if exists "inventory_feed_events_write" on public.inventory_feed_events;
create policy "inventory_feed_events_select" on public.inventory_feed_events
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "inventory_feed_events_write" on public.inventory_feed_events
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "marketplace_properties_select" on public.marketplace_properties;
drop policy if exists "marketplace_properties_write" on public.marketplace_properties;
create policy "marketplace_properties_select" on public.marketplace_properties
  for select to authenticated
  using (
    listing_status = 'published'
    or app_private.has_cell_access(company_id, cell_id)
    or app_private.is_platform_admin()
  );
create policy "marketplace_properties_write" on public.marketplace_properties
  for all to authenticated
  using (app_private.is_platform_admin() or app_private.has_cell_access(company_id, cell_id))
  with check (app_private.is_platform_admin() or company_id = app_private.current_company());

drop policy if exists "property_payment_plans_select" on public.property_payment_plans;
drop policy if exists "property_payment_plans_write" on public.property_payment_plans;
create policy "property_payment_plans_select" on public.property_payment_plans
  for select to authenticated
  using (
    exists (
      select 1 from public.marketplace_properties mp
      where mp.id = property_payment_plans.property_id
        and (mp.listing_status = 'published' or app_private.has_cell_access(mp.company_id, mp.cell_id))
    )
  );
create policy "property_payment_plans_write" on public.property_payment_plans
  for all to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company())
  with check (app_private.is_platform_admin() or company_id = app_private.current_company());

drop policy if exists "resale_verifications_select" on public.resale_verifications;
drop policy if exists "resale_verifications_write" on public.resale_verifications;
create policy "resale_verifications_select" on public.resale_verifications
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "resale_verifications_write" on public.resale_verifications
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "resale_valuations_select" on public.resale_valuations;
drop policy if exists "resale_valuations_write" on public.resale_valuations;
create policy "resale_valuations_select" on public.resale_valuations
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "resale_valuations_write" on public.resale_valuations
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "lead_cell_assignments_select" on public.lead_cell_assignments;
drop policy if exists "lead_cell_assignments_write" on public.lead_cell_assignments;
create policy "lead_cell_assignments_select" on public.lead_cell_assignments
  for select to authenticated
  using (app_private.has_cell_access(company_id, cell_id));
create policy "lead_cell_assignments_write" on public.lead_cell_assignments
  for all to authenticated
  using (app_private.has_cell_access(company_id, cell_id))
  with check (app_private.has_cell_access(company_id, cell_id));

drop policy if exists "property_search_events_select" on public.property_search_events;
drop policy if exists "property_search_events_write" on public.property_search_events;
create policy "property_search_events_select" on public.property_search_events
  for select to authenticated
  using (user_id = auth.uid() or lead_id is null or app_private.is_company_operator());
create policy "property_search_events_write" on public.property_search_events
  for all to authenticated
  using (user_id = auth.uid() or company_id = app_private.current_company())
  with check (user_id = auth.uid() or company_id = app_private.current_company());

drop policy if exists "property_recommendations_select" on public.property_recommendations;
drop policy if exists "property_recommendations_write" on public.property_recommendations;
create policy "property_recommendations_select" on public.property_recommendations
  for select to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "property_recommendations_write" on public.property_recommendations
  for all to authenticated
  using (app_private.is_platform_admin() or company_id = app_private.current_company())
  with check (app_private.is_platform_admin() or company_id = app_private.current_company());

drop policy if exists "roi_scenarios_select" on public.roi_scenarios;
drop policy if exists "roi_scenarios_write" on public.roi_scenarios;
create policy "roi_scenarios_select" on public.roi_scenarios
  for select to authenticated
  using (created_by = auth.uid() or app_private.is_platform_admin() or company_id = app_private.current_company());
create policy "roi_scenarios_write" on public.roi_scenarios
  for all to authenticated
  using (created_by = auth.uid() or app_private.is_platform_admin() or company_id = app_private.current_company())
  with check (created_by = auth.uid() or app_private.is_platform_admin() or company_id = app_private.current_company());

drop policy if exists "crm_transactions_select" on public.crm_transactions;
drop policy if exists "crm_transactions_write" on public.crm_transactions;
create policy "crm_transactions_select" on public.crm_transactions
  for select to authenticated
  using (app_private.has_cell_access(company_id, cell_id));
create policy "crm_transactions_write" on public.crm_transactions
  for all to authenticated
  using (app_private.has_cell_access(company_id, cell_id))
  with check (app_private.has_cell_access(company_id, cell_id));

drop policy if exists "commission_schemes_select" on public.commission_schemes;
drop policy if exists "commission_schemes_write" on public.commission_schemes;
create policy "commission_schemes_select" on public.commission_schemes
  for select to authenticated
  using (company_id = app_private.current_company() or app_private.is_platform_admin());
create policy "commission_schemes_write" on public.commission_schemes
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

drop policy if exists "commission_splits_select" on public.commission_splits;
drop policy if exists "commission_splits_write" on public.commission_splits;
create policy "commission_splits_select" on public.commission_splits
  for select to authenticated
  using (
    beneficiary_user_id = auth.uid()
    or app_private.has_cell_access(company_id, cell_id)
  );
create policy "commission_splits_write" on public.commission_splits
  for all to authenticated
  using (app_private.has_cell_access(company_id, cell_id) and app_private.is_company_operator())
  with check (app_private.has_cell_access(company_id, cell_id) and app_private.is_company_operator());

drop policy if exists "cell_performance_snapshots_select" on public.cell_performance_snapshots;
drop policy if exists "cell_performance_snapshots_write" on public.cell_performance_snapshots;
create policy "cell_performance_snapshots_select" on public.cell_performance_snapshots
  for select to authenticated
  using (app_private.has_cell_access(company_id, cell_id));
create policy "cell_performance_snapshots_write" on public.cell_performance_snapshots
  for all to authenticated
  using (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()))
  with check (app_private.is_platform_admin() or (company_id = app_private.current_company() and app_private.is_company_operator()));

-- Relationship documentation for the generated API.
comment on table public.work_cells is 'Multi-tenant sales cells for FAST INVESTMENT style operating model.';
comment on table public.marketplace_properties is 'Headless property abstraction combining primary developer inventory and verified resale listings.';
comment on table public.api_integrations is 'API gateway registry for developer inventory/prices/payment-plan feeds.';
comment on table public.resale_valuations is 'AVM and manual valuation records for resale units.';
comment on table public.crm_transactions is 'Unified transaction ledger for primary, resale, reservations, refunds, and commission payouts.';
comment on table public.commission_splits is 'Detailed commission distribution across agents, cell leaders, company, platform, and partners.';
