-- Marketplace advisor cleanup
-- Reduces multiple permissive SELECT policies and adds FK indexes introduced by marketplace schema hardening.

create index if not exists idx_ads_package_id on public.ads(package_id);
create index if not exists idx_ads_reviewed_by on public.ads(reviewed_by);
create index if not exists idx_chat_messages_support_assigned_to on public.chat_messages(support_assigned_to);

drop policy if exists "ad_packages_public_read" on public.ad_packages;
drop policy if exists "ad_packages_admin_write" on public.ad_packages;

create policy "ad_packages_read_active"
on public.ad_packages
for select
to anon, authenticated
using (is_active = true or app_private.is_marketplace_admin());

create policy "ad_packages_admin_insert"
on public.ad_packages
for insert
to authenticated
with check (app_private.is_marketplace_admin());

create policy "ad_packages_admin_update"
on public.ad_packages
for update
to authenticated
using (app_private.is_marketplace_admin())
with check (app_private.is_marketplace_admin());

create policy "ad_packages_admin_delete"
on public.ad_packages
for delete
to authenticated
using (app_private.is_marketplace_admin());

drop policy if exists "user_balances_owner_read" on public.user_balances;
drop policy if exists "user_balances_finance_read" on public.user_balances;
drop policy if exists "user_balances_finance_write" on public.user_balances;

create policy "user_balances_read"
on public.user_balances
for select
to authenticated
using (
  ((select auth.uid()) is not null and user_id = (select auth.uid()))
  or app_private.has_marketplace_role('finance')
);

create policy "user_balances_finance_insert"
on public.user_balances
for insert
to authenticated
with check (app_private.has_marketplace_role('finance'));

create policy "user_balances_finance_update"
on public.user_balances
for update
to authenticated
using (app_private.has_marketplace_role('finance'))
with check (app_private.has_marketplace_role('finance'));

create policy "user_balances_finance_delete"
on public.user_balances
for delete
to authenticated
using (app_private.has_marketplace_role('finance'));

drop policy if exists "ads_public_read_approved" on public.ads;
drop policy if exists "ads_owner_read" on public.ads;
drop policy if exists "ads_approval_team_all" on public.ads;

create policy "ads_anon_read_approved"
on public.ads
for select
to anon
using (status = 'approved');

create policy "ads_authenticated_read"
on public.ads
for select
to authenticated
using (
  status = 'approved'
  or ((select auth.uid()) is not null and user_id = (select auth.uid()))
  or app_private.has_marketplace_role('ad_approval')
);

create policy "ads_approval_team_update"
on public.ads
for update
to authenticated
using (app_private.has_marketplace_role('ad_approval'))
with check (app_private.has_marketplace_role('ad_approval'));

create policy "ads_approval_team_delete"
on public.ads
for delete
to authenticated
using (app_private.has_marketplace_role('ad_approval'));

drop policy if exists "user_roles_own_read" on public.user_roles;
drop policy if exists "user_roles_super_admin_read" on public.user_roles;
drop policy if exists "user_roles_super_admin_write" on public.user_roles;

create policy "user_roles_read"
on public.user_roles
for select
to authenticated
using (
  ((select auth.uid()) is not null and user_id = (select auth.uid()))
  or app_private.is_marketplace_admin()
);

create policy "user_roles_super_admin_insert"
on public.user_roles
for insert
to authenticated
with check (app_private.is_marketplace_admin());

create policy "user_roles_super_admin_update"
on public.user_roles
for update
to authenticated
using (app_private.is_marketplace_admin())
with check (app_private.is_marketplace_admin());

create policy "user_roles_super_admin_delete"
on public.user_roles
for delete
to authenticated
using (app_private.is_marketplace_admin());
