/**
 * Componente Button Reutilizável - Mobile First
 */

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
}) {
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const widthClass = fullWidth ? "btn-full" : "";
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
