-- Fast Investment CRM: Pipeline + notifications compatibility
-- Additive migration for the existing public.deals / public.notifications schema.

create extension if not exists pgcrypto;

alter table public.deals
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists agent_id uuid references public.profiles(id) on delete set null,
  add column if not exists unit_id uuid references public.units(id) on delete set null,
  add column if not exists title text,
  add column if not exists value numeric(12,2),
  add column if not exists expected_close_date date,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

update public.deals
set title = coalesce(title, client_name, buyer_name, project_name, 'صفقة عقارية')
where title is null;

alter table public.deals
  alter column title set default 'صفقة عقارية';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deals_stage_supported_values'
      and conrelid = 'public.deals'::regclass
  ) then
    alter table public.deals
      add constraint deals_stage_supported_values
      check (
        stage is null
        or stage in (
          'new','contacted','viewing','offer','contract','closed','lost',
          'lead','qualified','site_visit','proposal','negotiation','reservation','closed_won','closed_lost',
          'New','Negotiation','Contracted','Registration','Handover','Lost','contract_signed'
        )
      ) not valid;
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

create table if not exists public.deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null default 'note',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists deals_stage_idx on public.deals(stage);
create index if not exists deals_agent_id_idx on public.deals(agent_id);
create index if not exists deals_lead_id_idx on public.deals(lead_id);
create index if not exists deals_unit_id_idx on public.deals(unit_id);
create index if not exists deals_expected_close_date_idx on public.deals(expected_close_date);
create index if not exists deal_activities_deal_created_idx on public.deal_activities(deal_id, created_at desc);

alter table public.deals enable row level security;
alter table public.deal_activities enable row level security;

drop policy if exists "deal activities select visible deals" on public.deal_activities;
create policy "deal activities select visible deals"
  on public.deal_activities for select
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (
          d.agent_id = auth.uid()
          or d.company_id = public.current_company_id()
          or public.is_super_admin()
        )
    )
  );

drop policy if exists "deal activities insert visible deals" on public.deal_activities;
create policy "deal activities insert visible deals"
  on public.deal_activities for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (
          d.agent_id = auth.uid()
          or d.company_id = public.current_company_id()
          or public.is_super_admin()
        )
    )
  );

alter table public.notifications
  add column if not exists body text,
  add column if not exists read_at timestamptz;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('info','success','warning','error','deal_moved','new_client','commission_paid','task_due','mention'));

update public.notifications
set body = coalesce(body, message)
where body is null;

update public.notifications
set read_at = coalesce(read_at, created_at)
where is_read = true and read_at is null;

create index if not exists notifications_user_read_created_idx
  on public.notifications(user_id, is_read, created_at desc);

create index if not exists notifications_user_read_at_created_idx
  on public.notifications(user_id, read_at, created_at desc);

drop policy if exists "users can delete own notifications" on public.notifications;
create policy "users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

do $$
begin
  begin
    alter publication supabase_realtime add table public.deals;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.deal_activities;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.audit_logs;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then
    null;
  end;
end $$;
