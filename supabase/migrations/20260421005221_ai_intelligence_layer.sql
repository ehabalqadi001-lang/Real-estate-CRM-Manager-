-- Fast Investment CRM: AI Intelligence Layer
-- Adds lead AI scoring, persistent AI alerts, and weekly AI insight storage.

alter table public.leads
  add column if not exists ai_score integer check (ai_score between 0 and 100),
  add column if not exists ai_recommendation text,
  add column if not exists ai_scored_at timestamptz;

create index if not exists leads_ai_score_idx on public.leads(company_id, ai_score desc, ai_scored_at desc);

create table if not exists public.ai_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  agent_id uuid references auth.users(id) on delete cascade,
  source_type text not null default 'smart_alert'
    check (source_type in ('lead_scoring','smart_alert','commission','deal','market','weekly')),
  priority text not null default 'medium'
    check (priority in ('critical','high','medium','low')),
  title text not null,
  body text not null,
  action_label text not null default 'فتح',
  action_link text not null default '/dashboard',
  payload jsonb not null default '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_alerts_company_agent_idx
  on public.ai_alerts(company_id, agent_id, dismissed_at, created_at desc);

create index if not exists ai_alerts_priority_idx
  on public.ai_alerts(priority, created_at desc);

alter table public.ai_alerts enable row level security;

drop policy if exists "ai_alerts_select" on public.ai_alerts;
create policy "ai_alerts_select" on public.ai_alerts
  for select using (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );

drop policy if exists "ai_alerts_insert" on public.ai_alerts;
create policy "ai_alerts_insert" on public.ai_alerts
  for insert with check (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );

drop policy if exists "ai_alerts_update" on public.ai_alerts;
create policy "ai_alerts_update" on public.ai_alerts
  for update using (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  ) with check (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );

create table if not exists public.ai_weekly_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  agent_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  achievements text[] not null default '{}'::text[],
  attention_deals text[] not null default '{}'::text[],
  next_week_forecast text[] not null default '{}'::text[],
  coaching_tip text not null default '',
  raw_text text,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(agent_id, week_start)
);

create index if not exists ai_weekly_insights_company_week_idx
  on public.ai_weekly_insights(company_id, week_start desc);

alter table public.ai_weekly_insights enable row level security;

drop policy if exists "ai_weekly_insights_select" on public.ai_weekly_insights;
create policy "ai_weekly_insights_select" on public.ai_weekly_insights
  for select using (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );

drop policy if exists "ai_weekly_insights_insert" on public.ai_weekly_insights;
create policy "ai_weekly_insights_insert" on public.ai_weekly_insights
  for insert with check (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );

drop policy if exists "ai_weekly_insights_update" on public.ai_weekly_insights;
create policy "ai_weekly_insights_update" on public.ai_weekly_insights
  for update using (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  ) with check (
    public.is_super_admin()
    or agent_id = auth.uid()
    or company_id = public.current_company_id()
  );
