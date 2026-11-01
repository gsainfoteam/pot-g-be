import { account } from "./lib/account";
import { AccountProvider } from "@gsainfoteam/account-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccountProvider
      client={account}
      fallback={<p className="placeholder">불러오는 중...</p>}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AccountProvider>
  </StrictMode>,
);
