# FAST INVESTMENT CRM — Full System Redesign & Bug-Fix Codex Prompt

## ROLE
You are a Senior Full-Stack Engineer + Principal UI/UX Designer + Sales-Psychology Expert working on a production Next.js 16 / React 19 / Supabase / Tailwind v4 real-estate CRM called **FAST INVESTMENT**.

---

## PRIME DIRECTIVE — NON-NEGOTIABLE
> **NEVER delete any existing backend logic, server actions, Supabase queries, API routes, types, hooks, state management, or RBAC permissions.**
> This task is PURELY an upgrade. Enhance, modernize, and fix — but preserve every service and data structure exactly as-is.

---

## TECH STACK (READ-ONLY — do not change)
- Next.js 16 App Router (Turbopack, Server Components)
- React 19 with `useTransition` / `useOptimistic`
- Supabase SSR (`@supabase/ssr`) — auth + realtime + storage
- Tailwind CSS v4 (`@import "tailwindcss"`)
- shadcn/ui components — do NOT replace, only extend
- Framer Motion `^12` — **already installed, USE IT**
- dnd-kit — drag-and-drop (pipeline kanban)
- Lucide React — icons
- Cairo + Inter fonts (loaded via `next/font/google`)
- Design tokens in `src/styles/design-tokens.css` and `src/app/globals.css`

---

## COLOR SYSTEM & PSYCHOLOGY PALETTE

### Primary Palette (trust, authority, growth)
```
--fi-navy-deep:   #07172F   (trust, stability — sidebar background)
--fi-navy-mid:    #0F2446   (depth, professionalism)
--fi-blue-cta:    #2563EB   (action, urgency — primary CTA)
--fi-blue-soft:   #EFF6FF   (calm, clarity — backgrounds)
--fi-emerald:     #10B981   (success, growth, money)
--fi-emerald-mid: #16A34A   (approval, confirmed)
--fi-gold:        #F59E0B   (premium, VIP, partner tier)
--fi-rose:        #F43F5E   (urgency, alerts, lost deals)
--fi-ink:         #0B1220   (primary text)
--fi-muted:       #5A6A85   (secondary text)
--fi-line:        rgba(15,23,42,0.09) (borders)
--fi-soft:        #F2F7FF   (page backgrounds)
```

### Psychology Application Rules
- **Sales Team screens**: Blue/emerald dominance → confidence + action bias
- **Client/Buyer screens**: Warm whites + gold accents → trust + aspiration + FOMO
- **Partner/Company screens**: Navy + gold → exclusivity + professional authority
- **Management screens**: Data-rich + blue-gray → clarity + control + power
- **Success states**: Always emerald (#10B981) + micro-celebration animation
- **Urgency states**: Rose (#F43F5E) + subtle pulse — never panic-inducing

---

## TASK 1 — GLOBAL LAYOUT (RTL Arabic — verify and enhance)

### 1.1 DashboardShell (`src/shared/components/app-shell/DashboardShell.tsx`)

- Confirm `dir="rtl"` on root div (already done — system is Arabic RTL)
- Add a subtle `background-attachment: fixed` radial gradient to the shell background
- Ensure `--fi-gradient-primary` CSS variable resolves correctly per tenant brand color

### 1.2 EnterpriseSidebar (`src/shared/components/app-shell/EnterpriseSidebar.tsx`)
Enhance the already-redesigned dark navy sidebar:
- Add **Framer Motion** `AnimatePresence` + `motion.div` for group collapse/expand (spring easing)
- Add `whileHover={{ x: 2 }}` micro-slide on nav items
- Add `layoutId="active-pill"` shared layout animation on the active indicator bar
- Add a pulsing green dot next to "Live" badge using `animate={{ opacity: [1, 0.3, 1] }}` loop
- Ensure sidebar scrollbar is hidden (`no-scrollbar` class)

### 1.3 EnterpriseTopbar (`src/shared/components/app-shell/EnterpriseTopbar.tsx`)
- Add Framer Motion `initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}` on mount
- Wrap the Sparkles CTA button with `whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }}`
- Add a greeting that changes based on time of day:
  - 05:00–11:59 → "Good morning" ☀️
  - 12:00–17:59 → "Good afternoon" 🌤
  - 18:00–04:59 → "Good evening" 🌙
- Display it as a small line below "Real Estate Command Center"

---

## TASK 2 — WELCOME HEADER (psychology-driven, role-aware)

In `src/components/pipeline/PipelineBoard.tsx` → `WelcomeHeader` component AND in the main dashboard (`src/app/dashboard/page.tsx`) add the same hero:

### Role messages
```
SALES TEAM (agent | senior_agent | broker):
  Title: "Welcome back, Champion! 🏆"
  Sub: "Your pipeline is live. Push every deal one stage closer to closing today."
  Accent: Blue/emerald gradient, motivational energy

CLIENT (client | CLIENT | buyer):
  Title: "Welcome to Your Investment Portal."
  Sub: "Track your property journey, explore premium opportunities, and build lasting wealth."
  Accent: Warm gold/navy, aspirational

PARTNER / COMPANY (company | broker_company | partner):
  Title: "Welcome, Strategic Partner."
  Sub: "Together we unlock exponential growth. Your current pipeline and commissions are ready."
  Accent: Navy/gold, exclusive & authoritative

MANAGEMENT (admin | company_admin | super_admin | branch_manager):
  Title: "Command Center — FAST INVESTMENT"
  Sub: "Real-time strategic intelligence across every sales channel and department."
  Accent: Deep navy/blue, data-driven authority

HR / FINANCE / OPS (hr_manager | finance_officer | finance_manager):
  Title: "Operations Hub"
  Sub: "Your department metrics, payroll status, and pending approvals are ready."
  Accent: Slate/teal, calm professionalism
```

### Animation spec for WelcomeHeader
```tsx
// Use Framer Motion stagger:
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }
```

---

## TASK 3 — PIPELINE BOARD (`src/components/pipeline/PipelineBoard.tsx`)

All logic is already preserved. Enhance only:

### 3.1 Framer Motion for columns
Wrap each `PipelineColumn` in:
```tsx
<motion.div
  key={column.key}
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
>
```

### 3.2 Deal card hover
Add `whileHover={{ y: -3, scale: 1.02 }}` on `CompactDealCard` button element (remove CSS transition, use motion instead).

### 3.3 Sheet animations
Wrap `SheetContent` inner content in:
```tsx
<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05, type: 'spring' }}>
```

### 3.4 Stage badge counter
When deal count changes, animate the number with `useSpring` or a counting animation.

### 3.5 Skeleton loader (`src/app/dashboard/pipeline/loading.tsx`)
Replace `.sales-skeleton` divs with animated `motion.div` shimmer:
```tsx
<motion.div animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }} className="sales-skeleton" />
```

---

## TASK 4 — LOGIN PAGE (`src/app/login/page.tsx`)

**Complete redesign** — keep `loginAction` and all form logic intact.

### Design spec

- Keep `dir="rtl"` — system is Arabic RTL; form inputs may use `dir="ltr"` individually for data entry (email, password)
- Left panel (hero): dark navy gradient (`#07172F → #1A3A7A`) with animated floating property icons
- Right panel (form): frosted glass card, clean white, subtle shadow

### Framer Motion animations
```tsx
// Left panel: stagger children
// Right panel: slide in from right
<motion.section initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} />

// Floating icons background (left panel):
const floatingVariants = {
  animate: { y: [-8, 8, -8], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
}
```

### Content (bilingual EN/AR)
```
Hero title: "One Platform for Real Estate Excellence"
Sub: "Manage clients, deals, partners, and inventory from a single intelligent workspace."

Stats row:
  - "500+ Active Deals" / صفقة نشطة
  - "98% Client Retention" / نسبة الاحتفاظ بالعملاء
  - "Live Pipeline" / متابعة فورية

Form labels: Use floating labels (CSS only — label moves up on focus/fill)
Email placeholder: "your@email.com"
Password placeholder: "Your secure password"
CTA button: Gradient (#2563EB → #10B981), font-black, height 52px, rounded-2xl
  - whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
  - Loading state: spinner + "Signing in…"

Bottom links (LTR, smaller):
  "New client?" → /register?role=client
  "Join as Partner" → /register?role=partner
  "Forgot password?" → /forgot-password
```

### Input styling (floating label pattern)
```css
.input-float-wrap { position: relative; }
.input-float { height: 56px; padding: 20px 16px 6px; border-radius: 14px; border: 1.5px solid var(--fi-line); background: white; font-size: 14px; font-weight: 700; transition: border 160ms, box-shadow 160ms; }
.input-float:focus { border-color: #2563EB; box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
.input-float-label { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #5A6A85; transition: 160ms ease; pointer-events: none; }
.input-float:focus + .input-float-label,
.input-float:not(:placeholder-shown) + .input-float-label { top: 10px; transform: none; font-size: 11px; font-weight: 800; color: #2563EB; }
```

---

## TASK 5 — REGISTER PAGE (`src/app/register/page.tsx`)

**Complete redesign** — keep `registerAction` + all form field logic intact.

### Design spec
- `dir="ltr"` globally, form inputs stay LTR for data entry
- Left sticky panel: role-aware hero (Partner = navy/gold, Client = warm white/emerald)
- Right: multi-section form with progress indicator (steps 1→2→3 visual tracker)

### Partner mode layout
```
Section 1: Account Type selector (Broker | Company) — pill buttons with icon + checkmark
Section 2: Personal / Company details — floating label inputs, 2-column grid
Section 3: Document Upload — drag-and-drop zones with animated dashed border (Framer Motion)
Section 4: Submit — large gradient CTA + security badge
```

### Client mode layout
```
Clean single-column: Name, Phone, Region, Email, Password
Large CTA, friendly copy, no document upload
```

### Drag-and-drop upload zone animation
```tsx
<motion.label
  whileHover={{ borderColor: '#10B981', background: 'rgba(16,185,129,0.04)' }}
  whileDrag={{ scale: 1.03 }}
  animate={isDragging ? { borderColor: '#10B981', scale: 1.02 } : {}}
  className="upload-zone"
>
```

### Psychology copy (EN, bilingual)
```
Partner page eyebrow: "FAST INVESTMENT · Partner Network"
Partner title: "Join Our Elite Broker & Company Network"
Partner sub: "Gain access to exclusive inventory, priority leads, and a dedicated account manager."

Client page eyebrow: "FAST INVESTMENT"
Client title: "Start Your Property Investment Journey"
Client sub: "Create your account and explore premium real estate opportunities curated just for you."

Trust signals (below form):
  🔒 SSL Secured · 256-bit Encryption
  ✓ Reviewed within 24 hours
  🏆 Trusted by 200+ Brokers
```

---

## TASK 6 — MARKETPLACE (`src/app/marketplace/page.tsx`)

**Complete redesign** — keep all existing `actions.ts`, listing data fetching, and search logic.

### Design spec
- Hero section: full-width gradient banner with animated floating property cards
- Search bar: large (height 60px), centered, with filters inline (type, location, price range)
- Listings grid: masonry or 3-column card grid, cards with glassmorphism
- Card design: project image, project name, developer name, price badge (gradient pill), CTA button
- Filter sidebar: collapsible, smooth slide

### Card micro-interactions
```tsx
<motion.div
  whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(37,99,235,0.14)' }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  className="listing-card"
/>
```

### Psychology elements
- Price shown prominently in emerald — triggers "value" perception
- "X people viewed this" social proof label → drives urgency
- "Featured" gold badge on premium listings
- Limited availability: "Only 3 units left" in rose text

---

## TASK 7 — GLOBAL CSS ENHANCEMENTS (`src/app/globals.css`)

Add to the existing file (DO NOT remove existing rules):

```css
/* Floating label inputs */
.fi-input-float-wrap { position: relative; }
.fi-input-float {
  height: 56px; width: 100%;
  padding: 20px 16px 8px;
  border-radius: 14px;
  border: 1.5px solid var(--fi-line);
  background: white;
  font-size: 14px; font-weight: 700;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
  font-family: var(--font-cairo), var(--font-inter), sans-serif;
}
.fi-input-float:focus { border-color: var(--sales-blue); box-shadow: 0 0 0 4px rgba(37,99,235,0.11); }
.fi-input-float-label {
  position: absolute; left: 16px; top: 50%;
  transform: translateY(-50%);
  font-size: 14px; font-weight: 600; color: var(--fi-muted);
  pointer-events: none;
  transition: top 140ms ease, font-size 140ms ease, color 140ms ease, transform 140ms ease;
}
.fi-input-float:focus ~ .fi-input-float-label,
.fi-input-float:not(:placeholder-shown) ~ .fi-input-float-label {
  top: 10px; transform: none;
  font-size: 10px; font-weight: 800; color: var(--sales-blue);
  letter-spacing: 0.06em; text-transform: uppercase;
}

/* Upload drop-zone */
.fi-dropzone {
  border: 2px dashed var(--fi-line);
  border-radius: 16px;
  background: var(--fi-soft);
  min-height: 120px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: border-color 160ms ease, background 160ms ease;
  cursor: pointer;
}
.fi-dropzone:hover, .fi-dropzone.is-over {
  border-color: var(--fi-emerald);
  background: rgba(16,185,129,0.04);
}

/* Progress step indicator */
.fi-step-line { display: flex; align-items: center; gap: 0; margin-bottom: 2rem; }
.fi-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.fi-step-circle {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 900;
  border: 2px solid var(--fi-line);
  background: white; color: var(--fi-muted);
  transition: all 200ms ease;
  z-index: 1;
}
.fi-step.active .fi-step-circle { border-color: var(--sales-blue); background: var(--sales-blue); color: white; box-shadow: 0 0 0 4px rgba(37,99,235,0.15); }
.fi-step.done .fi-step-circle { border-color: var(--fi-emerald); background: var(--fi-emerald); color: white; }
.fi-step-connector { position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: var(--fi-line); z-index: 0; }
.fi-step.done .fi-step-connector { background: var(--fi-emerald); }

/* Gradient CTA button */
.fi-cta-gradient {
  background: linear-gradient(135deg, #2563EB 0%, #10B981 100%);
  color: white; font-weight: 900;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(37,99,235,0.28), 0 1px 0 rgba(255,255,255,0.15) inset;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.fi-cta-gradient:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,99,235,0.35); }
.fi-cta-gradient:active { transform: scale(0.98); }

/* Page transition wrapper */
.fi-page-enter { animation: fi-page-in 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes fi-page-in {
  from { opacity: 0; transform: translateY(12px) scale(0.995); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Pulse for live indicators */
@keyframes fi-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.85); }
}
.fi-live-dot { animation: fi-pulse-dot 2s ease-in-out infinite; }

/* Glass card premium */
.fi-glass-premium {
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 8px 32px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.9);
  backdrop-filter: blur(24px) saturate(180%);
}
```

---

## TASK 8 — BUG AUDIT & FIXES

### Known issues to fix:

**8.1 CompanyContextSwitcher — ????? text** (ALREADY FIXED)
In `src/shared/components/app-shell/CompanyContextSwitcher.tsx`:
- Add `style={{ fontFamily: 'Cairo, system-ui, sans-serif', direction: 'auto', unicodeBidi: 'plaintext' }}` to the `<select>` element
- This ensures Arabic company names render correctly in the select element

**8.2 Dashboard page dir attribute** (NO CHANGE NEEDED)
`src/app/dashboard/page.tsx` — keep `dir="rtl"` on the `<main>` element — system is Arabic RTL

**8.3 Pipeline page dir attribute** (NO CHANGE NEEDED)
`src/app/dashboard/pipeline/page.tsx` — keep `dir="rtl"` on the `<main>` element — system is Arabic RTL

**8.4 Login/Register pages — error messages** (NO CHANGE NEEDED)
In `src/app/login/page.tsx` → catch block: keep Arabic error messages — system language is Arabic.
```tsx
// Keep as-is:
message: 'تعذر الاتصال بالخادم'
```

**8.5 AiFollowUpMessageButton — verify it renders**
Check `src/components/ai/ai-follow-up-message-button.tsx` exists and renders correctly in the DealDetailSheet. If it throws, wrap in `<Suspense>` fallback.

**8.6 Mobile sidebar toggle**
The mobile hamburger button dispatches `fi:open-sidebar` event — verify the `window.addEventListener` in EnterpriseSidebar correctly catches this. Check for SSR hydration mismatch (use `useEffect` not direct window access at top level).

**8.7 Notification bell userId prop**
`<NotificationBell userId={profile.id} />` — verify the NotificationBell component accepts and uses this prop. If it's undefined, the bell won't load realtime subscriptions.

**8.8 Sheet side direction**
In PipelineBoard, `SheetContent side="right"` is correct for this Arabic RTL system (opens from the start/right side). No change needed — do not switch to `side="left"`.

**8.9 Number locale** (NO CHANGE NEEDED)
Keep `toLocaleString('ar-EG')` throughout — system locale is Arabic Egyptian. Do not replace with `en-US`.

**8.10 Empty state strings** (NO CHANGE NEEDED)
All UI strings are in Arabic — this is correct. Do not translate Arabic strings to English.

---

## TASK 9 — PERFORMANCE ENHANCEMENTS

- Add `loading="lazy"` to all non-critical images
- Add `Suspense` boundaries around heavy components (PipelineBoard, DashboardKPIs)
- Use `React.memo` on `CompactDealCard` to prevent re-renders during drag
- Add `will-change: transform` to animated elements in CSS
- Use `prefetch={false}` on sidebar links that are rarely visited

---

## TASK 10 — ANIMATION SYSTEM (Framer Motion)

`src/lib/motion.ts` **already exists** — verify it exports the presets below and add any missing ones:

```ts
import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 25 } },
}

export const cardHover = {
  rest:  { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.015, transition: { type: 'spring', stiffness: 400, damping: 20 } },
}

export const buttonTap = {
  whileHover: { scale: 1.03 },
  whileTap:   { scale: 0.96 },
}

export const floatingLoop = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
}
```

Use these in all redesigned pages. Import as: `import { fadeUp, staggerContainer } from '@/lib/motion'`

---

## IMPLEMENTATION ORDER

Execute in this sequence to minimize conflicts:

1. `src/lib/motion.ts` — Verify/update animation presets (file already exists)
2. `src/app/globals.css` — Add new CSS classes (append only)
3. `src/shared/components/app-shell/CompanyContextSwitcher.tsx` — Fix Arabic font
4. `src/shared/components/app-shell/EnterpriseSidebar.tsx` — Add Framer Motion
5. `src/shared/components/app-shell/EnterpriseTopbar.tsx` — Add greeting + animations
6. `src/components/pipeline/PipelineBoard.tsx` — Add Framer Motion, fix locales
7. `src/app/dashboard/pipeline/loading.tsx` — Animated skeleton
8. `src/app/login/page.tsx` — Full redesign (keep loginAction)
9. `src/app/register/page.tsx` — Full redesign (keep registerAction)
10. `src/app/marketplace/page.tsx` — Hero + card animations
11. Audit layout consistency — preserve all `dir="rtl"` on page-level wrappers; do not remove Arabic strings

---

## QUALITY CHECKLIST (verify each before finishing)

- [ ] No TypeScript errors (`npx tsc --noEmit --skipLibCheck`)
- [ ] All existing server actions still exported and called correctly
- [ ] `loginAction` still called from login page with FormData
- [ ] `registerAction` still called from register page with FormData
- [ ] `onStageChange`, `onCreateDeal`, `onUpdateDeal`, `onAddActivity` still wired in PipelineBoard
- [ ] `createBrowserSupabaseClient()` realtime subscription still active in PipelineBoard
- [ ] CompanyContextSwitcher `selectActiveCompanyAction` still called on change
- [ ] All page-level wrappers preserve `dir="rtl"` — do not remove RTL direction from the system
- [ ] All Framer Motion imports from `'framer-motion'` (already in package.json `^12.38.0`)
- [ ] Cairo font applied to all Arabic text elements via CSS
- [ ] Mobile bottom nav still renders and navigates correctly
- [ ] Dark mode still works (`.dark` variants still apply)

---

## WHAT NOT TO CHANGE

- `src/shared/auth/` — authentication logic
- `src/shared/rbac/` — RBAC permissions
- `src/shared/supabase/` — database clients
- `src/app/api/` — API routes
- `src/app/auth/` — auth callbacks
- `src/app/dashboard/pipeline/actions.ts` — server actions
- `src/app/login/actions.ts` — login/register actions
- `src/lib/types/` — TypeScript types
- `src/utils/supabase/middleware.ts` — Supabase auth middleware
- `supabase/migrations/` — database schema
- Any `.env` or `.env.local` files
