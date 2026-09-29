import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "현황", end: true },
  { to: "/pots", label: "팟 관리" },
  { to: "/routes", label: "노선/정류장 관리" },
  { to: "/users", label: "사용자" },
  { to: "/stats", label: "통계" },
  { to: "/admin-accounts", label: "관리자 계정" },
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
        <Outlet />
      </main>
    </div>
  );
}
