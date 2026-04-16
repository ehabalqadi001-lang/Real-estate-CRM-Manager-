-- ============================================================
-- Notifications table (if not already created)
-- ============================================================
create table if not exists public.notifications (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  title       text        not null,
  message     text        not null default '',
  type        text        default 'info'
    check (type in ('info', 'success', 'warning', 'error')),
  is_read     boolean     default false,
  link        text,
  created_at  timestamptz default now() not null
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

alter table public.notifications enable row level security;

create policy "users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "service role inserts notifications"
  on public.notifications for insert
  with check (true);

-- Enable realtime for this table
alter publication supabase_realtime add table public.notifications;
