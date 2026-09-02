# BUK Housing Frontend Redesign — Design Spec

**Date:** 2026-08-27
**Status:** Approved by user
**Scope:** Full visual redesign of all 12 pages, system-first, mobile-first.

## Goal

Rewrite the frontend's visual layer to a "warm & human" (Airbnb-inspired) aesthetic —
cream canvas, terracotta brand accent, rounded cards, real webfonts — replacing the
current generic look. All application logic (API calls, routing, auth, state) stays
untouched. UX improvements (loading skeletons, empty states, bottom sheets, inline
validation) are in scope; behavior changes are not.

## Non-goals

- No changes to `services/api.js`, `hooks/useListings.js`, backend, or route structure.
- No new features that require new API endpoints.
- No migration off CRA or Tailwind.

## Design System

### Palette

| Token | Value | Use |
|---|---|---|
| `cream` | `#FAF7F2` | Page canvas |
| `sand` | `#F3EDE4` | Subtle section backgrounds |
| `ink` | `#1C1917` | Primary text (warm black) |
| `stone` | `#78716C` | Secondary text |
| `line` | `#EDE7DF` | 1px borders |
| `brand` | `#C2593C` | Terracotta — primary actions, links, active states |
| `brand-dark` | `#A84A30` | Hover/pressed |
| `brand-tint` | `#F6E8E2` | Chips, highlights, selected states |
| `sage` | `#5F7A61` | Verified / success badges |
| `amber` | `#D97706` | Ratings, warnings |
| `espresso` | `#292524` | Footer, dashboard sidebar dark surfaces |

### Typography

Plus Jakarta Sans via Fontsource (`@fontsource/plus-jakarta-sans`, weights 400–800).
- Display: 40/32/24px, weight 700–800, tracking tight
- Body: 15/14px, weight 400–500
- Labels: 12/11px, uppercase, letter-spacing wide

### Shape & depth

- Card radius 16px, hero/feature cards 24px, pills 999px
- Soft warm shadows: `0 1px 2px rgba(28,25,23,.05), 0 4px 16px rgba(28,25,23,.06)`
- 1px `line` borders instead of shadows where possible

### Core components (`src/components/ui/`)

Button (primary/secondary/ghost + loading), Input, Select, Textarea, Chip,
ListingCard, Skeleton, EmptyState, Modal (bottom-sheet on mobile), Toast, Avatar,
Badge, StatCard, Tabs. All purely presentational, taking props — no API calls inside
UI components.

## Navigation

- **Mobile:** bottom nav (Home · Search · Messages · Saved · Profile) with active
  terracotta pill; sticky translucent blur header.
- **Desktop:** slim top bar — logo left, search center, auth right. Role-aware:
  landlords see Dashboard, students see Saved.
- **Footer:** espresso background, cream text.

## Page treatments

1. **Landing** — full-bleed hero photo, overlapping search card, category chips,
   featured listings rail, verified-landlord trust strip, 3-step how-it-works.
2. **Auth** — split screen (photo/testimonial panel + form), segmented
   Student/Landlord toggle, inline validation.
3. **Listings browse** — sticky filter pill bar, bottom-sheet filter drawer on
   mobile, skeleton loading, sort dropdown, empty state.
4. **Listing details** — swipeable photo gallery, sticky mobile book/message bar,
   amenity icon grid, landlord trust card, reviews.
5. **Student dashboard** — bento stat cards, saved listings grid.
6. **Landlord dashboard** — sidebar (desktop) / bottom tabs (mobile), stat bento,
   cleaner charts, listings table→cards on mobile.
7. **Messages** — two-pane desktop, drill-in mobile, brand-colored chat bubbles.
8. **List property** — multi-step wizard with progress, photo dropzone previews,
   inline validation.
9. **Account** — grouped settings cards, avatar upload.
10. **Student/Landlord landings** — role-specific hero + quick actions, same system.

## Constraints honored

- Logic intact: only className/JSX/layout changes + new presentational components.
- Mobile-first (390px), desktop (1440px) second.
- Small UX fixes allowed if behavior-neutral.
- UX-improving components (skeletons, empty states, toasts, bottom sheets) welcome.

## Verification

- Every page screenshotted in the running app via Playwright at 390px and 1440px.
- No console errors, no broken images, no horizontal overflow.
- Smoke test: login → browse → listing details → messages after each page batch.
- `npm run build` must pass.

## Rollout order

1. Design system foundation (tailwind config, fonts, UI components)
2. Shell: Header, BottomNav, Footer
3. Landing → Auth → Listings browse → Listing details
4. Dashboards → Messages → List property → Account
