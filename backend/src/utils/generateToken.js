import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT containing only the minimal identity payload
 * needed to authenticate and authorize a user on future requests.
 *
 * @param {string} userId - MongoDB _id of the user
 * @param {string} role - one of "user" | "owner" | "admin"
 * @returns {string} signed JWT
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Fail loudly and immediately — a missing secret must never be
    // silently ignored, since that would produce an insecure token.
    throw new Error(
      "JWT_SECRET is not defined in environment variables. Cannot generate token."
    );
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const payload = {
    userId,
    role,
  };

  return jwt.sign(payload, secret, { expiresIn });
};

export default generateToken;