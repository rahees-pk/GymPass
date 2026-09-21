import express from "express";
import {
  createMembership,
  getMyMembership,
  getMembershipById,
  cancelMembership,
  checkActiveMembership,
} from "../controllers/membership.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createMembership);

// IMPORTANT: these two must be declared BEFORE "/:id" below.
// Express matches routes top-to-bottom, so if "/:id" came first,
// requests to "/me" or "/check-active" would incorrectly match "/:id"
// with :id === "me" / "check-active" and never reach these handlers.
router.get("/me", authenticate, getMyMembership);
router.get("/check-active", authenticate, checkActiveMembership);

router.get("/:id", authenticate, getMembershipById);
router.patch("/:id/cancel", authenticate, cancelMembership);

export default router;