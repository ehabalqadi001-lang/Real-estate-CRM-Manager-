-- Marketplace transaction policy cleanup
-- Splits finance writes from owner reads and adds transaction foreign-key indexes.

create index if not exists idx_transactions_package_id on public.transactions(package_id);
create index if not exists idx_transactions_ad_id on public.transactions(ad_id);
create index if not exists idx_transactions_reviewed_by on public.transactions(reviewed_by);

drop policy if exists "transactions_owner_read" on public.transactions;
drop policy if exists "transactions_finance_all" on public.transactions;

create policy "transactions_read"
on public.transactions
for select
to authenticated
using (
  ((select auth.uid()) is not null and user_id = (select auth.uid()))
  or app_private.has_marketplace_role('finance')
);

create policy "transactions_finance_insert"
on public.transactions
for insert
to authenticated
with check (app_private.has_marketplace_role('finance'));

create policy "transactions_finance_update"
on public.transactions
for update
to authenticated
using (app_private.has_marketplace_role('finance'))
with check (app_private.has_marketplace_role('finance'));

create policy "transactions_finance_delete"
on public.transactions
for delete
to authenticated
using (app_private.has_marketplace_role('finance'));
