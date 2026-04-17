# Marketplace Design System

## Brand Position

Fast Investment CRM marketplace is the public trust layer for EHAB & ESLAM TEAM. The interface must feel premium, clear, and operationally reliable for Egyptian buyers, sellers, developers, brokers, and internal approval teams.

## Color Palette

| Token | Hex | Use |
| --- | --- | --- |
| `market-ink` | `#102033` | Primary Arabic text, headings, navigation |
| `market-navy` | `#17375E` | Primary actions, header identity, active states |
| `market-teal` | `#0F8F83` | Trust cues, chat, verified state |
| `market-gold` | `#C9964A` | Featured ads, premium packages, highlights |
| `market-sand` | `#F5EFE4` | Warm hero and package backgrounds |
| `market-mist` | `#EEF6F5` | Filter surfaces and soft status panels |
| `market-rose` | `#B54747` | Rejection, destructive warnings |
| `market-slate` | `#64748B` | Secondary text and metadata |
| `market-line` | `#DDE6E4` | Borders and dividers |
| `market-paper` | `#FBFCFA` | Page background |

Avoid screens dominated by one hue. Use navy for structure, teal for confidence, gold for premium value, and sand/mist for warmth.

## Typography

The primary font is `Cairo` for all Arabic and English UI. Use tabular numerals for prices, points, counts, and financial summaries.

| Style | Size | Weight | Usage |
| --- | --- | --- | --- |
| Display | 44-56px | 800 | Public marketplace hero only |
| H1 | 32-40px | 800 | Page titles |
| H2 | 24-30px | 700 | Section titles |
| H3 | 18-22px | 700 | Cards and panels |
| Body | 15-16px | 500 | Core content |
| Meta | 12-14px | 600 | Badges, attributes, timestamps |

Line-height must stay generous for Arabic: 1.55 for body, 1.2-1.3 for headings. Do not use negative letter spacing.

## RTL And Arabic Rules

- `html` remains `lang="ar"` and `dir="rtl"`.
- Icons that imply flow must sit on the natural Arabic side: leading icons use `ms-*`, trailing icons use `me-*`.
- Currency format: `ج.م` after the value, with compact display allowed on cards: `2.5 مليون ج.م`.
- Phone numbers are never displayed on public property cards. Contact entry is always in-system chat.
- Arabic labels must be written as human product copy, not literal database labels.
- Keep controls touch-friendly on mobile: minimum 40px high for inputs and primary commands.

## UI Patterns

- Marketplace header: sticky, translucent white, brand lockup visible, login/signup for guests, profile/add-property for authenticated users.
- Search: one prominent search input, followed by segmented listing type and filter controls.
- Property card: image first, price second, then title, location, facts, seller trust, and chat/detail actions.
- Featured state: gold badge and subtle top border, never a loud full-card treatment.
- Verified seller/company: teal badge with shield/check icon.
- Empty/loading states: show actionable next steps, not decorative copy.
- Admin work queues: dense tables/cards with status chips, SLA counters, and clear approve/reject/assign actions.

## Conversion Rules

- Buyers should see approved listings without login.
- Chat requires login, but the CTA should explain that login protects both parties.
- Add Property appears only for authenticated users.
- Company premium offers should highlight featured slots and verified badge value.
- Approval status must be visible to the listing owner and internal teams, never to public buyers.

## Supabase Schema Contract

The marketplace requires these tables in `public` with RLS enabled:

- `ad_packages`: monetized plans for individuals and companies.
- `user_balances`: points wallet per authenticated user.
- `ads`: submitted property listings with `pending`, `approved`, `rejected`, `expired`, `sold`.
- `transactions`: payment and points ledger.
- `chat_messages`: in-system buyer/seller messages tied to an ad.
- `user_roles`: internal operational roles: `ad_approval`, `finance`, `customer_service`, `super_admin`.

Recommended additions for the next migration:

- Add `ads.listing_kind` with values `primary`, `resale`.
- Add `ads.seller_type` with values `individual`, `company`, `developer`, `broker`.
- Add `ads.compound_name`, `ads.city`, `ads.district`, `ads.delivery_status`.
- Add `ad_packages.points_included` and `ad_packages.verified_badge_included`.
- Add `transactions.provider_payload jsonb` for payment gateway reconciliation.
- Add `chat_messages.channel` with values `internal`, `whatsapp`.
- Add helper functions in a private schema for role checks to avoid recursive `user_roles` RLS policies.

## RLS Rules

- Public/anon can select only `ads.status = 'approved'` and active `ad_packages`.
- Authenticated owners can insert ads as `pending`, read their own ads, and update only editable listing fields while status is not approved.
- Ad approval team can select pending ads and update review fields/status.
- Finance team can select transactions and balances, but wallet mutation should be server-side only.
- Customer service can read chat threads assigned to support, but public users can read only messages where they are sender or receiver.
- Super admin role management should avoid policies that query the same table recursively.

This follows Supabase guidance that exposed `public` tables need RLS enabled and policies should specify target roles. Supabase also recommends explicit authenticated checks because `auth.uid()` is null for unauthenticated requests.
