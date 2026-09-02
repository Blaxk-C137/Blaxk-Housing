# BUK Housing Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Also REQUIRED for page tasks:** Read and follow the `frontend-design:frontend-design` skill before writing any page JSX — it contains the quality bar for visual work.

**Goal:** Restyle all 12 pages of the React app to the approved "warm & human" (Airbnb-inspired) design system without touching any application logic.

**Architecture:** Build a token layer (Tailwind config + fonts + base CSS) and a presentational UI component kit first, then redesign the app shell (Header/BottomNav/Footer), then each page. Pages keep their existing data flow (props, hooks, API calls) — only JSX structure and classNames change, plus new presentational components.

**Tech Stack:** React 18 (CRA/react-scripts 5), Tailwind CSS 2/3 (already configured via `tailwind.config.js` + `@tailwind` directives in `src/index.css`), lucide-react icons, framer-motion, @fontsource/plus-jakarta-sans (new dep).

**Spec:** `docs/superpowers/specs/2026-08-27-frontend-redesign-design.md`

## Global Constraints

- **No logic changes**: never modify `src/services/api.js`, `src/hooks/useListings.js`, `src/hooks/useAuth.js`, `src/context/*`, route paths in `App.js`, or any API call. Only classNames, JSX layout, and new presentational components in `src/components/ui/`.
- **Mobile-first**: write styles at 390px first, then `md:`/`lg:` breakpoints up to 1440px.
- **Colors** (use Tailwind tokens, never raw hex in JSX): `cream #FAF7F2`, `sand #F3EDE4`, `ink #1C1917`, `stone #78716C`, `line #EDE7DF`, `brand #C2593C`, `brand-dark #A84A30`, `brand-tint #F6E8E2`, `sage #5F7A61`, `amber #D97706`, `espresso #292524`.
- **Old blue `#1B4FD8` / `text-blue-600` / `bg-blue-50` must be fully replaced** by the token system — grep at the end of each page task to confirm.
- Icons: `lucide-react` only (already installed). No emoji in UI chrome.
- Every task ends with: dev server renders the page at 390px and 1440px with **zero console errors**, no horizontal scroll, no broken images → then commit.

## File Structure

```
frontend/src/
├── index.css                      # MODIFIED — font imports, base styles, utility classes
├── tailwind.config.js             # MODIFIED — color tokens, font family, shadows, radius
├── components/
│   ├── ui/
│   │   ├── Button.jsx             # CREATE
│   │   ├── Field.jsx              # CREATE — Input, Select, Textarea (one file, related)
│   │   ├── Badge.jsx              # CREATE — Badge + Chip
│   │   ├── Avatar.jsx             # CREATE
│   │   ├── Skeleton.jsx           # CREATE
│   │   ├── EmptyState.jsx         # CREATE
│   │   ├── Sheet.jsx              # CREATE — Modal that becomes bottom sheet on mobile
│   │   └── StatCard.jsx           # CREATE
│   ├── Header.js                  # MODIFIED (redesign)
│   ├── BottomNav.jsx              # MODIFIED (redesign)
│   ├── Footer.jsx                 # MODIFIED (redesign)
│   └── ListingCard.jsx            # MODIFIED (redesign)
└── pages/...                      # 12 pages MODIFIED in place, same file names
```

## Pre-flight (once, before Task 1)

- [ ] Backend running: `cd backend && ./venv/bin/python manage.py runserver 0.0.0.0:8000` (in background)
- [ ] Frontend running: `cd frontend && npm start` (in background) — CRA serves on :3000
- [ ] Verify `http://localhost:3000` loads and note any pre-existing console errors so we don't chase them later

---

### Task 1: Design tokens — Tailwind config, fonts, base CSS

**Files:**
- Modify: `frontend/tailwind.config.js` (full replace)
- Modify: `frontend/src/index.css` (full replace, keep tailwind directives)
- Create: nothing
- Install: `@fontsource/plus-jakarta-sans`

**Interfaces:**
- Produces (used by every later task): Tailwind color tokens `cream, sand, ink, stone, line, brand, brand-dark, brand-tint, sage, amber, espresso`; font family `font-sans` = Plus Jakarta Sans; shadow token `shadow-warm`; radius tokens `rounded-card` (16px), `rounded-hero` (24px); utility classes `.label-caps`, `.no-scrollbar`, `.page-pad` in index.css.

- [ ] **Step 1: Install the font**

```bash
cd frontend && npm install @fontsource/plus-jakarta-sans
```

- [ ] **Step 2: Write `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        sand: '#F3EDE4',
        ink: '#1C1917',
        stone: '#78716C',
        line: '#EDE7DF',
        brand: { DEFAULT: '#C2593C', dark: '#A84A30', tint: '#F6E8E2' },
        sage: '#5F7A61',
        amber: '#D97706',
        espresso: '#292524',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        hero: '24px',
      },
      boxShadow: {
        warm: '0 1px 2px rgba(28,25,23,0.05), 0 4px 16px rgba(28,25,23,0.06)',
        'warm-lg': '0 2px 4px rgba(28,25,23,0.06), 0 12px 32px rgba(28,25,23,0.10)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Write `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/plus-jakarta-sans/800.css';

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #FAF7F2;
  color: #1C1917;
  -webkit-font-smoothing: antialiased;
}

@layer utilities {
  .label-caps {
    @apply text-[11px] font-bold uppercase tracking-wider text-stone;
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .page-pad { @apply px-4 md:px-8 lg:px-12; }
  .safe-area-pb { padding-bottom: env(safe-area-inset-bottom, 0px); }
}
```

- [ ] **Step 4: Verify build + render**

```bash
cd frontend && npm run build
```
Expected: build succeeds. Then reload dev server — app still renders (old blue styles now unstyled in places is fine; tokens exist).

- [ ] **Step 5: Commit**

```bash
git add frontend/tailwind.config.js frontend/src/index.css frontend/package.json frontend/package-lock.json
git commit -m "feat(design): add warm token system, Plus Jakarta Sans, base styles"
```

---

### Task 2: UI primitives — Button, Field, Badge/Chip, Avatar, StatCard

**Files:**
- Create: `frontend/src/components/ui/Button.jsx`, `Field.jsx`, `Badge.jsx`, `Avatar.jsx`, `StatCard.jsx`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces:
  - `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg" loading={bool} fullWidth>` — renders `<button>` or `<a>`; all props pass through.
  - `<Input label error ... />`, `<Select label options={[{value,label}]} ... />`, `<Textarea label ... />` — controlled inputs with warm focus ring `focus:ring-brand/30 focus:border-brand`, label above, error text below in `text-brand`.
  - `<Badge tone="sage|brand|amber|stone" icon>` — small pill.
  - `<Chip active onClick>` — filter pill, active = `bg-brand-tint text-brand-dark border-brand/30`.
  - `<Avatar name src size>` — initials fallback `bg-brand-tint text-brand-dark`.
  - `<StatCard icon label value tone>`.

- [ ] **Step 1: Implement each component** with the exact class foundations:

Button primary: `bg-brand text-white hover:bg-brand-dark active:scale-[0.98] rounded-full font-semibold transition-all shadow-warm` — secondary: `bg-white text-ink border border-line hover:border-ink/30 rounded-full font-semibold` — ghost: `text-ink hover:bg-sand rounded-full font-medium`. Loading adds a lucide `Loader2` spinner and `disabled:opacity-60`.

Field wrapper: `w-full rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder:text-stone/60`.

- [ ] **Step 2: Verify** — `npm run build` passes; components import cleanly in a scratch page if needed.

- [ ] **Step 3: Commit** — `git commit -m "feat(ui): add Button, Field, Badge, Chip, Avatar, StatCard primitives"`

---

### Task 3: Feedback components — Skeleton, EmptyState, Sheet

**Files:**
- Create: `frontend/src/components/ui/Skeleton.jsx`, `EmptyState.jsx`, `Sheet.jsx`

**Interfaces:**
- Produces:
  - `<Skeleton className="h-4 w-full" />` — `animate-pulse rounded-lg bg-sand`.
  - `<EmptyState icon={Home} title="No listings yet" body="..." action={<Button>...</Button>} />` — centered, icon in `bg-brand-tint text-brand rounded-full w-16 h-16` circle.
  - `<Sheet open onClose title>` — on mobile (`<md`): fixed bottom sheet, `rounded-t-3xl`, drag-handle bar, slides up (framer-motion); on desktop: centered modal card. Dark backdrop `bg-ink/40 backdrop-blur-sm`.

- [ ] **Step 1: Implement** — Sheet must render via React portal to `document.body`, lock body scroll while open, close on backdrop click and Escape key.

- [ ] **Step 2: Verify build + commit** — `git commit -m "feat(ui): add Skeleton, EmptyState, Sheet components"`

---

### Task 4: App shell — Header, BottomNav, Footer

**Files:**
- Modify: `frontend/src/components/Header.js` (redesign in place)
- Modify: `frontend/src/components/BottomNav.jsx`
- Modify: `frontend/src/components/Footer.jsx`
- Modify: `frontend/src/App.js` — ONLY the two `bg-gray-50` divs (lines ~86 and ~93) → `bg-cream`, and the loading spinner `border-blue-600` → `border-brand`. Nothing else in App.js changes.

**Interfaces:**
- Consumes: Button, Avatar from Task 2.
- Produces: same component names/props as before (`<Header currentUser>`, `<BottomNav userRole>`, `<Footer />`) so App.js imports stay valid.

- [ ] **Step 1: Redesign Header** — sticky top, `bg-cream/80 backdrop-blur-md border-b border-line`; left: wordmark "BUK Housing" (`font-extrabold`, terracotta dot on "H"); center (desktop): pill search field `rounded-full border border-line bg-white px-4 py-2`; right: role-aware links + Avatar. Mobile: logo + notification bell + avatar.
- [ ] **Step 2: Redesign BottomNav** — keep existing nav arrays and routing logic exactly; restyle: `bg-white/95 backdrop-blur border-t border-line`; active item = `text-brand` with `bg-brand-tint rounded-full px-4` pill behind label; landlord special "+" button becomes `bg-brand` circle with `shadow-warm-lg` instead of blue.
- [ ] **Step 3: Redesign Footer** — `bg-espresso text-cream`: 4-column link grid (Explore, For Landlords, Support, Brand) collapsing to stacked on mobile, bottom bar with copyright. Links use `href="#"` placeholders (no router changes).
- [ ] **Step 4: Verify** — screenshot at 390px + 1440px with Playwright (any authed page for Header/BottomNav, landing for Footer); zero console errors.
- [ ] **Step 5: Commit** — `git commit -m "feat(shell): redesign Header, BottomNav, Footer with warm system"`

---

### Task 5: ListingCard redesign

**Files:**
- Modify: `frontend/src/components/ListingCard.jsx` (restyle both `grid` and `list` variants)

**Interfaces:**
- Consumes: tokens; lucide icons already imported.
- Produces: identical props signature `({ listing, savedListings, toggleSave, viewMode })` — callers unchanged.

- [ ] **Step 1: Restyle grid variant** — card: `bg-white rounded-card border border-line overflow-hidden hover:shadow-warm-lg transition-all`; image `h-48 sm:h-52 object-cover` with subtle `group-hover:scale-[1.03]`; heart button `w-9 h-9 bg-white/90 backdrop-blur rounded-full` with saved = `fill-brand text-brand`; price pill `absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-sm font-bold` with `/mo` in `text-stone text-xs`; title `font-bold text-ink truncate`, location `text-stone text-sm` with `MapPin`; chips: toilet `bg-sand text-ink`, water available `bg-sage/10 text-sage`, limited `bg-amber/10 text-amber`, unavailable `bg-brand/10 text-brand`, rating `bg-amber/10 text-amber` with filled star.
- [ ] **Step 2: Restyle list variant** — same tokens in horizontal layout.
- [ ] **Step 3: Verify** — browse page screenshots both breakpoints; heart toggle still works (click, confirm state change, no console errors).
- [ ] **Step 4: Commit** — `git commit -m "feat(ui): redesign ListingCard with warm tokens"`

---

### Task 6: LandingPage

**Files:**
- Modify: `frontend/src/pages/LandingPage/LandingPage.jsx` (redesign in place; ~233 lines)

**Interfaces:**
- Consumes: Button, Chip; existing data flow in the page unchanged.

- [ ] **Step 1: Implement sections in order** (read frontend-design skill first):
  1. **Hero** — full-bleed image (`https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80`) with `bg-ink/45` overlay, headline "Find your home at Bayero University" in `text-cream text-3xl md:text-5xl font-extrabold`, subline, white search card `-mt-12 md:-mt-16 rounded-hero shadow-warm-lg` overlapping the fold with location input + price select + CTA `bg-brand`.
  2. **Category chips** — horizontal-scroll rail of Chips: "All", "Self-contained", "Bills included", "Near campus", "Water available" — `no-scrollbar` scroll on mobile.
  3. **Featured listings** — heading row ("Featured homes" + "See all" link in `text-brand`), 2-col mobile / 4-col desktop grid of ListingCard.
  4. **Trust strip** — `bg-sand` band: three items with lucide icons (ShieldCheck "Verified landlords", MessageCircle "Message directly", Wallet "No agency fees").
  5. **How it works** — 3 numbered steps, numbers in `w-10 h-10 rounded-full bg-brand-tint text-brand-dark font-extrabold`.
  6. **CTA band** — `bg-espresso text-cream rounded-hero` card: "List your property" + Button.
  7. **Footer** (already redesigned in Task 4).
- [ ] **Step 2: Verify** — `/` at 390px and 1440px, screenshots, zero console errors, no horizontal overflow.
- [ ] **Step 3: Grep** — `grep -n "blue-" src/pages/LandingPage/LandingPage.jsx` returns nothing.
- [ ] **Step 4: Commit** — `git commit -m "feat(page): redesign LandingPage"`

---

### Task 7: AuthPage

**Files:**
- Modify: `frontend/src/pages/AuthPage/AuthPage.jsx` (~364 lines)

- [ ] **Step 1: Implement** — two-column layout (desktop): left panel `bg-espresso` with photo `opacity-80`, a short testimonial quote in `text-cream`, brand wordmark; right column form on `bg-cream`. Mobile: form only. Role selection = two big tappable cards (Student/Home icon, Landlord/Building2 icon), selected = `border-brand bg-brand-tint`. Fields use Task 2 `Input`/`Select`. Submit = `Button fullWidth loading`. Toggle signin/signup as underline link in `text-brand`.
  **Keep every state variable, handler, and API call exactly as-is** — swap markup only.
- [ ] **Step 2: Verify** — `/signin` both breakpoints; test wrong-password path shows existing error UI restyled (`bg-brand/10 text-brand-dark rounded-xl p-3`).
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign AuthPage"`

---

### Task 8: ListingsPage (student browse)

**Files:**
- Modify: `frontend/src/pages/ListingsPage/ListingsPage.jsx` (~538 lines)

- [ ] **Step 1: Implement** — page header with title `font-extrabold text-2xl md:text-3xl` + count in `text-stone`; sticky filter bar (`sticky top-16 z-30 bg-cream/90 backdrop-blur py-3`): Chip rail (toilet/lease/water quick filters) + "Filters" button opening the Task 3 `Sheet` on mobile / inline row on desktop, containing the existing price range + selects (same state, same handlers). Sort dropdown (Select). Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6`. While `listings` is empty/loading show 8 Skeleton cards (`Skeleton h-64 rounded-card`); when filter yields zero, show `EmptyState icon={SearchX} title="No homes match those filters" action={<Button onClick={reset}>Clear filters</Button>}` (reset = existing handler or `setFilters` defaults).
- [ ] **Step 2: Verify** — `/student-home` both breakpoints; open/close filter Sheet; toggle a Chip; heart a listing.
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign ListingsPage with chip filters and bottom sheet"`

---

### Task 9: ListingDetails

**Files:**
- Modify: `frontend/src/pages/ListingDetails/ListingDetails.jsx` (~448 lines)

- [ ] **Step 1: Implement** — mobile: swipeable photo gallery (`overflow-x-auto snap-x snap-mandatory flex` + `no-scrollbar`, dots indicator), title block `font-extrabold text-2xl`, price in `text-brand font-extrabold text-2xl` with `/month` in `text-stone`; amenities as icon grid (lucide: Droplet water, Bath toilet, Zap power, Wifi, Car parking — map from existing fields); landlord trust card `bg-sand rounded-card p-4` with Avatar + `ShieldCheck` verified badge in `text-sage` + "Verified landlord"; reviews list with Avatar, `fill-amber` stars. Desktop: gallery becomes 2/3 + sticky sidebar 1/3 (`lg:sticky lg:top-24`) containing the message/book Card. Mobile sticky bottom action bar above BottomNav (`fixed bottom-16 md:hidden bg-white border-t border-line p-3 flex gap-3`): price + "Message landlord" `Button`.
  Keep all existing handlers (save toggle, message send) wired exactly.
- [ ] **Step 2: Verify** — a real listing page (get an id from `/api/listings/`) at both breakpoints; swipe gallery; tap heart; sticky bar visible only on mobile.
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign ListingDetails with gallery and sticky action bar"`

---

### Task 10: StudentDashboard

**Files:**
- Modify: `frontend/src/pages/StudentDashboard/StudentDashboard.jsx` (~251 lines)

- [ ] **Step 1: Implement** — greeting header ("Hi, {name}" `font-extrabold text-2xl`); bento stat row: `StatCard` × 3 (Saved, Views on saved, Messages) in `grid-cols-3 gap-3`; saved listings grid of ListingCard (2-col desktop); EmptyState when none. Keep all data hooks.
- [ ] **Step 2: Verify + Commit** — `git commit -m "feat(page): redesign StudentDashboard"`

---

### Task 11: LandlordDashboard

**Files:**
- Modify: `frontend/src/pages/LandlordDashboard/LandlordDashboard.jsx` (~888 lines — the biggest; split visual sub-blocks into local section components inside the same file if it helps, but do not change data flow)

- [ ] **Step 1: Implement** — desktop: left sidebar `w-60 bg-espresso text-cream` (nav icons + labels, active = `bg-white/10 rounded-xl text-white`); content area on `bg-cream` with `page-pad`. Mobile: content full-width (BottomNav already provides navigation). Header row with "Add property" Button. Stat bento: 4 `StatCard`s (Listings, Total views, Rating, Messages) in `grid-cols-2 md:grid-cols-4`. Charts: keep existing chart logic, restyle containers `bg-white rounded-card border border-line p-4 md:p-6`. Listings management: desktop table (`bg-white rounded-card` rows with `border-b border-line last:border-0`), mobile cards — same data, two markups or responsive utilities. Replace all `text-blue-*`/`#1B4FD8` with tokens.
- [ ] **Step 2: Verify** — both breakpoints, screenshot sidebar + stats + table.
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign LandlordDashboard with sidebar layout"`

---

### Task 12: MessagesPage

**Files:**
- Modify: `frontend/src/pages/MessagesPage/MessagesPage.jsx` (~580 lines)

- [ ] **Step 1: Implement** — desktop ≥md: two-pane (`grid grid-cols-[320px_1fr]`): thread list `bg-white border-r border-line` (Avatar, name, last message preview, unread dot `bg-brand`), chat pane with header bar, messages: incoming `bg-sand text-ink rounded-2xl rounded-tl-sm`, outgoing `bg-brand text-white rounded-2xl rounded-tr-sm`. Mobile: single pane with back arrow (`ArrowLeft`) when a thread is open — pure conditional render on existing selected-thread state. Composer: `rounded-full border border-line bg-white` + send button `bg-brand rounded-full w-10 h-10` (lucide Send). Keep polling/fetch logic untouched.
- [ ] **Step 2: Verify** — send a message end-to-end on mobile width; check it appears.
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign MessagesPage two-pane layout"`

---

### Task 13: ListPropertyForm

**Files:**
- Modify: `frontend/src/pages/ListPropertyForm/ListPropertyForm.jsx` (~424 lines)

- [ ] **Step 1: Implement** — convert to 3-step wizard (Details → Photos & amenities → Pricing) using existing form state: progress indicator = 3 circles connected by lines, done steps `bg-brand text-white`, current `border-brand text-brand`, upcoming `border-line text-stone`; step content in `bg-white rounded-card border border-line p-5 md:p-8`; photo upload restyled as dashed dropzone `border-2 border-dashed border-line rounded-card hover:border-brand hover:bg-brand-tint/40` with existing file input logic and thumbnail previews `rounded-xl object-cover` + remove button; validation errors inline under fields in `text-brand text-xs`. Back/Next buttons (Next validates current step using existing validation logic). Final step submits via existing submit handler.
- [ ] **Step 2: Verify** — walk all 3 steps on mobile, submit a test listing, confirm it appears in `/api/listings/`.
- [ ] **Step 3: Commit** — `git commit -m "feat(page): redesign ListPropertyForm as wizard"`

---

### Task 14: AccountPage

**Files:**
- Modify: `frontend/src/pages/AccountPage/AccountPage.jsx` (~153 lines)

- [ ] **Step 1: Implement** — profile card (`Avatar lg` + name/email + "Edit profile" ghost Button); grouped settings cards: Profile, Notifications, Security, Danger zone (Sign out `Button variant="danger"` red-toned). `bg-white rounded-card border border-line divide-y divide-line` rows with lucide chevron.
- [ ] **Step 2: Verify + Commit** — `git commit -m "feat(page): redesign AccountPage"`

---

### Task 15: Final sweep and full verification

**Files:**
- Modify: any stragglers found by grep

- [ ] **Step 1: Grep for old styling** — `grep -rn "blue-\|#1B4FD8\|bg-gray-50\|gray-100\|gray-800\|gray-900" frontend/src --include="*.jsx" --include="*.js" | grep -v node_modules` → fix every hit that's a color (gray-* used as text-ink/stone/bg-cream/line equivalents).
- [ ] **Step 2: Full build** — `cd frontend && npm run build` → succeeds.
- [ ] **Step 3: Full smoke test** at 390px AND 1440px with Playwright, console clean on each: landing → signin (login with a real account) → browse → open a listing → message landlord → student dashboard → post-property wizard → account → landlord dashboard → messages. Screenshots saved for the user.
- [ ] **Step 4: Commit** — `git commit -m "feat(design): complete warm redesign of all pages"`

## Self-Review (done — notes)

- Spec coverage: palette/type/shape (T1), all 12 core components (T2–T3), nav (T4), all 12 pages (T5–T14), verification (per-task + T15), rollout order preserved. Student/Landlord landing pages are covered by spec item 10 — they redirect to dashboards per `App.js:183-186`, so no separate task needed.
- No placeholders: every task names files, exact classes, and verification commands.
- Interface consistency: ListingCard props unchanged (T5 ↔ T8–T10); Header/BottomNav/Footer props unchanged (T4); Sheet/Button/Input names consistent across T6–T14.
