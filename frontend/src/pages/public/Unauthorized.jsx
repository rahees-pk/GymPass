import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleDashboardPath = (role) => {
  switch (role) {
    case "owner":
      return "/owner/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "user":
      return "/dashboard";
    default:
      return "/";
  }
};

const Unauthorized = () => {
  const { user } = useAuth();
  const returnPath = user ? roleDashboardPath(user.role) : "/";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-surface border border-white/10 rounded-2xl p-8 sm:p-10">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
            <span className="text-primary text-2xl font-bold">!</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">Access Denied</h1>

          <p className="text-muted mt-3 text-sm sm:text-base leading-relaxed">
            You&apos;re signed in, but your account doesn&apos;t have permission to view this
            page. If you believe this is a mistake, contact GymPass support.
          </p>

          <Link
            to={returnPath}
            className="inline-block mt-8 bg-primary hover:bg-secondary text-white font-semibold rounded-lg px-6 py-2.5 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;