import Notification from "../models/Notification.js";

/**
 * GET /api/notifications
 * Authenticated. Returns only the requesting user's notifications,
 * newest first. Never accepts a userId from query/body — always
 * scoped to req.user.id.
 */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Get my notifications error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching notifications" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Authenticated. Returns the count of the user's unread notifications.
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Get unread notification count error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching your unread count" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Authenticated. Marks one of the user's own notifications as read.
 * The query itself is scoped by both _id AND user, so this can never
 * touch another user's notification, even by guessing an id.
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return res.status(500).json({ message: "Something went wrong while updating the notification" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Authenticated. Marks all of the user's own unread notifications as
 * read in one operation.
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return res.status(500).json({ message: "Something went wrong while updating your notifications" });
  }
};