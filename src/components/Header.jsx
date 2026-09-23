import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import getInitials from "../utils/getInitial";
import { logoutApi } from "../api/authApi";
import { getMyNotificationsApi } from "../api/instrumentApi";

export function Header({ user,title,subtitle,setCurrentUser}) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const role = String(user?.role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const notificationPath = role === "LAB_SUPERVISOR"
    ? "/supervisor/notifications"
    : role === "TESTING_OFFICER"
      ? "/testing-person/notifications"
      : "";

  useEffect(() => {
    if (!notificationPath) {
      setUnreadCount(0);
      return undefined;
    }

    const loadUnreadCount = () => {
      getMyNotificationsApi()
        .then((response) => {
          const payload = response?.data ?? response;
          const rows = Array.isArray(payload)
            ? payload
            : payload?.data || payload?.notifications || [];
          setUnreadCount(
            Array.isArray(rows) ? rows.filter((item) => !item.isRead).length : 0,
          );
        })
        .catch(() => setUnreadCount(0));
    };

    loadUnreadCount();
    const refresh = window.setInterval(loadUnreadCount, 30000);
    window.addEventListener("notifications-updated", loadUnreadCount);
    return () => {
      window.clearInterval(refresh);
      window.removeEventListener("notifications-updated", loadUnreadCount);
    };
  }, [notificationPath, location.pathname]);

  const openNotifications = () => {
    if (notificationPath) navigate(notificationPath);
  };

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
        <button
          type="button"
          className="nawi-icon-button relative mr-3"
          aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
          onClick={openNotifications}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#d32845] px-0.5 text-[9px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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
          {isOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-30 min-w-[240px] overflow-hidden rounded-xl border border-[#e4eaf2] bg-white p-1.5 shadow-[0_16px_35px_rgba(23,32,51,0.14)] ring-1 ring-black/[0.02]" role="menu">
            <div className="px-3 py-3">
              <span className="block break-words text-[13px] font-semibold tracking-[-0.1px] text-[#17345a]">{user?.email || "Email unavailable"}</span>
            </div>
            <button type="button" className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 border-t border-[#edf0f4] bg-transparent px-3 py-2.5 text-left text-[13px] font-semibold text-[#d32845] transition-colors hover:bg-[#fff4f5] hover:text-[#ad1d36]" onClick={handleLogout}><LogOut size={16} strokeWidth={2.2} />Logout</button>
          </div>}
        </div>
      </div>
    </header>
  );
}

export default Header;
