-- ============================================================
-- WhatsApp AI Logs — stores AI assistant conversation history
-- ============================================================
create table if not exists public.whatsapp_ai_logs (
  id            uuid        default gen_random_uuid() primary key,
  client_phone  text        not null,
  user_message  text        not null,
  ai_reply      text        not null,
  model         text        default 'claude-haiku-4-5-20251001',
  created_at    timestamptz default now() not null
);

create index if not exists whatsapp_ai_logs_phone_idx on public.whatsapp_ai_logs (client_phone);
create index if not exists whatsapp_ai_logs_created_at_idx on public.whatsapp_ai_logs (created_at desc);

alter table public.whatsapp_ai_logs enable row level security;

create policy "authenticated users can read ai logs"
  on public.whatsapp_ai_logs for select
  using (auth.role() = 'authenticated');

create policy "service role inserts ai logs"
  on public.whatsapp_ai_logs for insert
  with check (true);
