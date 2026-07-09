# data/ — MOCK dataset (development only)

All `*.json` files in this folder are **synthetic placeholder data**, not real content.
Records are marked with `[MOCK]` and use obviously fake IDs (`*-mock-NNNN-*`) and
`https://example.com/mock` source URLs.

**Purpose:** let contributors run, render, and develop the app without access to the
production dataset. The real question/framework content lives only in the maintainers'
private source repo and is integrated at deploy time — it is **never** committed here.

The files match the production **schema** exactly, so code written against this mock data
works unchanged against real data:

| File | Shape | Used by |
|------|-------|---------|
| `prelims_structured.json` | list of `{id, year, q_number, subject, tags, correct_answer, stem_html, options[], analysis_html}` | `prelims.html`, `dashboard.html`, `practice.html` |
| `prelims.json` | legacy flat prelims schema | (parity only) |
| `mains.json` | list of `{id, year, q_number, question_md, paper, optional_subject, topics[], word_limit, body_md, has_answer, source_url}` | `mains.html`, `dashboard.html`, `practice.html` |
| `optional.json` | same shape as mains, with `optional_subject` set | `optional.html`, `dashboard.html`, `practice.html` |
| `frameworks.json` | list of `{id, title, path, axis, body_md}` | `frameworks.html`, `optional.html` |
| `*_sample15.json` | first 15 records of the matching file | samples |
| `notes_tree.json` | nested `{id, title, type, content_blocks, children[]}` | misc |

Regenerating/extending the mock data is fine — just keep the keys identical to the table above.
