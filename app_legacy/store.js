/* UPSCviaPYQs progress store — device-local, versioned, account-ready.
   Single source of truth for bookmarks, "revise" flags, Prelims attempts, and a daily streak.
   Keys are namespaced under "upsc:v1:" so a future login can migrate/sync without re-architecting.
   Usage: <script src="store.js"></script> then window.Store.*  (kinds: "prelims","mains","optional","framework") */
(function (global) {
  const NS = "upsc:v1:";
  const K = {
    book:   NS + "bookmarks",  // { kind: { id: 1 } }
    rev:    NS + "revise",     // { kind: { id: 1 } }
    att:    NS + "attempts",   // { id: { chosen, correct, ts } }   (Prelims only)
    streak: NS + "streak",     // { last:"YYYY-MM-DD", count, best }
    pref:   NS + "prefs",      // { key: value }  (UI preferences, e.g. study mode)
    prac:   NS + "practiced",  // { kind: { id: 1 } }  (Mains/Optional answers written)
  };
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (_) { return def; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

  function toggleIn(key, kind, id) {
    const m = load(key, {}); m[kind] = m[kind] || {};
    if (m[kind][id]) delete m[kind][id]; else m[kind][id] = 1;
    save(key, m); return !!m[kind][id];
  }
  const has = (key, kind, id) => { const m = load(key, {}); return !!(m[kind] && m[kind][id]); };
  const idsOf = (key, kind) => { const m = load(key, {}); return Object.keys(m[kind] || {}); };

  const Store = {
    // ---- bookmarks ----
    isBookmarked: (kind, id) => has(K.book, kind, id),
    toggleBookmark: (kind, id) => toggleIn(K.book, kind, id),
    bookmarks: (kind) => idsOf(K.book, kind),

    // ---- "mark for revision" ----
    isRevise: (kind, id) => has(K.rev, kind, id),
    toggleRevise: (kind, id) => toggleIn(K.rev, kind, id),
    reviseList: (kind) => idsOf(K.rev, kind),

    // ---- Prelims attempts ----
    attempt: (id) => load(K.att, {})[id] || null,
    attempts: () => load(K.att, {}),
    recordAttempt(id, chosen, correct) {
      const m = load(K.att, {});
      m[id] = { chosen: chosen, correct: !!correct, ts: Date.now() };
      save(K.att, m); Store.touchStreak(); return m[id];
    },

    // ---- daily streak ----
    touchStreak() {
      const s = load(K.streak, { last: null, count: 0, best: 0 }), t = today();
      if (s.last === t) return s;
      s.count = (s.last && daysBetween(s.last, t) === 1) ? (s.count || 0) + 1 : 1;
      s.last = t; s.best = Math.max(s.best || 0, s.count); save(K.streak, s); return s;
    },
    streak() {
      const s = load(K.streak, { last: null, count: 0, best: 0 });
      if (s.last && daysBetween(s.last, today()) > 1) return { last: s.last, count: 0, best: s.best || 0 }; // broken
      return s;
    },

    // ---- aggregate stats (Prelims) ----
    // records: array of prelims {id, subject, year}
    stats(records) {
      const att = load(K.att, {}), ids = Object.keys(att);
      const byId = {}; (records || []).forEach(r => byId[r.id] = r);
      let correct = 0; const bySubject = {}, byYear = {};
      ids.forEach(id => {
        const a = att[id]; if (a.correct) correct++;
        const r = byId[id]; if (!r) return;
        const s = r.subject || "—"; (bySubject[s] = bySubject[s] || { n: 0, c: 0 }).n++; if (a.correct) bySubject[s].c++;
        const y = r.year || "—"; (byYear[y] = byYear[y] || { n: 0, c: 0 }).n++; if (a.correct) byYear[y].c++;
      });
      return {
        total: ids.length, correct, accuracy: ids.length ? Math.round(100 * correct / ids.length) : 0,
        bySubject, byYear,
        bookmarks: idsOf(K.book, "prelims").length,
        revise: idsOf(K.rev, "prelims").length,
      };
    },

    // ---- writing practice (Mains/Optional) ----
    recordPractice(kind, id) { const m = load(K.prac, {}); (m[kind] = m[kind] || {})[id] = 1; save(K.prac, m); Store.touchStreak(); },
    practicedCount(kind) { return idsOf(K.prac, kind).length; },
    practicedIds(kind) { return idsOf(K.prac, kind); },

    // ---- UI preferences ----
    getPref(k, def) { const m = load(K.pref, {}); return (k in m) ? m[k] : def; },
    setPref(k, v) { const m = load(K.pref, {}); m[k] = v; save(K.pref, m); },

    counts() {
      const cnt = (o) => Object.keys(o || {}).reduce((s, k) => s + Object.keys(o[k]).length, 0);
      return { bookmarks: cnt(load(K.book, {})), revise: cnt(load(K.rev, {})), attempts: Object.keys(load(K.att, {})).length };
    },

    reset() { [K.book, K.rev, K.att, K.streak, K.prac].forEach(k => localStorage.removeItem(k)); },  // prefs kept
  };
  global.Store = Store;
})(typeof window !== "undefined" ? window : this);
