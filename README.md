# UPSC via PYQs — static app (team handoff)

> ⚠️ **DEVELOPMENT REPO — MOCK DATA.** Every file under `data/` is **synthetic placeholder content** (look for the `[MOCK]` markers), generated only so the app renders and is safe to share. The **real question/content dataset is NOT in this repository** and is never committed here. Build and test against this mock data; the production data is integrated separately by the maintainers. See `data/README.md`.

A dependency-free static study web app for UPSC aspirants: **Prelims / Mains / Optional** explorers, a **Frameworks** library, **Practice**, and a **Dashboard**. No build step, no framework — just static HTML + inline JS + a few shared modules.

## Run locally
```bash
python3 serve.py        # → http://localhost:8000/app/   (no-cache headers, port 8000)
```
Open `http://localhost:8000/app/index.html`.

## Structure
- **`app/`** — all pages, each a self-contained HTML file with inline JS + its own markdown renderer + vendored KaTeX. `index.html` is the home page.
  - Shared modules: `store.js` (localStorage progress under `upsc:v1:*`), `md.js` (markdown helpers), `msel.css`/`msel.js` (multi-select faceted filters), `ui.css` (shared responsive chrome + clickable-logo + anti-copy).
- **`data/*.json`** — the content, normalized from Notion: `prelims_structured.json`, `mains.json`, `optional.json`, `frameworks.json`.
- **`serve.py`** — local static server.
- **`supabase/schema.sql`** + **`load_paid.py`** — **PARKED** backend scaffolding for the planned paywall (not wired into the app yet). See below.

## Verification convention (no Node in this project)
JS is sanity-checked headlessly with **JavaScriptCore** (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`): slice a page's `<script>` body, `new Function(...)` for syntax, and `eval` with DOM stubs to run functions over `data/*.json`.

## Planned monetization (to build — this is the task)
Single **All-Access annual pass: ₹999 + 18% GST** (founder price ₹599), **7-day refund**, **UPI via Razorpay**. Free tier = the **latest 2 exam years** per segment + **1 sample framework**; paid = the full archive.

**Intended architecture:**
- Keep **free** content **static** (fast, public, SEO).
- Move **paid** content into **Supabase Postgres behind Row-Level Security** — `supabase/schema.sql` defines `entitlements`, an `is_entitled()` check, paid content tables (`paid_prelims/mains/optional/frameworks`), and `orders`. RLS returns paid rows **only** to a logged-in user with an active entitlement (the real, un-bypassable lock).
- **Login** required only for paid users (magic-link works without custom SMTP; OTP-code needs SMTP).
- **Razorpay** Checkout → webhook → a Supabase **Edge Function** verifies the signature and writes the entitlement.
- `load_paid.py` loads `data/paid/*` into the paid tables (regenerate the free/paid split from `data/*.json`: free = each segment's latest 2 years; paid = the rest).

⚠️ **A static/client-side paywall is bypassable** — the server-side gate (RLS + auth + webhook) is the actual protection. Don't ship content gating that lives only in the browser.

## Not in this repo (intentionally excluded — see `.gitignore`)
- `normalizer/` — Notion-pull scripts **and secrets** (a Notion token). Not needed to build the backend.
- `data/raw_*.jsonl` — large raw Notion dumps (~216 MB). The cleaned `data/*.json` is what you need.
