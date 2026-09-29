import { VOCAB_SOURCES } from "../data/config.js";
import { syncDeck, getDueCards, getDeckSize, reviewCard } from "./srs.js";

let currentLang = "greek";
let queue = [];
let currentCard = null;

// Tokenizes RFC4180-style CSV: handles quoted fields containing commas,
// escaped quotes (""), and quoted fields containing newlines.
function tokenizeCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseCsv(text) {
  const rows = tokenizeCsv(text.trim());
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const wordIdx = header.indexOf("word");
  const transIdx = header.indexOf("translation");
  if (wordIdx === -1 || transIdx === -1) return [];

  return rows.slice(1).map((cols) => ({
    word: (cols[wordIdx] || "").trim(),
    translation: (cols[transIdx] || "").trim(),
  })).filter((r) => r.word);
}

async function fetchDeck(lang) {
  const url = VOCAB_SOURCES[lang]?.csvUrl;
  if (!url) return { ok: false, reason: "no-url" };
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, reason: "fetch-failed" };
    const text = await res.text();
    const rows = parseCsv(text);
    syncDeck(lang, rows);
    return { ok: true, count: rows.length };
  } catch {
    return { ok: false, reason: "fetch-failed" };
  }
}

function renderStatus(message) {
  document.getElementById("flashcard-status").textContent = message;
}

function renderCard() {
  const front = document.getElementById("card-front");
  const back = document.getElementById("card-back");
  const showBtn = document.getElementById("show-answer-btn");
  const gradeControls = document.getElementById("grade-controls");

  back.classList.add("hidden");
  gradeControls.classList.add("hidden");
  showBtn.classList.remove("hidden");

  if (!currentCard) {
    front.textContent = "";
    back.textContent = "";
    return;
  }
  front.textContent = currentCard.word;
  back.textContent = currentCard.translation;
}

function nextCard() {
  currentCard = queue.shift() || null;
  renderCard();
  if (!currentCard) {
    renderStatus(
      getDeckSize(currentLang) === 0
        ? "No vocab loaded yet — add the Google Sheet CSV URL in data/config.js."
        : "All caught up for today."
    );
  } else {
    renderStatus(`${queue.length + 1} due`);
  }
}

async function loadLang(lang) {
  currentLang = lang;
  renderStatus("Loading…");
  const result = await fetchDeck(lang);
  if (!result.ok && result.reason === "no-url") {
    renderStatus("No vocab source configured yet for this language.");
  } else if (!result.ok) {
    renderStatus("Could not fetch the vocab sheet — check the CSV URL and your connection.");
  }
  queue = getDueCards(lang);
  nextCard();
}

export function initFlashcards() {
  document.getElementById("show-answer-btn").addEventListener("click", () => {
    document.getElementById("card-back").classList.remove("hidden");
    document.getElementById("show-answer-btn").classList.add("hidden");
    document.getElementById("grade-controls").classList.remove("hidden");
  });

  document.getElementById("grade-controls").addEventListener("click", (e) => {
    const grade = e.target?.dataset?.grade;
    if (!grade || !currentCard) return;
    reviewCard(currentCard.id, grade);
    nextCard();
  });

  document.querySelectorAll("#view-flashcards .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#view-flashcards .lang-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadLang(btn.dataset.lang);
    });
  });

  loadLang(currentLang);
}
