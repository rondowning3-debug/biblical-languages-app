import { initTopicViewer } from "./topicViewer.js";

export function initGrammar() {
  initTopicViewer({
    section: "grammar",
    contentId: "grammar-content",
    nextBtnId: "grammar-next-btn",
    viewSelector: "#view-grammar",
  });
}
