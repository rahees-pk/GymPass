import { useState } from "react";
import ImageUploader from "../../components/common/ImageUploader";
import FacilitiesSelector from "../../components/common/FacilitiesSelector";
import { getErrorMessage } from "../../utils/errorMessage";

const PINCODE_REGEX = /^\d{6}$/;

const emptyForm = {
  name: "",
  description: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  longitude: "",
  latitude: "",
};

const inputClass =
  "w-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors duration-200";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-muted mb-2";

/**
 * Shared form for both "Add Gym" and "Edit Gym", so the (fairly large)
 * field set, validation, and FormData-building logic exists in exactly
 * one place. Which API call to make and where to navigate afterward is
 * left to the parent page via props — this component only knows how to
 * collect and validate gym data.
 *
 * mode: "add" | "edit"
 * initialGym: existing gym data to prefill (edit mode only)
 * onSubmit: async (formData) => Promise<gym> — parent calls create/update API
 * onSuccess: (gym) => void — called after a successful submit
 */
const GymForm = ({ mode, initialGym, onSubmit, onSuccess, submitLabel }) => {
  const [form, setForm] = useState(() =>
    initialGym
      ? {
          name: initialGym.name || "",
          description: initialGym.description || "",
          addressLine: initialGym.address?.addressLine || "",
          city: initialGym.address?.city || "",
          state: initialGym.address?.state || "",
          pincode: initialGym.address?.pincode || "",
          country: initialGym.address?.country || "India",
          longitude: initialGym.location?.coordinates?.[0] ?? "",
          latitude: initialGym.location?.coordinates?.[1] ?? "",
        }
      : emptyForm
  );
  const [facilities, setFacilities] = useState(initialGym?.facilities || []);
  const [newImages, setNewImages] = useState([]);
  const [existingImages] = useState(initialGym?.images || []);
  const [imageError, setImageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Gym name is required";
    if (!form.description.trim() || form.description.trim().length < 20)
      errors.description = "Description must be at least 20 characters";
    if (!form.addressLine.trim()) errors.addressLine = "Address is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.state.trim()) errors.state = "State is required";
    if (!PINCODE_REGEX.test(form.pincode.trim()))
      errors.pincode = "Enter a valid 6-digit pincode";

    const lng = Number(form.longitude);
    const lat = Number(form.latitude);
    if (form.longitude === "" || Number.isNaN(lng) || lng < -180 || lng > 180)
      errors.longitude = "Enter a valid longitude (-180 to 180)";
    if (form.latitude === "" || Number.isNaN(lat) || lat < -90 || lat > 90)
      errors.latitude = "Enter a valid latitude (-90 to 90)";

    const totalImages = existingImages.length + newImages.length;
    if (totalImages > 5) errors.images = "You can only have up to 5 images total";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImagesChange = (files, validationError) => {
    setNewImages(files);
    setImageError(validationError || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("addressLine", form.addressLine.trim());
      formData.append("city", form.city.trim());
      formData.append("state", form.state.trim());
      formData.append("pincode", form.pincode.trim());
      formData.append("country", form.country.trim() || "India");
      formData.append("longitude", form.longitude);
      formData.append("latitude", form.latitude);
      formData.append("facilities", JSON.stringify(facilities));

      // Let the browser set the multipart boundary — never set
      // Content-Type manually when sending FormData with Axios.
      newImages.forEach((file) => {
        formData.append("images", file);
      });

      const gym = await onSubmit(formData);

      setSuccessMessage(
        mode === "add"
          ? "Gym submitted successfully. It's now pending admin approval."
          : "Gym updated successfully."
      );

      if (mode === "add") {
        setForm(emptyForm);
        setFacilities([]);
        setNewImages([]);
      }

      onSuccess?.(gym);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {submitError && (
        <div className="border border-primary/40 bg-primary/5 text-primary text-sm px-4 py-3">
          {submitError}
        </div>
      )}
      {successMessage && (
        <div className="border border-green-500/40 bg-green-500/5 text-green-400 text-sm px-4 py-3">
          {successMessage}
        </div>
      )}

      {/* Basic information */}
      <section>
        <h2 className="text-white font-semibold tracking-tight mb-5 pb-3 border-b border-white/10">
          Basic Information
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Gym Name</label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="e.g. Iron Peak Fitness"
            />
            {fieldErrors.name && <p className="text-xs text-primary mt-1.5">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              disabled={isSubmitting}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Describe your gym, equipment, and what makes it stand out (min. 20 characters)"
            />
            {fieldErrors.description && (
              <p className="text-xs text-primary mt-1.5">{fieldErrors.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Address */}
      <section>
        <h2 className="text-white font-semibold tracking-tight mb-5 pb-3 border-b border-white/10">
          Address
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Address Line</label>
            <input
              type="text"
              value={form.addressLine}
              onChange={handleChange("addressLine")}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="Street, building, area"
            />
            {fieldErrors.addressLine && (
              <p className="text-xs text-primary mt-1.5">{fieldErrors.addressLine}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={form.city}
              onChange={handleChange("city")}
              disabled={isSubmitting}
              className={inputClass}
            />
            {fieldErrors.city && <p className="text-xs text-primary mt-1.5">{fieldErrors.city}</p>}
          </div>

          <div>
            <label className={labelClass}>State</label>
            <input
              type="text"
              value={form.state}
              onChange={handleChange("state")}
              disabled={isSubmitting}
              className={inputClass}
            />
            {fieldErrors.state && <p className="text-xs text-primary mt-1.5">{fieldErrors.state}</p>}
          </div>

          <div>
            <label className={labelClass}>Pincode</label>
            <input
              type="text"
              value={form.pincode}
              onChange={handleChange("pincode")}
              disabled={isSubmitting}
              maxLength={6}
              className={inputClass}
              placeholder="6-digit pincode"
            />
            {fieldErrors.pincode && (
              <p className="text-xs text-primary mt-1.5">{fieldErrors.pincode}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={form.country}
              onChange={handleChange("country")}
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-white font-semibold tracking-tight mb-2 pb-3 border-b border-white/10">
          Location Coordinates
        </h2>
        <p className="text-xs text-muted mt-3 mb-5 leading-relaxed">
          Used for future "gyms near me" search. You can find these from Google Maps by
          right-clicking your gym's location. Remember: longitude first, then latitude.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={handleChange("longitude")}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="e.g. 77.5946"
            />
            {fieldErrors.longitude && (
              <p className="text-xs text-primary mt-1.5">{fieldErrors.longitude}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={handleChange("latitude")}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="e.g. 12.9716"
            />
            {fieldErrors.latitude && (
              <p className="text-xs text-primary mt-1.5">{fieldErrors.latitude}</p>
            )}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section>
        <h2 className="text-white font-semibold tracking-tight mb-5 pb-3 border-b border-white/10">
          Facilities
        </h2>
        <FacilitiesSelector selected={facilities} onChange={setFacilities} />
      </section>

      {/* Images */}
      <section>
        <h2 className="text-white font-semibold tracking-tight mb-5 pb-3 border-b border-white/10">
          Gym Images
        </h2>
        <ImageUploader
          files={newImages}
          onFilesChange={handleImagesChange}
          existingImages={existingImages}
          disabled={isSubmitting}
          error={imageError || fieldErrors.images}
        />
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider px-8 py-3.5 transition-colors duration-200"
      >
        {isSubmitting ? "Saving..." : submitLabel || "Save Gym"}
      </button>
    </form>
  );
};

export default GymForm;