# FAST INVESTMENT Enterprise Design System

## Brand Principles

FAST INVESTMENT is a premium real estate operating system for executives, brokers, clients, finance, ad approvals, and customer service teams. The interface should feel decisive, dense, and calm: executive-grade data first, progressive detail second, and no legacy team naming.

## Core Tokens

```css
:root {
  --fi-navy: #0A0E1A;
  --fi-navy-2: #10182A;
  --fi-navy-3: #172033;
  --fi-gold: #C9A84C;
  --fi-gold-2: #E5C96A;
  --fi-ink: #F8FAFC;
  --fi-muted: #9AA4B2;
  --fi-line: rgba(201, 168, 76, 0.22);
  --fi-glass: rgba(10, 14, 26, 0.76);
  --fi-card: rgba(16, 24, 42, 0.82);
  --fi-success: #18B26B;
  --fi-danger: #D94A4A;
  --fi-warning: #E5B454;
  --fi-info: #5CA7FF;
}
```

## Spacing Scale

| Token | Value | Usage |
| --- | --- | --- |
| `--fi-space-1` | `4px` | Micro gaps, icon offsets |
| `--fi-space-2` | `8px` | Inline control gaps |
| `--fi-space-3` | `12px` | Compact cards |
| `--fi-space-4` | `16px` | Default card padding |
| `--fi-space-5` | `20px` | Dashboard module padding |
| `--fi-space-6` | `24px` | Section spacing |
| `--fi-space-8` | `32px` | Page rhythm |
| `--fi-space-10` | `40px` | Executive hero panels |

## Radius, Borders, Shadows

- Cards and panels: `8px` radius.
- Icon buttons: `8px` radius.
- Modals and command palette: `8px` radius.
- Gold border: `1px solid var(--fi-line)`.
- Enterprise shadow: `0 24px 80px rgba(0, 0, 0, 0.28)`.
- Glass panel: `backdrop-filter: blur(18px)` with navy transparency.

## Typography

- Font: Cairo for Arabic and English dashboard UI.
- H1: `32px / 800`
- H2: `24px / 800`
- Card title: `14px / 800`
- Body: `14px / 600`
- Metadata: `12px / 700`
- Tabular numerals for KPIs, currency, conversion rates, and SLA counters.

## Layout Architecture

- All dashboards use RTL.
- App shell is a fixed glassmorphic sidebar plus sticky top command header.
- Dashboard content uses a 12-column bento grid on desktop and single-column stacking on mobile.
- Progressive disclosure uses compact “Details” links, collapsed filter areas, and small secondary metrics inside cards.

## Component Library

- `fi-shell`: master layout with sidebar and top header.
- `fi-sidebar`: role-filtered navigation.
- `fi-topbar`: command palette trigger, role badge, quick actions.
- `fi-bento-card`: standard dashboard module.
- `fi-kpi-card`: metric, delta, icon, trend.
- `fi-feed`: AI activity feed with severity/status accents.
- `fi-chart-panel`: Recharts container with consistent dark grid treatment.
- `fi-kanban-column`: sales pipeline swimlane.
- `fi-approval-row`: admin approval queue item with SLA.
- `fi-support-card`: customer support action panel.

## Role-Based Surfaces

- Client: marketplace profile, owned listings, support, notifications.
- Broker: leads, pipeline, inventory matches, commissions.
- Admin: executive KPIs, approvals, finance, support queues, audit.

## Motion

- Use Framer Motion for page/panel entrance, feed item appearance, and kanban/card movement.
- Timing: `0.18s` for micro interactions, `0.32s` for panel transitions.
- Easing: `[0.22, 1, 0.36, 1]`.
