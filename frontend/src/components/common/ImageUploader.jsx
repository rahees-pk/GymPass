import { useEffect, useRef } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Handles new-image selection with local browser previews
 * (URL.createObjectURL), per-file validation, and removal of a
 * selected-but-not-yet-uploaded image. The actual File objects are
 * held by the parent form (not global state) and only ever sent to
 * the backend via FormData — never uploaded directly to Cloudinary
 * from here.
 *
 * existingImages (optional): already-saved gym images (edit mode),
 * shown read-only since the backend only supports appending new
 * images, not replacing/removing existing ones.
 */
const ImageUploader = ({
  files,
  onFilesChange,
  existingImages = [],
  maxImages = 5,
  disabled = false,
  error,
}) => {
  // Track object URLs so we can revoke them on unmount / when replaced,
  // avoiding memory leaks from URL.createObjectURL.
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    // Revoke any previous URLs before creating new ones for the current file list.
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = files.map((file) => URL.createObjectURL(file));

    // Cleanup when this effect re-runs or the component unmounts.
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const remainingSlots = maxImages - existingImages.length - files.length;

  const validateAndAddFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles);
    const validFiles = [];
    let validationError = "";

    for (const file of incoming) {
      if (files.length + validFiles.length + existingImages.length >= maxImages) {
        validationError = `You can only have up to ${maxImages} images total.`;
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        validationError = `"${file.name}" is not a supported image type (JPEG, PNG, WebP only).`;
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        validationError = `"${file.name}" is larger than 5MB.`;
        continue;
      }
      validFiles.push(file);
    }

    onFilesChange([...files, ...validFiles], validationError);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset input value so selecting the same file again re-triggers onChange.
    e.target.value = "";
  };

  const handleRemove = (index) => {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next, "");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {/* Existing (already-saved) images — read only */}
        {existingImages.map((img, i) => (
          <div
            key={img.publicId || i}
            className="relative w-24 h-24 border border-white/10 overflow-hidden"
          >
            <img src={img.url} alt="Gym" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] uppercase tracking-wider text-muted text-center py-1">
              Saved
            </span>
          </div>
        ))}

        {/* New, not-yet-uploaded images — removable */}
        {files.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="relative w-24 h-24 border border-white/10 overflow-hidden"
          >
            <img
              src={objectUrlsRef.current[i]}
              alt={file.name}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/80 text-white text-xs hover:bg-primary transition-colors duration-200"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        {remainingSlots > 0 && !disabled && (
          <label className="w-24 h-24 flex flex-col items-center justify-center border border-dashed border-white/15 text-muted hover:border-primary hover:text-primary transition-colors duration-200 cursor-pointer text-[10px] uppercase tracking-wider text-center px-1">
            <span className="text-xl leading-none mb-1 font-light">+</span>
            Add Image
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted mt-3 tracking-wide">
        {existingImages.length + files.length}/{maxImages} images &nbsp;·&nbsp; JPEG, PNG, or WebP
        &nbsp;·&nbsp; max 5MB each
      </p>

      {error && <p className="text-xs text-primary mt-1.5">{error}</p>}
    </div>
  );
};

export default ImageUploader;