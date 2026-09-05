import { Bell, ChevronDown } from "lucide-react";
import satyamevIcon from "../assets/satyamev_jayte.png";

export function Header({ user }) {
  const displayName = user?.name || "Rahul Sharma";
  const role = user?.role === "NAWI_ADMIN" ? "Admin" : "Testing Person";

  return (
    <header className="nawi-header">
      <div className="nawi-government-copy">
        <img src={satyamevIcon} alt="Satyamev Jayate" />
        <div>
          <span>Department of Consumer Affairs</span>
          <span>Legal Metrology</span>
        </div>
      </div>
      <div className="nawi-header-actions">
        <button type="button" className="nawi-icon-button" aria-label="Notifications">
          <Bell size={20} />
          <i />
        </button>
        <div className="nawi-user-avatar">{displayName.charAt(0)}</div>
        <div className="nawi-user-details">
          <strong>{displayName}</strong>
          <span>{role}</span>
        </div>
        <ChevronDown size={16} className="nawi-chevron" />
      </div>
    </header>
  );
}

export default Header;
