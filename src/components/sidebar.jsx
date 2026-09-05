import { FileText, FolderOpen, FlaskConical, LogOut, Scale, UserRound, UsersRound, House } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useContext } from "react";
import nawiIcon from "../assets/nawi-icon.png";
import { AuthContext } from "../context/authContextByValue";
import { logoutApi } from "../api/authApi";

const navigation = [
  { label: "Dashboard", to: "/testing-person/dashboard", icon: House },
  { label: "My Tests", to: "/testing-person/tests", icon: FlaskConical },
  { label: "Instruments", to: "/testing-person/instruments", icon: Scale },
  { label: "Reports", to: "/admin/reports", icon: FileText },
  { label: "Documents", to: "/testing-person/documents", icon: FolderOpen },
  { label: "Profile", to: "/testing-person/profile", icon: UserRound },
];

export function Sidebar() {
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const location = useLocation();
  // Route fallback keeps the admin sidebar correct even during auth hydration.
  const isAdmin = ["NAWI_ADMIN", "ADMIN", "ADMINISTRATOR"].includes(String(currentUser?.role || "").toUpperCase()) || location.pathname.startsWith("/admin/");
  const visibleNavigation = navigation
    .filter(({ label }) => !isAdmin || !["My Tests", "Instruments"].includes(label))
    .map((item) => isAdmin && item.label === "Dashboard" ? { ...item, to: "/admin/dashbaord" } : item);
  const handleLogout = async () => {
    try { await logoutApi(); } finally { setCurrentUser(null); window.location.assign("/login"); }
  };
  return (
    <aside className="nawi-sidebar">
      <div className="nawi-brand">
        <img src={nawiIcon} alt="NAWI Pro" />
      </div>

      <nav className="nawi-nav" aria-label="Main navigation">
        {visibleNavigation.map(({ label, to, icon: Icon }) => (
          <NavLink key={label} to={to} className={({ isActive }) => `nawi-nav-link${isActive ? " active" : ""}`}>
            <Icon size={16} strokeWidth={1.7} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nawi-sidebar-footer">
        <button type="button" className="nawi-nav-link" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.7} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
