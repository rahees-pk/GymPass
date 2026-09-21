const STATUS_STYLES = {
  pending: "border-l-accent text-accent",
  approved: "border-l-green-500 text-green-400",
  rejected: "border-l-primary text-primary",
  suspended: "border-l-white/30 text-muted",
};

/**
 * Renders a gym's status as a small rectangular label with a colored
 * left accent bar — styles are looked up from the status string itself,
 * so any of the four backend statuses renders correctly without
 * special-casing at the call site.
 */
const StatusBadge = ({ status }) => {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.suspended;

  return (
    <span
      className={`inline-flex items-center border-l-2 pl-2 pr-1 py-0.5 text-[11px] font-medium uppercase tracking-wider ${styles}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;