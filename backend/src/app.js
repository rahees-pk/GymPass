import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import gymRoutes from "./routes/gym.routes.js";
import adminGymRoutes from "./routes/adminGym.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

// --- Core middleware ---
app.use(express.json()); // parse incoming JSON request bodies
app.use(cookieParser()); // parse cookies (we'll store the JWT in an httpOnly cookie)

// CORS: allow requests from our Vite frontend, and allow cookies to be sent
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// --- Test route ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "GymPass API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/admin/gyms", adminGymRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;