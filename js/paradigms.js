import { initTopicViewer } from "./topicViewer.js";

export function initParadigms() {
  initTopicViewer({
    section: "paradigms",
    contentId: "paradigms-content",
    nextBtnId: "paradigms-next-btn",
    viewSelector: "#view-paradigms",
  });
}
