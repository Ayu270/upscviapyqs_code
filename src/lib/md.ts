const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(t: string): string {
  let s = esc(t);
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+?)`/g, "<code>$1</code>");
  return s;
}

function renderList(items: any[]): string {
  let out = "";
  let i = 0;
  while (i < items.length) {
    const base = items[i].indent;
    const ordered = items[i].ordered;
    out += ordered ? "<ol>" : "<ul>";
    while (i < items.length && items[i].indent === base) {
      let li = "<li>" + inline(items[i].text);
      let j = i + 1;
      const kids = [];
      while (j < items.length && items[j].indent > base) {
        kids.push(items[j]);
        j++;
      }
      if (kids.length) li += renderList(kids);
      out += li + "</li>";
      i = j;
    }
    out += ordered ? "</ol>" : "</ul>";
  }
  return out;
}

export function mdToHtml(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  let html = "";
  let i = 0;
  let para: string[] = [];
  
  const flush = () => {
    if (para.length) {
      html += "<p>" + inline(para.join(" ")) + "</p>";
      para = [];
    }
  };

  const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const tableSep = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/;

  while (i < lines.length) {
    const ln = lines[i];
    const t = ln.trim();
    if (!t) {
      flush();
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flush();
      html += "<hr>";
      i++;
      continue;
    }
    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const lv = Math.min(h[1].length + 1, 4);
      html += "<h" + lv + ">" + inline(h[2].replace(/\s*#+\s*$/, "")) + "</h" + lv + ">";
      i++;
      continue;
    }
    if (t.indexOf("|") >= 0 && i + 1 < lines.length && tableSep.test(lines[i + 1])) {
      flush();
      const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
      const head = cells(t);
      html += "<table><thead><tr>" + head.map(c => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>";
      i += 2;
      while (i < lines.length && lines[i].indexOf("|") >= 0 && lines[i].trim()) {
        const r = cells(lines[i]);
        html += "<tr>" + r.map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>";
        i++;
      }
      html += "</tbody></table>";
      continue;
    }
    if (/^>\s?/.test(t)) {
      flush();
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      html += "<blockquote>" + inline(buf.join(" ")) + "</blockquote>";
      continue;
    }
    if (listRe.test(ln)) {
      flush();
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(listRe);
        if (!m) break;
        items.push({
          indent: m[1].replace(/\t/g, "  ").length,
          ordered: /\d/.test(m[2]),
          text: m[3]
        });
        i++;
      }
      html += renderList(items);
      continue;
    }
    const b = t.match(/^\*\*(.+?)\*\*[:：]?\s*$/);
    if (b) {
      flush();
      html += '<div class="mdsub">' + inline(b[1]) + "</div>";
      i++;
      continue;
    }
    para.push(t);
    flush();
    i++;
  }
  flush();
  return html;
}

export function splitBody(x: { body_md?: string; question_md?: string }) {
  const body = (x.body_md || "").replace(/\r\n?/g, "\n");
  const lines = body.split("\n");
  const first = lines.findIndex(l => l.trim() !== "");
  if (first < 0) return { stem: x.question_md || "(question)", ans: "" };
  const stem = lines[first].replace(/^[-*+]\s+/, "").trim();
  const ans = lines.slice(first + 1).join("\n").trim();
  return { stem: stem || x.question_md || "(question)", ans };
}

export function keyPoints(body: string): string[] {
  const lines = (body || "").replace(/\r\n?/g, "\n").split("\n");
  const pts: string[] = [];
  const seen: Record<string, number> = {};
  const skip = /^(introduction|body|conclusion|essay|topic breakdown|essay outline|core message|definition|quote|context|outline|answer)$/i;
  
  lines.forEach(l => {
    const m = l.match(/^\s*[-*+]?\s*\*\*([^*]{3,60})\*\*/);
    if (!m) return;
    const t = m[1].replace(/[:：]\s*$/, "").trim();
    if (!t || skip.test(t)) return;
    const k = t.toLowerCase();
    if (seen[k]) return;
    seen[k] = 1;
    pts.push(t);
  });
  return pts.slice(0, 10);
}

const _STOP: Record<string, number> = {
  the: 1, and: 1, of: 1, to: 1, in: 1, a: 1, for: 1, is: 1, on: 1, with: 1, as: 1, by: 1, an: 1, be: 1, or: 1,
  are: 1, at: 1, from: 1, that: 1, this: 1, its: 1, it: 1, their: 1, which: 1, not: 1, but: 1
};

export function coverage(text: string, points: string[]) {
  const u = (text || "").toLowerCase();
  return points.map(p => {
    const phrase = p.toLowerCase();
    if (u.indexOf(phrase) >= 0) return { point: p, hit: true };
    const words = phrase.split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !_STOP[w]);
    if (!words.length) return { point: p, hit: false };
    const hits = words.filter(w => u.indexOf(w) >= 0).length;
    return { point: p, hit: hits / words.length >= 0.6 };
  });
}
