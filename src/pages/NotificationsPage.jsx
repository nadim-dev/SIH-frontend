import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { getMyNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from "../api/instrumentApi";
import { formatDate, formatTime } from "../utils/formatDate";

const groupNotificationsByDate = (notifications) => {
  const groups = new Map();
  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toDateString();
    if (!groups.has(key)) {
      groups.set(key, {
        date: key === "unknown" ? "Notifications" : formatDate(notification.createdAt),
        notifications: [],
      });
    }
    groups.get(key).notifications.push(notification);
  });
  return [...groups.values()];
};

export const NotificationsPage = () => {
  const { setHeaderContent } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    setHeaderContent({
      title: "Notifications",
      subtitle: "Updates and messages related to your inspection workflow.",
    });
    const loadNotifications = () => getMyNotificationsApi()
      .then(async (response) => {
        const payload = response?.data ?? response;
        const rows = Array.isArray(payload) ? payload : payload?.data || payload?.notifications || [];
        const notificationRows = Array.isArray(rows) ? rows : [];
        setNotifications(notificationRows);
        setError("");
        if (notificationRows.some((notification) => !notification.isRead)) {
          await markAllNotificationsReadApi();
          setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
          window.dispatchEvent(new Event("notifications-updated"));
        }
      })
      .catch((err) =>
        setError(
          err.response?.data?.message || "Unable to load notifications.",
        ),
      );
    loadNotifications();
    const refreshTimer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [setHeaderContent]);
  const markRead = async (notification) => {
    if (notification.isRead) return;
    await markNotificationReadApi(notification._id);
    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item,
      ),
    );
    window.dispatchEvent(new Event("notifications-updated"));
  };
  const notificationGroups = groupNotificationsByDate(notifications);
  return (
    <main className="min-h-full w-full bg-white px-2 py-4 text-[#172033]">
      <section className="ml-[1.5rem] mr-[2rem] w-auto max-w-none">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-10">
            {notificationGroups.map((group) => (
              <div key={group.date} className="space-y-3">
                <h2 className="text-sm font-bold text-[#172033]">{group.date}</h2>
                <div className="space-y-3">
                  {group.notifications.map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() => markRead(notification)}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 text-left transition-all hover:-translate-y-px hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#4f83e8]">
                        <Bell size={19} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className={`block text-xs leading-5 ${notification.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                          {notification.message}
                        </strong>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 self-start pt-1 text-[10px] text-slate-400">
                        {formatTime(notification.createdAt)}
                        {notification.isRead && <CheckCheck size={14} className="text-emerald-600" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
