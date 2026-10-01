import { initTopicViewer } from "./topicViewer.js?v=2026-10-01b";

export function initParadigms() {
  initTopicViewer({
    section: "paradigms",
    contentId: "paradigms-content",
    nextBtnId: "paradigms-next-btn",
    viewSelector: "#view-paradigms",
  });
}
