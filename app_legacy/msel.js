/* Multi-select dropdown component (dependent/faceted) for UPSCviaPYQs.
   API:
     MSel.create(mountId, {key, label})        – turn a <div id=mountId> into a dropdown
     MSel.setOptions(key, opts)                – opts: ["a","b"] or [{v,l}] ; preserves current selection
     MSel.values(key) -> [v,...]               – selected values
     MSel.set(key, [v,...])                     – set selection (deep-link)
     MSel.onChange(fn)                          – global callback(key) fired on any change
   Options can be plain strings (value===label) or {v,l} objects. */
(function (global) {
  const reg = {}; let openKey = null, onChangeFn = null;
  const esc = s => (s + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function close() { if (openKey && reg[openKey]) { reg[openKey].panel.style.display = "none"; reg[openKey].root.classList.remove("open"); } openKey = null; }
  document.addEventListener("click", e => { if (openKey && reg[openKey] && !reg[openKey].root.contains(e.target)) close(); });
  function paint(o) { const n = o.selected.size; o.cnt.textContent = n ? " (" + n + ")" : ""; o.btn.classList.toggle("active", n > 0); }

  const MSel = {
    create(mountId, opt) {
      const root = document.getElementById(mountId); if (!root) return;
      root.className = "msel";
      root.innerHTML = '<button type="button" class="msel-btn">' + esc(opt.label) + '<span class="msel-cnt"></span><span class="msel-ar">▾</span></button>' +
        '<div class="msel-panel"><div class="msel-actions"><span class="a-all">All</span><span class="a-clr">Clear</span></div><div class="msel-list"></div></div>';
      const o = { root, btn: root.querySelector(".msel-btn"), panel: root.querySelector(".msel-panel"), list: root.querySelector(".msel-list"), cnt: root.querySelector(".msel-cnt"), selected: new Set(), labels: {} };
      reg[opt.key] = o;
      o.btn.onclick = e => { e.stopPropagation(); const was = openKey === opt.key; close(); if (!was) { o.panel.style.display = "block"; o.root.classList.add("open"); openKey = opt.key; } };
      root.querySelector(".a-all").onclick = () => { o.list.querySelectorAll("input").forEach(i => { i.checked = true; o.selected.add(i.value); }); paint(o); if (onChangeFn) onChangeFn(opt.key); };
      root.querySelector(".a-clr").onclick = () => { o.selected.clear(); o.list.querySelectorAll("input").forEach(i => i.checked = false); paint(o); if (onChangeFn) onChangeFn(opt.key); };
    },
    setOptions(key, opts) {
      const o = reg[key]; if (!o) return;
      const norm = (opts || []).map(x => typeof x === "string" ? { v: x, l: x } : x);
      norm.forEach(x => o.labels[x.v] = x.l);
      const have = new Set(norm.map(x => x.v));
      [...o.selected].forEach(v => { if (!have.has(v)) norm.push({ v, l: o.labels[v] || v }); });  // keep selected even if filtered out
      o.list.innerHTML = norm.length
        ? norm.map(x => '<label class="msel-opt"><input type="checkbox" value="' + esc(x.v) + '" ' + (o.selected.has(x.v) ? "checked" : "") + '><span>' + esc(x.l) + '</span></label>').join("")
        : '<div class="msel-empty">none</div>';
      o.list.querySelectorAll("input").forEach(i => i.onchange = () => { i.checked ? o.selected.add(i.value) : o.selected.delete(i.value); paint(o); if (onChangeFn) onChangeFn(key); });
      paint(o);
    },
    values(key) { return reg[key] ? [...reg[key].selected] : []; },
    set(key, vals) { const o = reg[key]; if (!o) return; o.selected = new Set(vals || []); o.list.querySelectorAll("input").forEach(i => i.checked = o.selected.has(i.value)); paint(o); },
    onChange(fn) { onChangeFn = fn; },
  };
  global.MSel = MSel;
})(window);
