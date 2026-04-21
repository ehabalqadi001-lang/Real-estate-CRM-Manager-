create table if not exists public.agent_targets (
  id            uuid        default gen_random_uuid() primary key,
  agent_id      uuid        references auth.users(id) on delete cascade not null,
  month         text        not null,  -- YYYY-MM
  revenue_target numeric    default 0,
  deals_target  integer     default 0,
  leads_target  integer     default 0,
  created_at    timestamptz default now(),
  unique (agent_id, month)
);
alter table public.agent_targets enable row level security;
create policy "company can manage targets" on public.agent_targets
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('company','admin')));
create policy "agents can read own targets" on public.agent_targets for select
  using (auth.uid() = agent_id);
