# FAST INVESTMENT Enterprise CRM Refactor Plan

## 1. Current Code Structure Audit

The current codebase is a mixed architecture:

- `src/app` contains routes, UI, server actions, direct Supabase queries, and business rules.
- `src/components` contains reusable UI, domain UI, layout shell, notification widgets, and old RBAC UI guards.
- `src/lib` contains older shared utilities, Supabase clients, auth helpers, audit, email, notify, rate-limit, and typed database interfaces.
- `src/domains` exists, but currently covers only a few domains and still has typed-client issues.
- `src/shared` has started as the new production foundation for Supabase, auth, RBAC, navigation, and app shell.

The system currently has working functionality, but the architecture is inconsistent. The safest strategy is incremental migration, not a full rewrite.

## 2. Anti-Patterns

### Direct Supabase Queries In Pages

- Current problem: Many pages call `supabase.from(...)` directly, for example leads, deals, inventory, brokers, resale, finance, reports, dashboard, admin, and APIs.
- Why dangerous: Security, filtering, tenant boundaries, and business rules become inconsistent per page.
- Target solution: Pages call `domains/{module}/queries.ts`; mutations call `domains/{module}/actions.ts`.
- Migration strategy: Move one route at a time. Start with read-only list pages, then detail pages, then mutations.
- Regression risk: Medium. Query shape changes can alter visible rows.
- Implementation order: Leads list, clients list, inventory list, deals list, finance pages.

### Business Logic Inside UI Routes

- Current problem: Pages calculate KPIs, statuses, financial totals, and workflow state directly.
- Why dangerous: Same rule can produce different answers in different screens.
- Target solution: Domain services own calculations and workflow decisions.
- Migration strategy: Extract pure functions first, then repositories, then server actions.
- Regression risk: Medium.
- Implementation order: Dashboard stats, finance summaries, commission calculations, inventory status counts.

### Fragmented Auth And RBAC

- Current problem: Auth and role checks exist in `src/lib/server-auth.ts`, `src/lib/require-role.ts`, `src/components/RoleGuard.tsx`, old `Sidebar.tsx`, routes, and new `shared/auth`/`shared/rbac`.
- Why dangerous: Users can be allowed in one path and denied in another. Client-side role guards are not security.
- Target solution: `src/shared/auth` and `src/shared/rbac` become canonical. Server actions must call `requireSession` and `requirePermission`.
- Migration strategy: Mark old helpers as deprecated, migrate imports route by route.
- Regression risk: High for admin paths if role aliases are missed.
- Implementation order: Auth shell, admin routes, finance actions, broker actions, lead assignment actions.

### Mixed Inventory Models

- Current problem: Some code uses `inventory`; newer domain code references `units`, `projects`, `buildings`.
- Why dangerous: Unit availability and pricing can diverge, which is catastrophic for real estate operations.
- Target solution: Canonical inventory model: developers -> projects -> phases/buildings -> units.
- Migration strategy: Keep old `inventory` screens working while introducing a compatibility repository. Later migrate data and UI to `units`.
- Regression risk: High.
- Implementation order: Inventory repository adapter, unit list, unit detail, reservation workflow, remove direct `inventory` usage.

### Hand-Maintained Database Types

- Current problem: `src/lib/types/db.ts` is hand-maintained and does not align cleanly with Supabase client generics, causing many `never` type errors.
- Why dangerous: TypeScript becomes noisy and developers bypass types with `any`.
- Target solution: Generate Supabase database types and keep domain DTOs separate.
- Migration strategy: Add generated `src/shared/db/database.types.ts`; update new clients to use it; migrate old domain code gradually.
- Regression risk: Low for runtime, medium for compile-time.
- Implementation order: Generate types, update shared Supabase client, update domains one by one.

## 3. Unsafe Logic

### API Routes Are Not Default-Deny

- Current problem: Several API routes exist under `src/app/api`; auth enforcement is inconsistent.
- Why dangerous: API routes are public HTTP endpoints. Missing one auth check can expose CRM data.
- Target solution: `protectedApi`, `adminApi`, `publicApi`, and `webhookApi` wrappers.
- Migration strategy: Wrap route handlers one by one. Public routes must explicitly opt in.
- Regression risk: Medium. Some integrations may need explicit public/webhook behavior.
- Implementation order: documents, leads, agents, contracts, reports, developer units, AI routes.

### Server Actions Are Publicly Invokable

- Current problem: Many server actions mutate data without a uniform authorization wrapper.
- Why dangerous: Next Server Actions can be invoked directly by POST.
- Target solution: Every action validates input, checks session, checks permission, audits sensitive changes.
- Migration strategy: Create `withServerAction` wrapper and migrate actions per domain.
- Regression risk: Medium.
- Implementation order: finance/payouts, commissions, lead assignment, reservations/deals, inventory edits.

### Finance State Is Mutable Without Strong Workflow

- Current problem: Commission/payout/expense actions are scattered and not uniformly protected by maker-checker approval rules.
- Why dangerous: Incorrect payouts and manual adjustments cause business disputes.
- Target solution: Finance workflows require approval state, audit log, and immutable history.
- Migration strategy: First add guards and audit calls; later add proper tables for entitlement and payout events.
- Regression risk: High.
- Implementation order: payout approval, commission adjustment, expense approval, collection recording.

## 4. Route And Layout Issues

### Legacy Middleware Convention

- Current problem: The project used `src/middleware.ts`, deprecated in Next 16.
- Why dangerous: Warnings and future incompatibility.
- Target solution: `src/proxy.ts`.
- Migration strategy: Already started. Keep proxy lightweight: optimistic route redirects only.
- Regression risk: Low.
- Implementation order: Complete proxy validation, then move full authorization to DAL/actions.

### Layout-Level Auth Can Be Insufficient

- Current problem: Some auth logic lives in shared layouts and old sidebar/client components.
- Why dangerous: Next layouts do not re-run on every client navigation, and UI hiding is not authorization.
- Target solution: DAL checks close to data access and mutation points.
- Migration strategy: Keep dashboard layout requiring session, but add page/query/action-level guards.
- Regression risk: Medium.
- Implementation order: High-risk modules first: admin, finance, commissions, broker, inventory mutations.

### Navigation Does Not Equal Permission

- Current problem: Sidebar hides/shows items by role, but routes/actions may still be callable.
- Why dangerous: Hidden UI does not prevent access.
- Target solution: Navigation uses permissions for UX only; server guards enforce access.
- Migration strategy: Continue new `shared/config/navigation.ts`, then guard each route/query.
- Regression risk: Low.
- Implementation order: Route guards first, then navigation cleanup.

## 5. Permission Issues

### Role Strings Are Inconsistent

- Current problem: Roles include `admin`, `Admin`, `company`, `company_admin`, `super_admin`, `Super_Admin`, `agent`, and newer enterprise roles.
- Why dangerous: One typo can bypass or block access.
- Target solution: Canonical `AppRole` plus role alias normalization.
- Migration strategy: Normalize roles in `shared/auth/session.ts`; later migrate database values.
- Regression risk: Medium.
- Implementation order: Normalize reads, add migration, update UI labels.

### Missing Permission Scopes

- Current problem: Current logic mostly checks role, not scope.
- Why dangerous: Team leaders may see company data; brokers may see internal CRM.
- Target solution: Permission + scope: own, assigned, team, branch, company, platform.
- Migration strategy: Implement scope-aware `canAccessEntity` helpers per domain.
- Regression risk: High.
- Implementation order: Leads, clients, deals, commissions, brokers.

## 6. Duplicated Logic

### Supabase Client Creation

- Current problem: Supabase clients are created in multiple files and pages.
- Why dangerous: Cookie handling and typing diverge.
- Target solution: `src/shared/supabase/server.ts`, `browser.ts`, and later `admin.ts`.
- Migration strategy: Replace direct `createServerClient` calls gradually.
- Regression risk: Low.
- Implementation order: New domains first, old pages when touched.

### Notification Components

- Current problem: There are multiple notification bell/listener components.
- Why dangerous: Duplicate subscriptions and inconsistent UI.
- Target solution: One notification domain plus one shared notification UI.
- Migration strategy: Create notification queries/actions, then replace components.
- Regression risk: Low to medium.
- Implementation order: Notification bell, notification page, realtime listener.

### Commission Logic

- Current problem: Commission logic exists in old dashboard actions and `domains/commissions`.
- Why dangerous: Different pages can show different payout totals.
- Target solution: One commission engine and one finance-approved entitlement workflow.
- Migration strategy: Extract pure engine tests first; then migrate screens.
- Regression risk: High.
- Implementation order: Engine tests, commission read model, payout workflow.

## 7. Domain Leakage

### Pages Know Table Details

- Current problem: Pages know column names, joins, and table names.
- Why dangerous: Schema changes require UI edits everywhere.
- Target solution: Repositories return DTOs/view models.
- Migration strategy: Introduce `queries.ts` per domain and return stable types.
- Regression risk: Medium.
- Implementation order: List pages first.

### Shared Components Know Business Rules

- Current problem: Components such as old sidebar and role guards query profile/roles directly.
- Why dangerous: UI components become security/data layers.
- Target solution: Components receive profile/permissions as props or use safe client-only UX hooks.
- Migration strategy: Keep old components until pages migrate to new shell.
- Regression risk: Low.
- Implementation order: App shell, data tables, forms.

## 8. Proposed New Structure

Target structure:

```text
src/
  app/
  domains/
    leads/
    clients/
    brokers/
    inventory/
    resale/
    deals/
    commissions/
    payouts/
    finance/
    admin/
    notifications/
    geo/
  shared/
    auth/
    rbac/
    supabase/
    db/
    audit/
    components/
    config/
    validations/
    types/
```

Domain module shape:

```text
domains/{domain}/
  actions.ts
  service.ts
  repository.ts
  queries.ts
  schema.ts
  types.ts
  permissions.ts
  components/
```

Migration rule:

- New code goes into `domains` and `shared`.
- Old code is only edited to bridge or replace.
- Do not create new direct Supabase queries inside `app` pages.

## 9. Module-By-Module Migration Plan

### Phase 0: Stabilization

- Current problem: Full lint/typecheck fails.
- Target solution: Establish CI baseline.
- Migration strategy: Fix new code lint first, then old high-risk errors.
- Regression risk: Low.
- Order: lint errors, TypeScript generated types, deprecated proxy, dead routes.

### Phase 1: Auth / RBAC / Shell

- Current problem: Auth, RBAC, sidebar, and proxy were fragmented.
- Target solution: Canonical `shared/auth`, `shared/rbac`, `shared/components/app-shell`.
- Migration strategy: Continue Phase A work; deprecate old helpers.
- Regression risk: Medium for role redirects.
- Order: dashboard layout, admin layout, company layout, route guards.

### Phase 2: Leads / Clients / Activities

- Current problem: Lead logic exists in `app/dashboard/leads/actions.ts`, `domains/crm/actions.ts`, API routes, and components.
- Target solution: `domains/leads`, `domains/clients`, `domains/activities`.
- Migration strategy: Start with read queries, then create/update actions, then assignment/duplicates.
- Regression risk: Medium.
- Order: lead list, lead detail, create lead, assign lead, activity timeline, client profile.

### Phase 3: Inventory / Developers / Projects / Units

- Current problem: `inventory` and `units` models conflict.
- Target solution: Canonical inventory domain with compatibility adapter.
- Migration strategy: Create repositories that can read both models; progressively migrate screens to `units`.
- Regression risk: High.
- Order: developers, projects, units list, unit detail, imports, map.

### Phase 4: Resale / Sellers / Listings

- Current problem: Seller data is embedded in resale listings.
- Target solution: Seller and resale listing domains.
- Migration strategy: Keep current listing UI, add seller DTO and verification service.
- Regression risk: Medium.
- Order: listing list, listing form, seller profile, verification workflow.

### Phase 5: Deals / Reservations / Contracts

- Current problem: Deal lifecycle is not state-machine driven.
- Target solution: deal workflow service and reservation service.
- Migration strategy: Add stage transition service, then migrate kanban/detail/actions.
- Regression risk: High.
- Order: deal list, deal detail, status transitions, reservations, contracts.

### Phase 6: Commissions / Payouts / Finance

- Current problem: Finance logic is scattered and not fully approval-based.
- Target solution: finance ledger, commission engine, payout workflow.
- Migration strategy: Start with read-only reports, then guarded mutations, then approval workflows.
- Regression risk: Very high.
- Order: commission engine tests, commission list, payout list, payout approval, finance summary.

### Phase 7: Admin / Audit / Approvals / Notifications

- Current problem: Governance is partial.
- Target solution: generic approval engine, audit service, notification domain.
- Migration strategy: Add audit calls to sensitive actions before redesigning UI.
- Regression risk: Medium.
- Order: audit service, approvals repository, notification actions, admin center.

### Phase 8: Geo / Reports

- Current problem: Reports and maps query raw operational tables.
- Target solution: reporting read models and geo domain.
- Migration strategy: Create stable views/queries after core domains stabilize.
- Regression risk: Low to medium.
- Order: map DTOs, area filters, executive reports, finance reports.

## Recommended Implementation Order

1. Keep Phase A foundation and finish route guards.
2. Generate accurate Supabase database types.
3. Fix lint/type errors in high-risk shared/domain code.
4. Migrate leads and clients first.
5. Migrate inventory after deciding canonical `units` model.
6. Migrate deals/reservations before finance.
7. Migrate finance/commissions/payouts with tests.
8. Add audit/approval/notification infrastructure across sensitive actions.

## Definition Of Done Per Migrated Module

- No direct Supabase queries in page files.
- Server actions validate input and check permissions.
- Domain service contains business rules.
- Repository/queries isolate database access.
- Sensitive mutations write audit logs.
- List/detail pages use DTOs.
- Lint passes for changed files.
- At least smoke-tested in browser or by route request.

