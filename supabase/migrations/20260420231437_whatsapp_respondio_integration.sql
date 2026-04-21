-- Respond.io WhatsApp Business integration.

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  lead_id uuid references public.leads(id),
  agent_id uuid references public.agents(id),
  direction text not null check (direction in ('inbound', 'outbound')),
  waba_message_id text unique,
  phone_number text not null,
  message_type text not null check (message_type in ('text', 'template', 'image', 'document', 'audio')),
  content text,
  template_name text,
  template_params jsonb,
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  provider text default 'respond.io',
  provider_payload jsonb,
  sent_at timestamptz default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  name text not null,
  display_name text not null,
  category text check (category is null or category in ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language text default 'ar',
  body_text text not null,
  variables text[],
  active boolean default true,
  created_at timestamptz default now(),
  unique (company_id, name)
);

create index if not exists idx_whatsapp_messages_company_created
  on public.whatsapp_messages(company_id, created_at desc);

create index if not exists idx_whatsapp_messages_phone_created
  on public.whatsapp_messages(phone_number, created_at desc);

create index if not exists idx_whatsapp_messages_lead_created
  on public.whatsapp_messages(lead_id, created_at desc);

create index if not exists idx_whatsapp_messages_agent_created
  on public.whatsapp_messages(agent_id, created_at desc);

create index if not exists idx_whatsapp_messages_waba
  on public.whatsapp_messages(waba_message_id);

create index if not exists idx_whatsapp_templates_active
  on public.whatsapp_templates(company_id, active);

alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_templates enable row level security;

drop policy if exists "whatsapp_messages_company_select" on public.whatsapp_messages;
create policy "whatsapp_messages_company_select" on public.whatsapp_messages
  for select using (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
  );

drop policy if exists "whatsapp_messages_company_insert" on public.whatsapp_messages;
create policy "whatsapp_messages_company_insert" on public.whatsapp_messages
  for insert with check (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
  );

drop policy if exists "whatsapp_messages_company_update" on public.whatsapp_messages;
create policy "whatsapp_messages_company_update" on public.whatsapp_messages
  for update using (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
  )
  with check (
    public.is_super_admin()
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
  );

drop policy if exists "whatsapp_templates_company_select" on public.whatsapp_templates;
create policy "whatsapp_templates_company_select" on public.whatsapp_templates
  for select using (
    active = true
    and (company_id is null or company_id = public.current_company_id() or public.is_super_admin())
  );

drop policy if exists "whatsapp_templates_company_manage" on public.whatsapp_templates;
create policy "whatsapp_templates_company_manage" on public.whatsapp_templates
  for all using (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  );

insert into public.whatsapp_templates (company_id, name, display_name, category, language, body_text, variables, active)
values
  (
    null,
    'welcome_client',
    'ترحيب بعميل جديد',
    'UTILITY',
    'ar',
    'السلام عليكم {{1}}، نرحب بك في Fast Investment. سيتواصل معك مستشارنا {{2}} قريباً.',
    array['client_name', 'agent_name'],
    true
  ),
  (
    null,
    'property_offer',
    'عرض عقار',
    'MARKETING',
    'ar',
    'عزيزي {{1}}، لدينا وحدة متميزة في {{2}} بمساحة {{3}} م² بسعر {{4}} ج.م. هل تودّ الاستفسار؟',
    array['client_name', 'project_name', 'area', 'price'],
    true
  ),
  (
    null,
    'follow_up',
    'متابعة مع عميل',
    'UTILITY',
    'ar',
    'السلام عليكم {{1}}، نتواصل معك لمتابعة اهتمامك بـ {{2}}. هل لديك أي استفسار؟',
    array['client_name', 'project_name'],
    true
  ),
  (
    null,
    'deal_confirmed',
    'تأكيد صفقة',
    'UTILITY',
    'ar',
    'تهانينا {{1}}! تم تأكيد حجز وحدتكم في {{2}}. سيتواصل معك فريقنا لإتمام الإجراءات.',
    array['client_name', 'project_name'],
    true
  )
on conflict (company_id, name) do update set
  display_name = excluded.display_name,
  category = excluded.category,
  language = excluded.language,
  body_text = excluded.body_text,
  variables = excluded.variables,
  active = excluded.active;
