// Shared viewer for "grammar" and "paradigms" tabs: both show one random
// entry at a time from content/<section>/<lang>/index.json, with a button
// to swap in a different random entry (never immediately repeating).
export function initTopicViewer({ section, contentId, nextBtnId, viewSelector }) {
  let currentLang = "greek";
  let topics = [];
  let currentIndex = -1;

  async function loadIndex(lang) {
    try {
      const res = await fetch(`content/${section}/${lang}/index.json`, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async function loadEntry(lang, file) {
    try {
      const res = await fetch(`content/${section}/${lang}/${file}`, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  function pickRandomIndex(length, avoid) {
    if (length <= 1) return 0;
    let idx;
    do {
      idx = Math.floor(Math.random() * length);
    } while (idx === avoid);
    return idx;
  }

  async function showRandom() {
    const contentEl = document.getElementById(contentId);
    if (topics.length === 0) {
      contentEl.innerHTML = `<p class="empty-note">No ${section} entries added yet for ${currentLang}. Add entries to content/${section}/${currentLang}/index.json.</p>`;
      return;
    }
    currentIndex = pickRandomIndex(topics.length, currentIndex);
    const html = await loadEntry(currentLang, topics[currentIndex].file);
    contentEl.innerHTML = html ?? `<p class="empty-note">Could not load this entry.</p>`;
  }

  async function loadLang(lang) {
    currentLang = lang;
    currentIndex = -1;
    topics = await loadIndex(lang);
    await showRandom();
  }

  document.getElementById(nextBtnId).addEventListener("click", showRandom);

  document.querySelectorAll(`${viewSelector} .lang-btn`).forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(`${viewSelector} .lang-btn`).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadLang(btn.dataset.lang);
    });
  });

  loadLang(currentLang);
}
