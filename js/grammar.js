import { initTopicViewer } from "./topicViewer.js?v=2026-10-01b";

export function initGrammar() {
  initTopicViewer({
    section: "grammar",
    contentId: "grammar-content",
    nextBtnId: "grammar-next-btn",
    viewSelector: "#view-grammar",
  });
}
