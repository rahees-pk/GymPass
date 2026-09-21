/**
 * Generic confirmation modal, used before destructive actions (e.g.
 * deleting a gym). Reusable across the app wherever a "are you sure?"
 * step is needed.
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={!isLoading ? onCancel : undefined} />

      <div className="relative bg-surface border border-white/10 rounded-md p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="text-muted text-sm mt-2 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider text-muted hover:text-white border border-white/10 hover:border-white/25 transition-colors duration-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-secondary text-white transition-colors duration-200 disabled:opacity-60"
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;