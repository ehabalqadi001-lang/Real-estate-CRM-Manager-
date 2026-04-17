# FAST INVESTMENT | Enterprise CRM

Production-grade Egyptian real estate operating platform blueprint.

## 1. Architecture Plan

### Product Positioning

FAST INVESTMENT must evolve from a CRM shell into a real estate operating system for Egyptian brokerage and developer operations. The platform should support the full chain from lead capture to inventory discovery, reservation, contracting, commission calculation, payout, governance, reporting, support, and auditability.

### Architectural Principles

- Domain-first modules instead of feature folders with scattered Supabase calls.
- Server-side authorization on every protected route, query, and mutation.
- Supabase/PostgreSQL as the source of truth with RLS enabled on exposed tables.
- Next.js App Router pages act as composition layers, not business logic containers.
- Server actions delegate to domain mutations and never contain raw business rules directly.
- Shared UI patterns for tables, forms, filters, empty states, approval banners, and audit timelines.
- Arabic/RTL support by default, with data structures ready for Arabic and English labels.
- Finance and payout logic must be deterministic, auditable, and tested before release.
- Approval and audit workflows are platform primitives, not module-specific afterthoughts.

### Target Runtime Layers

1. App routes: page composition, layout, metadata, redirects.
2. Domain modules: workflow logic, queries, mutations, validation, policies.
3. Shared platform: auth, RBAC, Supabase clients, navigation, UI primitives, audit utilities.
4. Database: normalized domain schema, RLS policies, indexes, enums, triggers.
5. Integrations: notifications, maps, imports/exports, future WhatsApp/payment integrations.

## 2. Route Tree

```txt
src/app
  /(public)
    login
    register
  /auth
    callback
    logout
  /dashboard
    page.tsx
    /crm
      /leads
      /clients
      /buyers
      /sellers
      /activities
    /brokers
      page.tsx
      /[id]
    /teams
      page.tsx
      /[id]
    /inventory
      /developers
      /projects
      /projects/[id]
      /units
      /units/[id]
      /primary-listings
      /resale-listings
      /resale-listings/[id]
    /sales
      /deals
      /deals/[id]
      /reservations
      /contracts
    /commissions
      /rules
      /commissions
      /payout-cycles
      /payouts
    /finance
      /overview
      /collections
      /expenses
      /records
    /support
      /tickets
      /tickets/[id]
    /admin
      /users
      /companies
      /roles
      /approvals
      /audit-logs
      /settings
    /reports
      /sales
      /inventory
      /finance
      /broker-performance
    /maps
      /explorer
    /notifications
```

### Routing Rules

- `/dashboard/*` requires an authenticated active profile.
- Every route group declares the minimum permission needed.
- Sensitive pages also validate permission inside the domain query/mutation.
- Legacy routes can remain as redirects while migration is in progress.

## 3. Domain Model

### Core Identity And Tenant Model

- `companies`: brokerage companies, developer accounts, or internal platform organizations.
- `profiles`: authenticated users mapped to company, role, status, and account type.
- `teams`: sales teams within a company.
- `team_members`: user membership, leader assignment, effective dates.
- `roles`: optional database-backed role definitions for future custom roles.
- `permissions`: optional database-backed permission overrides.

### CRM Model

- `leads`: raw demand pipeline with source, status, score, temperature, owner, assignee.
- `lead_sources`: campaigns, broker referrals, social, portal, walk-in, WhatsApp.
- `clients`: normalized person/account record.
- `buyers`: buyer-specific budget, preferences, areas, projects, payment ability.
- `sellers`: owner/resale-specific identity, ownership and contact preferences.
- `activities`: calls, WhatsApp, visits, meetings, follow-ups.
- `tasks`: actionable work items with assignee, due date, status.
- `notes`: scoped notes attached to lead/client/deal/listing.
- `attachments`: documents and media with storage path and access scope.

### Inventory Model

- `developers`: developer companies.
- `projects`: city, area, developer, delivery, location, project metadata.
- `phases`: project phases.
- `buildings`: building/zone metadata.
- `unit_types`: apartment, villa, townhouse, twin house, chalet, office, clinic, retail.
- `units`: canonical unit inventory with price, area, floor, bedrooms, status.
- `primary_listings`: sellable developer units.
- `resale_listings`: owner-led listings with asking price, negotiability, owner state.
- `map_locations`: reusable geospatial coordinates for projects, units, listings.

### Sales Model

- `deals`: commercial transaction lifecycle.
- `reservations`: unit/listing reservation lock with expiry and approval.
- `contracts`: contract record, dates, status, documents.
- `collections`: payment collection events or developer confirmation records.
- `deal_participants`: buyer, seller, broker, team leader, referral, company roles.

### Finance Model

- `commission_rules`: company/developer/project/listing commission logic.
- `commissions`: calculated commission records tied to deals and participants.
- `payout_cycles`: finance batches.
- `payouts`: payable items to brokers/freelancers/company staff.
- `finance_records`: general finance ledger for expenses, collections, adjustments.

### Governance Model

- `approvals`: generic approval requests with entity type/id, requested action, status.
- `audit_logs`: append-only event log for sensitive operations.
- `notifications`: per-user notifications.
- `support_tickets`: operational support cases.

## 4. Permission Matrix

### Permission Scopes

- `own`: user-owned records.
- `assigned`: records assigned to user.
- `team`: records owned by team members.
- `company`: records within the user company.
- `platform`: cross-company operational scope.
- `all`: super-admin scope.

### Role Matrix

| Role | Scope | Primary Access | Explicit Denials |
|---|---|---|---|
| Super Admin | all | All modules, tenant governance, audit | None, but all sensitive actions audited |
| Platform Admin | platform | Company onboarding, support, platform reports | Tenant finance mutation unless granted |
| Company Owner | company | Company admin, users, finance approval, reports | Other companies |
| Sales Director | company | Leads, clients, brokers, deals, reports | Payout payment execution |
| Team Leader | team | Team leads, assignments, team deals | Company finance/admin settings |
| Broker | assigned/own | Own leads, clients, inventory, own deals, own commissions | Admin, company finance, other brokers |
| Freelancer | own | Own leads/deals/commissions, public inventory | Internal team/company data |
| Buyer Manager | team/assigned | Buyers, matching, buyer lifecycle | Seller ownership docs, payouts |
| Seller / Resale Manager | team/company resale | Sellers, resale listings, resale negotiation | Primary inventory admin unless granted |
| Finance Officer | company finance | Commissions, payouts, finance records | Sales reassignment, admin role changes |
| HR Officer | company HR | Teams, staff records, HR reports | Sales pipeline and finance detail |
| Customer Support | assigned support | Tickets, assigned client support view | Finance, commissions, admin |
| Developer Relations Manager | inventory | Developers, projects, units, availability | Payouts, user admin, private CRM |

### Sensitive Actions

- Role change.
- User deactivation.
- Lead reassignment across teams.
- Unit price override.
- Reservation approval.
- Contract approval.
- Commission approval.
- Payout approval/payment/reversal.
- Finance record edit/delete.
- Export of clients, deals, commissions, payouts.
- Deleting or archiving business records.

### RLS Mapping

- Company tables include `company_id`.
- User-owned records include `user_id` or `created_by`.
- Assignment-based records include `assigned_to`.
- Team records derive scope through `team_members`.
- Finance tables require finance/admin/company-owner policies.
- Audit logs are insert-only for application operations and read-limited by scope.

## 5. Repo Structure

```txt
src
  app
    dashboard
    auth
  domains
    leads
      types.ts
      queries.ts
      mutations.ts
      validation.ts
      permissions.ts
    clients
    brokers
    buyers
    sellers
    inventory
    listings
    deals
    commissions
    payouts
    finance
    approvals
    audit
    notifications
    maps
    support
  shared
    auth
    rbac
    supabase
    components
      app-shell
      data-table
      forms
      status
      empty-state
    config
    types
    utils
  lib
    legacy-only
supabase
  migrations
  seed
tests
  unit
  integration
  e2e
docs
  architecture
```

### Placement Rules

- Auth/session logic: `src/shared/auth`.
- RBAC config and checks: `src/shared/rbac`.
- Supabase clients: `src/shared/supabase`.
- Domain reads: `src/domains/*/queries.ts`.
- Domain writes: `src/domains/*/mutations.ts`.
- Form schemas: `src/domains/*/validation.ts`.
- Business types: `src/domains/*/types.ts`.
- Shared UI tables/forms: `src/shared/components`.
- Audit logging utilities: `src/domains/audit`.
- Finance logic: `src/domains/finance`.
- Commission logic: `src/domains/commissions`.
- Map logic: `src/domains/maps`.
- Route composition only: `src/app`.

## 6. Implementation Order

### Phase 0 - Stabilization

- Confirm strict TypeScript passes.
- Confirm lint baseline.
- Remove deprecated middleware patterns.
- Centralize Supabase clients.
- Centralize auth/session.

Status: started.

### Phase 1 - Access Foundation

- RBAC permission config.
- Protected layouts.
- Role-aware navigation.
- Server-side route guards.
- Logout and auth flow hardening.

Status: started.

### Phase 2 - CRM Foundation

- Leads domain query/mutation layer.
- Clients domain query/mutation layer.
- Activities/tasks/notes domain layer.
- Client detail route migration away from browser-side Supabase.
- Duplicate detection and Egyptian phone normalization.

Status: in progress.

### Phase 3 - Inventory Foundation

- Developers/projects/units domain layer.
- Unit status machine.
- Primary listing layer.
- Resale listing layer.
- Map location model.

### Phase 4 - Sales Workflows

- Deals lifecycle.
- Reservations.
- Contracts.
- Deal participants.
- Status transitions.
- Unit/listing locking.

### Phase 5 - Finance Workflows

- Commission rules.
- Commission calculation engine.
- Payout cycles.
- Payout approval/payment/reversal.
- Finance records.

### Phase 6 - Governance

- Approval engine.
- Audit logging.
- Notifications.
- Support tickets.
- Export controls.

### Phase 7 - Enterprise Hardening

- RLS audit.
- Integration tests.
- E2E tests.
- Performance indexes.
- Reporting readiness.
- Launch checklist.

## 7. Current Migration Rule

Do not rewrite the whole application blindly. Every migrated route should follow this pattern:

1. Read existing behavior.
2. Identify current data dependencies.
3. Create/extend domain types.
4. Move reads to `queries.ts`.
5. Move writes to `mutations.ts`.
6. Add permission checks.
7. Keep UI behavior stable unless the existing UI is unsafe.
8. Run `npx tsc --noEmit`.
9. Run `npm run lint`.

## 8. Next Implementation Target

The next production-ready implementation step is:

1. Migrate `src/app/dashboard/clients/[id]/page.tsx` from client-side Supabase to a server-rendered page backed by `src/domains/clients/queries.ts`.
2. Add scoped client detail and related deal queries.
3. Remove direct browser access to sensitive client/deal data.
4. Then continue into inventory domain migration.
