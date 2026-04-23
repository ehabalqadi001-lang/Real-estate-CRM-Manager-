create table if not exists public.broker_sale_documents (
  id uuid primary key default gen_random_uuid(),
  sale_submission_id uuid not null references public.broker_sales_submissions(id) on delete cascade,
  broker_user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.profiles(id) on delete set null,
  document_type text not null default 'sale_document',
  name text not null,
  url text not null,
  file_size bigint,
  mime_type text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_broker_sale_documents_sale
  on public.broker_sale_documents(sale_submission_id, status);

create index if not exists idx_broker_sale_documents_broker
  on public.broker_sale_documents(broker_user_id, created_at desc);

create index if not exists idx_broker_sale_documents_company
  on public.broker_sale_documents(company_id, status, created_at desc);

alter table public.broker_sales_submissions
  add column if not exists documents_review_status text not null default 'pending'
    check (documents_review_status in ('pending', 'partially_approved', 'approved', 'rejected'));

alter table public.broker_sale_documents enable row level security;

drop policy if exists "broker_sale_docs_select" on public.broker_sale_documents;
create policy "broker_sale_docs_select" on public.broker_sale_documents
  for select using (
    broker_user_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "broker_sale_docs_insert" on public.broker_sale_documents;
create policy "broker_sale_docs_insert" on public.broker_sale_documents
  for insert with check (
    broker_user_id = auth.uid()
    or public.is_company_manager()
    or public.is_super_admin()
  );

drop policy if exists "broker_sale_docs_update" on public.broker_sale_documents;
create policy "broker_sale_docs_update" on public.broker_sale_documents
  for update using (
    company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  ) with check (
    company_id = public.current_company_id()
    or public.is_company_manager()
    or public.is_super_admin()
  );

insert into public.broker_sale_documents (
  sale_submission_id,
  broker_user_id,
  company_id,
  document_type,
  name,
  url,
  file_size,
  mime_type,
  status,
  created_at
)
select
  sale.id,
  sale.broker_user_id,
  sale.company_id,
  coalesce(document_item ->> 'category', 'sale_document'),
  coalesce(nullif(document_item ->> 'name', ''), 'Document'),
  document_item ->> 'path',
  nullif(document_item ->> 'size', '')::bigint,
  nullif(document_item ->> 'type', ''),
  'pending',
  sale.created_at
from public.broker_sales_submissions sale
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(sale.documents) = 'array' then sale.documents
    else '[]'::jsonb
  end
) as document_item
where document_item ? 'path'
  and not exists (
    select 1
    from public.broker_sale_documents existing
    where existing.sale_submission_id = sale.id
      and existing.url = document_item ->> 'path'
  );
