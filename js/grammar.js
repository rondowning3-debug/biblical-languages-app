import { initTopicViewer } from "./topicViewer.js?v=2026-10-04";

export function initGrammar() {
  return initTopicViewer({
    section: "grammar",
    contentId: "grammar-content",
    nextBtnId: "grammar-next-btn",
  });
}
