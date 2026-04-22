-- FAST INVESTMENT PropTech Service Mesh core tables.
-- Implements the first production slice of docs/architecture/proptech-service-mesh-architecture.md.

create table if not exists public.developer_accounts (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('developer_admin','developer_sales','developer_manager','content_manager','viewer')),
  status text not null default 'active'
    check (status in ('active','suspended','pending')),
  created_at timestamptz not null default now(),
  unique (developer_id, user_id)
);

create table if not exists public.developer_projects_access (
  id uuid primary key default gen_random_uuid(),
  developer_account_id uuid not null references public.developer_accounts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  can_view_leads boolean not null default true,
  can_manage_inventory boolean not null default false,
  can_manage_media boolean not null default false,
  can_manage_meetings boolean not null default true,
  created_at timestamptz not null default now(),
  unique (developer_account_id, project_id)
);

create table if not exists public.developer_api_clients (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  client_key text not null unique,
  secret_ref text not null,
  allowed_ips inet[],
  scopes text[] not null default array['inventory:write'],
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_ingestion_batches (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references public.developers(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  source_type text not null
    check (source_type in ('api','excel','csv','manual')),
  source_name text,
  status text not null default 'pending'
    check (status in ('pending','processing','completed','failed','partially_completed')),
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  failed_rows integer not null default 0,
  mapping_payload jsonb not null default '{}'::jsonb,
  error_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.inventory_ingestion_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.inventory_ingestion_batches(id) on delete cascade,
  row_number integer not null,
  raw_payload jsonb not null,
  mapped_payload jsonb not null default '{}'::jsonb,
  target_table text,
  target_id uuid,
  status text not null default 'pending'
    check (status in ('pending','processed','failed','ignored')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

alter table public.projects
  add column if not exists masterplan_url text,
  add column if not exists masterplan_config jsonb not null default '{}'::jsonb,
  add column if not exists developer_video_url text,
  add column if not exists trust_score numeric(6,2) not null default 0;

alter table public.units
  add column if not exists external_reference text,
  add column if not exists availability_source text default 'manual'
    check (availability_source in ('api','excel','csv','manual')),
  add column if not exists last_synced_at timestamptz,
  add column if not exists media_urls text[] not null default '{}'::text[],
  add column if not exists video_url text,
  add column if not exists floorplan_config jsonb not null default '{}'::jsonb,
  add column if not exists inventory_hash text;

create table if not exists public.unit_price_history (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  old_price numeric(14,2),
  new_price numeric(14,2) not null,
  old_status text,
  new_status text,
  source_type text not null
    check (source_type in ('api','excel','csv','manual')),
  batch_id uuid references public.inventory_ingestion_batches(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.masterplan_nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.masterplan_nodes(id) on delete cascade,
  node_type text not null
    check (node_type in ('zone','building','floor','unit')),
  unit_id uuid references public.units(id) on delete set null,
  label text not null,
  polygon jsonb,
  position jsonb,
  status text not null default 'active'
    check (status in ('active','hidden','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  masked_phone text,
  real_phone_encrypted text,
  provider text not null default 'twilio',
  provider_identity_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.masked_call_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  agent_id uuid references auth.users(id) on delete set null,
  developer_user_id uuid references auth.users(id) on delete set null,
  from_masked_number text not null,
  to_masked_number text not null,
  provider text not null default 'twilio',
  provider_call_sid text unique,
  direction text not null
    check (direction in ('agent_to_client','developer_to_client','client_to_agent','client_to_developer')),
  status text not null default 'queued'
    check (status in ('queued','ringing','in_progress','completed','failed','no_answer','busy')),
  duration_seconds integer not null default 0,
  recording_url text,
  recording_status text
    check (recording_status in ('none','processing','available','failed')),
  consent_captured boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.realtime_chat_threads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  assigned_developer_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open'
    check (status in ('open','waiting','closed','archived')),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.realtime_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.realtime_chat_threads(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null
    check (sender_role in ('client','agent','developer_sales','system')),
  message_type text not null default 'text'
    check (message_type in ('text','image','document','unit_card','meeting_link','system')),
  body text,
  attachment_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_slots (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references public.developers(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1,
  status text not null default 'available'
    check (status in ('available','held','booked','cancelled')),
  created_at timestamptz not null default now(),
  constraint meeting_slots_time_check check (ends_at > starts_at)
);

create table if not exists public.meeting_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references public.meeting_slots(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  agent_id uuid references auth.users(id) on delete set null,
  developer_user_id uuid references auth.users(id) on delete set null,
  channel text not null default 'office'
    check (channel in ('office','phone','zoom','site_visit')),
  status text not null default 'scheduled'
    check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  property_id uuid references public.marketplace_properties(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  event_type text not null
    check (event_type in ('view_property','watch_video','open_masterplan','save_property','share_property','request_call','open_payment_plan')),
  event_count integer not null default 1,
  duration_seconds integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.engagement_triggers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  trigger_type text not null
    check (trigger_type in ('hot_video_rewatch','price_drop_match','unit_revisited','meeting_intent','roi_opportunity')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','critical')),
  title_ar text not null,
  body_ar text,
  action_link text,
  status text not null default 'open'
    check (status in ('open','dismissed','acted','expired')),
  created_at timestamptz not null default now()
);

create index if not exists developer_accounts_user_idx on public.developer_accounts(user_id, status);
create index if not exists developer_projects_access_project_idx on public.developer_projects_access(project_id);
create index if not exists developer_api_clients_key_idx on public.developer_api_clients(client_key, active);
create index if not exists ingestion_batches_company_idx on public.inventory_ingestion_batches(company_id, created_at desc);
create index if not exists ingestion_batches_developer_idx on public.inventory_ingestion_batches(developer_id, created_at desc);
create index if not exists ingestion_rows_batch_idx on public.inventory_ingestion_rows(batch_id, status);
create index if not exists unit_price_history_unit_idx on public.unit_price_history(unit_id, created_at desc);
create index if not exists masterplan_nodes_project_idx on public.masterplan_nodes(project_id, parent_id, node_type);
create index if not exists masked_call_sessions_lead_idx on public.masked_call_sessions(lead_id, created_at desc);
create index if not exists chat_threads_lead_idx on public.realtime_chat_threads(lead_id, status);
create index if not exists chat_messages_thread_idx on public.realtime_chat_messages(thread_id, created_at desc);
create index if not exists meeting_slots_project_idx on public.meeting_slots(project_id, starts_at, status);
create index if not exists engagement_events_lead_idx on public.engagement_events(lead_id, created_at desc);
create index if not exists engagement_triggers_agent_idx on public.engagement_triggers(assigned_agent_id, status, created_at desc);

alter table public.developer_accounts enable row level security;
alter table public.developer_projects_access enable row level security;
alter table public.developer_api_clients enable row level security;
alter table public.inventory_ingestion_batches enable row level security;
alter table public.inventory_ingestion_rows enable row level security;
alter table public.unit_price_history enable row level security;
alter table public.masterplan_nodes enable row level security;
alter table public.communication_identities enable row level security;
alter table public.masked_call_sessions enable row level security;
alter table public.realtime_chat_threads enable row level security;
alter table public.realtime_chat_messages enable row level security;
alter table public.meeting_slots enable row level security;
alter table public.meeting_bookings enable row level security;
alter table public.engagement_events enable row level security;
alter table public.engagement_triggers enable row level security;

drop policy if exists "developer_accounts_scoped" on public.developer_accounts;
create policy "developer_accounts_scoped" on public.developer_accounts
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or user_id = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or user_id = auth.uid()
  );

drop policy if exists "developer_projects_access_scoped" on public.developer_projects_access;
create policy "developer_projects_access_scoped" on public.developer_projects_access
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or exists (
      select 1
      from public.developer_accounts da
      where da.id = developer_projects_access.developer_account_id
        and da.user_id = auth.uid()
        and da.status = 'active'
    )
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or exists (
      select 1
      from public.developer_accounts da
      where da.id = developer_projects_access.developer_account_id
        and da.user_id = auth.uid()
        and da.status = 'active'
    )
  );

drop policy if exists "developer_api_clients_admin_only" on public.developer_api_clients;
create policy "developer_api_clients_admin_only" on public.developer_api_clients
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or (company_id = public.current_company_id() and public.is_company_manager())
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or (company_id = public.current_company_id() and public.is_company_manager())
  );

drop policy if exists "ingestion_batches_company_scope" on public.inventory_ingestion_batches;
create policy "ingestion_batches_company_scope" on public.inventory_ingestion_batches
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or created_by = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or created_by = auth.uid()
  );

drop policy if exists "ingestion_rows_batch_scope" on public.inventory_ingestion_rows;
create policy "ingestion_rows_batch_scope" on public.inventory_ingestion_rows
  for all to authenticated
  using (
    exists (
      select 1
      from public.inventory_ingestion_batches b
      where b.id = inventory_ingestion_rows.batch_id
        and (
          public.current_user_role() in ('super_admin','platform_admin')
          or b.company_id = public.current_company_id()
          or b.created_by = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.inventory_ingestion_batches b
      where b.id = inventory_ingestion_rows.batch_id
        and (
          public.current_user_role() in ('super_admin','platform_admin')
          or b.company_id = public.current_company_id()
          or b.created_by = auth.uid()
        )
    )
  );

drop policy if exists "unit_price_history_read_scope" on public.unit_price_history;
create policy "unit_price_history_read_scope" on public.unit_price_history
  for select to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or exists (
      select 1
      from public.units u
      where u.id = unit_price_history.unit_id
        and (u.company_id = public.current_company_id() or public.is_company_manager())
    )
  );

drop policy if exists "unit_price_history_write_scope" on public.unit_price_history;
create policy "unit_price_history_write_scope" on public.unit_price_history
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or public.is_company_manager()
  );

drop policy if exists "masterplan_nodes_project_scope" on public.masterplan_nodes;
create policy "masterplan_nodes_project_scope" on public.masterplan_nodes
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or exists (
      select 1
      from public.projects p
      where p.id = masterplan_nodes.project_id
        and (p.company_id = public.current_company_id() or public.is_company_manager())
    )
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or public.is_company_manager()
  );

drop policy if exists "communication_identities_self_or_admin" on public.communication_identities;
create policy "communication_identities_self_or_admin" on public.communication_identities
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or user_id = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or user_id = auth.uid()
  );

drop policy if exists "masked_calls_scoped_read" on public.masked_call_sessions;
create policy "masked_calls_scoped_read" on public.masked_call_sessions
  for select to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
    or developer_user_id = auth.uid()
  );

drop policy if exists "masked_calls_scoped_write" on public.masked_call_sessions;
create policy "masked_calls_scoped_write" on public.masked_call_sessions
  for insert to authenticated
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
    or developer_user_id = auth.uid()
  );

drop policy if exists "chat_threads_participant_scope" on public.realtime_chat_threads;
create policy "chat_threads_participant_scope" on public.realtime_chat_threads
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or assigned_agent_id = auth.uid()
    or assigned_developer_user_id = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or assigned_agent_id = auth.uid()
    or assigned_developer_user_id = auth.uid()
  );

drop policy if exists "chat_messages_thread_scope" on public.realtime_chat_messages;
create policy "chat_messages_thread_scope" on public.realtime_chat_messages
  for all to authenticated
  using (
    exists (
      select 1
      from public.realtime_chat_threads t
      where t.id = realtime_chat_messages.thread_id
        and (
          public.current_user_role() in ('super_admin','platform_admin')
          or t.company_id = public.current_company_id()
          or t.assigned_agent_id = auth.uid()
          or t.assigned_developer_user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.realtime_chat_threads t
      where t.id = realtime_chat_messages.thread_id
        and (
          public.current_user_role() in ('super_admin','platform_admin')
          or t.company_id = public.current_company_id()
          or t.assigned_agent_id = auth.uid()
          or t.assigned_developer_user_id = auth.uid()
        )
    )
  );

drop policy if exists "meeting_slots_developer_scope" on public.meeting_slots;
create policy "meeting_slots_developer_scope" on public.meeting_slots
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.developer_accounts da
      where da.developer_id = meeting_slots.developer_id
        and da.user_id = auth.uid()
        and da.status = 'active'
    )
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or owner_user_id = auth.uid()
    or exists (
      select 1
      from public.developer_accounts da
      where da.developer_id = meeting_slots.developer_id
        and da.user_id = auth.uid()
        and da.status = 'active'
    )
  );

drop policy if exists "meeting_bookings_scoped" on public.meeting_bookings;
create policy "meeting_bookings_scoped" on public.meeting_bookings
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
    or developer_user_id = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or agent_id = auth.uid()
    or developer_user_id = auth.uid()
  );

drop policy if exists "engagement_events_company_scope" on public.engagement_events;
create policy "engagement_events_company_scope" on public.engagement_events
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
  );

drop policy if exists "engagement_triggers_company_scope" on public.engagement_triggers;
create policy "engagement_triggers_company_scope" on public.engagement_triggers
  for all to authenticated
  using (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or assigned_agent_id = auth.uid()
  )
  with check (
    public.current_user_role() in ('super_admin','platform_admin')
    or company_id = public.current_company_id()
    or assigned_agent_id = auth.uid()
  );

comment on table public.developer_accounts is 'Developer-side users who can access Developer Hub and project-level sales operations.';
comment on table public.inventory_ingestion_batches is 'Import/API/manual inventory ingestion batch header with mapping and processing counters.';
comment on table public.inventory_ingestion_rows is 'Raw and mapped rows from developer Excel/CSV/API ingestion.';
comment on table public.masked_call_sessions is 'VoIP number masking call sessions between clients, agents, and developer sales users.';
