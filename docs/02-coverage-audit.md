# Coverage Audit — UPSCviaPYQs

**Purpose:** measure how much of the corpus already meets the canonical schema, so we know exactly what work remains. This is the directional map; the *precise* per-row completeness falls out of the normalizer (which parses every row against the schema).

## Methodology & caveats
- **Full-corpus shape** comes from the May-2025 HTML snapshot, which was *generated from this Notion data* — a valid proxy for corpus size/distribution.
- **Schema-quality sampling** used marker-string counting over the `Sample PYQs → Prelims` year pages and the Mains hubs. Marker counting is **directional, not exact** (variant headings, nested toggles inflate some counts).
- **Notion SQL query tool is unavailable** on the current plan, so exact DB row counts per year weren't pulled live — deferred to the normalizer.
- **Key structural finding:** the `Sample PYQs → Prelims` year-pages are a **curated ~15-Q/year sample (~700 total)**, NOT the full corpus. The full **~5,644** Prelims questions + autopsies live in the canonical **`UPSC Prelims PYQs`** database (row page-bodies). Audit/normalization must target the **database**, not the sample pages.

---

## Prelims

**Full corpus (HTML snapshot):** **5,644 questions, 1979–2025**; **4,904 have autopsies (~87%)**, **~740 bare (~13%)**. 11-subject spread (Geography 1138, Polity 942, Gen Science 783, Economy 655, Current Affairs 540, Modern History 491, Ecology 286, Ancient 220, Sci-Tech 210, Medieval 198, Culture 181).

**Autopsy schema quality (from the sample):**
- **Core layers (trap table + supplementary)** are solidly present in most mature years (≈1988–2000, 2006–2023 sample years at ~90–100%).
- **Genuine weak/bare pockets** flagged for backfill: **1982, 1983, 1987** (≈0% supplementary), **2003–2005** (trap/supplementary nearly absent), and the **pre-1985 zone** generally thinner.
- **Optional layers** (Key Takeaways, Related Concepts) are inconsistent across all eras — expected, since they're optional by the founder's own spec.

**Prelims work list:**
1. Normalize all ~5,644 DB rows → canonical schema (parse trap rows, statement verdicts, supplementary tables as structured fields).
2. Backfill the **~740 bare** + the weak pockets via the generation engine (reusing the schema-defining prompt), founder-reviewed.
3. Enrich metadata: `question_type`, `difficulty`, `frequency`, granular `sub_topic` (mostly derivable, reviewed).

---

## Mains

**Frameworks (the strategic asset):** strong — ~80–90% coverage on the big subjects (Polity ~156, Ethics ~127, Economy ~88 subtopics); no empty stubs found in sampling. This is the most product-ready Mains content.

**Per-PYQ model answers (directional, front-loaded to recent years):**

| Paper | Years with content | ~Answers | State |
|---|---|---|---|
| GS3 | 2020–2025 | ~139 | Strong |
| GS2 | 2021–2025 | ~108 | Good (2020 gap) |
| GS1 | recent years (e.g. 2024 full ~20) | partial | Not fully re-counted this pass |
| GS4 | 2024–2025 only | ~48 | **Thin — 2013–2023 gap** |
| Essay | 2024–2025 only | **~2** | **Severely sparse** |

> Hubs list year-pages back to 2013, but older pages appear largely **empty stubs** for GS2/GS4/Essay. Backfill for older years is a real task.

**Optional (Public Admin):** present across the full decade (2013–2025) for PubAd1 + PubAd2 (from earlier deep read), thinker/theory and constitutional/institutional answers.

**Mains work list:**
1. Frameworks → normalize to `Framework` schema; resolve subject-wise (canonical) vs syllabus-wise (index) so there's one store.
2. **Extract the Lens Toolkit** (transferable lenses) — highest-leverage addition.
3. Backfill model answers for **older years + GS4 + Essay** via generation, founder-reviewed.
4. Build the `BodyCluster` / case-study / essay / optional structured fields per the schema.

---

## Net assessment
- **Prelims** content is largely *there* (~87%) → mostly a **normalization + targeted backfill (~740) + metadata-enrichment** job.
- **Mains frameworks** are strong → **normalization + lens extraction**.
- **Mains model answers + essays** are the **biggest content gap** → significant **generation/backfill** for older years, GS4, and especially Essay.
- **Next build step:** the **normalizer** (read-only Notion → canonical JSON in the product store) — it doubles as the precise, per-row completeness audit.
