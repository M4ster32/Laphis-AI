import { useNavigate } from "react-router-dom";

/**
 * Reusable empty-state placeholder.
 * Consistent across all pages that show a "nothing here yet" view,
 * eliminating repeated markup in Dashboard, Plans, Logs, Chat, etc.
 *
 * @param {Object}   props
 * @param {import('react').ReactNode} [props.icon]       - Lucide icon or emoji.
 * @param {string}   props.title       - Heading text.
 * @param {string}   [props.description] - Explanatory sub-text.
 * @param {string}   [props.actionLabel] - Primary CTA button label.
 * @param {string}   [props.actionTo]    - Route path for the CTA.
 * @param {Function} [props.onAction]    - onClick handler (takes priority over actionTo).
 * @param {import('react').ReactNode} [props.children] - Extra content below the description.
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  children,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) return onAction();
    if (actionTo) navigate(actionTo);
  };

  return (
    <div style={s.root}>
      {icon && <div style={s.icon}>{icon}</div>}
      <h3 style={s.title}>{title}</h3>
      {description && <p style={s.description}>{description}</p>}
      {children}
      {actionLabel && (
        <button className="btn btn-primary" style={s.action} onClick={handleClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const s = {
  root: {
    textAlign: "center",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    animation: "fadeUp 0.35s var(--ease-out) both",
  },
  icon: {
    fontSize: 40,
    opacity: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
  },
  description: {
    fontSize: 13,
    color: "var(--text-muted)",
    maxWidth: 260,
    lineHeight: 1.5,
    margin: 0,
  },
  action: {
    marginTop: 8,
  },
};
