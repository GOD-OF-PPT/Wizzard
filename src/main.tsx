import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./web-v3.css";

const root = createRoot(document.getElementById("root")!);
const reviewState = import.meta.env.DEV ? new URLSearchParams(location.search).get("design-review") : null;
if (reviewState && ["results", "ranking", "rules", "confirm", "lobby", "gameplay", "bid", "chooser", "reconnecting", "session-ended", "create", "join", "connecting", "connection-error", "tab-protection"].includes(reviewState)) {
  document.title = "设计验收样例 · 奇术茶馆";
  void import("./web/DesignReview").then(({ default: Review }) => root.render(<Review state={reviewState} />));
} else {
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
