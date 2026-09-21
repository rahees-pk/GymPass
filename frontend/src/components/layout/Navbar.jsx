import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

const roleDashboardPath = (role) => {
  switch (role) {
    case "owner":
      return "/owner/gyms";
    case "admin":
      return "/admin/gyms";
    case "user":
    default:
      return "/dashboard";
  }
};

const roleDashboardLabel = (role) => {
  switch (role) {
    case "owner":
      return "Owner Dashboard";
    case "admin":
      return "Admin Dashboard";
    case "user":
    default:
      return "Dashboard";
  }
};

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors duration-200 ${
    isActive ? "text-white" : "text-muted hover:text-white"
  }`;

/**
 * Public-facing navbar, rendered once by PublicLayout. Fixed to the
 * top of the viewport, subtle translucent/glass background. The
 * role-aware dashboard link/label is derived from the authenticated
 * user's role via roleDashboardPath/roleDashboardLabel — no new auth
 * logic, ProtectedRoute, or RoleRoute changes involved.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-2 h-5 bg-primary" />
            <span className="text-xl font-bold tracking-tight text-white">
              Gym<span className="text-primary">Pass</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-9">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/gyms" className={navLinkClass}>
              Gyms
            </NavLink>
          </nav>

          {/* Desktop auth actions */}
          <div className="hidden sm:flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to={roleDashboardPath(user.role)}
                  className="text-sm font-medium text-muted hover:text-white transition-colors duration-200"
                >
                  {roleDashboardLabel(user.role)}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold uppercase tracking-wider border border-white/15 hover:border-white/30 text-white rounded-md px-5 py-2.5 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-secondary hover:opacity-90 text-white rounded-md px-5 py-2.5 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

               <NotificationBell />

          {/* Mobile menu toggle — simple hamburger, no icon library */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="sm:hidden flex flex-col items-end gap-1.5 w-8 h-8 justify-center"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-px bg-white transition-all duration-200 ${
                isMenuOpen ? "w-6 rotate-45 translate-y-[3px]" : "w-6"
              }`}
            />
            <span
              className={`block h-px bg-white transition-all duration-200 ${
                isMenuOpen ? "w-6 -rotate-45 -translate-y-[3px]" : "w-4"
              }`}
            />
          </button>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div className="sm:hidden pb-8 flex flex-col gap-5 border-t border-white/10 pt-6">
            <NavLink to="/" end onClick={() => setIsMenuOpen(false)} className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/gyms" onClick={() => setIsMenuOpen(false)} className={navLinkClass}>
              Gyms
            </NavLink>

            {user ? (
              <>
                <Link
                  to={roleDashboardPath(user.role)}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium text-muted hover:text-white transition-colors duration-200"
                >
                  {roleDashboardLabel(user.role)}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold uppercase tracking-wider border border-white/15 text-white rounded-md px-5 py-3 text-left transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium text-muted hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xs font-semibold uppercase tracking-wider bg-primary text-white rounded-md px-5 py-3 text-center transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;