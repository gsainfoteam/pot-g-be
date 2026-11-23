import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../lib/auth";
import { CurrentManagerProvider } from "../lib/current-manager";

const NAV_ITEMS = [
  { to: "/", label: "현황", end: true },
  { to: "/pots", label: "팟 관리" },
  { to: "/routes", label: "노선/정류장 관리" },
  { to: "/versions", label: "앱 버전" },
  { to: "/popo-messages", label: "포포 메시지" },
  { to: "/popo-message-status", label: "포포 발송/예약 현황" },
  { to: "/users", label: "사용자" },
  { to: "/stats", label: "통계" },
  { to: "/admin-accounts", label: "관리자 계정" },
  { to: "/pot-cleanup", label: "일회성 팟 정리" },
];

export function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccessToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">PotG Admin</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="button secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>
      <main className="main">
        <CurrentManagerProvider>
          <Outlet />
        </CurrentManagerProvider>
      </main>
    </div>
  );
}
