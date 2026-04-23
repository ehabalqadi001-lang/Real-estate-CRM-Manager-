create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.profiles(id) on delete set null,
  applicant_type text not null check (applicant_type in ('broker_freelancer', 'company')),
  status text not null default 'pending' check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  first_name text,
  last_name text,
  full_name text,
  email text not null,
  phone text,
  company_name text,
  manager_name text,
  manager_phone text,
  owner_phone text,
  facebook_url text,
  documents jsonb not null default '{}'::jsonb,
  assigned_account_manager_id uuid references public.profiles(id) on delete set null,
  review_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  brm_stage text not null default 'application_review' check (
    brm_stage in (
      'application_review',
      'active_seller',
      'eoi',
      'reservation',
      'contract',
      'commission_claim',
      'commission_collected',
      'broker_payout_ready',
      'paid'
    )
  ),
  payout_method text not null default 'bank_transfer' check (payout_method in ('bank_transfer', 'cash', 'cheque')),
  bank_details jsonb not null default '{}'::jsonb,
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
      'company_admin',
      'company_owner',
      'branch_manager',
      'team_leader',
      'sales_director',
      'senior_agent',
      'agent',
      'individual',
      'viewer',
      'broker',
      'freelancer',
      'account_manager'
    )
  );

create unique index if not exists partner_applications_profile_type_unique
  on public.partner_applications(profile_id, applicant_type);

create index if not exists idx_partner_applications_status
  on public.partner_applications(status, created_at desc);

create index if not exists idx_partner_applications_company
  on public.partner_applications(company_id, created_at desc);

create index if not exists idx_partner_applications_account_manager
  on public.partner_applications(assigned_account_manager_id, status);

drop trigger if exists partner_applications_updated_at on public.partner_applications;
create trigger partner_applications_updated_at
  before update on public.partner_applications
  for each row execute function public.set_updated_at();

alter table public.partner_applications enable row level security;

drop policy if exists "partner_applications_select" on public.partner_applications;
create policy "partner_applications_select" on public.partner_applications
  for select using (
    profile_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "partner_applications_insert" on public.partner_applications;
create policy "partner_applications_insert" on public.partner_applications
  for insert with check (
    profile_id = auth.uid()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "partner_applications_update" on public.partner_applications;
create policy "partner_applications_update" on public.partner_applications
  for update using (
    profile_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  ) with check (
    profile_id = auth.uid()
    or assigned_account_manager_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );
