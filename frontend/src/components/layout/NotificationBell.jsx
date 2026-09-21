import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotificationsRequest,
  getUnreadNotificationCountRequest,
  markNotificationAsReadRequest,
  markAllNotificationsAsReadRequest,
} from "../../api/notifications";
import { getErrorMessage } from "../../utils/errorMessage";

// Small, dependency-free relative time formatter — no date library
// installed in this project, so this stays intentionally simple.
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/**
 * Notification bell + dropdown, rendered only for authenticated users.
 * Unread count is fetched once the user becomes available (not on
 * every render, not for logged-out visitors). The full notification
 * list is only fetched when the dropdown is actually opened, per the
 * "don't fetch the list for every page load" requirement.
 */
const NotificationBell = () => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const containerRef = useRef(null);

  // Fetch unread count when the user becomes available (login), and
  // reset to 0 when they're not (logout) — no polling, no interval.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setHasLoadedOnce(false);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCountRequest();
        setUnreadCount(count);
      } catch {
        // A failed background count fetch shouldn't show an error UI
        // for something this minor — the badge just stays at its last
        // known value (or 0).
      }
    };

    loadUnreadCount();
  }, [user]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [list, count] = await Promise.all([
        getNotificationsRequest(),
        getUnreadNotificationCountRequest(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
      setHasLoadedOnce(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.read) return; // already-read items never call the API again

    try {
      await markNotificationAsReadRequest(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadRequest();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 text-muted hover:text-white transition-colors duration-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-primary text-white text-[10px] font-semibold rounded-full leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-surface border border-white/10 rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] uppercase tracking-wider text-primary hover:text-secondary transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && !hasLoadedOnce ? (
              <p className="text-muted text-sm text-center py-8">Loading notifications...</p>
            ) : error ? (
              <p className="text-primary text-sm text-center py-8 px-4">{error}</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">No new notifications</p>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors duration-200 ${
                      notification.read ? "hover:bg-white/[0.02]" : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    {!notification.read && (
                      <span className="w-1 shrink-0 bg-primary rounded-full mt-1" />
                    )}
                    <div className={notification.read ? "pl-4" : ""}>
                      <p className="text-white text-sm font-medium">{notification.title}</p>
                      <p className="text-muted text-xs mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-muted/70 text-[10px] uppercase tracking-wider mt-1.5">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;