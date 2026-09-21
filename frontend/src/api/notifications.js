import api from "./axios";

/**
 * Notification API calls, built on the existing shared Axios instance
 * — same pattern as every other API module in this project. The
 * backend derives the authenticated user from the httpOnly cookie;
 * nothing here ever sends a userId.
 */

// GET /api/notifications
export const getNotificationsRequest = async () => {
  const res = await api.get("/notifications");
  return res.data.notifications;
};

// GET /api/notifications/unread-count
export const getUnreadNotificationCountRequest = async () => {
  const res = await api.get("/notifications/unread-count");
  return res.data.count;
};

// PATCH /api/notifications/:id/read
export const markNotificationAsReadRequest = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.notification;
};

// PATCH /api/notifications/read-all
export const markAllNotificationsAsReadRequest = async () => {
  const res = await api.patch("/notifications/read-all");
  return res.data;
};