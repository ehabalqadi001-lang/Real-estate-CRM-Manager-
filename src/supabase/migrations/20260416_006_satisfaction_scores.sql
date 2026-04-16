create table if not exists public.satisfaction_scores (
  id           uuid        default gen_random_uuid() primary key,
  deal_id      uuid        references public.deals(id) on delete cascade not null,
  score        smallint    not null check (score between 1 and 5),
  agent_rating smallint    check (agent_rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique (deal_id)
);
alter table public.satisfaction_scores enable row level security;
-- Public insert (survey link is shared directly with client)
create policy "anyone can insert satisfaction score" on public.satisfaction_scores for insert with check (true);
create policy "authenticated can read scores" on public.satisfaction_scores for select using (auth.role() = 'authenticated');
