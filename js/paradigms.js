import { initTopicViewer } from "./topicViewer.js?v=2026-10-03a";

export function initParadigms() {
  initTopicViewer({
    section: "paradigms",
    contentId: "paradigms-content",
    nextBtnId: "paradigms-next-btn",
    viewSelector: "#view-paradigms",
  });
}
