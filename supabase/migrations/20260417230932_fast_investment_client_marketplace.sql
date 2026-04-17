-- FAST INVESTMENT client marketplace update
-- Adds client profile fields, advanced listing constraints, notifications support,
-- and storage buckets/policies for listing media and documents.

create schema if not exists app_private;

create or replace function app_private.is_fast_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'Admin', 'super_admin', 'Super_Admin', 'platform_admin', 'company_admin', 'company_owner')
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role_type in ('super_admin', 'ad_approval', 'customer_service')
      and ur.is_active = true
  );
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.is_fast_admin() to authenticated;

alter table public.profiles
  add column if not exists email text,
  add column if not exists preferred_contact text,
  add column if not exists client_notes text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz default now();

alter table public.profiles
  drop constraint if exists profiles_preferred_contact_check,
  add constraint profiles_preferred_contact_check
    check (preferred_contact is null or preferred_contact in ('phone', 'whatsapp', 'internal_chat', 'email'));

alter table public.ads
  alter column price drop not null,
  alter column price set default 0,
  alter column description drop not null,
  alter column description set default '',
  add column if not exists area_location text,
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists developer_id uuid references public.developers(id) on delete set null,
  add column if not exists detailed_address text,
  add column if not exists unit_number text,
  add column if not exists rooms integer,
  add column if not exists features text default 'NONE',
  add column if not exists finishing text,
  add column if not exists is_furnished boolean not null default false,
  add column if not exists unit_type text,
  add column if not exists internal_area_sqm numeric(10,2),
  add column if not exists external_area_sqm numeric(10,2),
  add column if not exists is_rented boolean not null default false,
  add column if not exists rental_value numeric(12,2),
  add column if not exists marketing_description text,
  add column if not exists special_notes text,
  add column if not exists doc_files text[] not null default '{}',
  add column if not exists layout_file text,
  add column if not exists masterplan_file text,
  add column if not exists pricing_strategy text,
  add column if not exists down_payment numeric(12,2),
  add column if not exists installment_amount numeric(12,2),
  add column if not exists total_cash_price numeric(12,2);

alter table public.ads
  drop constraint if exists ads_rooms_check,
  add constraint ads_rooms_check check (rooms is null or rooms >= 0),
  drop constraint if exists ads_bathrooms_check,
  add constraint ads_bathrooms_check check (bathrooms is null or bathrooms >= 0),
  drop constraint if exists ads_features_check,
  add constraint ads_features_check check (features in ('ROOF', 'GARDEN', 'NONE')),
  drop constraint if exists ads_finishing_check,
  add constraint ads_finishing_check check (finishing is null or finishing in ('تشطيب كامل', 'نصف تشطيب', 'طوب أحمر')),
  drop constraint if exists ads_unit_type_check,
  add constraint ads_unit_type_check check (unit_type is null or unit_type in ('سكني', 'تجاري', 'إداري', 'فندقي', 'طبي')),
  drop constraint if exists ads_internal_area_sqm_check,
  add constraint ads_internal_area_sqm_check check (internal_area_sqm is null or internal_area_sqm > 0),
  drop constraint if exists ads_external_area_sqm_check,
  add constraint ads_external_area_sqm_check check (external_area_sqm is null or external_area_sqm > 0),
  drop constraint if exists ads_rental_value_check,
  add constraint ads_rental_value_check check (rental_value is null or rental_value >= 0),
  drop constraint if exists ads_pricing_strategy_check,
  add constraint ads_pricing_strategy_check check (pricing_strategy is null or pricing_strategy in ('كاش', 'أقساط', 'تكملة أقساط')),
  drop constraint if exists ads_down_payment_check,
  add constraint ads_down_payment_check check (down_payment is null or down_payment >= 0),
  drop constraint if exists ads_installment_amount_check,
  add constraint ads_installment_amount_check check (installment_amount is null or installment_amount >= 0),
  drop constraint if exists ads_total_cash_price_check,
  add constraint ads_total_cash_price_check check (total_cash_price is null or total_cash_price >= 0),
  drop constraint if exists ads_images_limit_check,
  add constraint ads_images_limit_check check (coalesce(array_length(images, 1), 0) <= 12),
  drop constraint if exists ads_commercial_area_check,
  add constraint ads_commercial_area_check check (
    unit_type is distinct from 'تجاري'
    or (internal_area_sqm is not null and external_area_sqm is not null)
  ),
  drop constraint if exists ads_rented_value_check,
  add constraint ads_rented_value_check check (
    is_rented = false
    or rental_value is not null
  ),
  drop constraint if exists ads_installments_value_check,
  add constraint ads_installments_value_check check (
    pricing_strategy is null
    or pricing_strategy = 'كاش'
    or (down_payment is not null and installment_amount is not null)
  );

create index if not exists idx_ads_area_location on public.ads(area_location);
create index if not exists idx_ads_project_id on public.ads(project_id);
create index if not exists idx_ads_developer_id on public.ads(developer_id);
create index if not exists idx_ads_unit_type on public.ads(unit_type);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);

drop policy if exists ads_owner_update on public.ads;
drop policy if exists ads_owner_delete on public.ads;
drop policy if exists "ads_owner_update_pending" on public.ads;
drop policy if exists "ads_approval_team_update" on public.ads;
drop policy if exists "ads_approval_team_delete" on public.ads;
drop policy if exists "ads_admin_update" on public.ads;
drop policy if exists "ads_admin_delete" on public.ads;

create policy "ads_owner_update_pending"
on public.ads
for update
to authenticated
using (
  user_id = (select auth.uid())
  and status in ('pending', 'rejected')
)
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
);

create policy "ads_admin_update"
on public.ads
for update
to authenticated
using (app_private.is_fast_admin())
with check (app_private.is_fast_admin());

create policy "ads_admin_delete"
on public.ads
for delete
to authenticated
using (app_private.is_fast_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('listing-docs', 'listing-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('listing-arch', 'listing-arch', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing images public read" on storage.objects;
drop policy if exists "listing_images_public_read" on storage.objects;
drop policy if exists "listing images owner insert" on storage.objects;
drop policy if exists "listing images owner update" on storage.objects;
drop policy if exists "listing images owner delete" on storage.objects;
drop policy if exists "listing docs owner read" on storage.objects;
drop policy if exists "listing docs owner insert" on storage.objects;
drop policy if exists "listing docs owner update" on storage.objects;
drop policy if exists "listing docs owner delete" on storage.objects;
drop policy if exists "listing arch owner read" on storage.objects;
drop policy if exists "listing arch owner insert" on storage.objects;
drop policy if exists "listing arch owner update" on storage.objects;
drop policy if exists "listing arch owner delete" on storage.objects;

create policy "listing images owner insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing images owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()))
with check (bucket_id = 'listing-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing images owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-images' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing docs owner read"
on storage.objects for select
to authenticated
using (bucket_id = 'listing-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing docs owner insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing docs owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()))
with check (bucket_id = 'listing-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing docs owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing arch owner read"
on storage.objects for select
to authenticated
using (bucket_id = 'listing-arch' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing arch owner insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-arch' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing arch owner update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-arch' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()))
with check (bucket_id = 'listing-arch' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));

create policy "listing arch owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-arch' and ((storage.foldername(name))[1] = (select auth.uid())::text or app_private.is_fast_admin()));
