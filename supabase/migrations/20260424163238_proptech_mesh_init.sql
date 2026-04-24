-- Migration: Initialize Core PropTech Mesh Tables
-- We add new tables alongside existing ones safely.

-- 1. API Gateway Registry for Developers
create table if not exists public.developer_api_clients (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null, -- Intentionally no cascade here yet to ensure stability
  company_id uuid,
  name text not null,
  client_key text not null unique,
  secret_ref text not null, -- Stores reference to Supabase Vault
  allowed_ips inet[],
  scopes text[] not null default array['inventory:write'],
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.developer_api_clients enable row level security;

-- 2. Ingestion Engine Batches
create table if not exists public.inventory_ingestion_batches (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid,
  company_id uuid,
  source_type text not null check (source_type in ('api','excel','csv','manual')),
  source_name text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','partially_completed')),
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  failed_rows integer not null default 0,
  mapping_payload jsonb not null default '{}'::jsonb,
  error_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Enable RLS
alter table public.inventory_ingestion_batches enable row level security;

-- 3. Ingestion Engine Rows
create table if not exists public.inventory_ingestion_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.inventory_ingestion_batches(id) on delete cascade,
  row_number integer not null,
  raw_payload jsonb not null,
  mapped_payload jsonb not null default '{}'::jsonb,
  target_table text,
  target_id uuid,
  status text not null default 'pending' check (status in ('pending','processed','failed','ignored')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.inventory_ingestion_rows enable row level security;

-- 4. Apply RLS Policies for New Tables
create policy "api_clients_admin_only" on public.developer_api_clients
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin','platform_admin'));

create policy "ingestion_batches_company_scope" on public.inventory_ingestion_batches
  for all to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin','platform_admin')
    or company_id = (select auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  );

create policy "ingestion_rows_batch_scope" on public.inventory_ingestion_rows
  for all to authenticated
  using (
    exists (
      select 1 from public.inventory_ingestion_batches b
      where b.id = inventory_ingestion_rows.batch_id
      and (
        (select auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin','platform_admin')
        or b.company_id = (select auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
      )
    )
  );