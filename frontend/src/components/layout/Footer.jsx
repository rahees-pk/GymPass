import { Link } from "react-router-dom";

/**
 * Reusable public-site footer, shared across Home, Gym Discovery,
 * Gym Details, Membership, and any other public page. Matches the
 * Navbar's brand mark and the site-wide design system — no fake
 * social links, contact details, or unsupported claims.
 */
const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="w-2 h-5 bg-primary" />
              <span className="text-lg font-bold tracking-tight text-white">
                Gym<span className="text-primary">Pass</span>
              </span>
            </Link>
            <p className="text-muted text-sm mt-4 max-w-xs leading-relaxed">
              One membership. Every approved partner gym. GymPass makes it simple to discover
              and access quality training spaces through a single platform.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-white hover:text-primary transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/gyms"
                  className="text-sm text-white hover:text-primary transition-colors duration-200"
                >
                  Gyms
                </Link>
              </li>
              <li>
                <Link
                  to="/membership"
                  className="text-sm text-white hover:text-primary transition-colors duration-200"
                >
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-white hover:text-primary transition-colors duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-white hover:text-primary transition-colors duration-200"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6">
          <p className="text-muted text-xs">© 2026 GymPass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;