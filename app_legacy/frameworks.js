/* Reusable framework renderer for UPSCviaPYQs — self-contained & namespaced as window.FW so it
   can be dropped into any page (e.g. optional.html) without colliding with that page's own
   toggle()/card()/mdToHtml(). FW.mount(containerEl, nodes) renders each framework as a lazy,
   two-level accordion (framework → section → sub-section → text) using event delegation. */
(function (global) {
  const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function inline(t) {
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
    t = t.replace(/`([^`]+?)`/g, "<code>$1</code>");
    return t;
  }
  function renderList(items) {
    let out = "", i = 0;
    while (i < items.length) {
      const base = items[i].indent, ordered = items[i].ordered;
      out += ordered ? "<ol>" : "<ul>";
      while (i < items.length && items[i].indent === base) {
        let li = "<li>" + inline(items[i].text); let j = i + 1; const kids = [];
        while (j < items.length && items[j].indent > base) { kids.push(items[j]); j++; }
        if (kids.length) li += renderList(kids);
        out += li + "</li>"; i = j;
      }
      out += ordered ? "</ol>" : "</ul>";
    }
    return out;
  }
  function mdToHtml(md) {
    if (!md) return "";
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    let html = "", i = 0, para = [];
    const flush = () => { if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
    const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
    const tableSep = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/;
    while (i < lines.length) {
      const ln = lines[i], t = ln.trim();
      if (!t) { flush(); i++; continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flush(); html += "<hr>"; i++; continue; }
      let h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) { flush(); let lv = Math.min(h[1].length + 1, 4); html += "<h" + lv + ">" + inline(h[2].replace(/\s*#+\s*$/, "")) + "</h" + lv + ">"; i++; continue; }
      if (t.indexOf("|") >= 0 && i + 1 < lines.length && tableSep.test(lines[i + 1])) {
        flush();
        const cells = r => r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
        const head = cells(t);
        html += "<table><thead><tr>" + head.map(c => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>"; i += 2;
        while (i < lines.length && lines[i].indexOf("|") >= 0 && lines[i].trim()) { const r = cells(lines[i]); html += "<tr>" + r.map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>"; i++; }
        html += "</tbody></table>"; continue;
      }
      if (/^>\s?/.test(t)) { flush(); const buf = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; } html += "<blockquote>" + inline(buf.join(" ")) + "</blockquote>"; continue; }
      if (listRe.test(ln)) {
        flush(); const items = [];
        while (i < lines.length) { const m = lines[i].match(listRe); if (!m) break; items.push({ indent: m[1].replace(/\t/g, "  ").length, ordered: /\d/.test(m[2]), text: m[3] }); i++; }
        html += renderList(items); continue;
      }
      let b = t.match(/^\*\*(.+?)\*\*[:：]?\s*$/);
      if (b) { flush(); html += '<div class="mdsub">' + inline(b[1]) + "</div>"; i++; continue; }
      para.push(t); flush(); i++;
    }
    flush(); return html;
  }
  function renderMath(html) {
    if (!global.katex || !html || html.indexOf("\\") < 0) return html || "";
    return html
      .replace(/\\\[([\s\S]+?)\\\]/g, (m, e) => { try { return katex.renderToString(e, { displayMode: true, throwOnError: false }); } catch (_) { return m; } })
      .replace(/\\\(([\s\S]+?)\\\)/g, (m, e) => { try { return katex.renderToString(e, { displayMode: false, throwOnError: false }); } catch (_) { return m; } });
  }
  function splitSections(body) {
    const lines = (body || "").replace(/\r\n?/g, "\n").split("\n");
    const idx = []; for (let i = 0; i < lines.length; i++) if (/^[-*+]\s+\S/.test(lines[i])) idx.push(i);
    if (!idx.length) return [{ title: "", md: body }];
    const secs = [];
    if (idx[0] > 0) { const pre = lines.slice(0, idx[0]).join("\n").trim(); if (pre) secs.push({ title: "", md: pre, intro: true }); }
    for (let k = 0; k < idx.length; k++) { const s = idx[k], e = (k + 1 < idx.length) ? idx[k + 1] : lines.length; secs.push({ title: lines[s].replace(/^[-*+]\s+/, "").trim(), md: lines.slice(s + 1, e).join("\n") }); }
    return secs;
  }
  function splitSub(md) {
    if (!md || md.length < 2000) return null;
    const lines = md.replace(/\r\n?/g, "\n").split("\n"); const b2 = [], h3 = [];
    for (let i = 0; i < lines.length; i++) { if (/^\s{1,3}[-*+]\s+\S/.test(lines[i])) b2.push(i); else if (/^#{1,6}\s+\S/.test(lines[i])) h3.push(i); }
    const ok = (a, hi) => a.length >= 2 && a.length <= hi;
    const idx = ok(b2, 40) ? b2 : ok(h3, 40) ? h3 : ok(b2, 120) ? b2 : ok(h3, 120) ? h3 : null;
    if (!idx) return null;
    const subs = [];
    if (idx[0] > 0) { const pre = lines.slice(0, idx[0]).join("\n").trim(); if (pre) subs.push({ title: "", md: pre, intro: true }); }
    for (let k = 0; k < idx.length; k++) { const s = idx[k], e = (k + 1 < idx.length) ? idx[k + 1] : lines.length; subs.push({ title: lines[s].replace(/^\s*[-*+]\s+/, "").replace(/^#{1,6}\s+/, "").trim(), md: lines.slice(s + 1, e).join("\n") }); }
    return subs.filter(s => !s.intro).length >= 2 ? subs : null;
  }

  let SEQ = 0;
  function mount(container, nodes) {
    const MD = {};   // id → markdown (lazy render)
    const shell = (title, md, depth) => {
      const id = "fw" + (SEQ++); MD[id] = md;
      const k = depth === 0 ? "fwcard" : "fwsub";
      return '<div class="' + k + '" data-d="' + depth + '"><div class="' + k + '-h" data-t="' + id + '"><span class="fw-ar">▸</span><span class="fw-tt">' + inline(title) + '</span></div><div class="' + k + '-c" data-b="' + id + '"></div></div>';
    };
    container.innerHTML = (nodes || []).map(n => shell(n.title || "Framework", n.body_md || "", 0)).join("") || '<div class="fw-empty">No frameworks for this subject yet.</div>';
    container.onclick = e => {
      const h = e.target.closest("[data-t]"); if (!h || !container.contains(h)) return;
      const wrap = h.parentNode, id = h.getAttribute("data-t"), depth = +wrap.getAttribute("data-d");
      const open = wrap.classList.toggle("open"); if (!open) return;
      const body = wrap.querySelector('[data-b="' + id + '"]'); if (body.dataset.done) return; body.dataset.done = "1";
      const md = MD[id];
      const kids = depth === 0 ? splitSections(md) : depth === 1 ? splitSub(md) : null;
      if (kids) body.innerHTML = kids.map(k => k.intro ? '<div class="fw-intro">' + renderMath(mdToHtml(k.md)) + '</div>' : shell(k.title, k.md, depth + 1)).join("");
      else body.innerHTML = '<div class="fw-body">' + renderMath(mdToHtml(md)) + '</div>';
    };
  }
  global.FW = { mount, splitSections, splitSub, mdToHtml };
})(window);
