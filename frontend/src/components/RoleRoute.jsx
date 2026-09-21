import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guards nested routes so only specific roles can access them.
 * Must be used nested inside <ProtectedRoute />, which already
 * confirmed the user is authenticated and loading has finished.
 *
 * Usage:
 *   <Route element={<RoleRoute allowedRoles={["owner"]} />}>
 *     <Route path="/owner/dashboard" element={<OwnerDashboard />} />
 *   </Route>
 */
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Defensive fallback in case RoleRoute is ever used without
    // being nested under ProtectedRoute.
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;