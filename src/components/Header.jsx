import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import getInitials from "../utils/getInitial";
import { logoutApi } from "../api/authApi";

export function Header({ user,title,subtitle,setCurrentUser}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logoutApi(); } finally {
      setIsOpen(false);
      setCurrentUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="nawi-header">
      <div className="nawi-government-copy">
          <span>{title}</span>
          <span>{subtitle}</span>
       
      </div>
      <div className="nawi-header-actions">
        <button type="button" className="nawi-icon-button" aria-label="Notifications">
          <Bell size={20} />
          <i />
        </button>
        <div className="relative">
          <button type="button" className="flex cursor-pointer items-center gap-[11px] border-0 bg-transparent p-0 text-left text-inherit" aria-expanded={isOpen} aria-haspopup="menu" onClick={() => setIsOpen((open) => !open)}>
            <div className="nawi-user-avatar">{getInitials(user?.name || "User")}</div>
            <div className="nawi-user-details">
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || ""}</span>
            </div>
            <ChevronDown size={16} className={`ml-2.5 text-[#122744] transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && <div className="absolute right-0 top-[calc(100%+14px)] z-30 min-w-[300px] overflow-hidden rounded-2xl border border-[#e4eaf2] bg-white p-2 shadow-[0_20px_50px_rgba(23,32,51,0.14)] ring-1 ring-black/[0.02]" role="menu">
            <div className="px-4 py-4">
              <span className="block break-words text-[14px] font-semibold tracking-[-0.1px] text-[#17345a]">{user?.email || "Email unavailable"}</span>
            </div>
            <button type="button" className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 border-t border-[#edf0f4] bg-transparent px-4 py-3.5 text-left text-[13px] font-semibold text-[#d32845] transition-colors hover:bg-[#fff4f5] hover:text-[#ad1d36]" onClick={handleLogout}><LogOut size={17} strokeWidth={2.2} />Logout</button>
          </div>}
        </div>
      </div>
    </header>
  );
}

export default Header;
