import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CallbackPage } from "./pages/CallbackPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RoutesPage } from "./pages/RoutesPage";
import { VersionPage } from "./pages/VersionPage";
import { isLoggedIn } from "./lib/auth";

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
        <Route index element={<PlaceholderPage title="현황" refreshable />} />
        <Route path="pots" element={<PlaceholderPage title="팟 관리" />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="versions" element={<VersionPage />} />
        <Route path="users" element={<PlaceholderPage title="사용자" />} />
        <Route path="stats" element={<PlaceholderPage title="통계" refreshable />} />
        <Route
          path="admin-accounts"
          element={<PlaceholderPage title="관리자 계정" />}
        />
      </Route>
    </Routes>
  );
}
