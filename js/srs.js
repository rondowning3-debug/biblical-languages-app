// Minimal SM-2 style spaced-repetition engine.
// Card shape: { id, word, translation, lang, ease, interval, reps, dueDate }

import { PACING_CONFIG, PRESUMED_KNOWN } from "../data/config.js";

const STORAGE_KEY = "blapp_srs_v1";
const PACING_KEY = "blapp_pacing_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable; progress just won't persist this session
  }
}

function newCard(id, word, translation, lang, freq, order) {
  return {
    freq,
    order,
    introduced: false,
    id,
    word,
    translation,
    lang,
    ease: 2.5,
    interval: 0,
    reps: 0,
    dueDate: todayStamp(),
  };
}

function todayPlus(days) {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

// Applies the presumed-known rule (see PRESUMED_KNOWN in config). Unstarred
// high-frequency words that haven't been studied are seeded as mastered with
// a scattered due date; a starred word that was previously seeded this way is
// reset so it goes through normal pacing. Real review history is never touched.
function applyPresumption(card, row, lang) {
  const rule = PRESUMED_KNOWN[lang];
  if (!rule || card.freq == null) return;
  const qualifies = card.freq >= rule.minFrequency;
  if (qualifies && !row.starred && card.introduced === false && card.reps === 0) {
    card.introduced = true;
    card.presumed = true;
    card.reps = 3;
    card.interval = rule.interval;
    card.dueDate = todayPlus(Math.floor(Math.random() * rule.interval));
  } else if (row.starred && card.presumed) {
    card.presumed = false;
    card.introduced = false;
    card.reps = 0;
    card.interval = 0;
    card.ease = 2.5;
    card.dueDate = todayStamp();
  }
}

// Merge freshly-fetched vocab rows into stored SRS state.
// Existing progress is preserved; new words get fresh cards.
export function syncDeck(lang, rows) {
  const state = loadState();
  rows.forEach((row, i) => {
    const id = `${lang}:${row.word}`;
    if (!state[id]) {
      state[id] = newCard(id, row.word, row.translation, lang, row.freq, i);
    } else {
      // keep progress, but refresh translation/frequency in case the sheet changed
      state[id].translation = row.translation;
      state[id].freq = row.freq;
      state[id].order = i;
      // cards from before pacing existed: anything already reviewed counts as introduced
      if (state[id].introduced === undefined) state[id].introduced = state[id].reps > 0;
    }
    applyPresumption(state[id], row, lang);
  });
  saveState(state);
  return state;
}

export function getDueCards(lang) {
  const state = loadState();
  const today = todayStamp();
  return Object.values(state)
    .filter((c) => c.lang === lang && c.introduced !== false && c.dueDate <= today)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function getDeckSize(lang) {
  const state = loadState();
  return Object.values(state).filter((c) => c.lang === lang).length;
}

// grade: "again" | "hard" | "good" | "easy"
export function reviewCard(id, grade) {
  const state = loadState();
  const card = state[id];
  if (!card) return;

  if (grade === "again") {
    card.reps = 0;
    card.interval = 0;
    card.ease = Math.max(1.3, card.ease - 0.2);
  } else {
    card.reps += 1;
    if (grade === "hard") {
      card.ease = Math.max(1.3, card.ease - 0.15);
      card.interval = card.interval === 0 ? 1 : Math.round(card.interval * 1.2);
    } else if (grade === "good") {
      card.interval =
        card.interval === 0 ? 1 : card.interval === 1 ? 3 : Math.round(card.interval * card.ease);
    } else if (grade === "easy") {
      card.ease = card.ease + 0.15;
      card.interval =
        card.interval === 0 ? 2 : Math.round(card.interval * card.ease * 1.3);
    }
  }

  const due = new Date(Date.now() + card.interval * DAY_MS);
  card.dueDate = due.toISOString().slice(0, 10);
  state[id] = card;
  saveState(state);
}

function loadPacing() {
  try {
    const raw = localStorage.getItem(PACING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePacing(p) {
  try {
    localStorage.setItem(PACING_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

// Highest frequency first; words with no frequency go last, in sheet order.
function sortedCards(state, lang) {
  return Object.values(state)
    .filter((c) => c.lang === lang)
    .sort((a, b) => {
      const fa = a.freq ?? -Infinity;
      const fb = b.freq ?? -Infinity;
      return fb - fa || a.order - b.order;
    });
}

// Groups the sorted deck into batches of like frequency: all words sharing a
// frequency value stay together, and adjacent values merge until a batch
// reaches minBatchSize.
function buildBatches(cards) {
  const batches = [];
  let current = [];
  let i = 0;
  while (i < cards.length) {
    const f = cards[i].freq;
    let j = i;
    while (j < cards.length && cards[j].freq === f) j++;
    current.push(...cards.slice(i, j));
    if (current.length >= PACING_CONFIG.minBatchSize) {
      batches.push(current);
      current = [];
    }
    i = j;
  }
  if (current.length) batches.push(current);
  return batches;
}

function isMastered(card) {
  return card.introduced !== false && card.interval >= PACING_CONFIG.masteryInterval;
}

// Introduces new words (respecting the daily cap and the mastery gate) and
// returns a summary for the status line.
export function introduceNewCards(lang) {
  const state = loadState();
  const batches = buildBatches(sortedCards(state, lang));
  const pacing = loadPacing();
  const today = todayStamp();
  if (!pacing[lang] || pacing[lang].date !== today) pacing[lang] = { date: today, count: 0 };

  const summary = { batchIndex: 0, batchCount: batches.length, masteredPct: 0, newToday: 0, locked: false };
  if (batches.length === 0) return summary;

  let remaining = PACING_CONFIG.newPerDay - pacing[lang].count;
  for (let b = 0; b < batches.length && remaining > 0; b++) {
    const pending = batches[b].filter((c) => c.introduced === false);
    if (pending.length === 0) continue;
    if (b > 0) {
      const prev = batches[b - 1];
      const ratio = prev.filter(isMastered).length / prev.length;
      if (ratio < PACING_CONFIG.unlockThreshold) break;
    }
    for (const card of pending.slice(0, remaining)) {
      card.introduced = true;
      card.dueDate = today;
      state[card.id] = card;
      pacing[lang].count++;
      remaining--;
    }
    // keep going: the next batch only opens if this one (now including the words just introduced) still meets the mastery gate
  }
  saveState(state);
  savePacing(pacing);

  // Status: the earliest batch that isn't fully mastered is the "current" one.
  const cur = batches.findIndex((batch) => !batch.every(isMastered));
  summary.batchIndex = cur === -1 ? batches.length - 1 : cur;
  const curBatch = batches[summary.batchIndex];
  summary.masteredPct = Math.round((curBatch.filter(isMastered).length / curBatch.length) * 100);
  summary.newToday = pacing[lang].count;
  summary.locked = curBatch.some((c) => c.introduced === false) === false &&
    summary.batchIndex < batches.length - 1;
  return summary;
}
