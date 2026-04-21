-- Super Admin Panel schema and platform-wide RLS bypass.
-- Uses the requested JWT role predicate and the existing hardened profile-based
-- public.is_super_admin() fallback because auth.jwt()->>'role' is not always
-- fresh and should not be the only authorization source.

alter table public.announcements
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists start_date timestamptz,
  add column if not exists is_active boolean default true,
  add column if not exists priority text default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical'));

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  user_id uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  category text,
  resolution_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists idx_support_tickets_status_priority
  on public.support_tickets(status, priority, created_at desc);

create index if not exists idx_support_tickets_company
  on public.support_tickets(company_id, created_at desc);

create index if not exists idx_announcements_schedule
  on public.announcements(start_date, end_date, is_active);

alter table public.support_tickets enable row level security;
alter table public.announcements enable row level security;
alter table public.companies enable row level security;
alter table public.user_profiles enable row level security;
alter table public.developers enable row level security;
alter table public.projects enable row level security;
alter table public.commission_rates enable row level security;
alter table public.commissions enable row level security;
alter table public.deals enable row level security;

drop policy if exists "support_tickets_super_admin_bypass" on public.support_tickets;
create policy "support_tickets_super_admin_bypass" on public.support_tickets
  for all using (
    auth.jwt() ->> 'role' = 'super_admin'
    or public.is_super_admin()
  )
  with check (
    auth.jwt() ->> 'role' = 'super_admin'
    or public.is_super_admin()
  );

drop policy if exists "support_tickets_company_read" on public.support_tickets;
create policy "support_tickets_company_read" on public.support_tickets
  for select using (
    company_id = public.current_company_id()
    or user_id = auth.uid()
    or assigned_to = auth.uid()
  );

drop policy if exists "support_tickets_user_insert" on public.support_tickets;
create policy "support_tickets_user_insert" on public.support_tickets
  for insert with check (
    user_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_super_admin()
  );

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'announcements',
    'companies',
    'user_profiles',
    'developers',
    'projects',
    'commission_rates',
    'commissions',
    'deals'
  ]
  loop
    execute format('drop policy if exists "super_admin_bypass" on public.%I', table_name);
    execute format(
      'create policy "super_admin_bypass" on public.%I for all using ((auth.jwt() ->> ''role'' = ''super_admin'') or public.is_super_admin()) with check ((auth.jwt() ->> ''role'' = ''super_admin'') or public.is_super_admin())',
      table_name
    );
  end loop;
end;
$$;
