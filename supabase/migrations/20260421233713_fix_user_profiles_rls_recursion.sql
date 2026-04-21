-- Fix production RLS recursion on public.user_profiles.
-- The previous user_profiles policies called helper functions that read
-- user_profiles while RLS was evaluating user_profiles, which can trigger:
-- "infinite recursion detected in policy for relation user_profiles".

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select up.company_id from public.user_profiles up where up.id = auth.uid() limit 1),
    (select p.company_id from public.profiles p where p.id = auth.uid() limit 1)
  );
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select up.role from public.user_profiles up where up.id = auth.uid() limit 1),
    (select p.role from public.profiles p where p.id = auth.uid() limit 1),
    'viewer'
  );
$$;

create or replace function public.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select up.status from public.user_profiles up where up.id = auth.uid() limit 1),
    (select p.status from public.profiles p where p.id = auth.uid() limit 1),
    'pending'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.current_user_role() in ('super_admin', 'platform_admin')
    and public.current_user_status() not in ('suspended', 'rejected');
$$;

create or replace function public.is_company_manager()
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
    'branch_manager',
    'team_leader',
    'sales_director',
    'admin',
    'company'
  )
  and public.current_user_status() not in ('suspended', 'rejected');
$$;

alter table public.user_profiles enable row level security;

drop policy if exists "own_profile" on public.user_profiles;
drop policy if exists "company_admin_read" on public.user_profiles;
drop policy if exists "company_admin_update" on public.user_profiles;
drop policy if exists "company_admin_insert" on public.user_profiles;
drop policy if exists "super_admin_bypass" on public.user_profiles;

create policy "own_profile"
  on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "company_admin_read"
  on public.user_profiles
  for select
  to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
    )
  );

create policy "company_admin_insert"
  on public.user_profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    or public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role in ('branch_manager', 'senior_agent', 'agent', 'individual', 'viewer')
    )
  );

create policy "company_admin_update"
  on public.user_profiles
  for update
  to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role not in ('super_admin', 'platform_admin', 'company_admin')
    )
  )
  with check (
    id = auth.uid()
    or public.is_super_admin()
    or (
      public.is_company_manager()
      and company_id = public.current_company_id()
      and role not in ('super_admin', 'platform_admin', 'company_admin')
    )
  );

create policy "super_admin_bypass"
  on public.user_profiles
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
