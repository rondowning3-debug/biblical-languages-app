let currentLang = "greek";

async function loadIndex(lang) {
  try {
    const res = await fetch(`content/grammar/${lang}/index.json`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function loadTopic(lang, file) {
  try {
    const res = await fetch(`content/grammar/${lang}/${file}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function renderTopicList(topics, lang) {
  const list = document.getElementById("grammar-topic-list");
  list.innerHTML = "";

  if (topics.length === 0) {
    const contentEl = document.getElementById("grammar-content");
    contentEl.innerHTML = `<p class="empty-note">No grammar topics added yet for ${lang}. Add entries to content/grammar/${lang}/index.json.</p>`;
    return;
  }

  topics.forEach((topic, i) => {
    const li = document.createElement("li");
    li.textContent = topic.title;
    li.dataset.file = topic.file;
    if (i === 0) li.classList.add("active");
    li.addEventListener("click", async () => {
      list.querySelectorAll("li").forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
      const html = await loadTopic(lang, topic.file);
      document.getElementById("grammar-content").innerHTML =
        html ?? `<p class="empty-note">Could not load this topic.</p>`;
    });
    list.appendChild(li);
  });

  list.querySelector("li")?.dispatchEvent(new Event("click"));
}

async function loadLang(lang) {
  currentLang = lang;
  const topics = await loadIndex(lang);
  renderTopicList(topics, lang);
}

export function initGrammar() {
  document.querySelectorAll("#view-grammar .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#view-grammar .lang-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadLang(btn.dataset.lang);
    });
  });

  loadLang(currentLang);
}
