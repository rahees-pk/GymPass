import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { fetchOwnerGyms } from "../../api/gyms";
import { getErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/common/StatusBadge";

const GymDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qrCanvasRef = useRef(null);

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

  const handleDownloadQr = () => {
    const canvas = document.getElementById("owner-gym-qr-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${gym.name.replace(/\s+/g, "-").toLowerCase()}-gympass-qr.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto">
        <Link to="/owner/gyms" className="text-sm text-muted hover:text-white transition">
          ← Back to My Gyms
        </Link>

        {isLoading ? (
          <p className="text-muted text-center py-16">Loading gym details...</p>
        ) : loadError ? (
          <p className="text-primary text-center py-16">{loadError}</p>
        ) : (
          <div className="mt-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{gym.name}</h1>
              <StatusBadge status={gym.status} />
            </div>

            {gym.images?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                {gym.images.map((img) => (
                  <div key={img.publicId} className="aspect-video rounded-xl overflow-hidden border border-white/10">
                    <img src={img.url} alt={gym.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 aspect-video rounded-xl border border-white/10 bg-black/30 flex items-center justify-center text-muted text-sm">
                No images uploaded
              </div>
            )}

            <div className="bg-surface border border-white/10 rounded-2xl p-6 mt-6 space-y-6">
              <div>
                <h2 className="text-white font-semibold text-sm mb-1.5">Description</h2>
                <p className="text-muted text-sm leading-relaxed">{gym.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-white font-semibold text-sm mb-1.5">Address</h2>
                  <p className="text-muted text-sm">
                    {gym.address?.addressLine}
                    <br />
                    {gym.address?.city}, {gym.address?.state} {gym.address?.pincode}
                    <br />
                    {gym.address?.country}
                  </p>
                </div>

                <div>
                  <h2 className="text-white font-semibold text-sm mb-1.5">Location</h2>
                  <p className="text-muted text-sm">
                    Lng: {gym.location?.coordinates?.[0]}
                    <br />
                    Lat: {gym.location?.coordinates?.[1]}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-white font-semibold text-sm mb-1.5">Facilities</h2>
                {gym.facilities?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gym.facilities.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-muted border border-white/10"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">No facilities listed</p>
                )}
              </div>

              <div>
                <h2 className="text-white font-semibold text-sm mb-1.5">Rating</h2>
                <p className="text-muted text-sm">
                  {gym.rating?.count > 0
                    ? `${gym.rating.average.toFixed(1)} ★ (${gym.rating.count} reviews)`
                    : "No reviews yet"}
                </p>
              </div>
            </div>

            {/* Gym QR Code — used by members to check in via the Scan Gym QR flow */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6 mt-6">
              <h2 className="text-white font-semibold text-sm mb-1.5">Gym QR Code</h2>
              <p className="text-muted text-sm leading-relaxed mb-5">
                Print or display this QR code at your gym. Members with an active GymPass
                membership can scan it to check in.
              </p>

              {gym.status !== "approved" && (
                <p className="text-accent text-xs uppercase tracking-wider mb-4">
                  This gym is not yet approved — check-ins won't work until it's approved by an
                  admin.
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="bg-white p-4 rounded-lg inline-block" ref={qrCanvasRef}>
                  <QRCodeCanvas id="owner-gym-qr-canvas" value={gym._id} size={180} level="M" />
                </div>
                <button
                  onClick={handleDownloadQr}
                  className="border border-white/15 hover:border-white/30 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition"
                >
                  Download QR Code
                </button>
              </div>
            </div>

            <Link
              to={`/owner/gyms/${gym._id}/edit`}
              state={{ gym }}
              className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white font-semibold rounded-lg px-6 py-2.5 transition mt-6"
            >
              Edit Gym
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymDetails;