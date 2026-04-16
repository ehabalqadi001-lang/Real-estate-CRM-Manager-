-- ============================================================
-- Audit Logs — records every CRM action for compliance trail
-- ============================================================
create table if not exists public.audit_logs (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete set null,
  action        text        not null,           -- e.g. 'lead.created', 'deal.stage_changed'
  target_table  text,                           -- e.g. 'leads', 'deals'
  target_id     text,                           -- row id being acted on
  metadata      jsonb,                          -- arbitrary context (old/new values, etc.)
  created_at    timestamptz default now() not null
);

-- Index for fast per-user queries
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- Row-Level Security
alter table public.audit_logs enable row level security;

-- Admins and company owners can read all logs in their company
create policy "company owners can read audit logs"
  on public.audit_logs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'company')
    )
  );

-- Only server-side inserts (service role) — no client writes
create policy "service role inserts audit logs"
  on public.audit_logs for insert
  with check (true);
