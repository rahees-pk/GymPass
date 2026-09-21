import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchOwnerGyms, deleteGymRequest } from "../../api/gyms";
import { getErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";

const OwnerGymDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log("CURRENT USER:", user);
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [gymPendingDelete, setGymPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadGyms = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchOwnerGyms();
      setGyms(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGyms();
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!gymPendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteGymRequest(gymPendingDelete._id);
      // Remove from UI without a full page reload/refetch.
      setGyms((prev) => prev.filter((g) => g._id !== gymPendingDelete._id));
      setSuccessMessage(`"${gymPendingDelete.name}" was deleted successfully.`);
      setGymPendingDelete(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setGymPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10 pb-6 border-b border-white/10">
          <div>
  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
    My Gyms
  </h1>

  <p className="text-muted mt-1.5 text-sm">
    Welcome, {user?.name}
  </p>

  <p className="text-primary text-[11px] font-semibold uppercase tracking-wider mt-2">
    Role: {user?.role}
  </p>
</div>
          <Link
            to="/owner/gyms/add"
            className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 transition-colors duration-200"
          >
            + Add Gym
          </Link>
        </div>

        {successMessage && (
          <div className="border border-green-500/40 bg-green-500/5 text-green-400 text-sm px-4 py-3 mb-6">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="border border-primary/40 bg-primary/5 text-primary text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-muted text-sm text-center py-20">Loading your gyms...</p>
        ) : gyms.length === 0 ? (
          <div className="border border-white/10 bg-surface px-8 py-16 text-center">
            <p className="text-white font-medium tracking-tight">No gyms registered yet</p>
            <p className="text-muted text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Add your first gym to start appearing on GymPass once it's approved by our team.
            </p>
            <Link
              to="/owner/gyms/add"
              className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 transition-colors duration-200 mt-8"
            >
              + Add Gym
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => (
              <div
                key={gym._id}
                className="bg-surface border border-white/10 hover:border-white/20 transition-colors duration-200 flex flex-col"
              >
                <div className="w-full aspect-video bg-black/40">
                  {gym.images?.[0]?.url ? (
                    <img
                      src={gym.images[0].url}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs uppercase tracking-wider">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-semibold tracking-tight leading-snug">
                      {gym.name}
                    </h3>
                    <StatusBadge status={gym.status} />
                  </div>

                  <p className="text-muted text-sm mt-2 leading-relaxed line-clamp-2">
                    {gym.description}
                  </p>

                  <p className="text-muted text-xs mt-4 uppercase tracking-wider">
                    {gym.address?.city}, {gym.address?.state}
                  </p>

                  {gym.facilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {gym.facilities.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] uppercase tracking-wider px-2 py-1 border border-white/10 text-muted"
                        >
                          {f}
                        </span>
                      ))}
                      {gym.facilities.length > 3 && (
                        <span className="text-[10px] text-muted px-1 py-1">
                          +{gym.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-muted text-[11px] mt-4">
                    Added {new Date(gym.createdAt).toLocaleDateString("en-IN")}
                  </p>

                  <div className="flex items-stretch gap-2 mt-5 pt-5 border-t border-white/10">
                    <button
                      onClick={() => navigate(`/owner/gyms/${gym._id}`, { state: { gym } })}
                      className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-white/10 text-muted hover:text-white hover:border-white/25 transition-colors duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/owner/gyms/${gym._id}/edit`, { state: { gym } })}
                      className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-white/10 text-muted hover:text-white hover:border-white/25 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setGymPendingDelete(gym)}
                      className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-primary/30 text-primary hover:bg-primary/5 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(gymPendingDelete)}
        title="Delete this gym?"
        message={`"${gymPendingDelete?.name}" and its images will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setGymPendingDelete(null)}
      />
    </div>
  );
};

export default OwnerGymDashboard;