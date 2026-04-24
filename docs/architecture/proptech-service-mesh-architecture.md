# FAST INVESTMENT PropTech Service Mesh Architecture

وثيقة تصميم هندسي لبناء طبقة ربط مركزية بين FAST INVESTMENT، المطورين العقاريين، شركات الوساطة، خلايا البيع، والعملاء. الهدف هو تشغيل مخزون عقاري ديناميكي، اتصالات آمنة، وتوصيات ذكية تدعم حجم مبيعات يتجاوز 110 مليون جنيه شهرياً لفريق EHAB & ESLAM TEAM.

## 1. الرؤية التنفيذية

PropTech Service Mesh هو طبقة تشغيل وسيطة فوق Supabase/PostgreSQL وNext.js. هذه الطبقة تجعل كل مطور عقاري، مشروع، وحدة، تفاعل عميل، مكالمة، محادثة، وموعد قابلاً للتتبع والحوكمة والربط بخلايا العمل البيعية.

الأهداف:

- مزامنة مخزون المطورين لحظياً عبر API Gateway.
- استيراد ملفات Excel/CSV بذكاء مع Auto Mapping.
- تمكين Manual CMS لإضافة وتعديل الوحدات فورياً.
- عزل بيانات العملاء بين خلايا البيع والوسطاء باستخدام RBAC وRLS.
- تمكين Number Masking وVoIP وتسجيل المكالمات بدون كشف أرقام العملاء أو السيلز.
- توفير Developer Hub وB2B Company Portal وDeveloper Sales Panel.
- دعم Interactive Masterplans وRich Media.
- تشغيل Predictive Matchmaking وEngagement Triggers.

## 2. Tech Stack

### Frontend

- Next.js App Router + React + TypeScript strict.
- Tailwind CSS v4 + shadcn/ui.
- Framer Motion للحركة الدقيقة.
- Recharts/Tremor للتقارير البيعية والتفاعل.
- TanStack Table للجداول التشغيلية.
- React Hook Form + Zod للنماذج والتحقق.

### Backend

- Supabase PostgreSQL كمصدر الحقيقة.
- Supabase Auth للهوية والجلسات.
- Supabase Storage للوسائط والمخططات والعقود.
- Supabase Realtime للمحادثات والتنبيهات وتحديثات المخزون.
- Supabase Edge Functions للمهام الزمنية، webhooks، وعمليات التكامل الحساسة.
- Upstash Redis للـ idempotency، rate limiting، وتخزين حالات ingestion المؤقتة.

### Integrations

- Developer API Gateway لاستقبال inventory/prices/payment plans/availability.
- CSV/Excel parser لمعالجة ملفات المطورين.
- Twilio أو مزود VoIP مشابه لـ number masking وتسجيل المكالمات.
- WhatsApp Business عبر respond.io للتأكيدات والرسائل.
- Resend للبريد الإلكتروني.
- Vercel AI SDK + OpenAI GPT-4o للتوصيات والتنبيهات وتحليل ROI.

## 3. High-Level Architecture

```txt
Developer Systems
  ├─ REST/Webhook APIs
  ├─ Excel/CSV Files
  └─ Manual CMS
        │
        ▼
PropTech Service Mesh
  ├─ API Gateway
  ├─ Ingestion Engine
  ├─ Normalization Layer
  ├─ Validation + Idempotency
  ├─ Inventory Event Log
  ├─ Communication Gateway
  ├─ Recommendation Engine
  └─ Engagement Trigger Engine
        │
        ▼
Supabase PostgreSQL
  ├─ developers / projects / units
  ├─ marketplace_properties
  ├─ work_cells / assignments
  ├─ leads / interactions
  ├─ calls / chats / meetings
  └─ audit_logs / notifications
        │
        ▼
Dashboards
  ├─ Developer Hub
  ├─ Developer Sales Panel
  ├─ B2B Company Portal
  ├─ CRM Dashboard
  └─ Marketplace Search
```

## 4. Domain Boundaries

| Domain | Ownership | Key Responsibility |
|---|---|---|
| Identity & RBAC | Platform Core | users, profiles, roles, permissions, tenant boundaries |
| Developer Network | Inventory Ops | developers, projects, developer staff, contracts |
| Inventory Mesh | Inventory Ops | units, price updates, availability, payment plans, media |
| Marketplace | Growth/Sales | public/private property listings, search, recommendations |
| CRM Pipeline | Sales Ops | leads, assignments, deals, tasks, cells |
| Communication Mesh | Sales/Support | masked calls, call logs, chat, WhatsApp, meetings |
| Analytics & AI | Management | ROI, recommendations, engagement triggers, conversion insights |
| Governance | Platform Admin | audit logs, approvals, ingestion errors, compliance |

## 5. Database Schema

هذا schema يكمّل الجداول الموجودة حالياً. الجداول في `public` يجب أن يكون عليها RLS. الجداول الحساسة المرتبطة بالمفاتيح والـ secrets لا تخزن secret خام؛ يتم تخزين `secret_ref` فقط (يُفضل استخدام Supabase Vault).

**ملاحظات هندسية إضافية:**
- يجب إنشاء فهارس (Indexes) على كافة الـ Foreign Keys.
- يفضل إضافة حقل `updated_at` مدعوم بـ Database Trigger لمعظم الجداول الأساسية.
- تم استبدال بعض `on delete cascade` بالاعتماد على Soft Deletes لحماية البيانات التاريخية للمبيعات.

```sql
-- Developers and stakeholder access.
create table if not exists public.developer_accounts (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('developer_admin','developer_sales','developer_manager','content_manager','viewer')),
  status text not null default 'active' check (status in ('active','suspended','pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
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

-- API Gateway registry.
create table if not exists public.developer_api_clients (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete restrict,
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
  source_type text not null check (source_type in ('api','excel','csv','manual')),
  source_name text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','partially_completed')),
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
  status text not null default 'pending' check (status in ('pending','processed','failed','ignored')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Canonical inventory extensions.
alter table public.projects
  add column if not exists masterplan_url text,
  add column if not exists masterplan_config jsonb not null default '{}'::jsonb,
  add column if not exists developer_video_url text,
  add column if not exists trust_score numeric(6,2) not null default 0;

alter table public.units
  add column if not exists external_reference text,
  add column if not exists availability_source text default 'manual' check (availability_source in ('api','excel','csv','manual')),
  add column if not exists last_synced_at timestamptz,
  add column if not exists media_urls text[] not null default '{}'::text[],
  add column if not exists video_url text,
  add column if not exists floorplan_config jsonb not null default '{}'::jsonb,
  add column if not exists inventory_hash text,
  add column if not exists deleted_at timestamptz;

create table if not exists public.unit_price_history (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  old_price numeric(14,2),
  new_price numeric(14,2) not null,
  old_status text,
  new_status text,
  source_type text not null check (source_type in ('api','excel','csv','manual')),
  batch_id uuid references public.inventory_ingestion_batches(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Interactive masterplan model.
create table if not exists public.masterplan_nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.masterplan_nodes(id) on delete cascade,
  node_type text not null check (node_type in ('zone','building','floor','unit')),
  unit_id uuid references public.units(id) on delete set null,
  label text not null,
  polygon jsonb,
  position jsonb,
  status text not null default 'active' check (status in ('active','hidden','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Customer engagement and communication.
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
  lead_id uuid references public.leads(id) on delete restrict,
  agent_id uuid references auth.users(id) on delete set null,
  developer_user_id uuid references auth.users(id) on delete set null,
  from_masked_number text not null,
  to_masked_number text not null,
  provider text not null default 'twilio',
  provider_call_sid text unique,
  direction text not null check (direction in ('agent_to_client','developer_to_client','client_to_agent','client_to_developer')),
  status text not null default 'queued' check (status in ('queued','ringing','in_progress','completed','failed','no_answer','busy')),
  duration_seconds integer not null default 0,
  recording_url text,
  recording_status text check (recording_status in ('none','processing','available','failed')),
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
  lead_id uuid references public.leads(id) on delete restrict,
  assigned_agent_id uuid references auth.users(id) on delete set null,
  assigned_developer_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','waiting','closed','archived')),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.realtime_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.realtime_chat_threads(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('client','agent','developer_sales','system')),
  message_type text not null default 'text' check (message_type in ('text','image','document','unit_card','meeting_link','system')),
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
  status text not null default 'available' check (status in ('available','held','booked','cancelled')),
  created_at timestamptz not null default now(),
  constraint meeting_slots_time_check check (ends_at > starts_at)
);

create table if not exists public.meeting_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references public.meeting_slots(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  developer_id uuid references public.developers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  lead_id uuid references public.leads(id) on delete restrict,
  agent_id uuid references auth.users(id) on delete set null,
  developer_user_id uuid references auth.users(id) on delete set null,
  channel text not null default 'office' check (channel in ('office','phone','zoom','site_visit')),
  status text not null default 'scheduled' check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- AI recommendations and engagement triggers.
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  property_id uuid references public.marketplace_properties(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  event_type text not null check (event_type in ('view_property','watch_video','open_masterplan','save_property','share_property','request_call','open_payment_plan')),
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
  trigger_type text not null check (trigger_type in ('hot_video_rewatch','price_drop_match','unit_revisited','meeting_intent','roi_opportunity')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  title_ar text not null,
  body_ar text,
  action_link text,
  status text not null default 'open' check (status in ('open','dismissed','acted','expired')),
  created_at timestamptz not null default now()
);
```

## 6. Core Relationships

```txt
developers
  ├─ projects
  │   ├─ units
  │   │   ├─ payment_plans
  │   │   ├─ unit_price_history
  │   │   └─ marketplace_properties
  │   ├─ masterplan_nodes
  │   ├─ meeting_slots
  │   └─ realtime_chat_threads
  ├─ developer_accounts
  │   └─ developer_projects_access
  └─ developer_api_clients

companies
  ├─ profiles / user_profiles
  ├─ work_cells
  │   └─ work_cell_members
  ├─ leads
  │   ├─ lead_cell_assignments
  │   ├─ masked_call_sessions
  │   ├─ realtime_chat_threads
  │   ├─ meeting_bookings
  │   └─ engagement_events
  └─ crm_transactions / commission_splits
```

## 7. RLS Strategy

كل جدول في `public` يجب أن يكون RLS enabled.

سياسات الوصول:

- `super_admin` و`platform_admin`: قراءة وإدارة على مستوى المنصة مع audit.
- `developer_admin`: بيانات مطوره فقط.
- `developer_sales`: العملاء والمحادثات والاجتماعات المرتبطة بمشاريعه فقط، بدون رؤية رقم العميل الحقيقي.
- `company_admin`: بيانات شركته وخلاياها.
- `branch_manager` و`team_leader`: بيانات الخلية/الفريق.
- `agent`: العملاء والصفقات والمحادثات المسندة إليه.
- `client`: محادثاته ومواعيده ووحداته المحفوظة فقط.

نموذج policy عام:

```sql
alter table public.masked_call_sessions enable row level security;

create policy "masked calls scoped read"
on public.masked_call_sessions
for select
to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin','platform_admin')
  or company_id = (select auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
  or agent_id = auth.uid()
  or developer_user_id = auth.uid()
);
```

## 8. API Endpoints

### Inventory API Gateway

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/integrations/developer-feed` | استقبال حدث وحدة واحد أو مجموعة أحداث من مطور | API client key + HMAC |
| `POST` | `/api/integrations/developer-feed/bulk` | استقبال bulk inventory payload | API client key + HMAC + idempotency key |
| `GET` | `/api/integrations/developer-feed/status/:batchId` | حالة batch ingestion | Developer/API client |
| `POST` | `/api/inventory/import` | رفع Excel/CSV من لوحة الشركة | Session + `inventory.import` |
| `POST` | `/api/inventory/import/:batchId/map` | حفظ auto/manual mapping للأعمدة | Session + `inventory.import` |
| `POST` | `/api/inventory/import/:batchId/process` | معالجة batch وتطبيقها على projects/units/payment plans | Session + approval |
| `POST` | `/api/inventory/manual/unit` | إضافة وحدة يدوياً | Session + `unit.write` |
| `PATCH` | `/api/inventory/manual/unit/:id` | تعديل السعر/الحالة/الخطة | Session + `unit.write` |

### Developer Hub

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/developer/projects` | مشاريع المطور المتاحة للحساب الحالي | Developer account |
| `GET` | `/api/developer/projects/:id/units` | وحدات المشروع ومؤشرات الاهتمام | Developer project access |
| `POST` | `/api/developer/projects/:id/media` | رفع صور وفيديوهات ومخططات | Developer content permission |
| `GET` | `/api/developer/leads` | العملاء المهتمون بمشاريع المطور بدون كشف بيانات حساسة | Developer sales scope |
| `POST` | `/api/developer/meetings/slots` | إنشاء أوقات مقابلات | Developer manager/sales |

### Communication / VoIP Masking

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/communications/calls/masked/start` | إنشاء مكالمة masked بين agent/developer/client | Session + scoped lead access |
| `POST` | `/api/communications/calls/webhook` | Twilio status/recording callback | Provider signature |
| `GET` | `/api/communications/calls/:id` | تفاصيل المكالمة بدون كشف الرقم الحقيقي | Scoped participant |
| `POST` | `/api/communications/chat/threads` | إنشاء thread بين العميل والمطور/الوكيل | Session |
| `GET` | `/api/communications/chat/threads/:id/messages` | تحميل آخر الرسائل | Participant scope |
| `POST` | `/api/communications/chat/threads/:id/messages` | إرسال رسالة realtime | Participant scope |
| `POST` | `/api/communications/meetings/book` | حجز موعد | Lead/client/agent/developer scope |
| `POST` | `/api/communications/meetings/:id/confirm` | تأكيد الموعد وإرسال WhatsApp/email | Scoped participant |

### AI And Engagement

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/ai/matchmaking` | اقتراح وحدات مناسبة للعميل | Agent/company scope |
| `POST` | `/api/ai/roi` | حساب ROI وفترة الاسترداد | Agent/company scope |
| `POST` | `/api/engagement/events` | تسجيل مشاهدة فيديو/وحدة/مخطط | Public session or authenticated |
| `GET` | `/api/engagement/triggers` | تنبيهات تدخل السيلز | Assigned agent/team scope |

## 9. API Security Contract

كل طلب من مطور إلى API Gateway يجب أن يحتوي:

```http
X-FI-Client-Key: dev_xxx
X-FI-Timestamp: 2026-04-22T10:00:00Z
X-FI-Idempotency-Key: developer-unit-123-20260422-price
X-FI-Signature: hmac_sha256(timestamp + body, client_secret)
```

قواعد الحماية:

- رفض أي timestamp أقدم من 5 دقائق.
- تخزين `idempotency_key` في Redis أو جدول ingestion لمنع التكرار.
- rate limit حسب developer/client key.
- لا يتم قبول `status=sold` أو price drop كبير إلا بعد rule validation أو approval إذا تجاوز threshold محدد.
- كل mutation يكتب audit log.

## 10. Ingestion Flow

```txt
1. Receive payload/file/manual input.
2. Create inventory_ingestion_batches row.
3. Validate developer/client authorization.
4. Normalize Arabic/English field names.
5. Auto-map fields:
   - project name
   - unit number
   - building/floor
   - area
   - price
   - down payment
   - installment years
   - availability
6. Upsert developer/project/unit/payment plan.
7. Insert unit_price_history when price/status changes.
8. Publish Supabase Realtime event.
9. Trigger matching recalculation for leads watching the same project/type/budget.
10. Notify assigned agents if a watched unit drops price or becomes available.
```

## 11. VoIP Masking Flow

```txt
1. Agent أو Developer Sales يضغط اتصال من داخل CRM.
2. Server يتحقق من صلاحية الوصول للـ lead/project.
3. ينشئ masked_call_sessions.
4. يطلب من Twilio إنشاء bridge call برقم masked.
5. أرقام العميل والسيلز الحقيقية لا تظهر في الواجهة.
6. Webhook يحدث الحالة: ringing / in_progress / completed.
7. عند توفر التسجيل، يتم حفظ recording_url.
8. engagement_events يسجل call_requested/call_completed.
9. AI trigger يقترح follow-up إذا لم يتم الرد أو إذا زادت مدة المكالمة عن threshold.
```

## 12. Interactive Visual Data

الـ Masterplan لا يجب أن يكون صورة فقط. النموذج المقترح:

- `projects.masterplan_url`: صورة/ملف المخطط.
- `projects.masterplan_config`: إعدادات zoom/layers/default viewport.
- `masterplan_nodes`: مناطق، مباني، أدوار، وحدات.
- `units.floorplan_config`: polygon أو coordinates داخل floor plan.
- عند ضغط العميل على مبنى أو طابق، يتم تحميل الوحدات المتاحة فقط مع السعر والحالة.

## 13. Predictive Matchmaking

مصادر البيانات:

- `leads.budget_min/budget_max`.
- `engagement_events`.
- `property_search_events`.
- `marketplace_properties`.
- `unit_price_history`.
- `roi_scenarios`.

معادلة أولية:

```txt
score =
  budget_fit * 0.30
  + location_fit * 0.20
  + engagement_similarity * 0.20
  + availability_urgency * 0.15
  + roi_quality * 0.15
```

النتيجة تحفظ في `property_recommendations` مع سبب عربي واضح للوكيل:

- "مطابقة قوية للميزانية والمنطقة."
- "العميل شاهد فيديو المشروع أكثر من مرة."
- "الوحدة أقل من متوسط المشروع بنسبة 8%."

## 14. Implementation Roadmap

### Phase 1 - Stabilize Core Mesh

- اعتماد `api_integrations` و`inventory_feed_events`.
- إضافة batch ingestion لجداول Excel/CSV.
- بناء `/dashboard/integrations`.
- بناء `/api/integrations/developer-feed`.

### Phase 2 - Developer Hub

- developer accounts.
- project access.
- unit interest dashboards.
- media upload and approval.

### Phase 3 - Communication Mesh

- masked calls.
- call status webhooks.
- realtime chat.
- meeting scheduler.

### Phase 4 - Visual Layer

- masterplan node editor.
- unit-level media.
- project/developer profile pages.

### Phase 5 - AI Sales Engine

- engagement triggers.
- predictive recommendations.
- ROI and payback engine.
- weekly conversion insights.

## 15. Operational KPIs

- Inventory sync latency: أقل من 60 ثانية للـ API events.
- Import success rate: أكبر من 97% بعد mapping approval.
- Price accuracy: كل تغيير سعر له history/audit.
- Call connect rate.
- Lead-to-meeting conversion.
- Meeting-to-deal conversion.
- GMV per cell.
- Average response time after engagement trigger.
- Percentage of recommendations acted upon by agents.
