import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGymById } from "../../api/publicGyms";
import { checkActiveMembershipRequest } from "../../api/memberships";
import { getActiveCheckInRequest, createCheckInRequest } from "../../api/checkins";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const GymDetailsPublic = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [gym, setGym] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Membership + active check-in status, loaded only for logged-in
  // users. Kept separate from the gym's own loading state so a slow
  // or failed check never blocks the gym content itself.
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [isAccessStatusLoading, setIsAccessStatusLoading] = useState(false);

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState("");

  useEffect(() => {
    const loadGym = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchGymById(id);
        setGym(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadGym();
  }, [id]);

  const loadAccessStatus = async () => {
    if (!user) {
      setHasActiveMembership(false);
      setActiveCheckIn(null);
      return;
    }

    setIsAccessStatusLoading(true);
    try {
      const [{ hasMembership }, checkIn] = await Promise.all([
        checkActiveMembershipRequest(),
        getActiveCheckInRequest(),
      ]);
      setHasActiveMembership(hasMembership);
      setActiveCheckIn(checkIn);
    } catch (err) {
      // Fail safe rather than blocking the page — treat as no
      // membership / no active check-in, same as a logged-out visitor.
      setHasActiveMembership(false);
      setActiveCheckIn(null);
    } finally {
      setIsAccessStatusLoading(false);
    }
  };

  useEffect(() => {
    loadAccessStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCheckIn = async () => {
    if (!gym) return;
    setIsCheckingIn(true);
    setCheckInError("");
    setCheckInSuccess("");
    try {
      await createCheckInRequest(gym._id);
      setCheckInSuccess("You're checked in. Enjoy your session!");
      await loadAccessStatus();
    } catch (err) {
      setCheckInError(getErrorMessage(err));
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <p className="text-muted text-sm text-center py-32">Loading gym...</p>
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center px-6 text-center py-32">
          <p className="text-white font-semibold tracking-tight text-lg">Gym not found</p>
          <p className="text-muted text-sm mt-2">{error || "This gym may no longer be available."}</p>
          <Link
            to="/gyms"
            className="text-primary text-xs uppercase tracking-wider mt-6 hover:text-secondary transition-colors duration-200"
          >
            ← Back to Discover Gyms
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = gym.images?.[0]?.url;
  const additionalImages = gym.images?.slice(1) || [];
  const hasRating = gym.rating?.count > 0;

  const isCheckedInHere = activeCheckIn && activeCheckIn.gym?._id === gym._id;
  const isCheckedInElsewhere = activeCheckIn && activeCheckIn.gym?._id !== gym._id;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero with name/location overlaid at the bottom */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-black/40">
        {heroImage ? (
          <img src={heroImage} alt={gym.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs uppercase tracking-wider">
            No Image Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:pb-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              {gym.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
              <p className="text-muted text-sm uppercase tracking-wider">
                {gym.address?.city}, {gym.address?.state}
              </p>
              {hasRating && (
                <>
                  <span className="w-px h-3.5 bg-white/20" />
                  <p className="text-white text-sm">
                    {gym.rating.average.toFixed(1)} <span className="text-primary">★</span>{" "}
                    <span className="text-muted">({gym.rating.count} reviews)</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <Link
          to="/gyms"
          className="group inline-flex items-center gap-1.5 text-muted text-xs uppercase tracking-wider hover:text-white transition-colors duration-200"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
          Back to Discover Gyms
        </Link>

        <div className="py-9 border-b border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">About</h2>
          <p className="text-white text-sm sm:text-base leading-relaxed">{gym.description}</p>
        </div>

        <div className="py-9 border-b border-white/10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
            Facilities
          </h2>
          {gym.facilities?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gym.facilities.map((f) => (
                <div key={f} className="flex items-center gap-2.5 border border-white/10 px-4 py-3">
                  <span className="w-1 h-3.5 bg-primary shrink-0" />
                  <span className="text-white text-sm">{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No facilities listed yet.</p>
          )}
        </div>

        <div className="py-9 border-b border-white/10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Location
          </h2>
          <p className="text-white text-sm leading-relaxed">
            {gym.address?.addressLine}
            <br />
            {gym.address?.city}, {gym.address?.state} {gym.address?.pincode}
            <br />
            {gym.address?.country}
          </p>
        </div>

        {additionalImages.length > 0 && (
          <div className="py-9 border-b border-white/10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
              Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {additionalImages.map((img) => (
                <div
                  key={img.publicId}
                  className="group aspect-square overflow-hidden border border-white/10"
                >
                  <img
                    src={img.url}
                    alt={gym.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membership + check-in aware CTA */}
        <div className="pt-9">
          {checkInSuccess && (
            <div className="border border-green-500/30 bg-green-500/5 text-green-400 text-sm px-6 py-3 mb-4">
              {checkInSuccess}
            </div>
          )}
          {checkInError && (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-6 py-3 mb-4">
              {checkInError}
            </div>
          )}

          <div className="text-center sm:text-left">
            {isAccessStatusLoading ? (
              <div className="inline-flex items-center justify-center border border-white/10 text-muted text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4">
                Checking Access...
              </div>
            ) : !hasActiveMembership ? (
              <Link
                to="/membership"
                className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200"
              >
                {user ? "Get Access" : "Get Membership"}
              </Link>
            ) : isCheckedInHere ? (
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="inline-flex items-center justify-center border border-green-500/30 text-green-400 text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4">
                  Checked In — {formatDateTime(activeCheckIn.checkedInAt)}
                </span>
                <Link
                  to="/dashboard"
                  className="text-xs uppercase tracking-wider text-muted hover:text-white transition-colors duration-200"
                >
                  Manage on Dashboard →
                </Link>
              </div>
            ) : isCheckedInElsewhere ? (
              <div>
                <button
                  disabled
                  className="inline-flex items-center justify-center border border-white/20 text-muted text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 cursor-not-allowed"
                >
                  Check In
                </button>
                <p className="text-muted text-xs mt-3">
                  You're checked into {activeCheckIn.gym?.name || "another gym"}.{" "}
                  <Link to="/dashboard" className="text-primary hover:text-secondary transition-colors duration-200">
                    Check out first
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="inline-flex items-center justify-center bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200"
              >
                {isCheckingIn ? "Checking In..." : "Check In"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymDetailsPublic;