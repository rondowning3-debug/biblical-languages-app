import { READING_CONFIG } from "../data/config.js?v=2026-10-01b";
import { wrapVerse, decoratePassage, initParsingClicks } from "./parsing.js?v=2026-10-01b";

const STORAGE_KEY = "blapp_reading_v1";
let currentLang = "greek";
let currentBook = null; // { verses: [...], label, versesPerSitting }

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

function getPosition(lang) {
  const progress = loadProgress();
  return progress[lang] || { bookIndex: 0, verseIndex: 0 };
}

function setPosition(lang, pos) {
  const progress = loadProgress();
  progress[lang] = pos;
  saveProgress(progress);
}

async function loadBookFile(lang, file) {
  try {
    const res = await fetch(`content/readings/${lang}/${file}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json(); // expected: [{ ref, text }, ...]
  } catch {
    return null;
  }
}

function renderStatus(text) {
  document.getElementById("reading-status").textContent = text;
}

function renderPassage(verses, lang) {
  const el = document.getElementById("reading-passage");
  if (!verses || verses.length === 0) {
    el.innerHTML = `<p class="empty-note">No text loaded for this passage yet.</p>`;
    return;
  }
  let html = "", chapter = null, open = false;
  verses.forEach((v, i) => {
    const m = /^(.*\S)\s+(\d+):(\d+)$/.exec(v.ref);
    const heading = m ? `${m[1]} ${m[2]}` : null;
    if (heading && heading !== chapter) {
      if (open) html += "</p>";
      html += `<h3 class="chapter-head">${heading}</h3>`;
      chapter = heading;
      open = false;
    }
    if (!open || v.para || i === 0) {
      if (open) html += "</p>";
      html += "<p>";
      open = true;
    }
    const body = m && lang === "greek" ? wrapVerse(v.text, m[2], m[3]) : v.text;
    html += `<sup class="vnum">${m ? m[3] : v.ref}</sup>${body} `;
  });
  if (open) html += "</p>";
  el.innerHTML = html;
  if (lang === "greek") decoratePassage(el, lang, verses.map((v) => v.ref));
}

async function render() {
  const config = READING_CONFIG[currentLang];
  const pos = getPosition(currentLang);
  const bookEntry = config.bookOrder[pos.bookIndex];

  if (!bookEntry) {
    renderStatus("Reading plan complete for this language.");
    renderPassage([]);
    document.getElementById("mark-read-btn").disabled = true;
    return;
  }

  document.getElementById("mark-read-btn").disabled = false;
  const book = await loadBookFile(currentLang, bookEntry.file);

  if (!book) {
    renderStatus(`${bookEntry.label} — text not yet added (content/readings/${currentLang}/${bookEntry.file})`);
    renderPassage([]);
    return;
  }

  const chunk = book.slice(pos.verseIndex, pos.verseIndex + config.versesPerSitting);
  renderStatus(`${bookEntry.label} — verses ${pos.verseIndex + 1}–${pos.verseIndex + chunk.length} of ${book.length}`);
  renderPassage(chunk, currentLang);
  currentBook = book;
}

async function markReadAndContinue() {
  const config = READING_CONFIG[currentLang];
  const pos = getPosition(currentLang);
  const bookEntry = config.bookOrder[pos.bookIndex];
  if (!bookEntry || !currentBook) return;

  const nextVerseIndex = pos.verseIndex + config.versesPerSitting;
  if (nextVerseIndex >= currentBook.length) {
    setPosition(currentLang, { bookIndex: pos.bookIndex + 1, verseIndex: 0 });
  } else {
    setPosition(currentLang, { bookIndex: pos.bookIndex, verseIndex: nextVerseIndex });
  }
  await render();
}

async function loadLang(lang) {
  currentLang = lang;
  await render();
}

export function initReading() {
  initParsingClicks(document.getElementById("reading-passage"));
  document.getElementById("mark-read-btn").addEventListener("click", markReadAndContinue);

  document.querySelectorAll("#view-reading .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#view-reading .lang-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadLang(btn.dataset.lang);
    });
  });

  loadLang(currentLang);
}
