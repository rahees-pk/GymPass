import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const SALT_ROUNDS = 10;

/**
 * Converts a "zeit/ms"-style duration string (e.g. "7d", "12h", "30m")
 * into milliseconds, for use as the cookie's maxAge.
 * Falls back to 7 days if the format isn't recognized.
 */
const parseDurationToMs = (duration) => {
  const fallbackMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  if (!duration || typeof duration !== "string") return fallbackMs;

  const match = duration.match(/^(\d+)\s*(d|h|m|s)$/i);
  if (!match) return fallbackMs;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (unitToMs[unit] || unitToMs.d);
};

/**
 * Builds the standard cookie options used whenever we set the JWT.
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: parseDurationToMs(process.env.JWT_EXPIRES_IN),
});

/**
 * POST /api/auth/register
 * Public. Creates a "user" or "owner" account. "admin" cannot self-register.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Only "user" or "owner" may self-register. Default to "user" if not provided.
    let requestedRole = role || "user";
    if (requestedRole !== "user" && requestedRole !== "owner") {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'owner'" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: requestedRole,
    });

    const token = generateToken(user._id.toString(), user.role);
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Something went wrong during registration" });
  }
};

/**
 * POST /api/auth/login
 * Public. Verifies credentials and issues a session cookie.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // passwordHash is select:false on the schema, so we must opt back in.
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    // Generic message for both "no such user" and "wrong password".
    const invalidCredentialsResponse = () =>
      res.status(401).json({ message: "Invalid credentials" });

    if (!user) {
      return invalidCredentialsResponse();
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return invalidCredentialsResponse();
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "This account has been suspended" });
    }

    const token = generateToken(user._id.toString(), user.role);
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong during login" });
  }
};

/**
 * POST /api/auth/logout
 * Clears the session cookie. JWTs are stateless, so no server-side
 * invalidation is needed beyond removing the cookie.
 */
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

/**
 * GET /api/auth/me
 * Special case: ALWAYS returns 200, with either the current user or null.
 * This endpoint intentionally does NOT use the shared `authenticate`
 * middleware (which returns 401 on failure) — it performs its own,
 * non-throwing verification so the frontend can safely call this on
 * every app load without handling an error case just to learn "nobody's
 * logged in". All other protected routes continue to use `authenticate`
 * and correctly return 401/403 as normal.
 */
export const getMe = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(200).json({ user: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(200).json({ user: null });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.status === "suspended") {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(200).json({ user: null });
  }
};