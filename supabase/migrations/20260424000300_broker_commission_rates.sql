alter table public.broker_profiles
  add column if not exists developer_commission_rate numeric(5,2) not null default 4,
  add column if not exists broker_commission_rate     numeric(5,2) not null default 2;

comment on column public.broker_profiles.developer_commission_rate is 'نسبة عمولة المطور % — يحددها Account Manager فقط';
comment on column public.broker_profiles.broker_commission_rate     is 'نسبة عمولة الشريك % — يحددها Account Manager فقط';
