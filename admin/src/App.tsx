import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CallbackPage } from "./pages/CallbackPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { AdminAccountsPage } from "./pages/AdminAccountsPage";
import { PotsPage } from "./pages/PotsPage";
import { PotDetailPage } from "./pages/PotDetailPage";
import { RoutesPage } from "./pages/RoutesPage";
import { VersionPage } from "./pages/VersionPage";
import { UsersPage } from "./pages/UsersPage";
import { UserDetailPage } from "./pages/UserDetailPage";
import { isLoggedIn } from "./lib/auth";
import { PotCleanupPage } from "./pages/PotCleanupPage";
import { FofoMessagesPage } from "./pages/FofoMessagesPage";
import { FofoMessageStatusPage } from "./pages/FofoMessageStatusPage";
import { StatusPage } from "./pages/StatusPage";
import { StatsPage } from "./pages/StatsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="pots" element={<PotsPage />} />
        <Route path="pots/:pk" element={<PotDetailPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="versions" element={<VersionPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:pk" element={<UserDetailPage />} />
        <Route path="fofo-messages" element={<FofoMessagesPage />} />
        <Route path="fofo-message-status" element={<FofoMessageStatusPage />} />
        <Route path="admin-accounts" element={<AdminAccountsPage />} />
        <Route path="pot-cleanup" element={<PotCleanupPage />} />
        <Route index element={<StatusPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
    </Routes>
  );
}
