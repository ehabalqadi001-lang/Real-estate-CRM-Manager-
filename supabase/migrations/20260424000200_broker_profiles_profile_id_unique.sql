alter table public.broker_profiles
  add constraint broker_profiles_profile_id_unique unique (profile_id);
