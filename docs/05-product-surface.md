# Phase 1 — Free Product Surface (design)

**Scope:** the free, public product that is the lead magnet and the proof the paid system works. English-first, **i18n-ready** (so Hindi slots in later via a reviewed translation pipeline without re-architecting). No AI/generation here — this surface serves vetted human content only, so it ships with zero hallucination risk.

**Three surfaces + accounts:**
1. Prelims **Autopsy Explorer**
2. Mains **Framework Library** + **Lens Toolkit**
3. **Accounts + progress hooks** (free, but "paid-ready")

---

## 1. Prelims Autopsy Explorer

**Browse/search:** filter by year, subject, sub_topic, question_type, difficulty, frequency; full-text search. Mobile-first (aspirants study on phones).

**Per-question view — attempt-first progressive disclosure** (the signature interaction):
1. Show **stem + options only**. No answer visible yet.
2. Student selects an option → **Submit**.
3. Reveal **verdict** (right/wrong) + the **decision-rule** one-liner ("Persian Gulf country → must cross Hormuz") + concept-first explanation.
4. Expandable: **trap table** (why each option is right/wrong) → **supplementary tables** → **Key Takeaways** (always one tap away for revision-mode users).
5. **Related Concepts / Current Relevance** at the bottom.

Why attempt-first: the exam skill is *deciding under uncertainty*, not reading an answer key. (The "lead with the trap" framing is for marketing Shorts/carousels, not the on-platform default.)

**Two modes:** *Learn* (full disclosure) and *Revise* (collapse to stem → answer → Key Takeaways).

**Rendering:** Markdown bodies + tables; KaTeX for any math. Content served from the normalized `PrelimsQuestion` records (structured fields, not blobs).

---

## 2. Mains Framework Library + Lens Toolkit

**Framework Library:** browse by paper (GS1–4, Essay, Optional) → topic. Each framework page renders its 7-part sections and lists **applicable lenses** + the PYQs it can answer. Model answers browsable as exemplars (Intro → body clusters → Conclusion; GS4 case-study format).

**Lens Toolkit page:** the 14 lenses ([04-lens-toolkit.md](04-lens-toolkit.md)), with the 5 ⭐ "curveball" lenses highlighted. Each lens shows its trigger prompts, slots, and a worked example. This is the free teaser for the paid **drill**.

---

## 3. Accounts + progress hooks (free tier, paid-ready)

- Email / OAuth login.
- Persist **attempts** (`Attempt` schema), bookmarks, "mark for revision."
- Basic stats dashboard (attempted, accuracy by subject). 
- These write the same tables the **adaptive engine / error-DNA / drill** will later read — so Phase 1 quietly collects the data that powers the paid layer. **No re-migration later.**

**Free vs paid seam (built now, enforced later):** ALL content (autopsies, frameworks, lenses, model answers) is free. The *system* — generated mocks, adaptive ROI queue, error-DNA, the Mains deployment drill, projected-score — is the future paid tier. Build the UI with this seam so paid features bolt on.

---

## Tech (per plan)
- **Next.js (App Router)** + **Postgres** (load normalized JSON → tables) + auth.
- Content tables mirror the canonical schema; a thin loader imports `data/*.json`.
- **i18n-ready:** content fields keyed so a `lang` variant (Hindi) can be added later; UI strings externalized from day one.
- Brand: carry the demo's navy + gold identity (recognisable, already designed).

## Build order (once the pull + parser land)
1. Loader: normalized JSON → Postgres.
2. Prelims Explorer (browse + attempt-first question view) — the core, highest-traffic surface.
3. Mains Framework Library + Lens Toolkit pages.
4. Accounts + attempt persistence.
5. Polish, mobile, deploy → this is the lead magnet that opens the GTM funnel.

## Open (not blocking Phase 1 build)
- Auth provider choice; hosting (Vercel + managed Postgres is the low-friction default).
- Exact free/paid line wording for launch.
