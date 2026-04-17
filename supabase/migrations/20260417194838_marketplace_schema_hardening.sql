-- Marketplace schema hardening
-- Adds product columns and replaces recursive role checks with private helpers.

create schema if not exists app_private;

create or replace function app_private.has_marketplace_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role_type = required_role
      and ur.is_active = true
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'Admin', 'super_admin', 'Super_Admin', 'platform_admin')
  );
$$;

create or replace function app_private.is_marketplace_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_marketplace_role('super_admin');
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.has_marketplace_role(text) to authenticated;
grant execute on function app_private.is_marketplace_admin() to authenticated;

alter table public.ads
  add column if not exists listing_kind text not null default 'resale',
  add column if not exists seller_type text not null default 'individual',
  add column if not exists compound_name text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists delivery_status text,
  add column if not exists points_cost numeric(10,2) not null default 1,
  add column if not exists submitted_at timestamptz not null default now();

alter table public.ads
  drop constraint if exists ads_listing_kind_check,
  add constraint ads_listing_kind_check check (listing_kind in ('primary', 'resale')),
  drop constraint if exists ads_seller_type_check,
  add constraint ads_seller_type_check check (seller_type in ('individual', 'company', 'developer', 'broker')),
  drop constraint if exists ads_delivery_status_check,
  add constraint ads_delivery_status_check check (delivery_status is null or delivery_status in ('ready', 'soon', 'off_plan'));

alter table public.ad_packages
  add column if not exists points_included numeric(10,2) not null default 0,
  add column if not exists verified_badge_included boolean not null default false;

alter table public.transactions
  add column if not exists provider_payload jsonb not null default '{}'::jsonb,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

alter table public.chat_messages
  add column if not exists channel text not null default 'internal',
  add column if not exists support_assigned_to uuid references auth.users(id);

alter table public.chat_messages
  drop constraint if exists chat_messages_channel_check,
  add constraint chat_messages_channel_check check (channel in ('internal', 'whatsapp'));

create index if not exists idx_ads_listing_kind on public.ads(listing_kind);
create index if not exists idx_ads_seller_type on public.ads(seller_type);
create index if not exists idx_ads_city on public.ads(city);
create index if not exists idx_ads_district on public.ads(district);
create index if not exists idx_ads_pending_review on public.ads(created_at desc) where status = 'pending';
create index if not exists idx_chat_messages_receiver_read on public.chat_messages(receiver_id, is_read, created_at desc);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_user_balances_user_id on public.user_balances(user_id);

update public.ad_packages
set
  points_included = ads_included,
  verified_badge_included = case when price >= 10000 then true else verified_badge_included end
where points_included = 0;

-- Replace marketplace policies with explicit role-targeted policies.
drop policy if exists "ad_packages_public_read" on public.ad_packages;
drop policy if exists "ad_packages_admin_write" on public.ad_packages;

create policy "ad_packages_public_read"
on public.ad_packages
for select
to anon, authenticated
using (is_active = true);

create policy "ad_packages_admin_write"
on public.ad_packages
for all
to authenticated
using (app_private.is_marketplace_admin())
with check (app_private.is_marketplace_admin());

drop policy if exists "user_balances_own" on public.user_balances;
drop policy if exists "user_balances_finance_read" on public.user_balances;

create policy "user_balances_owner_read"
on public.user_balances
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "user_balances_finance_read"
on public.user_balances
for select
to authenticated
using (app_private.has_marketplace_role('finance'));

create policy "user_balances_finance_write"
on public.user_balances
for all
to authenticated
using (app_private.has_marketplace_role('finance'))
with check (app_private.has_marketplace_role('finance'));

drop policy if exists "ads_public_read" on public.ads;
drop policy if exists "ads_own_manage" on public.ads;
drop policy if exists "ads_approval_team" on public.ads;

create policy "ads_public_read_approved"
on public.ads
for select
to anon, authenticated
using (status = 'approved');

create policy "ads_owner_read"
on public.ads
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "ads_owner_insert_pending"
on public.ads
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

create policy "ads_owner_update_pending"
on public.ads
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and status in ('pending', 'rejected')
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
);

create policy "ads_approval_team_all"
on public.ads
for all
to authenticated
using (app_private.has_marketplace_role('ad_approval'))
with check (app_private.has_marketplace_role('ad_approval'));

drop policy if exists "transactions_own" on public.transactions;
drop policy if exists "transactions_finance" on public.transactions;

create policy "transactions_owner_read"
on public.transactions
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "transactions_finance_all"
on public.transactions
for all
to authenticated
using (app_private.has_marketplace_role('finance'))
with check (app_private.has_marketplace_role('finance'));

drop policy if exists "chat_messages_participants" on public.chat_messages;

create policy "chat_messages_participants_select"
on public.chat_messages
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    sender_id = (select auth.uid())
    or receiver_id = (select auth.uid())
    or support_assigned_to = (select auth.uid())
    or app_private.has_marketplace_role('customer_service')
  )
);

create policy "chat_messages_participants_insert"
on public.chat_messages
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and sender_id = (select auth.uid())
  and (
    receiver_id <> sender_id
    or app_private.has_marketplace_role('customer_service')
  )
);

create policy "chat_messages_participants_update"
on public.chat_messages
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (
    receiver_id = (select auth.uid())
    or support_assigned_to = (select auth.uid())
    or app_private.has_marketplace_role('customer_service')
  )
)
with check (
  (select auth.uid()) is not null
  and (
    receiver_id = (select auth.uid())
    or support_assigned_to = (select auth.uid())
    or app_private.has_marketplace_role('customer_service')
  )
);

drop policy if exists "user_roles_own_read" on public.user_roles;
drop policy if exists "user_roles_super_admin" on public.user_roles;

create policy "user_roles_own_read"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "user_roles_super_admin_read"
on public.user_roles
for select
to authenticated
using (app_private.is_marketplace_admin());

create policy "user_roles_super_admin_write"
on public.user_roles
for all
to authenticated
using (app_private.is_marketplace_admin())
with check (app_private.is_marketplace_admin());
