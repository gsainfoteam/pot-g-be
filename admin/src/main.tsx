import { account } from "./lib/account";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

// IdP callback 이면 로그인을 마치고, 아니면 refresh 쿠키로 세션을 복구합니다.
void account.ready();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
