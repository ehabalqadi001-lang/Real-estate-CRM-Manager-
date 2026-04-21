-- Fast Investment CRM: commissions, RBAC, and team management additions.
-- Additive and compatible with the existing schema.

create extension if not exists pgcrypto;

create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references public.developers(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  min_value numeric(12,2) default 0,
  max_value numeric(12,2),
  rate_percentage numeric(5,2) not null,
  agent_share_percentage numeric(5,2) default 70,
  company_share_percentage numeric(5,2) default 30,
  effective_from date default current_date,
  effective_to date,
  created_at timestamptz default now()
);

alter table public.commission_rates enable row level security;

drop policy if exists "commission rates read company" on public.commission_rates;
create policy "commission rates read company"
  on public.commission_rates for select
  using (auth.role() = 'authenticated');

drop policy if exists "commission rates manage admins" on public.commission_rates;
create policy "commission rates manage admins"
  on public.commission_rates for all
  using (public.is_company_manager() or public.is_super_admin())
  with check (public.is_company_manager() or public.is_super_admin());

alter table public.commissions
  add column if not exists gross_deal_value numeric(12,2),
  add column if not exists gross_commission numeric(12,2),
  add column if not exists agent_amount numeric(12,2),
  add column if not exists company_amount numeric(12,2),
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_date date,
  add column if not exists requested_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists receipt_url text,
  add column if not exists bank_details text;

alter table public.commissions
  drop constraint if exists commissions_status_check;

alter table public.commissions
  add constraint commissions_status_check
  check (status in ('pending','approved','processing','paid','disputed','cancelled'));

update public.commissions
set
  gross_deal_value = coalesce(gross_deal_value, total_amount, amount, 0),
  gross_commission = coalesce(gross_commission, total_amount, amount, 0),
  agent_amount = coalesce(agent_amount, amount, total_amount, 0),
  company_amount = coalesce(company_amount, 0),
  commission_rate = coalesce(commission_rate, rate, 0)
where gross_commission is null or agent_amount is null or commission_rate is null;

create index if not exists commission_rates_lookup_idx
  on public.commission_rates(project_id, developer_id, effective_from, effective_to);

create index if not exists commissions_status_created_idx
  on public.commissions(status, created_at desc);

create index if not exists commissions_agent_status_idx
  on public.commissions(agent_id, status, created_at desc);

create or replace function public.auto_create_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate public.commission_rates%rowtype;
  v_project_id uuid;
  v_developer_id uuid;
  v_value numeric;
  v_gross numeric;
  v_agent_amount numeric;
  v_company_amount numeric;
begin
  if coalesce(new.stage, '') in ('closed', 'closed_won', 'Contracted', 'contract_signed')
     and coalesce(old.stage, '') is distinct from coalesce(new.stage, '') then

    select u.project_id into v_project_id
    from public.units u
    where u.id = new.unit_id
    limit 1;

    v_project_id := coalesce(v_project_id, null);

    select p.developer_id into v_developer_id
    from public.projects p
    where p.id = v_project_id
    limit 1;

    v_value := coalesce(new.value, new.unit_value, new.final_price, new.amount, 0);

    select * into v_rate
    from public.commission_rates cr
    where (cr.project_id = v_project_id or cr.project_id is null)
      and (cr.developer_id = v_developer_id or cr.developer_id is null)
      and coalesce(cr.min_value, 0) <= v_value
      and (cr.max_value is null or cr.max_value >= v_value)
      and cr.effective_from <= current_date
      and (cr.effective_to is null or cr.effective_to >= current_date)
    order by cr.project_id nulls last, cr.developer_id nulls last, cr.min_value desc
    limit 1;

    if found and not exists (select 1 from public.commissions c where c.deal_id = new.id) then
      v_gross := v_value * v_rate.rate_percentage / 100;
      v_agent_amount := v_gross * v_rate.agent_share_percentage / 100;
      v_company_amount := v_gross * v_rate.company_share_percentage / 100;

      insert into public.commissions (
        deal_id, agent_id, company_id, gross_deal_value,
        commission_rate, gross_commission, agent_amount, company_amount,
        amount, total_amount, status
      )
      values (
        new.id, new.agent_id, new.company_id, v_value,
        v_rate.rate_percentage, v_gross, v_agent_amount, v_company_amount,
        v_agent_amount, v_gross, 'pending'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_auto_commission on public.deals;
create trigger trigger_auto_commission
  after update on public.deals
  for each row execute function public.auto_create_commission();

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  role text default 'agent'
    check (role in ('super_admin','company_admin','branch_manager','senior_agent','agent','individual','viewer')),
  account_type text default 'individual'
    check (account_type in ('individual','company')),
  company_id uuid references public.companies(id),
  branch_id uuid references public.branches(id),
  status text default 'pending'
    check (status in ('pending','active','suspended','rejected')),
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "own_profile" on public.user_profiles;
create policy "own_profile" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "company_admin_read" on public.user_profiles;
create policy "company_admin_read" on public.user_profiles
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role in ('super_admin','company_admin','branch_manager')
        and (up.company_id = user_profiles.company_id or up.role = 'super_admin')
    )
  );

drop policy if exists "company_admin_update" on public.user_profiles;
create policy "company_admin_update" on public.user_profiles
  for update using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role in ('super_admin','company_admin','branch_manager')
        and (up.company_id = user_profiles.company_id or up.role = 'super_admin')
    )
  );

drop policy if exists "company_admin_insert" on public.user_profiles;
create policy "company_admin_insert" on public.user_profiles
  for insert with check (
    id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role in ('super_admin','company_admin','branch_manager')
        and (up.company_id = user_profiles.company_id or up.role = 'super_admin')
    )
  );

create index if not exists user_profiles_company_role_idx on public.user_profiles(company_id, role);
create index if not exists user_profiles_status_idx on public.user_profiles(status);

do $$
begin
  begin
    alter publication supabase_realtime add table public.commissions;
  exception when duplicate_object then null;
  end;
end $$;
