-- Production runtime repair for dashboard/client/notification pages.
-- Additive and idempotent: safe to run on existing production data.

create extension if not exists pgcrypto;

-- Keep auth helpers aligned with the newer user_profiles table while preserving
-- legacy profiles fallback. This fixes company/agent visibility in RLS.
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

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(up.role, p.role) in ('super_admin','platform_admin')
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
    'super_admin','platform_admin','company_owner','company_admin',
    'branch_manager','sales_director','team_leader','admin','company'
  )
  from auth.users u
  left join public.user_profiles up on up.id = u.id
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid()
  limit 1;
$$;

-- Missing columns causing production red errors.
alter table public.notifications
  add column if not exists link text,
  add column if not exists body text,
  add column if not exists read_at timestamptz,
  add column if not exists is_read boolean default false,
  add column if not exists company_id uuid references public.companies(id);

update public.notifications
set body = coalesce(body, message)
where body is null;

create index if not exists notifications_user_created_repair_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_read_repair_idx
  on public.notifications(user_id, is_read, created_at desc);

alter table public.clients
  add column if not exists status text default 'active',
  add column if not exists assigned_to uuid references auth.users(id),
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_status_supported_values'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_status_supported_values
      check (status is null or status in ('active','follow_up','new','inactive','converted','lost')) not valid;
  end if;
end $$;

update public.clients
set status = 'active'
where status is null;

create index if not exists clients_company_status_repair_idx
  on public.clients(company_id, status, created_at desc);

create index if not exists clients_assigned_to_repair_idx
  on public.clients(assigned_to);

alter table public.clients enable row level security;

drop policy if exists "clients_select_v2" on public.clients;
drop policy if exists "clients_insert_v2" on public.clients;
drop policy if exists "clients_update_v2" on public.clients;
drop policy if exists "clients_delete_v2" on public.clients;
drop policy if exists "clients_company_agent_select" on public.clients;
drop policy if exists "clients_company_agent_insert" on public.clients;
drop policy if exists "clients_company_agent_update" on public.clients;
drop policy if exists "clients_company_manager_delete" on public.clients;

create policy "clients_company_agent_select"
  on public.clients for select
  using (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or assigned_to = auth.uid()
    or user_id = auth.uid()
  );

create policy "clients_company_agent_insert"
  on public.clients for insert
  with check (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or company_id is null
  );

create policy "clients_company_agent_update"
  on public.clients for update
  using (
    public.is_super_admin()
    or (
      company_id = public.current_company_id()
      and (
        public.is_company_manager()
        or assigned_to = auth.uid()
        or user_id = auth.uid()
      )
    )
  )
  with check (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or company_id is null
  );

create policy "clients_company_manager_delete"
  on public.clients for delete
  using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  );
