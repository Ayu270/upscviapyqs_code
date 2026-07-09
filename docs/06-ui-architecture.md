# 06 — Production UI Architecture (Material UI revamp)

**Goal:** evolve the current dependency-free static app into a production-grade **web application**
built on **Material UI**, aligned to UPSC aspirants, responsive across screen sizes (desktop +
mobile web), extensible into a comprehensive product, and able to scale to millions of read-heavy
users cheaply.

This is a **high-level design** — stack, UX, system architecture, scaling, migration. No LLD.

> **Current scope (decided): build a solid WEB APPLICATION only.** The web app is fully
> **responsive** and works well in mobile browsers — but a dedicated **mobile app (native *and*
> PWA) is out of scope for now** (deferred; see § 1A). Put all effort into an excellent desktop +
> mobile-web experience. Keep the data/API layer and logic decoupled from the UI so a mobile app
> stays possible later, but **do not build for it now**.

---

## 1. Recommended stack

| Layer | Choice | Why for this app |
|------|--------|------------------|
| Framework | **Next.js (App Router) + TypeScript** | Free content stays static/SEO (per project principle); SSG/ISR → CDN edge → scales to millions at ~zero origin cost. |
| UI | **MUI v6** + custom theme | Accessible Material components, large ecosystem for future modules. |
| Styling | **Pigment CSS (zero-runtime)** or Emotion | Removes style-in-JS cost on low-end phones. |
| Server state | **TanStack Query** | Caching, pagination, retries for paid/data fetches. |
| UI state | **Zustand** | Replaces ad-hoc `localStorage`; syncs to Supabase on login. |
| Auth/Data/Paid | **Supabase** (Postgres + RLS + Auth) | Already in plan (`supabase/schema.sql`); paid content gated server-side. |
| Payments | **Razorpay** | Already planned (UPI annual pass). |
| Content/Math | **KaTeX** + markdown/MDX | Reuse existing rendering; KaTeX already vendored. |
| Hosting/CDN | **Vercel** (or Cloudflare Pages) | Edge CDN, ISR, image optimization. |

> **Key decision:** Next.js (SEO-first, SSG/ISR) over a plain Vite SPA. A content app that
> depends on Google traffic and must scale cheaply needs server/static rendering, not a SPA.

---

## 1A. Mobile / native app — out of scope (deferred)

A dedicated mobile app is **not part of current scope**. Our mobile story for now is simply that the
**web app is responsive** and works well in mobile browsers.

When a real mobile app is justified later, the options are a WebView wrap (**Capacitor**) or a
**React Native / Expo** rebuild — note **MUI does not run in React Native**, so its components would
not carry over. To keep that future door cheap, keep **design tokens + data/API layer + domain
logic** decoupled from the MUI component layer (the **Primitives** layer in § 4). **Do not build for
native now.**

---

## 2. UX principles (audience: UPSC aspirants)

1. **Responsive, low-end-friendly** — full desktop experience + a great mobile-browser one; design down to 360px width. Target LCP < 2.5s on mid-tier mobile, < ~150KB initial JS/route.
2. **Distraction-free study** — content is the hero; reading-optimized typography for long autopsies, tables, math.
3. **Bilingual-ready (i18n)** — Hindi-medium is a large UPSC segment; build locale switching in from day one.
4. **Dark mode + adjustable text size** — long study sessions, eye comfort.
5. **Progress & motivation** — streaks, bookmarks, "revise", accuracy (already modeled in `store.js`).
6. **Accessibility (WCAG AA)** — mostly free via MUI.
7. **Trust → conversion** — generous free PYQs; contextual, non-naggy upgrade to the annual pass.

---

## 3. Information architecture

```
Public (SSG, SEO)         App (signed-in)            Admin (role-gated)
├─ /        landing       ├─ /dashboard  progress    ├─ /admin           overview
├─ /prelims explorer      ├─ /practice   quiz/mock    ├─ /admin/traffic   visitors, sources
├─ /mains   explorer      ├─ /bookmarks /revise       ├─ /admin/activity  attempts, sessions, DAU
├─ /optional explorer     ├─ /account /upgrade        ├─ /admin/content   popular Qs, weak topics
├─ /frameworks            └─ /search     related Qs   └─ /admin/users     cohorts, entitlements
├─ /q/[id]  question                │
├─ /pricing               Auth
└─ /signin  email sign-in / magic link
```

---

## 4. Frontend architecture (component layers)

```
Design tokens (theme.ts) — colors, type scale, spacing, dark mode
Primitives ............. MUI components, lightly wrapped
Patterns ............... QuestionCard, FacetFilter, AutopsyAccordion,
                         MathContent, ProgressRing, RelatedList
Features ............... PrelimsExplorer, PracticeSession, Dashboard
Routes (App Router) .... SSG public · client/SSR for app + paid
```

A wrapped **Patterns** layer is what makes the product "comprehensive over time": new modules
(current affairs, mock tests, notes) reuse vetted building blocks + one theme, staying consistent.

---

## 5. System architecture — scaling to millions

```
   Google / SEO ─────►  CDN / Edge (Vercel)        ◄── ~99% of traffic, cache hits
                        • SSG free content              → scales to millions
                        • ISR revalidation              cheaply
                        • asset/image cache
                              │ (only auth / paid / dynamic)
                        Next.js server / Edge fns
                          │                 │
                   Supabase                 Razorpay webhook
                   Postgres + RLS           → entitlement
                   Auth · pgvector
                   read replicas
```

**Why it scales:** free content is static → served from CDN edge (a million readers ≈ a million
cache hits, near-zero origin/DB load). Origin only handles auth, paid fetches, progress writes,
payments. RLS is the real, un-bypassable paid gate. ISR updates content without redeploys.

---

## 5A. Authentication & accounts (email sign-in)

**Requirement:** a `/signin` page with **email sign-in**, on top of **Supabase Auth**.

- **Anonymous-first.** The app is fully usable without logging in (progress stays in
  `localStorage`, `upsc:v1:*`). Sign-in is needed only for sync-across-devices and the paid tier.
- **Email method:** start with **magic link** (passwordless, no SMTP setup needed — per the
  README note). **Email OTP code** is an option once SMTP is configured. Add Google OAuth later.
- **On first sign-in:** migrate the device's `upsc:v1:*` progress into a Supabase `user_progress`
  row, then keep both in sync.
- **Roles:** `anonymous` → `user` → `paid` (has active entitlement) → `admin`. Role lives in a
  `profiles` table and a JWT claim; **RLS uses it server-side** (never trust the client).

```
/signin
┌──────────────────────────────────────┐
│        Sign in to UPSCviaPYQs         │
│  ┌────────────────────────────────┐  │
│  │ you@email.com                  │  │
│  └────────────────────────────────┘  │
│        [ Send magic link → ]          │
│  We'll email you a one-tap login link │
│  ─────────  or  ─────────             │
│  [ Continue with Google ]  (later)    │
│  No account? It's created on sign-in. │
└──────────────────────────────────────┘
```

---

## 5B. Admin console & analytics (admin login)

**Requirement:** an **admin login** (same email auth, but `role = admin`) and a role-gated
`/admin` console for the team to track **traffic, activity, and trends**.

- **Access:** gated server-side by the `admin` role (middleware + RLS). Admin routes are never
  shipped to non-admins; add an **audit log** of admin actions.
- **What it shows:**
  - **Traffic** — visitors, page views, sources (SEO/referral), devices, geography.
  - **Activity** — DAU/MAU, sessions, questions attempted, practice sets completed, streaks.
  - **Trends** — most-viewed questions/subjects, accuracy distribution, weak topics, free→paid
    conversion funnel, revenue (from Razorpay), refunds.
  - **Users** — cohorts, entitlements, recent sign-ups.
- **Recommended approach (hybrid):**
  - **Traffic & behavior** → a product-analytics tool (**Plausible** = lightweight/privacy-friendly,
    or **PostHog** = funnels + events). Cheap, scales, no custom pipeline.
  - **Learning / content / revenue trends** → a **custom MUI admin dashboard** (MUI X **DataGrid**
    + **Charts**) querying Postgres aggregates. Reuses the same theme/components.

```
/admin  (overview)
┌───────────────────────────────────────────────────────────┐
│ Admin · Overview        Today ▾   [ Export ]               │
├───────────────┬───────────────┬───────────────────────────┤
│ Visitors 12.4k│ DAU 3.1k      │ Conversion 2.4%            │
│ ▁▂▅▇▆▃ 7-day  │ ▂▃▅▆▇▇ 7-day  │ Revenue ₹1.2L (mo)         │
├───────────────┴───────────────┴───────────────────────────┤
│ Top questions      │ Weak topics       │ Traffic sources   │
│ 1. MPI (Economy)   │ Polity 58%        │ Google   71%      │
│ 2. …               │ Environment 61%   │ Direct   18%      │
└────────────────────┴───────────────────┴───────────────────┘
```

---

## 6. The data-loading problem (must fix for scale)

Today each page fetches a **monolithic JSON** (prelims ≈ 13.8 MB) and renders all rows. At scale
this is the #1 risk.

| Problem | Fix |
|---------|-----|
| 13.8 MB single fetch | Chunk at build time (per-segment + per-year); lazy-load; or paginate via Supabase. |
| All rows in DOM | Virtualized lists (~20 rows rendered). |
| Heavy autopsy up front | List shows stem; full autopsy loads on `/q/[id]`. |
| Re-downloads | CDN cache + long-lived HTTP cache headers. |
| Search across 1,400+ | pgvector (ties to RAG / related-questions, see `03-rag-engine.md`) or prebuilt static index. |

---

## 7. Related-questions (retrieval) — see `03-rag-engine.md`

Phase the "similar questions" feature: **(0)** metadata (subject/tag/year) → **(1)** precomputed
embedding neighbors shipped as static `related.json` (recommended; no runtime infra) → **(2)** live
pgvector once on the Supabase backend. The prototype demonstrates tier 0/1 UX.

---

## 8. Theming note

Avoid default Material (looks generic). Brand it: custom primary (deep indigo/teal — calm,
academic), serif for question stems + sans for UI, generous reading width, restrained elevation,
first-class dark mode. Define once in `theme.ts` so every future component inherits it.

---

## 9. Migration path (phased, low-risk)

1. **Foundations** — Next.js + MUI theme + tokens + primitives; chunk the data.
2. **Prelims Explorer first** — virtualized list, facets, `/q/[id]`, KaTeX (shipped behind a flag).
3. **Auth (email sign-in) + progress** — build `/signin` (Supabase magic link, § 5A); migrate `upsc:v1:*` localStorage → Supabase on login; keep anon local mode.
4. **Mains / Optional / Frameworks** — same patterns.
5. **Paid tier** — RLS + Razorpay + paywall UI.
6. **Comprehensive add-ons** — practice/mock tests, related-Qs (pgvector), current affairs, i18n (Hindi).
7. **Admin console & analytics** — role-gated `/admin` (§ 5B): wire a product-analytics tool for
   traffic, build the custom dashboard for learning/revenue trends.

---

## 10. Prototype

`prototype/index.html` — a self-contained, clickable MUI prototype of the **Prelims Explorer +
Question Detail/autopsy** (custom theme, dark mode, facets, search, related questions) running on a
real-content slice. It uses React + MUI via CDN purely for fast preview; production uses the
Next.js + MUI build above. Open it directly in a browser (double-click) to feel the direction.

---

## 11. Getting started — for a new contributor (intern-friendly)

> **Is this doc enough to start?** For *direction*, yes. Sections 1–10 are the "what and why" (HLD).
> This section is the concrete runway: setup, reference artifacts, and starter tasks with clear
> "done" criteria. A college intern comfortable with HTML/CSS/JS and basic React can start from here.
> Anything not yet specified (exact API shapes, pixel specs) is **intentionally deferred to LLD** —
> ask a maintainer when you reach it rather than guessing.

### Prerequisites / skills
- **Required:** HTML, CSS, JavaScript, basic **React** (components, props, state, hooks).
- **Learn-as-you-go:** TypeScript basics, **MUI**, **Next.js** App Router.
- **Free resources:** react.dev · mui.com/material-ui · nextjs.org/learn · typescriptlang.org/docs.

### Reference artifacts (read these first)
1. **`prototype/index.html`** — the visual + behavioral spec. Your components should look and behave
   like this (it's the source of truth for UX until designs exist).
2. **`data/README.md`** — the JSON shape your components consume (you'll build against **mock data**).
3. This doc §§ 2 (UX principles), 4 (component layers), 8 (theming).

### Local setup
1. Clone the **mock-data dev repo** (never the real data): `satyam-m/upscviapyqs-dev`.
2. Install **Node 20+** and **pnpm** (or npm).
3. Scaffold once (a maintainer may have already done this): `npx create-next-app@latest --ts`,
   then add MUI: `pnpm add @mui/material @emotion/react @emotion/styled @mui/icons-material`.
4. `pnpm dev` → http://localhost:3000. Use the JSON in `data/` as your data source for now.

### First milestones (good-first-tasks, in order)

| # | Task | Done when… |
|---|------|-----------|
| M1 | Project scaffold + theme | `theme.ts` with brand colors/fonts/dark-mode; app runs; ESLint/Prettier set up. |
| M2 | `QuestionCard` component | Renders year/subject/Q-number chips, stem, options, bookmark/revise icons (matches prototype). |
| M3 | Prelims list page | Reads mock `prelims_structured.json`, renders a list of `QuestionCard`s, shows the count. |
| M4 | Facet filters + search | Subject/Year filters + text search narrow the list; "clear all" works. |
| M5 | `/q/[id]` detail route | Stem, options, "Check answer", autopsy accordion, **KaTeX** math renders. |
| M6 | Dark mode + responsive | Toggle works; on mobile the filter rail becomes a drawer; no layout breakage. |
| M7 | `/signin` page (§ 5A) | Email field + "Send magic link" via Supabase; redirects on success. |

### Conventions
- TypeScript everywhere; one component per folder (`Component.tsx` + `index.ts`).
- Style via the **theme** + `sx` — no hard-coded colors/spacing.
- Mobile-first; check at 360px width. No console errors/warnings.
- **Never commit real data**; work only against the mock repo. Small PRs, descriptive titles.

### Definition of done (every task)
Responsive (360px→desktop) · keyboard-accessible · works on mock data · no console errors ·
matches the prototype's look/behavior · passes lint · reviewed via PR.

### Glossary
- **PYQ** — Previous Year Question. **Prelims/Mains/Optional** — UPSC exam stages.
- **Autopsy** — the detailed answer explanation for a question.
- **Facet** — a filter dimension (subject, year). **Virtualization** — rendering only visible rows.
- **SSG/ISR** — static generation / incremental revalidation (Next.js). **RLS** — Postgres
  row-level security (the server-side paid gate). **Entitlement** — a user's active paid access.
