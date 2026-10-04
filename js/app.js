import { initFlashcards } from "./flashcards.js?v=2026-10-03b";
import { initGrammar } from "./grammar.js?v=2026-10-03b";
import { initParadigms } from "./paradigms.js?v=2026-10-03b";
import { initReading } from "./reading.js?v=2026-10-03b";

// One global language (top buttons) drives every tab. Each tab module exposes
// show(lang): it (re)loads only when the language differs from what it last
// loaded, so flipping between tabs keeps your place and switching language
// switches all tabs at once.
let currentLang = "greek";
let currentView = "flashcards";

const views = {
  flashcards: initFlashcards(),
  grammar: initGrammar(),
  paradigms: initParadigms(),
  reading: initReading(),
};

function render() {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${currentView}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === currentView));
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === currentLang));
  views[currentView].show(currentLang);
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    render();
  });
});

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    render();
  });
});

render();
