# Quickstart

Get the static UPSC-via-PYQs app running locally in under a minute. No build step, no `npm install` — just Python 3 and a browser.

## 1. Prerequisites
- **Python 3** (any recent 3.x). Check with `python3 --version`.
- A modern browser (Chrome, Firefox, Safari, Edge).

## 2. Clone & enter
```bash
git clone -b static_app git@github.com:thegameofupsc-debug/upscviapyqs.git
cd upscviapyqs/upscviapyqs_code
```

## 3. Run
```bash
python3 serve.py
```
This starts a no-cache static server on **port 8000**.

## 4. Open
Visit **http://localhost:8000/app/** (or `http://localhost:8000/app/index.html`).

You should see the home page with **Prelims / Mains / Optional** explorers, a **Frameworks** library, **Practice**, and a **Dashboard**. Progress is saved in your browser's `localStorage` (keys under `upsc:v1:*`) — no account or backend needed.

## What you get out of the box
| Area | Where |
|------|-------|
| Pages (HTML + inline JS) | `app/` |
| Content (normalized JSON) | `data/*.json` |
| Shared modules | `app/store.js`, `app/md.js`, `app/msel.*`, `app/ui.css` |
| Vendored KaTeX (math) | `app/vendor/katex/` |
| Local server | `serve.py` |

## Sanity-checking JS (no Node in this project)
JS is verified headlessly with **JavaScriptCore**:
```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
```
Slice a page's `<script>` body, wrap it in `new Function(...)` for a syntax check, then `eval` with DOM stubs to run functions over `data/*.json`.

## Next steps
- Read **`README.md`** for the full architecture, structure, and the planned monetization/Supabase backend.
- Backend scaffolding lives in `supabase/schema.sql` + `load_paid.py` (**parked** — not wired into the app yet).

> ⚠️ The `normalizer/` folder and `data/raw_*.jsonl` dumps are intentionally excluded (secrets + ~216 MB raw data). See `.gitignore`.
