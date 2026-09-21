/**
 * Middleware factory for role-based authorization.
 * Must be used AFTER the `authenticate` middleware, since it relies on
 * req.user being already populated.
 *
 * Usage:
 *   authorize("admin")
 *   authorize("owner")
 *   authorize("owner", "admin")
 *
 * @param  {...string} allowedRoles - roles permitted to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive check: authenticate should always run first.
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export default authorize;