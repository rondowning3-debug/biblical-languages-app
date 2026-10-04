import { PARSING_SOURCES } from "../data/config.js?v=2026-10-03a";
import { tokenizeCsv } from "./csv.js?v=2026-10-03a";

// Which sheet fields the popup shows for each Type (lowercase). Edit freely.
// A Type not listed here falls back to every non-empty field.
const FIELD_LABELS = {
  lexical: "Lexical form", translation: "Translation", case: "Case", person: "Person",
  number: "Number", gender: "Gender", tense: "Tense", voice: "Voice", mood: "Mood", notes: "Notes",
};
const FIELDS_BY_TYPE = {
  noun: ["lexical", "translation", "case", "number", "gender"],
  verb: ["lexical", "translation", "person", "number", "tense", "voice", "mood"],
  participle: ["lexical", "translation", "case", "number", "gender", "tense", "voice"],
  infinitive: ["lexical", "translation", "tense", "voice"],
  adjective: ["lexical", "translation", "case", "number", "gender"],
  article: ["lexical", "translation", "case", "number", "gender"],
  pronoun: ["lexical", "translation", "person", "case", "number", "gender"],
  preposition: ["lexical", "translation"],
  conjunction: ["lexical", "translation"],
};

// Must match tools/parsing_template.py: split on whitespace, strip surrounding
// punctuation (the elision mark ’ is kept).
const STRIP = /^[,.·;:!?·;()[\]“”"—]+|[,.·;:!?·;()[\]“”"—]+$/g;
export const cleanToken = (tok) => tok.replace(STRIP, "").normalize("NFC");

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Wraps each word of a verse in a span carrying its chapter:verse:pos key.
export function wrapVerse(text, chapter, verse) {
  return text.split(/\s+/).filter(Boolean).map((tok, i) =>
    `<span class="pw" data-key="${chapter}:${verse}:${i + 1}" data-word="${escapeHtml(cleanToken(tok))}">${escapeHtml(tok)}</span>`
  ).join(" ");
}

const cache = {}; // `${lang}|${book}|${chapter}` -> Map(key -> row) | null
let current = new Map();

async function loadChapter(lang, book, chapter) {
  const id = `${lang}|${book}|${chapter}`;
  if (id in cache) return cache[id];
  const url = PARSING_SOURCES[lang]?.[book]?.[chapter];
  let map = null;
  if (url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) map = parseRows(await res.text(), chapter);
    } catch { /* leave null */ }
  }
  cache[id] = map;
  return map;
}

function parseRows(text, chapter) {
  const rows = tokenizeCsv(text.trim());
  if (rows.length < 2) return new Map();
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name) => header.indexOf(name);
  const col = {
    verse: idx("verse"), pos: idx("pos"), word: idx("word"), type: idx("type"),
    lexical: idx("lexical form"), translation: idx("translation"),
    case: idx("case"), person: idx("person"), number: idx("number"), gender: idx("gender"),
    tense: idx("tense"), voice: idx("voice"), mood: idx("mood"), notes: idx("notes"),
  };
  if (col.verse === -1 || col.pos === -1) return new Map();
  const map = new Map();
  for (const r of rows.slice(1)) {
    const get = (k) => (col[k] === -1 ? "" : (r[col[k]] || "").trim());
    const verse = get("verse"), pos = get("pos");
    if (!verse || !pos || !get("type")) continue; // unparsed rows stay plain text
    const row = {};
    for (const k of Object.keys(col)) row[k] = get(k);
    map.set(`${chapter}:${verse}:${pos}`, row);
  }
  return map;
}

// Marks parsed words in the rendered passage as clickable.
export async function decoratePassage(container, lang, verseRefs) {
  closePopup();
  current = new Map();
  const chapters = new Set();
  for (const ref of verseRefs) {
    const m = /^(.*\S)\s+(\d+):\d+$/.exec(ref);
    if (m) chapters.add(`${m[1]}|${m[2]}`);
  }
  for (const c of chapters) {
    const [book, chapter] = c.split("|");
    const map = await loadChapter(lang, book, chapter);
    if (map) for (const [k, v] of map) current.set(k, v);
  }
  container.querySelectorAll(".pw").forEach((el) => {
    if (current.has(el.dataset.key)) el.classList.add("parsed");
  });
}

let popup = null;

function closePopup() {
  popup?.remove();
  popup = null;
  document.querySelectorAll(".pw.active").forEach((e) => e.classList.remove("active"));
}

function showPopup(el) {
  const row = current.get(el.dataset.key);
  if (!row) return;
  closePopup();
  el.classList.add("active");
  const type = row.type.toLowerCase();
  const fields = FIELDS_BY_TYPE[type] || Object.keys(FIELD_LABELS);
  const lines = fields.filter((f) => row[f]).map((f) =>
    `<div class="pp-row"><span class="pp-label">${FIELD_LABELS[f]}</span><span class="pp-val">${escapeHtml(row[f])}</span></div>`
  ).join("");
  const mismatch = row.word && row.word.normalize("NFC") !== el.dataset.word
    ? `<div class="pp-warn">Sheet word “${escapeHtml(row.word)}” differs from the text — check this row.</div>` : "";
  popup = document.createElement("div");
  popup.className = "parse-popup";
  popup.innerHTML = `<button class="pp-close" aria-label="Close">×</button>
    <div class="pp-head"><span class="pp-word">${escapeHtml(el.dataset.word)}</span><span class="pp-type">${escapeHtml(row.type)}</span></div>${lines}${mismatch}`;
  popup.querySelector(".pp-close").addEventListener("click", closePopup);
  document.body.appendChild(popup);
}

export function initParsingClicks(container) {
  container.addEventListener("click", (e) => {
    const el = e.target.closest(".pw.parsed");
    if (el) { e.stopPropagation(); showPopup(el); }
  });
  document.addEventListener("click", (e) => {
    if (popup && !popup.contains(e.target)) closePopup();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });
}
