import { useNavigate, Link } from "react-router-dom";
import GymForm from "./GymForm";
import { createGymRequest } from "../../api/gyms";

const AddGym = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Give the owner a moment to see GymForm's success message before
    // navigating away, rather than redirecting instantly.
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
          Add a New Gym
        </h1>
        <p className="text-muted mt-2 text-sm mb-10 leading-relaxed">
          Your gym will be submitted for admin review before it appears publicly on GymPass.
        </p>

        <div className="bg-surface border border-white/10 p-6 sm:p-10">
          <GymForm
            mode="add"
            onSubmit={createGymRequest}
            onSuccess={handleSuccess}
            submitLabel="Submit Gym"
          />
        </div>
      </div>
    </div>
  );
};

export default AddGym;