interface AchievementBadgeProps {
  icon: string;
  title: string;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

export default function AchievementBadge({
  icon,
  title,
  size = "md",
  onClick,
  className = "",
}: AchievementBadgeProps) {
  const classes = [
    "achievement-badge",
    size === "sm" ? "achievement-badge--sm" : "",
    onClick ? "achievement-badge--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="achievement-badge__ribbon" aria-hidden />
      <span
        className={`achievement-badge__medal${
          icon.length > 1 && !icon.includes("★") ? "" : icon.length > 1 ? " achievement-badge__medal--tight" : ""
        }`}
        aria-hidden
      >
        {icon}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        title={title}
        aria-label={title}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={title} aria-label={title}>
      {content}
    </span>
  );
}
