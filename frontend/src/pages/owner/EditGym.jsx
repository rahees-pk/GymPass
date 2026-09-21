import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import GymForm from "./GymForm";
import { updateGymRequest, fetchOwnerGyms } from "../../api/gyms";
import { getErrorMessage } from "../../utils/errorMessage";

const EditGym = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Preferred path: gym data arrives via router state from the dashboard's
  // navigate(..., { state: { gym } }) call — no network request needed.
  // Fallback path: if state is missing (page refresh, direct URL visit,
  // bookmark), we re-fetch the owner's full gym list and find it by id,
  // since the public GET /api/gyms/:id only returns APPROVED gyms and
  // would 404 for a pending/rejected gym being edited.
  const [gym, setGym] = useState(location.state?.gym || null);
  const [isLoading, setIsLoading] = useState(!location.state?.gym);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (gym) return;

    const loadGym = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const gyms = await fetchOwnerGyms();
        const found = gyms.find((g) => g._id === id);
        if (!found) {
          setLoadError("Gym not found, or it doesn't belong to your account.");
        } else {
          setGym(found);
        }
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadGym();
  }, [gym, id]);

  const handleSuccess = () => {
    setTimeout(() => navigate("/owner/gyms"), 1200);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/owner/gyms"
          className="text-xs uppercase tracking-wider text-muted hover:text-white transition-colors duration-200"
        >
          ← Back to My Gyms
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-4">
          Edit Gym
        </h1>
        <p className="text-muted mt-2 text-sm mb-10 leading-relaxed">
          Changes to an approved gym go live immediately. Ownership, status, and rating cannot be
          changed here.
        </p>

        <div className="bg-surface border border-white/10 p-6 sm:p-10">
          {isLoading ? (
            <p className="text-muted text-sm text-center py-14">Loading gym details...</p>
          ) : loadError ? (
            <p className="text-primary text-sm text-center py-14">{loadError}</p>
          ) : (
            <GymForm
              mode="edit"
              initialGym={gym}
              onSubmit={(formData) => updateGymRequest(gym._id, formData)}
              onSuccess={handleSuccess}
              submitLabel="Save Changes"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditGym;