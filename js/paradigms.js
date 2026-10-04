import { initTopicViewer } from "./topicViewer.js?v=2026-10-04";

export function initParadigms() {
  return initTopicViewer({
    section: "paradigms",
    contentId: "paradigms-content",
    nextBtnId: "paradigms-next-btn",
  });
}
