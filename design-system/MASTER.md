# FAST INVESTMENT CRM — Design System MASTER

> Source of truth for all UI decisions. Page-specific overrides live in `pages/`.

---

## 1. Product Identity

| Attribute | Value |
|-----------|-------|
| Product | Real Estate Enterprise CRM |
| Style | Glassmorphism + Minimalism |
| Pattern | Sales Intelligence Dashboard |
| Audience | Arabic-speaking real estate professionals |
| Language | RTL (Arabic primary, English secondary) |

---

## 2. Color Palette

### Brand (Light Mode)
| Token | Hex | Usage |
|-------|-----|-------|
| `--fi-emerald` | `#27AE60` | Primary brand, CTAs, active nav |
| `--fi-emerald-2` | `#2ECC71` | Gradient end, hover states |
| `--fi-blue` | `#3498DB` | Info, secondary accent |
| `--fi-bg` | `#F7FAF8` | Page background |
| `--fi-paper` | `#FFFFFF` | Card surface |
| `--fi-soft` | `#EEF7F1` | Subtle fills, badges |
| `--fi-ink` | `#17202A` | Primary text |
| `--fi-muted` | `#667085` | Secondary text, placeholders |
| `--fi-line` | `#E4ECE7` | Borders, dividers |
| `--fi-danger` | `#E74C3C` | Errors, destructive |
| `--fi-warning` | `#F2C94C` | Warnings |
| `--fi-success` | `#2ECC71` | Success states |

### Brand (Dark Mode)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#00C27C` | Same brand green — never changes to gray |
| Background | `#0B1120` | Page background |
| Surface | `#111827` | Card background |
| Surface-2 | `#1E2D3D` | Elevated cards |
| Border | `rgba(255,255,255,0.08)` | Subtle dividers |
| Text | `#F1F5F9` | Primary text |
| Muted | `#94A3B8` | Secondary text |

### Sidebar (always dark)
- Background: `#0C1A2E`
- Active item: `bg-[#00C27C]/12 text-[#00C27C]`
- Inactive item: `text-white/45 hover:text-white/80`
- Active indicator: 3px right border `bg-[#00C27C]`

### Status Colors
| Status | Background | Text |
|--------|-----------|------|
| Fresh/New | `bg-blue-50 border-blue-100` | `text-blue-700` |
| Interested | `bg-purple-50` | `text-purple-700` |
| Negotiation | `bg-amber-50` | `text-amber-700` |
| Won/Contracted | `bg-emerald-50` | `text-emerald-700` |
| Lost/Cold | `bg-red-50` | `text-red-700` |

---

## 3. Typography

### Fonts
| Font | Variable | Usage |
|------|----------|-------|
| Cairo | `--font-cairo` | All Arabic text (primary) |
| Inter | `--font-inter` | English labels, numbers, code |
| Geist | `--font-sans` | Fallback |

### Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page title | `text-xl` / `text-2xl` | 700-800 | 1.3 |
| Section heading | `text-lg` | 700 | 1.4 |
| Card title | `text-sm` / `text-base` | 600-700 | 1.4 |
| Body text | `text-sm` (14px min) | 400-500 | 1.6 |
| Caption/label | `text-xs` | 500-600 | 1.5 |
| Stat numbers | `text-2xl` / `text-3xl` | 700-800 | 1.2 |

### Rules
- Minimum body text: 14px on desktop, 16px on mobile
- Numbers use `font-variant-numeric: tabular-nums` (`.fi-tabular`)
- Arabic numerals with `ar-EG` locale for user-facing numbers

---

## 4. Spacing & Layout

### Grid
- Dashboard: 12-column bento grid (`fi-bento-grid`)
- Cards: `rounded-2xl` (16px radius) for main cards, `rounded-xl` for inner elements
- Container: `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`

### Spacing Scale
```
4px  → fi-space-1 (tight: labels, icon gaps)
8px  → fi-space-2 (small: badge padding)
12px → fi-space-3 (medium: icon + text gap)
16px → fi-space-4 (default: card inner padding unit)
20px → fi-space-5
24px → fi-space-6 (card padding)
32px → fi-space-8 (section gap)
40px → fi-space-10 (section padding)
```

### Z-Index Scale
```
10  → sticky headers, dropdowns
20  → modals, dialogs
30  → notifications, toasts
50  → command palette, overlays
```

---

## 5. Elevation & Glass

### Card hierarchy
```css
/* Base card */
background: rgba(255,255,255,0.92);
border: 1px solid var(--fi-line);
border-radius: 16px;
box-shadow: 0 18px 50px rgba(23,32,42,0.08);

/* Glass overlay */
background: rgba(255,255,255,0.78);
backdrop-filter: blur(18px);
border: 1px solid var(--fi-line);

/* Elevated (modal, dropdown) */
box-shadow: 0 25px 60px rgba(23,32,42,0.15);
```

### Dark mode cards
```css
background: rgba(17,24,39,0.85);
border: 1px solid rgba(255,255,255,0.08);
backdrop-filter: blur(18px);
```

---

## 6. Interactive States

| State | Style |
|-------|-------|
| Hover card | `translateY(-2px)` + deeper shadow, 200ms |
| Active nav | `bg-[#00C27C]/12` + right border indicator |
| Button primary | `bg-gradient(#27AE60→#2ECC71)` + `shadow-emerald-200/50` |
| Focus ring | `ring-2 ring-emerald-400/40 outline-none` |
| Loading skeleton | `animate-pulse bg-slate-200 dark:bg-slate-700` |
| Disabled | `opacity-50 cursor-not-allowed` |

### Animation timing
- Micro-interactions: `150ms ease`
- Card hover: `200ms ease`
- Page transitions: `300ms ease`
- Skeleton pulse: `1.5s` cycle

---

## 7. Component Patterns

### KPI Cards (dashboard)
- Icon in colored rounded square (`rounded-xl w-10 h-10`)
- Large number (`text-3xl font-black fi-tabular`)
- Label below (`text-xs text-muted`)
- Trend badge (green ↑ / red ↓ with arrow)

### Data Tables
- Striped rows (alt `bg-slate-50/50 dark:bg-slate-800/30`)
- Sticky header
- Row hover: `hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10`
- Status badges: pill with colored dot
- Action column: icon buttons with tooltip

### Forms
- Label above input (always `<label>` with `for`)
- Error message directly below field
- Required indicator: red asterisk
- Focus ring: emerald

### Empty states
- Centered illustration (icon 48px)
- Heading + subtext
- Primary CTA button

---

## 8. Accessibility

- Minimum contrast: 4.5:1 (WCAG AA)
- Focus rings: always visible on keyboard navigation
- Touch targets: minimum 44×44px
- All images: `alt` attribute
- Icon-only buttons: `aria-label`
- Form inputs: `<label>` with `htmlFor`
- Reduced motion: `@media (prefers-reduced-motion)` respects all animations

---

## 9. Anti-Patterns (NEVER DO)

- Never use emoji as icons — use Lucide SVG icons
- Never use `oklch` gray as `--primary` in dark mode (breaks emerald brand)
- Never use `bg-white/10` for glass in light mode (too transparent)
- Never use `text-slate-400` for body text in light mode (insufficient contrast)
- Never use `scale` transforms that cause layout shift on hover
- Never omit `cursor-pointer` on clickable cards/elements
- Never nest fixed navbars without accounting for offset in content
- Never use inline `style` with hardcoded colors instead of CSS tokens

---

## 10. Stack-Specific Notes (Next.js App Router)

- Use Server Components for data fetching, Client Components only when needed
- `'use client'` only for: state, effects, event handlers, browser APIs
- Use `motion` from `framer-motion` for animations
- Chart library: `recharts` with `ResponsiveContainer`
- Icon set: `lucide-react` exclusively
- Font loading: `next/font/google` with `variable` CSS
- Image optimization: `next/image` with `WebP` format
