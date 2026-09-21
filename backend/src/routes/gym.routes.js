import express from "express";
import {
  createGym,
  getGyms,
  getGymById,
  getOwnerGyms,
  updateGym,
  deleteGym,
} from "../controllers/gym.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import uploadGymImages from "../middleware/upload.middleware.js";

const router = express.Router();

// --- Public routes ---
router.get("/", getGyms);

// IMPORTANT: this specific route MUST be declared before "/:id" below.
// Express matches routes top-to-bottom in the order they're registered,
// so if "/:id" came first, a request to "/owner/mine" would match "/:id"
// with :id === "owner" and never reach this handler.
router.get(
  "/owner/mine",
  authenticate,
  authorize("owner", "admin"),
  getOwnerGyms
);

router.get("/:id", getGymById);

// --- Owner/Admin routes ---
router.post(
  "/",
  authenticate,
  authorize("owner", "admin"),
  uploadGymImages,
  createGym
);

router.put(
  "/:id",
  authenticate,
  authorize("owner", "admin"),
  uploadGymImages,
  updateGym
);

router.delete("/:id", authenticate, authorize("owner", "admin"), deleteGym);

export default router;