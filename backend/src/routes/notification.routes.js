import express from "express";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, getMyNotifications);
router.get("/unread-count", authenticate, getUnreadNotificationCount);
router.patch("/read-all", authenticate, markAllNotificationsAsRead);
router.patch("/:id/read", authenticate, markNotificationAsRead);

export default router;