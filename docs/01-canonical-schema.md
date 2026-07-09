# Canonical Schema — UPSCviaPYQs

Single source of truth for the product data model. Every piece of content from Notion normalizes into one of these entities. Field types are written DB-agnostic (map cleanly to Postgres columns / JSONB and to TypeScript types). `R` = required, `O` = optional.

Design rules:
- **Store layers as discrete fields, never one flattened markdown blob** (the HTML demo's mistake).
- **Required vs optional mirrors the founder's own schema-defining prompt.** Required fields define the quality floor; optional fields are enrichment.
- Long-form prose fields hold **Markdown** (tables, bold, lists preserved). Structured sub-parts (trap rows, statement verdicts, framework sections) are **arrays of objects**, not prose.
- Every content entity carries `provenance` so we always know if a field was human-written, normalized, or AI-generated (critical for the founder-review gate).

---

## 0. Shared enumerations

```
Exam            = "Prelims" | "Mains"
PrelimsSubject  = Modern History | Ancient History | Medieval History |
                  International Relations | Geography | Economy | Government Schemes |
                  Environment | Security | Science & Technology | Polity |
                  Culture | Miscellaneous            # from canonical UPSC Prelims PYQs DB
QuestionType    = Statement-based | Assertion-Reason | Match the Following |
                  Factual/Direct | Chronological Arrangement | Multiple Correct | Map-based
Difficulty      = Easy | Medium | Hard
Frequency       = High | Moderate | Low | One-time   # recurrence / ROI signal
OptionLetter    = a | b | c | d                       # normalize ALL to lowercase
MainsPaper      = Essay | GS1 | GS2 | GS3 | GS4 | Optional
ProvenanceState = human_written | normalized | ai_generated | ai_then_reviewed
ReviewState     = unreviewed | approved | flagged | rejected
```

```
Provenance {
  state:        ProvenanceState   R
  source_url:   string            O   # Notion page URL of origin
  generated_by: string            O   # model id, if ai_*
  reviewed_by:  string            O
  reviewed_at:  datetime          O
  review_state: ReviewState       R   default unreviewed
}
```

---

## 1. Prelims — Autopsy  (the atomic Prelims unit)

One row per MCQ. Required fields = the founder's spec ("Correct Answer, Explanation, Why-wrong, Supplementary Info"); the rest is enrichment.

```
PrelimsQuestion {
  id:               uuid            R
  year:             int             R    # 1979–2025
  q_number:         int             R
  paper:            "GS1" | "CSAT"  O    default GS1
  source_url:       string          O    # Notion origin

  # --- stem ---
  question_md:      markdown        R    # full stem, statements inline
  options:          Option[4]       R    # {letter: a|b|c|d, text_md}
  correct_answer:   OptionLetter    R

  # --- the 9 layers ---
  explanation_md:   markdown        R    # L3: concept-first "why correct"
  statement_verdicts: StatementVerdict[]  O   # L4: ONLY for statement/AR types — break out of trap table
  trap_table:       TrapRow[4]      R    # L5: one row per option, why right/wrong
  supplementary:    SuppTable[]     R    # L6: ≥1 lookup/comparison table
  decision_rule_md: markdown        O    # the reusable rule ("Persian Gulf → crosses Hormuz")
  key_takeaways_md: markdown        O    # L7: optional per founder spec
  current_relevance_md: markdown    O    # L8
  related_concepts_md:  markdown    O    # L9

  # --- classification metadata (enrichment; powers adaptive/diagnostics) ---
  subject:          PrelimsSubject  R
  sub_topic:        string          O    # granular tag
  question_type:    QuestionType    O    # also the trap-family key for error-DNA
  difficulty:       Difficulty      O
  frequency:        Frequency       O

  provenance:       Provenance      R
  completeness:     enum(full | core | bare)   R   # derived, see below
}

Option           { letter: OptionLetter; text_md: markdown }
StatementVerdict { label: string;  # "I", "Statement-II", etc.
                   verdict: "correct" | "incorrect";
                   reason_md: markdown }
TrapRow          { option: OptionLetter;
                   verdict: "correct" | "incorrect";
                   explanation_md: markdown }
SuppTable        { title: string; table_md: markdown }   # later: structured rows if needed
```

**Derived `completeness`:**
- `full`  = all required + (key_takeaways OR related_concepts) + current_relevance present.
- `core`  = all required present (stem, answer, explanation, trap_table, ≥1 supplementary).
- `bare`  = missing one or more required → needs normalization or generation (pre-1985 zone).

---

## 2. Mains — base + four variants

All Mains content shares a base, then specializes. `paper` + `mains_type` discriminate the variant.

```
MainsBase {
  id:            uuid         R
  year:          int          O    # null for evergreen frameworks/lenses
  paper:         MainsPaper    R
  mains_type:    "model_answer" | "essay" | "optional" | "framework"   R
  question_md:   markdown     O    # null for frameworks
  word_limit:    int          O    # 150 / 250 …
  topics:        string[]     R    # from canonical 26-topic taxonomy
  provenance:    Provenance   R
}
```

### 2a. Model Answer (GS1–4)
```
ModelAnswer extends MainsBase {
  answer_type:   "standard" | "case_study"   R
  # standard skeleton
  intro_md:      markdown    R
  body:          BodyCluster[]   R    # thematic clusters: {heading, points_md[]}
  conclusion_md: markdown    R
  # case_study extension (GS4)
  ethical_issues_md:   markdown   O   # required when answer_type=case_study
  options_md:          markdown   O
  course_of_action_md: markdown   O
}
BodyCluster { heading: string; points_md: markdown[] }
```

### 2b. Essay
```
Essay extends MainsBase {
  essay_kind:    "quote_based" | "thematic" | "case_study"   R
  intro_md:      markdown    R
  body:          BodyCluster[]   R
  conclusion_md: markdown    R
  thinkers:      string[]    O    # extracted → feeds a future Thinker/Quote bank
  examples:      string[]    O    # extracted → Example bank
  anchor_quote_md: markdown  O
}
```

### 2c. Optional — Public Administration
```
OptionalAnswer extends MainsBase {
  optional_subject: "Public Administration"   R
  paper_part:    "PubAd1" | "PubAd2"   R   # theory vs Indian admin/constitutional
  intro_md:      markdown    R
  body:          BodyCluster[]   R
  conclusion_md: markdown    R
  thinkers:      Thinker[]   O    # {name, year, work} — PubAd1 is thinker-centric
  constitutional_refs: string[]   O   # Articles etc. — PubAd2
  case_law:      string[]    O
}
Thinker { name: string; year: int?; work: string? }
```

### 2d. Framework  ⭐ (the strategic asset / RAG retrieval base)
```
Framework extends MainsBase {        # year = null
  title:         string      R
  subject_axis:  { paper: MainsPaper; topic: string; sub_topic: string? }   R   # canonical (subject-wise)
  syllabus_axis_tags: string[]   O   # exam-aligned view (syllabus-wise) = index, not a copy
  sections:      FrameworkSection[]   R    # the 7-part template, order preserved
  applicable_lenses: uuid[]  O    # links to Lens entities that fit this topic
  answers_pyqs:  uuid[]      O    # ModelAnswer ids this framework can generate
  coverage:      enum(full | partial | stub)   R   # derived from section completeness
}
FrameworkSection {
  kind: "intro" | "components" | "key_features" | "interconnections" |
        "significance" | "contemporary_relevance" | "conclusion" | "other"   R
  heading: string;  body_md: markdown
}
```

---

## 3. Lens Toolkit  (the "never go blank" engine for unseen questions)

Small, explicit, teachable set of transferable structures — extracted from what's currently implicit inside frameworks.

```
Lens {
  id:          uuid      R
  name:        string    R    # e.g. "PESTEL-I+A dimensions", "Stakeholder map", "Cause → Consequence → Way Forward"
  kind:        "dimensional" | "stakeholder" | "structural" | "temporal" | "evaluative"   R
  prompts_md:  markdown  R    # the trigger questions that generate points
  slots:       string[]  R    # the point-buckets (e.g. Social, Political, Economic, …)
  example_md:  markdown  O    # the lens applied to one sample question
  applies_to:  string[]  O    # paper/topic hints
}
```

---

## 4. Cross-cutting: user-progress hooks (defined now so content is "paid-ready")

Not content, but the schema must anticipate them so we never re-migrate:
```
Attempt        { user_id; question_id; chosen: OptionLetter; correct: bool; time_ms; created_at }
DrillRun       { user_id; framework_id?; question_id?; lenses_used: uuid[]; points_generated; score; created_at }
ReviewSchedule { user_id; entity_id; entity_kind; due_at; ease }   # spaced repetition
```
`question_type` (Prelims) and `kind` (Lens) are the join keys for **error-DNA** and the **adaptive ROI queue** — they must be populated during enrichment.

---

## Open mappings to confirm during the audit
- Confirm the canonical Prelims subject list is exactly the 13 above (vs the 9-subject taxonomy in the out-of-scope DB).
- Decide whether `supplementary` tables stay as Markdown or get structured rows (affects RAG retrieval granularity).
- Frameworks: lock that **subject-wise = canonical store, syllabus-wise = tag/index view** (no duplicate rows).
