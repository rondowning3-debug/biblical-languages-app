import { initTopicViewer } from "./topicViewer.js?v=2026-10-03b";

export function initParadigms() {
  return initTopicViewer({
    section: "paradigms",
    contentId: "paradigms-content",
    nextBtnId: "paradigms-next-btn",
  });
}
