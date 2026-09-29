// Minimal SM-2 style spaced-repetition engine.
// Card shape: { id, word, translation, lang, ease, interval, reps, dueDate }

const STORAGE_KEY = "blapp_srs_v1";
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

function newCard(id, word, translation, lang) {
  return {
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

// Merge freshly-fetched vocab rows into stored SRS state.
// Existing progress is preserved; new words get fresh cards.
export function syncDeck(lang, rows) {
  const state = loadState();
  for (const row of rows) {
    const id = `${lang}:${row.word}`;
    if (!state[id]) {
      state[id] = newCard(id, row.word, row.translation, lang);
    } else {
      // keep progress, but refresh translation in case the sheet changed it
      state[id].translation = row.translation;
    }
  }
  saveState(state);
  return state;
}

export function getDueCards(lang) {
  const state = loadState();
  const today = todayStamp();
  return Object.values(state)
    .filter((c) => c.lang === lang && c.dueDate <= today)
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
