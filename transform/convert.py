#!/usr/bin/env python3
"""
Offline: raw Notion block trees (data/raw_prelims.jsonl) -> clean HTML records
(data/prelims_structured.json). Tables become exact <table> with in-cell <br>,
lists become real <ul>/<ol>, nothing is dropped or mangled. No API calls.
"""
from __future__ import annotations
import json, os, re, html as H

ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
# An OPTION is a lowercase a-d with a CLOSING bracket — "(a) …", "a) …", even "{a)" (source typos).
# NOT "A." / "B." (uppercase + period = statement labels), nor "1." / "I." (numeric/roman).
OPT = re.compile(r'^\s*\**[\(\[\{]?\s*([a-d])\s*[\)\]\}]\s*\**\s*(.+\S)\s*$')
# For match-the-following: an option whose letter is the FIRST CELL of a table row
# (text may be empty in that cell, with the content in the remaining cells).
OPTCELL = re.compile(r'^\**[\(\[\{]?\s*([a-d])\s*[\)\]\}]\s*\**\s*(.*)$')

def options_from_table(tbl):
    """Extract (a)-(d) options from a table whose rows start with an option letter."""
    opts = {}
    for rw in tbl.get("_children", []):
        cells = ["".join(c.get("plain_text", "") for c in cell) for cell in rw.get("table_row", {}).get("cells", [])]
        if not cells:
            continue
        m = OPTCELL.match(cells[0].strip())
        if m and m.group(1) in "abcd" and m.group(1) not in opts:
            parts = [m.group(2).strip()] + [c.strip() for c in cells[1:]]
            opts[m.group(1)] = H.escape(" — ".join(x for x in parts if x))
    return opts

def rt(rich):
    out = []
    for t in rich or []:
        if t.get("type") == "equation":                       # inline LaTeX → KaTeX delimiters (raw)
            out.append(f"\\({t.get('equation', {}).get('expression', '')}\\)")
            continue
        s = H.escape(t.get("plain_text", "")).replace("\n", "<br>")
        a = t.get("annotations", {})
        if a.get("code"): s = f"<code>{s}</code>"
        if a.get("bold"): s = f"<strong>{s}</strong>"
        if a.get("italic"): s = f"<em>{s}</em>"
        out.append(s)
    return "".join(out)

def kids(b): return b.get("_children", []) or []
def plain(rich): return "".join(x.get("plain_text", "") for x in rich or [])

def to_html(blocks):
    out, i, n = [], 0, len(blocks)
    while i < n:
        b = blocks[i]; t = b.get("type"); data = b.get(t, {}); txt = rt(data.get("rich_text", []))
        if t in ("bulleted_list_item", "numbered_list_item"):
            tag = "ul" if t == "bulleted_list_item" else "ol"
            items = []
            while i < n and blocks[i].get("type") == t:
                bb = blocks[i]; ch = to_html(kids(bb)) if kids(bb) else ""
                items.append(f"<li>{rt(bb[bb['type']].get('rich_text', []))}{ch}</li>"); i += 1
            out.append(f"<{tag}>{''.join(items)}</{tag}>"); continue
        elif t == "paragraph":
            if txt: out.append(f"<p>{txt}</p>")
            if kids(b): out.append(to_html(kids(b)))      # paragraphs can have nested children
        elif t in ("heading_1", "heading_2", "heading_3"):
            out.append(f"<h4 class='ah'>{txt}</h4>")
            if kids(b): out.append(to_html(kids(b)))
        elif t == "table":
            rows = kids(b); hdr = data.get("has_column_header")
            trs = []
            for ri, rw in enumerate(rows):
                cells = rw.get("table_row", {}).get("cells", [])
                ct = "th" if (hdr and ri == 0) else "td"
                trs.append("<tr>" + "".join(f"<{ct}>{rt(c)}</{ct}>" for c in cells) + "</tr>")
            out.append(f"<table>{''.join(trs)}</table>")
        elif t in ("quote", "callout"):
            if txt: out.append(f"<blockquote>{txt}</blockquote>")
            if kids(b): out.append(to_html(kids(b)))
        elif t == "equation":                                 # block LaTeX → KaTeX display
            out.append(f"<div class='mathblock'>\\[{data.get('expression', '')}\\]</div>")
        elif t == "code":
            out.append(f"<pre><code>{H.escape(plain(data.get('rich_text', [])))}</code></pre>")
        elif t == "divider":
            out.append("<hr>")
        else:  # toggle, column_list, column, and anything else: render text + recurse
            if txt: out.append(f"<p>{txt}</p>")
            if kids(b): out.append(to_html(kids(b)))
        i += 1
    return "".join(out)

def prop(p, name, typ):
    x = p.get(name, {})
    if typ == "title": return plain(x.get("title", []))
    if typ == "number": return x.get("number")
    if typ == "select": return (x.get("select") or {}).get("name")
    if typ == "multi": return [o["name"] for o in x.get("multi_select", [])]

def is_ans_head(b):
    if b.get("type") not in ("heading_1", "heading_2", "heading_3"): return False
    h = plain(b[b["type"]].get("rich_text", [])).lower()
    return "correct answer" in h or "explanation" in h

def convert():
    out, no_opts = [], 0
    for line in open(os.path.join(ROOT, "raw_prelims.jsonl")):
        r = json.loads(line); p = r["properties"]; tree = r["tree"]
        tog = tree[0] if tree and tree[0]["type"] == "toggle" else None
        summ = plain(tog["toggle"].get("rich_text", [])) if tog else ""
        children = kids(tog) if tog else tree
        # options from the toggle summary
        opt_pairs, stem_lines = [], []
        for ln in summ.split("\n"):
            m = OPT.match(ln)
            if m and m.group(1).lower() in "abcd":
                opt_pairs.append((m.group(1).lower(), H.escape(m.group(2).strip())))
            else:
                stem_lines.append(ln)
        if len(opt_pairs) == 4:                        # 4 options → letter by POSITION (fixes (a)(b)(c)(c) typos)
            options = {k: opt_pairs[i][1] for i, k in enumerate("abcd")}
        else:                                          # otherwise keep labels (table-based handled below)
            options = {}
            for k, t in opt_pairs:
                options.setdefault(k, t)
        stem_text = "\n".join(stem_lines).strip()
        idx = next((k for k, b in enumerate(children) if is_ans_head(b)), 0)
        pre = [b for b in children[:idx] if b.get("type") != "divider"]
        post = children[idx:]
        # match-the-following: options live in a pre-answer table row → extract & don't double-show
        if len(options) < 4:
            for b in list(pre):
                if b.get("type") == "table":
                    topts = options_from_table(b)
                    if len(topts) >= 3:
                        options = topts; pre.remove(b); break
        stem_html = f"<p>{H.escape(stem_text).strip().replace(chr(10), '<br>')}</p>" + (to_html(pre) if pre else "")
        if not options: no_opts += 1
        out.append({
            "id": r["id"], "year": prop(p, "Year", "number"), "q_number": prop(p, "Question Number", "number"),
            "subject": (prop(p, "Tags", "multi") or [None])[0], "tags": prop(p, "Tags", "multi") or [],
            "correct_answer": (prop(p, "Correct Answer", "select") or "").lower() or None,
            "stem_html": stem_html,
            "options": [{"letter": k, "html": options[k]} for k in "abcd" if k in options],
            "analysis_html": to_html(post),
        })
    json.dump(out, open(os.path.join(ROOT, "prelims_structured.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"converted {len(out)} prelims records | {no_opts} with no options parsed")

if __name__ == "__main__":
    convert()
