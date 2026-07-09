# RAG Generation Engine — Spec

**Goal:** generate UPSC-grade content **from our own corpus** instead of hand-writing it — new Prelims MCQs (+ their autopsies), Mains answer assembly, and backfill of missing/old autopsies. Every output is **grounded in retrieved corpus records and cited**, and nothing reaches a student until **founder-reviewed** (`review_state = approved`).

Non-negotiable: the engine must never invent facts. Its job is to *recombine and reframe* vetted content, not to be a free-form LLM.

---

## 1. Retrieval base (what we index)

Source = the normalized canonical records (from the normalizer), **not** raw Notion.

| Corpus | Unit indexed | Key retrieval metadata |
|---|---|---|
| Prelims autopsies | per-question: stem, explanation, trap rows, supplementary tables, takeaways | subject, sub_topic, question_type, difficulty, frequency, year |
| Mains frameworks | per **section** of each framework (intro/components/…); also whole-framework | paper, topic, sub_topic |
| Lens Toolkit | per lens | kind, applies_to |
| Mains/Optional model answers | per answer (intro/body-clusters/conclusion) | paper, topic, year, answer_type |

**Store:** Postgres + **pgvector** (we're already on Postgres; no extra infra). Each chunk row: `{id, source_kind, source_id, text, metadata jsonb, embedding vector}`.

**Chunking:** semantic, by section (a trap table, a framework section, a body cluster = one chunk). Keep chunks self-labeled (prepend "Subject/Topic — Section") so retrieval is interpretable.

**Embeddings:** a dedicated embedding model (provider-flexible — e.g. Voyage / OpenAI / a local `bge`-class model). Claude has no embeddings endpoint; keep the embedder behind an interface so it's swappable. Re-embed on content change only (cheap, incremental).

**Retrieval = hybrid:** vector similarity **+** metadata filter (always constrain by subject/topic; optionally by question_type/difficulty/frequency). Hybrid keyword+vector beats pure vector for exam terminology.

---

## 2. Generation flows

Generation uses **Claude** (Opus 4.8 `claude-opus-4-8` for quality-critical generation; Haiku 4.5 `claude-haiku-4-5` for cheap classification/routing). Use **prompt caching** for the large, stable context (framework text, the schema-defining prompt).

### 2a. Prelims MCQ generation
1. Input: a target `{subject, sub_topic, question_type, difficulty}` (e.g. from the adaptive engine's "this student is weak here").
2. Retrieve top-k autopsies + supplementary tables for that sub_topic.
3. Generate a **new** MCQ of the requested `question_type`, drawing only on retrieved facts.
4. Auto-draft the autopsy for it using the **founder's own schema-defining prompt** as the system prompt (Correct Answer → Explanation → Why-each-wrong → Supplementary → optional Takeaways/Current Relevance). → emits a `PrelimsQuestion` with `provenance.state = ai_generated`.
5. Attach **citations**: the `source_id`s of every retrieved record used.

### 2b. Mains answer assembly
1. Input: any question (PYQ, generated, or current-affairs).
2. Classify → `{paper, topic}` (Haiku).
3. Retrieve the matching **framework(s)** + **applicable lenses** + 1–2 similar **model answers** (as style/depth exemplars).
4. Assemble an answer in the house skeleton — Intro → body clusters (seeded by framework sections + lens slots) → Conclusion; GS4 → case-study format. Word-limit aware.
5. Cite the frameworks/lenses used. `provenance.state = ai_generated`.

### 2c. Backfill (Prelims old/bare autopsies)
Same as 2a step 4 but the *question already exists* — retrieve sibling-topic autopsies for grounding, draft the missing layers, mark `ai_generated` → review queue. This is how we close the pre-2013 / bare-question gaps (if/when we ingest them) without hand-writing.

---

## 3. Grounding guardrails (the quality system)

1. **Retrieval-grounded prompting:** system prompt instructs "use ONLY the provided sources; if the sources don't support a needed fact, say so — do not fill from general knowledge."
2. **Coverage gate:** if top-k similarity < threshold or < N relevant chunks, **refuse/flag** rather than generate (prevents ungrounded output on thin topics).
3. **Mandatory citations:** every generated factual claim maps to a `source_id`; outputs without citations are auto-rejected.
4. **Self-check pass:** a second Claude call verifies each claim is supported by the cited chunk (cheap, catches drift).
5. **Founder-review gate:** all `ai_generated` records enter a review queue; only `review_state = approved` are servable/scoreable. This is enforced in the schema (§ canonical-schema `Provenance`).
6. **Provenance everywhere** so we can always audit what was machine-made.

---

## 4. Hallucination evaluation (gate before we trust it)

Before any generated content is shown to students at scale:
- Generate **N=100** items across subjects.
- Expert (founder) scores each on: (a) factual accuracy, (b) every claim traceable to a valid citation, (c) UPSC-authenticity (does it read like a real PYQ / topper answer).
- **Track hallucination rate**; set a launch threshold (e.g. < 2% unsupported claims) and don't ship generated content as "trusted" until met.
- Re-run this eval whenever the prompt or model changes. Log results in `docs/eval/`.

---

## 5. Architecture & build order

```
normalized JSON ──ingest──> pgvector chunks (embeddings + metadata)
                                   │
                 ┌─────────────────┴───────────────────┐
            retrieval svc                          (Claude API)
          (vector + filter)  ───context───>   generation svc
                                                   │
                                          generated record (+citations)
                                                   │
                                            self-check pass
                                                   │
                                          review queue (founder)
                                                   │
                                       approved → product DB (servable)
```

Build order: (1) ingest + pgvector + retrieval svc → (2) Mains assembly (lowest risk: recombines vetted frameworks) → (3) Prelims MCQ generation → (4) backfill. Mains-first because assembling from frameworks is far safer than fabricating MCQs.

---

## 6. Costs / notes
- **Prompt caching** the framework/system context cuts cost dramatically for repeated generation in a topic.
- Classification/routing on **Haiku**, generation on **Opus**; this keeps per-item cost low.
- The engine is **paid-tier infrastructure** (unlimited practice/mocks) — but also our **content-ops tool** (backfill). Same engine, two uses.
- Keep the embedder and the LLM behind interfaces; only the *grounding discipline* is fixed, not the vendor.
