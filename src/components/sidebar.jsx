import { AlertTriangle, ChevronRight, ClipboardList, FileText, House, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useContext } from "react";
import nawiIcon from "../assets/nawi-icon.png";
import { AuthContext } from "../context/authContextByValue";
import getInitials from "../utils/getInitial";
const navigation = [
  { label: "Dashboard", to: "/testing-person/dashboard", icon: House },
  { label: "Reports", to: "/admin/reports", icon: FileText },
];

const supervisorNavigation = [
  { label: "Dashboard", to: "/supervisor/dashbaord", icon: House },
  { label: "Testing Officers", to: "/supervisor/testing-officers", icon: Users },
  { label: "Evaluations", to: "/supervisor/evaluations", icon: ClipboardList },
  { label: "Non-Compliance", to: "/supervisor/non-compliance", icon: AlertTriangle },
  { label: "Reports", to: "/supervisor/reports", icon: FileText },
];

export function Sidebar() {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const role = String(currentUser?.role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const isLabSupervisor = role === "LAB_SUPERVISOR";
  // Route fallback keeps the admin sidebar correct even during auth hydration.
  const isAdmin = ["NAWI_ADMIN", "ADMIN", "ADMINISTRATOR"].includes(String(currentUser?.role || "").toUpperCase()) || location.pathname.startsWith("/admin/");
  const visibleNavigation = (isLabSupervisor ? supervisorNavigation : navigation)
    .filter(({ label }) => !isAdmin || !["My Tests", "Instruments"].includes(label))
    .map((item) => isAdmin && item.label === "Dashboard" ? { ...item, to: "/admin/dashbaord" } : item);
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
        <NavLink to="/testing-person/profile" className="nawi-sidebar-profile" aria-label="View profile">
          <div className="nawi-sidebar-profile-avatar">{getInitials(currentUser?.name || "User")}</div>
          <div className="nawi-sidebar-profile-copy">
            <strong>{currentUser?.name || "User"}</strong>
            <span>View Profile</span>
          </div>
          <ChevronRight size={21} strokeWidth={2} />
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
