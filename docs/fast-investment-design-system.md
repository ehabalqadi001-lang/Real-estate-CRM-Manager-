# FAST INVESTMENT Enterprise Design System

## Brand Direction

FAST INVESTMENT is a clean, calm, high-trust real estate operating system for clients, brokers, admins, finance, support, and ad approvals. The interface should feel lighter than a traditional CRM: generous whitespace, clear hierarchy, strong Arabic readability, and fast role-based workflows.

The visual benchmark is Nawy-inspired clarity, not imitation: soft surfaces, emerald actions, clean data cards, and mobile-first task completion.

## Tailwind v4 Token Strategy

The project uses Tailwind v4 through `@theme` in [globals.css](../src/app/globals.css), not a legacy `tailwind.config.js` token map. FAST INVESTMENT tokens are exposed as CSS variables and as Tailwind color aliases.

```css
:root {
  --fi-emerald: #27AE60;
  --fi-emerald-2: #2ECC71;
  --fi-blue: #3498DB;
  --fi-bg: #F7FAF8;
  --fi-paper: #FFFFFF;
  --fi-soft: #EEF7F1;
  --fi-ink: #17202A;
  --fi-muted: #667085;
  --fi-line: #E4ECE7;
  --fi-glass: rgba(255, 255, 255, 0.78);
  --fi-card: rgba(255, 255, 255, 0.92);
  --fi-success: #2ECC71;
  --fi-danger: #E74C3C;
  --fi-warning: #F2C94C;
  --fi-info: #3498DB;
  --fi-gradient-primary: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
  --fi-gradient-data: linear-gradient(90deg, #27AE60 0%, #3498DB 100%);
}
```

## Color Usage

| Token | Usage |
| --- | --- |
| `--fi-bg` | App background and dashboard canvas |
| `--fi-paper` | Sidebar, topbar, cards, modals |
| `--fi-soft` | Quiet selected states and pale panels |
| `--fi-emerald` | Primary buttons, active navigation, chart emphasis |
| `--fi-emerald-2` | Success states and gradients |
| `--fi-blue` | Secondary data accents |
| `--fi-ink` | Main text |
| `--fi-muted` | Metadata, captions, helper text |
| `--fi-line` | Borders and separators |

## Spacing Scale

| Token | Value | Usage |
| --- | --- | --- |
| `--fi-space-1` | `4px` | Icon offsets |
| `--fi-space-2` | `8px` | Inline controls |
| `--fi-space-3` | `12px` | Compact groups |
| `--fi-space-4` | `16px` | Default card padding |
| `--fi-space-5` | `20px` | Dashboard modules |
| `--fi-space-6` | `24px` | Page rhythm |
| `--fi-space-8` | `32px` | Section rhythm |
| `--fi-space-10` | `40px` | Desktop hero/dashboard bands |

## Radius, Borders, Shadows

- Cards, toolbars, controls: `8px` radius.
- Mobile bottom navigation: `8px` radius.
- Borders: `1px solid var(--fi-line)`.
- Soft card shadow: `0 18px 50px rgba(23, 32, 42, 0.08)`.
- Glass panel: `background: var(--fi-glass); backdrop-filter: blur(18px)`.

## Typography

- Cairo is mandatory for Arabic and primary UI.
- H1: `32px / 900`, mobile `24px / 900`.
- Section title: `18px / 900`.
- Card title: `14px / 900`.
- Body: `14px / 600`.
- Metadata: `12px / 700`.
- Use tabular numerals for KPIs, currency, conversion, and SLA counters.

## Layout Architecture

- Strict RTL across dashboard surfaces.
- Desktop app shell: fixed glassmorphic sidebar, sticky topbar, 12-column bento grid.
- Tablet and mobile: sidebar collapses into bottom navigation; content stacks into one column with touch-friendly controls.
- Cards avoid nested card structures; sections use unframed whitespace and cards only for repeated or actionable units.
- Progressive disclosure keeps advanced finance/filter controls behind compact action rows.

## Component Library

- `fi-shell-bg`: soft green-tinted app canvas.
- `fi-glass`: translucent white panels with blur.
- `fi-card`: white card with gentle border and shadow.
- `fi-bento-grid`: 12-column desktop grid, single-column mobile stack.
- `fi-primary-button`: emerald gradient command.
- `fi-bottom-nav`: mobile navigation surface.
- `fi-kpi-card`: metric, delta, icon, and next action.
- `fi-feed`: AI activity feed with subtle severity accents.
- `fi-chart-panel`: Recharts container with muted grid and emerald/blue accents.
- `fi-kanban-column`: touch-friendly pipeline column.
- `fi-support-card`: customer support action panel.

## Role-Based Surfaces

- Client: marketplace profile, owned listings, support, listing submission.
- Broker: leads, pipeline, inventory matching, commissions.
- Admin: executive KPIs, approvals, finance, support queues, audit.
- Finance: payouts, revenue, commissions, contract cashflow.
- Customer service: tickets, internal chat, SLA, client contact actions.

## Motion

- Framer Motion transitions should be subtle and functional.
- Micro interactions: `0.16s`.
- Panel entrance: `0.28s`.
- Kanban movement: spring-like but restrained.
- Easing: `[0.22, 1, 0.36, 1]`.

## Mobile Requirements

- Minimum touch target: `44px`.
- Dashboard KPIs stack into two-column or one-column grids depending on width.
- Charts remain horizontally safe and never overflow.
- Primary route access is available through bottom navigation.
- The multi-step listing form should use full-width controls, sticky progress context, and minimal visible fields per step.
