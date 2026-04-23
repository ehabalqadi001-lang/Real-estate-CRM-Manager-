create table if not exists public.broker_sales_submissions (
  id uuid primary key default gen_random_uuid(),
  broker_profile_id uuid not null references public.broker_profiles(id) on delete cascade,
  broker_user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.profiles(id) on delete set null,
  assigned_account_manager_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_phone text,
  project_name text not null,
  developer_name text,
  unit_code text,
  unit_type text,
  deal_value numeric(15,2) not null default 0,
  developer_commission_rate numeric(8,4) not null default 0,
  broker_commission_rate numeric(8,4) not null default 0,
  gross_commission numeric(15,2) not null default 0,
  broker_commission_amount numeric(15,2) not null default 0,
  company_commission_amount numeric(15,2) not null default 0,
  stage text not null default 'eoi' check (stage in ('eoi', 'reservation', 'contract')),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled')),
  documents jsonb not null default '{}'::jsonb,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  commission_id uuid references public.commissions(id) on delete set null,
  commission_lifecycle_stage text not null default 'sale_submitted' check (
    commission_lifecycle_stage in (
      'sale_submitted',
      'sale_approved',
      'claim_submitted_to_developer',
      'developer_commission_collected',
      'broker_payout_scheduled',
      'broker_paid',
      'rejected'
    )
  ),
  developer_claim_submitted_at timestamptz,
  developer_collected_at timestamptz,
  broker_payout_due_date date,
  broker_paid_at timestamptz,
  payout_method text check (payout_method is null or payout_method in ('bank_transfer', 'cash', 'cheque')),
  bank_details jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

alter table public.user_profiles
  add constraint user_profiles_role_check
  check (
    role in (
      'super_admin',
      'platform_admin',
      'company_owner',
      'company_admin',
      'branch_manager',
      'senior_agent',
      'sales_director',
      'team_leader',
      'hr_manager',
      'hr_staff',
      'broker',
      'freelancer',
      'buyer_manager',
      'seller_resale_manager',
      'finance_officer',
      'hr_officer',
      'customer_support',
      'developer_relations_manager',
      'ad_reviewer',
      'ad_manager',
      'users_am',
      'ads_am',
      'am_supervisor',
      'collection_rep',
      'finance_manager',
      'inventory_rep',
      'data_manager',
      'campaign_specialist',
      'marketing_manager',
      'cs_agent',
      'cs_supervisor',
      'account_manager',
      'admin',
      'company',
      'agent',
      'individual',
      'viewer'
    )
  );

create index if not exists idx_broker_sales_broker
  on public.broker_sales_submissions(broker_user_id, created_at desc);

create index if not exists idx_broker_sales_company
  on public.broker_sales_submissions(company_id, status, created_at desc);

create index if not exists idx_broker_sales_account_manager
  on public.broker_sales_submissions(assigned_account_manager_id, status, created_at desc);

create index if not exists idx_broker_sales_lifecycle
  on public.broker_sales_submissions(commission_lifecycle_stage, created_at desc);

drop trigger if exists broker_sales_submissions_updated_at on public.broker_sales_submissions;
create trigger broker_sales_submissions_updated_at
  before update on public.broker_sales_submissions
  for each row execute function public.set_updated_at();

alter table public.commissions
  add column if not exists broker_sale_submission_id uuid references public.broker_sales_submissions(id) on delete set null,
  add column if not exists developer_claim_submitted_at timestamptz,
  add column if not exists developer_collected_at timestamptz,
  add column if not exists broker_payout_due_date date,
  add column if not exists broker_paid_at timestamptz,
  add column if not exists lifecycle_stage text default 'pending' check (
    lifecycle_stage is null or lifecycle_stage in (
      'pending',
      'approved',
      'claim_submitted_to_developer',
      'developer_commission_collected',
      'broker_payout_scheduled',
      'broker_paid',
      'cancelled'
    )
  );

create index if not exists idx_commissions_broker_sale_submission
  on public.commissions(broker_sale_submission_id);

alter table public.broker_sales_submissions enable row level security;

drop policy if exists "broker_sales_select" on public.broker_sales_submissions;
create policy "broker_sales_select" on public.broker_sales_submissions
  for select using (
    broker_user_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "broker_sales_insert" on public.broker_sales_submissions;
create policy "broker_sales_insert" on public.broker_sales_submissions
  for insert with check (
    broker_user_id = auth.uid()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "broker_sales_update" on public.broker_sales_submissions;
create policy "broker_sales_update" on public.broker_sales_submissions
  for update using (
    broker_user_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  ) with check (
    broker_user_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );
