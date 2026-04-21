-- Inventory Management System
-- Adds the fields required by the Arabic-first inventory experience while
-- preserving the existing Fast Investment CRM schema.

alter table public.developers
  add column if not exists name_ar text,
  add column if not exists logo_url text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists description text,
  add column if not exists tier text default 'standard',
  add column if not exists active boolean default true;

alter table public.developers
  drop constraint if exists developers_tier_check,
  add constraint developers_tier_check
    check (tier in ('premium', 'standard', 'basic'));

update public.developers
set name_ar = coalesce(name_ar, name)
where name_ar is null;

alter table public.projects
  add column if not exists name_ar text,
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists delivery_date date,
  add column if not exists max_price numeric(12,2),
  add column if not exists cover_image_url text,
  add column if not exists gallery_urls text[],
  add column if not exists featured boolean default false;

update public.projects
set
  name_ar = coalesce(name_ar, name),
  latitude = coalesce(latitude, lat),
  longitude = coalesce(longitude, lng),
  cover_image_url = coalesce(cover_image_url, cover_image),
  gallery_urls = coalesce(gallery_urls, images),
  featured = coalesce(featured, is_featured, false)
where name_ar is null
   or latitude is null
   or longitude is null
   or cover_image_url is null
   or gallery_urls is null
   or featured is null;

alter table public.projects
  drop constraint if exists projects_project_type_check,
  add constraint projects_project_type_check
    check (
      project_type is null
      or project_type in ('residential', 'commercial', 'mixed', 'resort', 'administrative')
    );

alter table public.units
  add column if not exists floor_number integer,
  add column if not exists building text,
  add column if not exists down_payment numeric(12,2),
  add column if not exists monthly_installment numeric(12,2),
  add column if not exists installment_years smallint,
  add column if not exists held_by uuid references public.agents(id),
  add column if not exists held_until timestamptz,
  add column if not exists floor_plan_url text,
  add column if not exists virtual_tour_url text,
  add column if not exists notes text;

update public.units
set floor_number = coalesce(floor_number, floor)
where floor_number is null and floor is not null;

alter table public.units
  drop constraint if exists units_unit_type_check,
  add constraint units_unit_type_check
    check (
      unit_type is null
      or unit_type in ('apartment', 'villa', 'duplex', 'penthouse', 'studio', 'office', 'shop', 'chalet', 'townhouse')
    ),
  drop constraint if exists units_finishing_check,
  add constraint units_finishing_check
    check (
      finishing is null
      or finishing in ('fully_finished', 'semi_finished', 'core_shell', 'furnished')
    ),
  drop constraint if exists units_status_check,
  add constraint units_status_check
    check (status is null or status in ('available', 'reserved', 'sold', 'held'));

create table if not exists public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete cascade,
  name text not null,
  down_payment_percentage numeric(5,2),
  installment_years integer,
  installment_frequency text default 'monthly'
    check (installment_frequency in ('monthly', 'quarterly', 'semi_annual', 'annual')),
  maintenance_fee_percentage numeric(5,2),
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_developers_active on public.developers(active);
create index if not exists idx_projects_developer_id on public.projects(developer_id);
create index if not exists idx_projects_city on public.projects(city);
create index if not exists idx_projects_featured_v2 on public.projects(featured) where featured = true;
create index if not exists idx_units_project_id on public.units(project_id);
create index if not exists idx_units_status on public.units(status);
create index if not exists idx_units_price on public.units(price);
create index if not exists idx_units_area_sqm on public.units(area_sqm);
create index if not exists idx_units_held_until on public.units(held_until) where status = 'held';
create index if not exists idx_payment_plans_unit_id on public.payment_plans(unit_id);

alter table public.developers enable row level security;
alter table public.projects enable row level security;
alter table public.units enable row level security;
alter table public.payment_plans enable row level security;

drop policy if exists "developers_inventory_select" on public.developers;
create policy "developers_inventory_select" on public.developers
  for select using (auth.uid() is not null);

drop policy if exists "developers_inventory_manage" on public.developers;
create policy "developers_inventory_manage" on public.developers
  for all using (public.is_company_manager() or public.is_super_admin())
  with check (public.is_company_manager() or public.is_super_admin());

drop policy if exists "projects_inventory_select" on public.projects;
create policy "projects_inventory_select" on public.projects
  for select using (
    auth.uid() is not null
    and (
      company_id is null
      or company_id = public.current_company_id()
      or public.is_super_admin()
    )
  );

drop policy if exists "projects_inventory_manage" on public.projects;
create policy "projects_inventory_manage" on public.projects
  for all using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  );

drop policy if exists "units_inventory_select" on public.units;
create policy "units_inventory_select" on public.units
  for select using (
    auth.uid() is not null
    and (
      company_id is null
      or company_id = public.current_company_id()
      or public.is_super_admin()
    )
  );

drop policy if exists "units_inventory_manage" on public.units;
create policy "units_inventory_manage" on public.units
  for all using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
    or held_by = auth.uid()
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
    or held_by = auth.uid()
  );

drop policy if exists "payment_plans_inventory_select" on public.payment_plans;
create policy "payment_plans_inventory_select" on public.payment_plans
  for select using (
    auth.uid() is not null
    and exists (
      select 1
      from public.units u
      where u.id = payment_plans.unit_id
        and (
          u.company_id is null
          or u.company_id = public.current_company_id()
          or public.is_super_admin()
        )
    )
  );

drop policy if exists "payment_plans_inventory_manage" on public.payment_plans;
create policy "payment_plans_inventory_manage" on public.payment_plans
  for all using (public.is_company_manager() or public.is_super_admin())
  with check (public.is_company_manager() or public.is_super_admin());

create or replace function public.release_expired_unit_holds()
returns integer
language plpgsql
security invoker
as $$
declare
  released_count integer;
begin
  update public.units
  set
    status = 'available',
    held_by = null,
    held_until = null,
    updated_at = now()
  where status = 'held'
    and held_until is not null
    and held_until < now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;
