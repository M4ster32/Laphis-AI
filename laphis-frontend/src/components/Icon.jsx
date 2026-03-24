import dashboardIcon from "../assets/icons/dashboard.svg";
import waterIcon from "../assets/icons/water.svg";
import zenIcon from "../assets/icons/zen.svg";
import nutritionIcon from "../assets/icons/nutrition.svg";
import profileIcon from "../assets/icons/profile.svg";
import reportsIcon from "../assets/icons/reports.svg";
import chatIcon from "../assets/icons/chat.svg";
import weightIcon from "../assets/icons/weight.svg";
import breathingIcon from "../assets/icons/breathing.svg";
import energizeIcon from "../assets/icons/energize.svg";
import targetIcon from "../assets/icons/target.svg";
import fireIcon from "../assets/icons/fire.svg";
import dumbbellIcon from "../assets/icons/dumbbell.svg";
import heartIcon from "../assets/icons/heart.svg";
import appleIcon from "../assets/icons/apple.svg";
import bellIcon from "../assets/icons/bell.svg";
import settingsIcon from "../assets/icons/settings.svg";

// Icon registry — map icon names to their imports
const ICONS = {
  dashboard: dashboardIcon,
  water: waterIcon,
  zen: zenIcon,
  nutrition: nutritionIcon,
  profile: profileIcon,
  reports: reportsIcon,
  chat: chatIcon,
  weight: weightIcon,
  breathing: breathingIcon,
  energize: energizeIcon,
  target: targetIcon,
  fire: fireIcon,
  dumbbell: dumbbellIcon,
  heart: heartIcon,
  apple: appleIcon,
  bell: bellIcon,
  settings: settingsIcon,
};

/**
 * Icon component — renders SVG icons with customizable size and color
 * Usage: <Icon name="dashboard" size={24} color="#B5714D" />
 */
export function Icon({ name, size = 24, color = "currentColor", className = "" }) {
  const src = ICONS[name];
  
  if (!src) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(ICONS));
    return <span style={{ display: "inline-block", width: size, height: size }} />;
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{
        display: "inline-block",
        color,
        filter: color !== "currentColor" ? `drop-shadow(0 0 0 ${color})` : undefined,
      }}
      className={className}
    />
  );
}

/**
 * Get icon by name — useful for template strings and dynamic rendering
 * Usage: const iconSrc = getIconSrc("zen")
 */
export function getIconSrc(name) {
  return ICONS[name] || null;
}

/**
 * List all available icons
 */
export function listAvailableIcons() {
  return Object.keys(ICONS);
}
