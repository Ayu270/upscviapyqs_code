#!/usr/bin/env python3
"""
Parse raw Prelims autopsies (data/prelims.json) into UI-ready records WITHOUT
losing any depth. We extract ONLY the stem + the four options (needed for the
attempt-first UI); EVERYTHING else (the full authored analysis — every section,
every supplementary table, statement-wise breakdowns) is preserved verbatim as
an ordered list of sections. Nothing is classified-away or dropped.

Writes data/prelims_structured.json + parse stats. Pure stdlib.
"""
from __future__ import annotations
import json, os, re
from collections import Counter

ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
SRC = os.path.join(ROOT, "prelims.json")
OUT = os.path.join(ROOT, "prelims_structured.json")

HEADER = re.compile(r'^\s*#{1,6}\s+(.+?)\s*$')
OPTION = re.compile(r'^[\s\->*]*\**\(?\s*([a-dA-D])\s*[\)\.]\s*\**\s*(.*\S)\s*$')

def strip_md(s: str) -> str:
    return s.replace("**", "").strip()

def clean_md(text: str) -> str:
    """Repair converter artifacts so marked.js renders faithfully:
    1) remove the stray toggle-base indentation, 2) rejoin table rows whose last
    cell wrapped onto the next line, 3) put blank lines around tables / hr so GFM
    tables parse and paragraphs don't get sucked into them."""
    if not text:
        return text
    lines = text.split("\n")
    # 1) dedent by the common (toggle-induced) leading indent
    nb = [len(l) - len(l.lstrip(" ")) for l in lines if l.strip()]
    base = min(nb) if nb else 0
    if base:
        lines = [l[base:] if len(l) >= base else "" for l in lines]
    # flatten stray indentation on non-list, non-table lines (indented paragraphs
    # otherwise render as code blocks at 4+ spaces or get absorbed into lists)
    is_list = lambda l: re.match(r'^\s*([-*+]|\d+[.)])\s', l)
    lines = [l if (is_list(l) or l.strip().startswith("|")) else l.lstrip(" ") for l in lines]
    # 2) rejoin rows whose cells wrapped onto following lines — INCLUDING Notion
    #    multi-line cells (blank-line-separated content inside one cell). The in-cell
    #    line breaks are preserved as <br> so the row stays one valid markdown line.
    merged, i = [], 0
    while i < len(lines):
        s = lines[i]
        if s.strip().startswith("|") and not s.strip().endswith("|"):
            parts, j = [s.strip()], i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if nxt.startswith("|"):          # a new row begins → stop, don't merge rows
                    break
                if nxt:
                    parts.append(nxt)
                j += 1
                if parts[-1].endswith("|"):      # row closed
                    break
            row = " <br> ".join(parts)
            if not row.endswith("|"):
                row += " |"
            merged.append(row); i = j
        else:
            merged.append(s); i += 1
    lines = merged
    # normalize stray bullet glyphs to markdown dashes
    lines = [re.sub(r'^(\s*)[•▪◦·●]\s+', r'\1- ', l) for l in lines]
    # 2b) rebuild every table block: equal column count + a valid separator row
    def split_cells(row):
        r = row.strip()
        if r.startswith("|"): r = r[1:]
        if r.endswith("|"): r = r[:-1]
        return [c.strip() for c in r.split("|")]
    is_sep = lambda cells: bool(cells) and all(re.fullmatch(r':?-{2,}:?', c.replace(" ", "")) for c in cells if c != "")
    rebuilt, i = [], 0
    while i < len(lines):
        if lines[i].strip().startswith("|"):
            blk = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                blk.append(lines[i]); i += 1
            rows = [split_cells(l) for l in blk]
            rows = [r for r in rows if not is_sep(r)]          # drop existing separators
            if rows:
                n = max(len(r) for r in rows)
                rows = [r + [""] * (n - len(r)) for r in rows]  # pad short rows
                rebuilt.append("| " + " | ".join(rows[0]) + " |")
                rebuilt.append("| " + " | ".join(["---"] * n) + " |")
                for r in rows[1:]:
                    rebuilt.append("| " + " | ".join(r) + " |")
        else:
            rebuilt.append(lines[i]); i += 1
    lines = rebuilt
    # 3) blank line at every block-type transition so GFM parses each block cleanly
    def btype(l):
        s = l.strip()
        if not s: return "blank"
        if s.startswith("|"): return "table"
        if s in ("---", "***", "___"): return "hr"
        if s.startswith("#"): return "heading"
        if is_list(l): return "list"
        return "para"
    out = []
    for l in lines:
        if l.strip():
            prevnb = next((x for x in reversed(out) if x.strip()), "")
            if prevnb and btype(prevnb) != btype(l) and out and out[-1].strip():
                out.append("")
        out.append(l)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()

def parse_body(body: str):
    lines = body.split("\n")
    # first markdown header marks the start of the analysis; everything before is stem+options
    first_h = next((i for i, ln in enumerate(lines)
                    if ln.lstrip().startswith("#") and HEADER.match(ln)), None)
    stem_block = "\n".join(lines[:first_h]) if first_h is not None else body
    rest_lines = lines[first_h:] if first_h is not None else []

    # --- options + stem from the stem block ---
    options, stem_lines = {}, []
    for ln in stem_block.split("\n"):
        m = OPTION.match(ln)
        if (m and m.group(1).lower() in "abcd" and len(ln) < 220
                and m.group(1).lower() not in options and not ln.lstrip().startswith("|")):
            options[m.group(1).lower()] = strip_md(m.group(2))
        else:
            stem_lines.append(ln)  # keep ALL non-option content (incl. tables after the options)
    stem = re.sub(r'\n{3,}', '\n\n', "\n".join(stem_lines)).strip()
    stem = clean_md(re.sub(r'^[-\s]+', '', stem).strip())

    # --- ALL analysis sections, in order, nothing dropped ---
    sections, cur_h, cur = [], None, []
    def flush():
        md = clean_md("\n".join(cur).strip().strip("-").strip())
        if cur_h or md:
            sections.append({"heading": cur_h, "md": md})
    for ln in rest_lines:
        m = HEADER.match(ln) if ln.lstrip().startswith("#") else None
        if m:
            flush(); cur_h = strip_md(m.group(1)); cur = []
        else:
            cur.append(ln)
    flush()
    # drop the bare "Correct Answer: (x)" echo section (the UI shows the verdict itself),
    # but keep "Explanation of the Correct Answer" and everything else.
    sections = [s for s in sections
                if not (s["heading"] and s["heading"].lower().startswith("correct answer")
                        and len(s["md"]) < 120)]
    return stem, options, sections

def main():
    data = json.load(open(SRC))
    out, stats = [], Counter()
    raw_chars = kept_chars = 0
    for r in data:
        stem, options, sections = parse_body(r.get("body_md", ""))
        rec = {
            "id": r["id"], "year": r.get("year"), "q_number": r.get("q_number"),
            "subject": (r.get("tags") or [None])[0], "tags": r.get("tags") or [],
            "correct_answer": r.get("correct_answer"),
            "stem_md": stem,
            "options": [{"letter": k, "text_md": options[k]} for k in "abcd" if k in options],
            "sections": sections,
            "source_url": r.get("source_url"),
        }
        out.append(rec)
        stats["total"] += 1
        stats[f"opts_{len(rec['options'])}"] += 1
        stats["n_sections"] += len(sections)
        raw_chars += len(r.get("body_md", ""))
        kept_chars += len(stem) + sum(len(o["text_md"]) for o in rec["options"]) \
                      + sum(len(s["md"]) + len(s["heading"] or "") for s in sections)
        if not stem: stats["empty_stem"] += 1
        if not rec["correct_answer"]: stats["no_answer"] += 1
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=2)

    n = stats["total"]
    print(f"Parsed {n} records → {os.path.basename(OUT)}")
    print(f"avg sections/question: {stats['n_sections']/n:.1f}")
    print(f"content preserved: {kept_chars:,} / {raw_chars:,} raw chars  ({round(100*kept_chars/raw_chars)}%)")
    print("options:", {k: stats[f'opts_{k}'] for k in range(5) if stats[f'opts_{k}']})
    print(f"empty stem: {stats['empty_stem']} | no answer: {stats['no_answer']}")
    # sample
    s = out[0]
    print(f"\nSAMPLE [{int(s['year'])} Q{s['q_number']}] — {len(s['sections'])} sections:")
    for sec in s["sections"]:
        print(f"  • {sec['heading']}  ({len(sec['md'])} chars)")

if __name__ == "__main__":
    main()
