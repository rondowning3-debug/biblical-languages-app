import { initFlashcards } from "./flashcards.js?v=2026-10-01b";
import { initGrammar } from "./grammar.js?v=2026-10-01b";
import { initParadigms } from "./paradigms.js?v=2026-10-01b";
import { initReading } from "./reading.js?v=2026-10-01b";

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.nav-btn[data-view="${name}"]`).classList.add("active");
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

initFlashcards();
initGrammar();
initParadigms();
initReading();
