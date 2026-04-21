-- Multi-country and VAT fields for deals and commissions.

alter table public.deals
  add column if not exists country_code text not null default 'EG'
    check (country_code in ('EG','AE','SA')),
  add column if not exists subtotal_amount numeric(12,2),
  add column if not exists tax_rate numeric(5,4),
  add column if not exists tax_amount numeric(12,2),
  add column if not exists total_with_tax numeric(12,2);

alter table public.commissions
  add column if not exists country_code text not null default 'EG'
    check (country_code in ('EG','AE','SA')),
  add column if not exists subtotal_amount numeric(12,2),
  add column if not exists tax_rate numeric(5,4),
  add column if not exists tax_amount numeric(12,2),
  add column if not exists total_with_tax numeric(12,2);

create index if not exists deals_country_code_idx on public.deals(country_code);
create index if not exists commissions_country_code_idx on public.commissions(country_code);
