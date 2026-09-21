import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Verifies the JWT stored in the httpOnly "token" cookie, loads the
 * corresponding user fresh from the database, and attaches safe user
 * info to req.user for downstream route handlers and authorization
 * middleware to use.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Covers both invalid signature and expired tokens.
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const { userId } = decoded;

    // Fetch the user fresh from the DB — we do NOT trust the role
    // embedded in the token as the final source of truth.
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account is suspended" });
    }

    // Attach only safe, minimal identity info for downstream use.
    req.user = {
      id: user._id.toString(),
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    // Catch-all for unexpected errors (e.g. malformed userId, DB issues)
    return res.status(401).json({ message: "Not authenticated" });
  }
};

export default authenticate;