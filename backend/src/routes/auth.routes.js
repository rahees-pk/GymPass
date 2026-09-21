import express from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Intentionally NOT using the `authenticate` middleware here.
// getMe performs its own optional, non-throwing session check so this
// route can always respond 200 with { user } or { user: null }.
router.get("/me", getMe);

export default router;