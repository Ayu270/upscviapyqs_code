# Mains Lens Toolkit (v1)

The transferable "never-go-blank" lenses, extracted from the topic frameworks. Topic frameworks cover the *known* spectrum; **these lenses generate meaningful points on *any* question, including unseen curveballs.** Each maps to the `Lens` schema entity (name · kind · prompts · slots · applies_to).

> **Strategic finding (drives the product):** the frameworks' 6-part structure (Intro → Core → Analytical → Application → Evaluation → Conclusion) *already* trains lenses 1, 3, 8, 9, 10 implicitly. Lenses **5, 11, 12, 13, 14 are present but underused** — these are the highest-value additions to teach/drill explicitly, because they're exactly what rescues an aspirant on comparative/integrated/ethical/regional curveballs.

## The 14 lenses

| # | Lens | kind | Slots (point-buckets) | Best for |
|---|---|---|---|---|
| 1 | **Temporal Phases** | temporal | Phase→trigger→policy→achievement→challenge→legacy | GS1 history, GS3 economy, polity evolution |
| 2 | **Multi-dimensional Sweep** (PESTEL-I+A) | dimensional | Political·Economic·Social·Tech·Environmental·Institutional·Administrative | GS3 economy/sectors, GS1 geo/society |
| 3 | **Cause → Consequence → Way Forward** | structural | Trigger·response·intended·achieved·unintended·future | universal (esp. policy) |
| 4 | **Stakeholder Map & Differential Impact** | stakeholder | Govt·private·labour·consumers·rural·urban·marginalised·regional | GS2, GS3, GS1 society, GS4 |
| 5 | **Comparative (Model A vs B)** ⭐ | dimensional | Origin·features·merits·limits (×2)·India's choice & rationale | GS2 polity, GS3 model debates |
| 6 | **Internal Structure + External Context** | structural | Internal org·hierarchy·external pressures/opportunities·adaptation | GS1 civilisations, GS3 global integration |
| 7 | **Institutional Evolution & Design** | structural | Precedents·colonial·intl models·redesign·accountability·tensions | GS2 institutions, GS3 bodies |
| 8 | **Evaluative (Achievements vs Challenges vs Criticisms)** | evaluative | Objectives·achievements·unintended·structural challenges·criticisms·winners/losers·gaps | universal |
| 9 | **Context → Relevance Framing** | structural | Context·problem·definitions·scope·broader narrative·modern relevance | universal (intros) |
| 10 | **Application to Governance & Social Impact** | structural | Institution·instrument·agency·groups·long-term influence·legal basis·today | GS2 esp. |
| 11 | **Cross-cutting Integration** ⭐ | dimensional | Economic·social·political·cultural·environmental·tech + which drives which | GS1/GS2/GS3 integrated Qs |
| 12 | **Success vs Failure (Regional/Sectoral Variation)** ⭐ | evaluative | Success case·enablers·failure case·barriers·implementation gap·lessons | implementation/regional Qs |
| 13 | **Value-Ethics (Virtue vs Collective Welfare)** ⭐ | evaluative | Individual virtue·collective value·duty·right·dilemma·conseq/deont/virtue views·resolution | GS4 core; GS2/GS3 equity |
| 14 | **Forward-Looking Continuity (roots + path dependency)** ⭐ | temporal | Historical roots·continuities·shifts·emerging challenges·proposals·path deps·opportunities·constraints | "future of X" Qs |

⭐ = underused in current frameworks → **prioritise in the drill** (biggest curveball payoff).

## Prevalence (what's already trained vs new)
- **Heavily present:** 3, 9, 8, 1, 10 (the framework backbone).
- **Moderately present:** 2, 4, 7, 6.
- **Underused / mostly implicit:** 5, 11, 12, 13, 14 → the explicit-teaching opportunity.

## How each lens is used in the product
- **Lookup:** on a topic page, show "applicable lenses" so a student sees the angles.
- **Drill (paid headline):** show a question → student picks lenses + fills slots against a timer → reveal the model deployment. Weight drills toward the ⭐ underused lenses, since those are the ones that convert "blank page" into points on an unfamiliar question.
- **RAG assembly:** the lens `slots` seed the body clusters when generating a Mains answer (see [03-rag-engine.md](03-rag-engine.md) §2b).

## Next
- Author one canonical `example_md` per lens (the agent produced full worked examples for all 14 — they're the seed; founder to vet for exam-authenticity).
- Decide the **8–10 "core" lenses** to teach first (recommend: 3, 8, 9 as the spine + the five ⭐ as the differentiators).
