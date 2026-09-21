import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import PublicLayout from "./components/layout/PublicLayout";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Unauthorized from "./pages/public/Unauthorized";

import GymDiscovery from "./pages/user/GymDiscovery";
import GymDetailsPublic from "./pages/user/GymDetailsPublic";
import Membership from "./pages/user/Membership";
import Dashboard from "./pages/user/Dashboard";
import ScanGymQR from "./pages/user/ScanGymQR";

import OwnerGymDashboard from "./pages/owner/OwnerGymDashboard";
import AddGym from "./pages/owner/AddGym";
import GymDetails from "./pages/owner/GymDetails";
import EditGym from "./pages/owner/EditGym";

import AdminGymManagement from "./pages/admin/AdminGymManagement";

const AppRoutes = () => (
  <Routes>
    {/* Public routes — share Navbar + Footer via PublicLayout */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/gyms" element={<GymDiscovery />} />
      <Route path="/gyms/:id" element={<GymDetailsPublic />} />
      <Route path="/membership" element={<Membership />} />
    </Route>
    
    <Route element={<RoleRoute allowedRoles={["user"]} />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/scan" element={<ScanGymQR />} />
</Route>

    {/* Protected routes — no PublicLayout, unchanged */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={["owner"]} />}>
        <Route path="/owner/gyms" element={<OwnerGymDashboard />} />
        <Route path="/owner/gyms/add" element={<AddGym />} />
        <Route path="/owner/gyms/:id" element={<GymDetails />} />
        <Route path="/owner/gyms/:id/edit" element={<EditGym />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/gyms" element={<AdminGymManagement />} />
      </Route>
    </Route>

    {/* Unknown routes fall back to Home */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;