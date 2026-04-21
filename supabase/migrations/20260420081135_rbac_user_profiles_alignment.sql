-- Fast Investment CRM: align RLS helper functions with user_profiles.
-- user_profiles is now the canonical RBAC table. profiles remains a legacy fallback.

create or replace function public.current_company_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.company_id, p.company_id)
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.role, p.role, 'viewer')
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_status()
returns text
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.status, p.status, 'pending')
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_company_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.role, p.role) in (
    'super_admin',
    'platform_admin',
    'company_owner',
    'company_admin',
    'branch_manager',
    'team_leader',
    'sales_director',
    'admin',
    'company'
  )
  and coalesce(up.status, p.status, 'active') not in ('suspended', 'rejected')
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.role, p.role) in ('super_admin', 'platform_admin')
  and coalesce(up.status, p.status, 'active') not in ('suspended', 'rejected')
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

drop policy if exists "company_admin_read" on public.user_profiles;
create policy "company_admin_read" on public.user_profiles
  for select using (
    auth.uid() = id
    or public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
    )
  );

drop policy if exists "company_admin_update" on public.user_profiles;
create policy "company_admin_update" on public.user_profiles
  for update using (
    public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role not in ('super_admin', 'company_admin')
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role not in ('super_admin', 'company_admin')
    )
  );

drop policy if exists "company_admin_insert" on public.user_profiles;
create policy "company_admin_insert" on public.user_profiles
  for insert with check (
    id = auth.uid()
    or public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role in ('branch_manager', 'senior_agent', 'agent', 'individual', 'viewer')
    )
  );
