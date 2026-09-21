import express from "express";
import { getAllGyms, updateGymStatus } from "../controllers/adminGym.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

// GET /api/admin/gyms
// GET /api/admin/gyms?status=pending
router.get("/", authenticate, authorize("admin"), getAllGyms);

// PATCH /api/admin/gyms/:id/status
router.patch("/:id/status", authenticate, authorize("admin"), updateGymStatus);

export default router;