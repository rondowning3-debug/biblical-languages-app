import { initTopicViewer } from "./topicViewer.js?v=2026-10-03b";

export function initGrammar() {
  return initTopicViewer({
    section: "grammar",
    contentId: "grammar-content",
    nextBtnId: "grammar-next-btn",
  });
}
