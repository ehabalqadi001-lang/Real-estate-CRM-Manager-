alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (
    account_type is null
    or account_type = any (array['individual'::text, 'company'::text, 'client'::text])
  );

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (
    status is null
    or status = any (array['pending'::text, 'approved'::text, 'rejected'::text, 'active'::text])
  );
