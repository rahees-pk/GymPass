import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { fetchAllGymsForAdmin, updateGymStatusRequest } from "../../api/adminGyms";
import { getErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Suspended", value: "suspended" },
];

const AdminGymManagement = () => {
  const [gyms, setGyms] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmAction, setConfirmAction] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Tracks which single gym card currently has its QR code expanded —
  // client-side only, no new API call needed since gym._id is already
  // present in the already-loaded `gyms` state.
  const [expandedQrGymId, setExpandedQrGymId] = useState(null);

  const loadGyms = async (filter) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAllGymsForAdmin(filter || undefined);
      setGyms(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGyms(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { gym, action } = confirmAction;

    setIsSubmittingAction(true);
    setError("");

    try {
      const updatedGym = await updateGymStatusRequest(gym._id, action);

      setGyms((prev) => {
        if (statusFilter && updatedGym.status !== statusFilter) {
          return prev.filter((g) => g._id !== updatedGym._id);
        }
        return prev.map((g) => (g._id === updatedGym._id ? updatedGym : g));
      });

      setSuccessMessage(
        action === "approved"
          ? `"${gym.name}" has been approved and is now visible on GymPass.`
          : `"${gym.name}" has been rejected.`
      );
      setConfirmAction(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmAction(null);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDownloadQr = (gym) => {
    const canvas = document.getElementById(`admin-gym-qr-canvas-${gym._id}`);
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gym.name.replace(/\s+/g, "-").toLowerCase()}-gympass-qr.png`;
    link.click();
  };

  const emptyStateMessage = statusFilter
    ? `No ${statusFilter} gyms found.`
    : "No gyms found on the platform yet.";

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="pb-6 border-b border-white/10 mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Gym Management
          </h1>
          <p className="text-muted mt-1.5 text-sm">
            Review and moderate gym listings submitted by owners
          </p>
        </div>

        <div className="flex flex-wrap gap-6 border-b border-white/10 mb-8">
          {FILTER_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.value)}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors duration-200 ${
                  isActive
                    ? "border-primary text-white"
                    : "border-transparent text-muted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
          <p className="text-muted text-sm text-center py-20">Loading gyms...</p>
        ) : gyms.length === 0 ? (
          <div className="border border-white/10 bg-surface px-8 py-16 text-center">
            <p className="text-white font-medium tracking-tight">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => {
              const canApprove = gym.status !== "approved";
              const canReject = gym.status !== "rejected";
              const isQrExpanded = expandedQrGymId === gym._id;

              return (
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

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[10px] uppercase tracking-wider text-muted/70">
                        Submitted By
                      </p>
                      <p className="text-white text-sm mt-1">{gym.owner?.name || "Unknown"}</p>
                      <p className="text-muted text-xs">{gym.owner?.email}</p>
                    </div>

                    <p className="text-muted text-[11px] mt-4">
                      Added {new Date(gym.createdAt).toLocaleDateString("en-IN")}
                    </p>

                    {isQrExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="bg-white p-3 rounded-lg inline-block">
                          <QRCodeCanvas
                            id={`admin-gym-qr-canvas-${gym._id}`}
                            value={gym._id}
                            size={140}
                            level="M"
                          />
                        </div>
                        <button
                          onClick={() => handleDownloadQr(gym)}
                          className="block text-xs text-muted hover:text-white uppercase tracking-wider mt-3 transition-colors duration-200"
                        >
                          Download QR
                        </button>
                      </div>
                    )}

                    <div className="flex items-stretch gap-2 mt-5 pt-5 border-t border-white/10">
                      {canApprove && (
                        <button
                          onClick={() => setConfirmAction({ gym, action: "approved" })}
                          className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-green-500/30 text-green-400 hover:bg-green-500/5 transition-colors duration-200"
                        >
                          Approve
                        </button>
                      )}
                      {canReject && (
                        <button
                          onClick={() => setConfirmAction({ gym, action: "rejected" })}
                          className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-primary/30 text-primary hover:bg-primary/5 transition-colors duration-200"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedQrGymId(isQrExpanded ? null : gym._id)
                        }
                        className="flex-1 text-xs font-semibold uppercase tracking-wider text-center py-2.5 border border-white/15 text-muted hover:text-white hover:border-white/30 transition-colors duration-200"
                      >
                        {isQrExpanded ? "Hide QR" : "View QR"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.action === "approved" ? "Approve this gym?" : "Reject this gym?"}
        message={
          confirmAction?.action === "approved"
            ? `"${confirmAction?.gym?.name}" will become publicly visible on GymPass immediately.`
            : `"${confirmAction?.gym?.name}" will be hidden from public listings.`
        }
        confirmLabel={confirmAction?.action === "approved" ? "Approve" : "Reject"}
        isLoading={isSubmittingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default AdminGymManagement;