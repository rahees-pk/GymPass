import express from "express";
import {
  createCheckIn,
  checkOut,
  getActiveCheckIn,
  getCheckInHistory,
} from "../controllers/checkin.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createCheckIn);
router.get("/active", authenticate, getActiveCheckIn);
router.get("/history", authenticate, getCheckInHistory);
router.patch("/:id/checkout", authenticate, checkOut);

export default router;