'use client';

import { create } from 'zustand';

const NS = "upsc:v1:";
const K = {
  book:   NS + "bookmarks",  // { kind: { id: 1 } }
  rev:    NS + "revise",     // { kind: { id: 1 } }
  att:    NS + "attempts",   // { id: { chosen, correct, ts } }
  streak: NS + "streak",     // { last: string, count: number, best: number }
  pref:   NS + "prefs",      // { key: value }
  prac:   NS + "practiced",  // { kind: { id: 1 } }
};

const loadJSON = (key: string, def: any) => {
  if (typeof window === 'undefined') return def;
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || def;
  } catch (_) {
    return def;
  }
};

const saveJSON = (key: string, val: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

const daysBetween = (a: string, b: string) => {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
};

interface StoreState {
  bookmarks: Record<string, Record<string, number>>;
  revise: Record<string, Record<string, number>>;
  attempts: Record<string, { chosen: string; correct: boolean; ts: number }>;
  streak: { last: string | null; count: number; best: number };
  practiced: Record<string, Record<string, number>>;
  themeMode: 'light' | 'dark';
  user: any | null;
  entitled: boolean;

  toggleBookmark: (kind: string, id: string) => void;
  isBookmarked: (kind: string, id: string) => boolean;
  toggleRevise: (kind: string, id: string) => void;
  isRevise: (kind: string, id: string) => boolean;
  recordAttempt: (id: string, chosen: string, correct: boolean) => void;
  recordPractice: (kind: string, id: string) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setUser: (user: any, entitled: boolean) => void;
  resetAll: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  bookmarks: loadJSON(K.book, {}),
  revise: loadJSON(K.rev, {}),
  attempts: loadJSON(K.att, {}),
  streak: loadJSON(K.streak, { last: null, count: 0, best: 0 }),
  practiced: loadJSON(K.prac, {}),
  themeMode: loadJSON(K.pref, { theme: 'light' }).theme || 'light',
  user: null,
  entitled: false,

  toggleBookmark: (kind, id) => {
    const next = { ...get().bookmarks };
    next[kind] = next[kind] || {};
    if (next[kind][id]) {
      delete next[kind][id];
    } else {
      next[kind][id] = 1;
    }
    set({ bookmarks: next });
    saveJSON(K.book, next);
  },

  isBookmarked: (kind, id) => {
    const books = get().bookmarks;
    return !!(books[kind] && books[kind][id]);
  },

  toggleRevise: (kind, id) => {
    const next = { ...get().revise };
    next[kind] = next[kind] || {};
    if (next[kind][id]) {
      delete next[kind][id];
    } else {
      next[kind][id] = 1;
    }
    set({ revise: next });
    saveJSON(K.rev, next);
  },

  isRevise: (kind, id) => {
    const revs = get().revise;
    return !!(revs[kind] && revs[kind][id]);
  },

  recordAttempt: (id, chosen, correct) => {
    const nextAtts = { ...get().attempts };
    nextAtts[id] = { chosen, correct, ts: Date.now() };
    
    // Update streak
    const s = { ...get().streak };
    const t = todayStr();
    if (s.last !== t) {
      s.count = (s.last && daysBetween(s.last, t) === 1) ? (s.count || 0) + 1 : 1;
      s.last = t;
      s.best = Math.max(s.best || 0, s.count);
    }

    set({ attempts: nextAtts, streak: s });
    saveJSON(K.att, nextAtts);
    saveJSON(K.streak, s);
  },

  recordPractice: (kind, id) => {
    const nextPrac = { ...get().practiced };
    nextPrac[kind] = nextPrac[kind] || {};
    nextPrac[kind][id] = 1;

    // Update streak
    const s = { ...get().streak };
    const t = todayStr();
    if (s.last !== t) {
      s.count = (s.last && daysBetween(s.last, t) === 1) ? (s.count || 0) + 1 : 1;
      s.last = t;
      s.best = Math.max(s.best || 0, s.count);
    }

    set({ practiced: nextPrac, streak: s });
    saveJSON(K.prac, nextPrac);
    saveJSON(K.streak, s);
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    const prefs = loadJSON(K.pref, {});
    prefs.theme = mode;
    saveJSON(K.pref, prefs);
  },

  setUser: (user, entitled) => {
    set({ user, entitled });
  },

  resetAll: () => {
    if (typeof window !== 'undefined') {
      [K.book, K.rev, K.att, K.streak, K.prac].forEach(k => localStorage.removeItem(k));
    }
    set({
      bookmarks: {},
      revise: {},
      attempts: {},
      streak: { last: null, count: 0, best: 0 },
      practiced: {},
    });
  }
}));
