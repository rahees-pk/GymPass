import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyMembership } from "../../api/memberships";
import {
  getActiveCheckInRequest,
  checkoutRequest,
  getCheckInHistoryRequest,
} from "../../api/checkins";
import { getErrorMessage } from "../../utils/errorMessage";

const STATUS_STYLES = {
  active: "border-l-green-500 text-green-400",
  expired: "border-l-accent text-accent",
  cancelled: "border-l-primary text-primary",
  completed: "border-l-white/30 text-muted",
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const Dashboard = () => {
  const { user } = useAuth();

  const [membership, setMembership] = useState(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(true);
  const [membershipError, setMembershipError] = useState("");

  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [isCheckInLoading, setIsCheckInLoading] = useState(true);
  const [checkInError, setCheckInError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");

  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const loadMembership = async () => {
    setIsMembershipLoading(true);
    setMembershipError("");
    try {
      const data = await fetchMyMembership();
      setMembership(data);
    } catch (err) {
      setMembershipError(getErrorMessage(err));
    } finally {
      setIsMembershipLoading(false);
    }
  };

  const loadActiveCheckIn = async () => {
    setIsCheckInLoading(true);
    setCheckInError("");
    try {
      const data = await getActiveCheckInRequest();
      setActiveCheckIn(data);
    } catch (err) {
      setCheckInError(getErrorMessage(err));
    } finally {
      setIsCheckInLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await getCheckInHistoryRequest();
      setHistory(data);
    } catch (err) {
      setHistoryError(getErrorMessage(err));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadMembership();
    loadActiveCheckIn();
    loadHistory();
  }, []);

  const handleCheckout = async () => {
    if (!activeCheckIn) return;
    setIsCheckingOut(true);
    setCheckoutError("");
    setCheckoutSuccess("");
    try {
      await checkoutRequest(activeCheckIn._id);
      setCheckoutSuccess("Checked out successfully.");
      await Promise.all([loadActiveCheckIn(), loadHistory()]);
    } catch (err) {
      setCheckoutError(getErrorMessage(err));
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Account header */}
        <div className="pb-8 border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            My Account
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            {user?.name}
          </h1>
          <p className="text-muted text-sm mt-1">{user?.email}</p>
        </div>

        {/* Gym Access entry point */}
        <div className="pt-10 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Gym Access
            </h2>
            <p className="text-white text-sm">
              Scan a gym's QR code to check in instantly.
            </p>
          </div>
          <Link
            to="/scan"
            className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3 transition-colors duration-200 shrink-0"
          >
            Scan Gym QR
          </Link>
        </div>

        {/* Membership section */}
        <div className="pt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-5">
            My Membership
          </h2>

          {isMembershipLoading ? (
            <p className="text-muted text-sm text-center py-16">Loading your membership...</p>
          ) : membershipError ? (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-6 py-8 text-center">
              {membershipError}
            </div>
          ) : !membership ? (
            <div className="border border-white/10 px-8 py-14 text-center">
              <p className="text-white font-medium tracking-tight">
                You don't currently have an active membership
              </p>
              <p className="text-muted text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Choose a plan to get access to every approved partner gym on GymPass.
              </p>
              <Link
                to="/membership"
                className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-3.5 transition-colors duration-200 mt-8"
              >
                View Membership Plans
              </Link>
            </div>
          ) : (
            <div className="border border-white/10 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Plan</p>
                  <p className="text-white text-xl font-semibold tracking-tight capitalize mt-1">
                    {membership.plan}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center border-l-2 pl-2 pr-1 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                    STATUS_STYLES[membership.status] || STATUS_STYLES.cancelled
                  }`}
                >
                  {membership.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Start Date
                  </p>
                  <p className="text-white text-sm mt-1.5">{formatDate(membership.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    End Date
                  </p>
                  <p className="text-white text-sm mt-1.5">{formatDate(membership.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Amount Paid
                  </p>
                  <p className="text-white text-sm mt-1.5">₹{membership.amount}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-8 border-t border-white/10">
                <Link
                  to="/gyms"
                  className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3 transition-colors duration-200"
                >
                  Explore Gyms
                </Link>
                <Link
                  to="/membership"
                  className="inline-flex items-center justify-center border border-white/20 hover:border-white/40 text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3 transition-colors duration-200"
                >
                  View Membership Plans
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Active check-in section */}
        <div className="pt-14">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-5">
            Active Check-in
          </h2>

          {checkoutSuccess && (
            <div className="border border-green-500/30 bg-green-500/5 text-green-400 text-sm px-6 py-3 mb-4">
              {checkoutSuccess}
            </div>
          )}
          {checkoutError && (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-6 py-3 mb-4">
              {checkoutError}
            </div>
          )}

          {isCheckInLoading ? (
            <p className="text-muted text-sm text-center py-16">Checking your gym status...</p>
          ) : checkInError ? (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-6 py-8 text-center">
              {checkInError}
            </div>
          ) : !activeCheckIn ? (
            <div className="border border-white/10 px-8 py-14 text-center">
              <p className="text-white font-medium tracking-tight">
                You're not currently checked into a gym
              </p>
              <p className="text-muted text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Head to a partner gym and check in from its details page, or scan the gym's QR
                code, to start a session.
              </p>
              <Link
                to="/gyms"
                className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-3.5 transition-colors duration-200 mt-8"
              >
                Explore Gyms
              </Link>
            </div>
          ) : (
            <div className="border border-white/10 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Checked In At
                  </p>
                  <p className="text-white text-xl font-semibold tracking-tight mt-1">
                    {activeCheckIn.gym?.name || "Unknown gym"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center border-l-2 pl-2 pr-1 py-0.5 text-[11px] font-medium uppercase tracking-wider ${STATUS_STYLES.active}`}
                >
                  Active
                </span>
              </div>

              <p className="text-muted text-sm mt-4">
                Since {formatDateTime(activeCheckIn.checkedInAt)}
              </p>

              <div className="mt-8 pt-8 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="inline-flex items-center justify-center bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-3.5 transition-colors duration-200"
                >
                  {isCheckingOut ? "Checking Out..." : "Check Out"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Check-in history */}
        <div className="pt-14 pb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-5">
            Check-in History
          </h2>

          {isHistoryLoading ? (
            <p className="text-muted text-sm text-center py-16">Loading your check-in history...</p>
          ) : historyError ? (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-6 py-8 text-center">
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <div className="border border-white/10 px-8 py-14 text-center">
              <p className="text-muted text-sm">You have no check-in history yet.</p>
            </div>
          ) : (
            <div className="border border-white/10 divide-y divide-white/10">
              {history.map((entry) => (
                <div
                  key={entry._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-5"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {entry.gym?.name || "Unknown gym"}
                    </p>
                    <p className="text-muted text-xs mt-1">
                      In: {formatDateTime(entry.checkedInAt)}
                      {entry.checkedOutAt && <> · Out: {formatDateTime(entry.checkedOutAt)}</>}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center self-start sm:self-auto border-l-2 pl-2 pr-1 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                      STATUS_STYLES[entry.status] || STATUS_STYLES.completed
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;