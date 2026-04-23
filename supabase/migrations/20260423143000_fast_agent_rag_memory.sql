create extension if not exists vector with schema extensions;

set search_path = public, extensions;

create table if not exists public.fast_agent_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  source_type text not null default 'manual'
    check (source_type in ('public','project','unit','ad','policy','manual')),
  source_table text,
  source_id text,
  title text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  visibility text not null default 'company'
    check (visibility in ('public','company','management','hr','finance','private')),
  allowed_roles text[] not null default '{}'::text[],
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_type, source_table, source_id)
);

create table if not exists public.fast_agent_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.fast_agent_documents(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('simple', coalesce(content, ''))) stored,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  visibility text not null default 'company'
    check (visibility in ('public','company','management','hr','finance','private')),
  allowed_roles text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table if not exists public.fast_agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null default 'FAST conversation',
  role_at_start text,
  status text not null default 'active'
    check (status in ('active','archived','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fast_agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.fast_agent_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  mode text check (mode in ('ai','fallback')),
  tools text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists fast_agent_documents_company_idx
  on public.fast_agent_documents(company_id, source_type, visibility);

create index if not exists fast_agent_chunks_company_idx
  on public.fast_agent_chunks(company_id, visibility, created_at desc);

create index if not exists fast_agent_chunks_tsv_idx
  on public.fast_agent_chunks using gin(content_tsv);

create index if not exists fast_agent_chunks_embedding_idx
  on public.fast_agent_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists fast_agent_conversations_user_idx
  on public.fast_agent_conversations(user_id, updated_at desc);

create index if not exists fast_agent_messages_conversation_idx
  on public.fast_agent_messages(conversation_id, created_at);

alter table public.fast_agent_documents enable row level security;
alter table public.fast_agent_chunks enable row level security;
alter table public.fast_agent_conversations enable row level security;
alter table public.fast_agent_messages enable row level security;

drop policy if exists "fast_agent_documents_select" on public.fast_agent_documents;
create policy "fast_agent_documents_select" on public.fast_agent_documents
  for select to anon, authenticated
  using (
    visibility = 'public'
    or (
      auth.uid() is not null
      and (
        public.is_super_admin()
        or company_id = public.current_company_id()
        or created_by = auth.uid()
      )
    )
  );

drop policy if exists "fast_agent_documents_write" on public.fast_agent_documents;
create policy "fast_agent_documents_write" on public.fast_agent_documents
  for all to authenticated
  using (public.is_super_admin() or public.is_company_manager())
  with check (public.is_super_admin() or public.is_company_manager());

drop policy if exists "fast_agent_chunks_select" on public.fast_agent_chunks;
create policy "fast_agent_chunks_select" on public.fast_agent_chunks
  for select to anon, authenticated
  using (
    visibility = 'public'
    or (
      auth.uid() is not null
      and (
        public.is_super_admin()
        or company_id = public.current_company_id()
        or public.current_user_role() = any(allowed_roles)
      )
    )
  );

drop policy if exists "fast_agent_chunks_write" on public.fast_agent_chunks;
create policy "fast_agent_chunks_write" on public.fast_agent_chunks
  for all to authenticated
  using (public.is_super_admin() or public.is_company_manager())
  with check (public.is_super_admin() or public.is_company_manager());

drop policy if exists "fast_agent_conversations_select" on public.fast_agent_conversations;
create policy "fast_agent_conversations_select" on public.fast_agent_conversations
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  );

drop policy if exists "fast_agent_conversations_insert" on public.fast_agent_conversations;
create policy "fast_agent_conversations_insert" on public.fast_agent_conversations
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "fast_agent_conversations_update" on public.fast_agent_conversations;
create policy "fast_agent_conversations_update" on public.fast_agent_conversations
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  )
  with check (
    user_id = auth.uid()
    or public.is_super_admin()
    or (company_id = public.current_company_id() and public.is_company_manager())
  );

drop policy if exists "fast_agent_messages_select" on public.fast_agent_messages;
create policy "fast_agent_messages_select" on public.fast_agent_messages
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.fast_agent_conversations c
      where c.id = fast_agent_messages.conversation_id
        and (
          c.user_id = auth.uid()
          or public.is_super_admin()
          or (c.company_id = public.current_company_id() and public.is_company_manager())
        )
    )
  );

drop policy if exists "fast_agent_messages_insert" on public.fast_agent_messages;
create policy "fast_agent_messages_insert" on public.fast_agent_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1
      from public.fast_agent_conversations c
      where c.id = fast_agent_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create or replace function public.match_fast_agent_chunks(
  query_embedding vector(768),
  match_count integer default 6,
  filter_company_id uuid default null,
  filter_role text default null
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  content text,
  source_type text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    c.id,
    c.document_id,
    d.title,
    c.content,
    d.source_type,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.metadata || jsonb_build_object('document_metadata', d.metadata) as metadata
  from public.fast_agent_chunks c
  join public.fast_agent_documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_company_id is null or c.company_id is null or c.company_id = filter_company_id)
    and (
      c.visibility = 'public'
      or filter_role is null
      or cardinality(c.allowed_roles) = 0
      or filter_role = any(c.allowed_roles)
    )
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

grant execute on function public.match_fast_agent_chunks(vector, integer, uuid, text) to anon, authenticated;

comment on table public.fast_agent_documents is 'RAG source documents for FAST AI Agent.';
comment on table public.fast_agent_chunks is 'RAG chunks with pgvector embeddings and text-search fallback.';
comment on table public.fast_agent_conversations is 'FAST AI Agent conversation headers scoped by user/company.';
comment on table public.fast_agent_messages is 'FAST AI Agent message history for audit and continuity.';
