-- Add account_manager_id to user_profiles so the assigned account manager
-- is persisted on the user's canonical profile record, not only on partner_applications.

alter table public.user_profiles
  add column if not exists account_manager_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_user_profiles_account_manager
  on public.user_profiles(account_manager_id);
