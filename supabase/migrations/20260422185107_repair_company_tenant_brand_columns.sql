-- Repair production schemas that have the tenant migrations marked as applied
-- but are missing the runtime columns/tables used by the dashboard shell.
-- This migration is intentionally additive and idempotent.

begin;

alter table public.companies
  add column if not exists primary_brand_color text default '#0f766e',
  add column if not exists primary_color text default '#0f766e',
  add column if not exists tenant_id uuid;

update public.companies
set
  primary_brand_color = coalesce(primary_brand_color, primary_color, '#0f766e'),
  primary_color = coalesce(primary_color, primary_brand_color, '#0f766e'),
  tenant_id = coalesce(tenant_id, id);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  domain text unique,
  subdomain text,
  logo_url text,
  primary_brand_color text not null default '#0f766e',
  primary_color text default '#0f766e',
  plan_tier text not null default 'basic',
  status text not null default 'active',
  max_users integer not null default 5,
  max_listings integer not null default 50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants
  add column if not exists domain text,
  add column if not exists subdomain text,
  add column if not exists logo_url text,
  add column if not exists primary_brand_color text not null default '#0f766e',
  add column if not exists primary_color text default '#0f766e',
  add column if not exists plan_tier text not null default 'basic',
  add column if not exists status text not null default 'active',
  add column if not exists max_users integer not null default 5,
  add column if not exists max_listings integer not null default 50,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

insert into public.tenants (
  id,
  company_name,
  subdomain,
  logo_url,
  primary_brand_color,
  primary_color,
  plan_tier,
  status,
  max_users,
  max_listings,
  metadata,
  created_at,
  updated_at
)
select
  c.id,
  c.name,
  nullif(
    trim(both '-' from lower(regexp_replace(coalesce(c.slug, c.name, 'tenant-' || left(c.id::text, 8)), '[^a-zA-Z0-9]+', '-', 'g'))),
    ''
  ),
  c.logo_url,
  coalesce(c.primary_brand_color, c.primary_color, '#0f766e'),
  coalesce(c.primary_color, c.primary_brand_color, '#0f766e'),
  coalesce(nullif(c.plan_tier, ''), 'basic'),
  case
    when coalesce(c.is_suspended, false) then 'suspended'
    when coalesce(c.active, true) then 'active'
    else 'suspended'
  end,
  coalesce(c.max_users, 5),
  coalesce(c.max_listings, 50),
  jsonb_build_object('source', 'companies'),
  coalesce(c.created_at, now()),
  coalesce(c.updated_at, now())
from public.companies c
on conflict (id) do update set
  company_name = excluded.company_name,
  subdomain = coalesce(public.tenants.subdomain, excluded.subdomain),
  logo_url = coalesce(excluded.logo_url, public.tenants.logo_url),
  primary_brand_color = coalesce(public.tenants.primary_brand_color, excluded.primary_brand_color, '#0f766e'),
  primary_color = coalesce(public.tenants.primary_color, excluded.primary_color, '#0f766e'),
  plan_tier = excluded.plan_tier,
  status = excluded.status,
  max_users = excluded.max_users,
  max_listings = excluded.max_listings,
  updated_at = now();

alter table public.profiles
  add column if not exists tenant_id uuid,
  add column if not exists logo_url text,
  add column if not exists primary_brand_color text default '#0f766e';

update public.profiles p
set tenant_id = coalesce(p.tenant_id, p.company_id)
where p.tenant_id is null
  and p.company_id is not null
  and exists (select 1 from public.tenants t where t.id = p.company_id);

alter table public.companies
  drop constraint if exists companies_tenant_id_fkey,
  add constraint companies_tenant_id_fkey foreign key (tenant_id) references public.tenants(id);

alter table public.profiles
  drop constraint if exists profiles_tenant_id_fkey,
  add constraint profiles_tenant_id_fkey foreign key (tenant_id) references public.tenants(id);

create unique index if not exists tenants_subdomain_unique_idx
  on public.tenants (lower(subdomain))
  where subdomain is not null;

create index if not exists idx_tenants_status on public.tenants(status);
create index if not exists idx_profiles_tenant_id on public.profiles(tenant_id);
create index if not exists idx_companies_tenant_id on public.companies(tenant_id);

alter table public.tenants enable row level security;

drop policy if exists tenants_read_own_or_platform on public.tenants;
create policy tenants_read_own_or_platform on public.tenants
  for select
  using (
    id in (
      select coalesce(p.tenant_id, p.company_id, p.id)
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'platform_admin', 'Super_Admin', 'Super Admin')
    )
  );

drop policy if exists tenants_update_company_admin on public.tenants;
create policy tenants_update_company_admin on public.tenants
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.tenant_id, p.company_id, p.id) = public.tenants.id
        and p.role in ('company_owner', 'company_admin', 'company', 'admin', 'Admin')
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'platform_admin', 'Super_Admin', 'Super Admin')
    )
  )
  with check (true);

commit;
