import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payment.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authenticate, createRazorpayOrder);
router.post("/verify", authenticate, verifyRazorpayPayment);

export default router;