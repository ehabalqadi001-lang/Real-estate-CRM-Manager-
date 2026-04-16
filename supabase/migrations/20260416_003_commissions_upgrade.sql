-- ============================================================
-- Commissions upgrade — add type, deal_value, percentage cols
-- ============================================================
alter table public.commissions
  add column if not exists commission_type text    default 'agent'
    check (commission_type in ('agent', 'manager', 'company', 'developer')),
  add column if not exists deal_value      numeric,
  add column if not exists percentage      numeric;

-- Backfill existing rows
update public.commissions
  set commission_type = 'agent'
  where commission_type is null;

comment on column public.commissions.commission_type is
  'agent | manager | company | developer';
comment on column public.commissions.deal_value is
  'Snapshot of the deal unit_value at time of commission creation';
comment on column public.commissions.percentage is
  'Commission percentage if calculated as % of deal_value';
