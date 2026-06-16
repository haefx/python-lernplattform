import AchievementBadge from "./AchievementBadge";
import {
  getLessonMedalIcon,
  getLessonMedalTitle,
  getMazeMedalIcon,
  getMazeMedalTitle,
  getPcepChallengeMedalIcon,
  getPcepChallengeMedalTitle,
} from "@/lib/achievements";

interface AchievementMedalsRowProps {
  lessonMedals?: number[];
  mazeMedals?: number[];
  pcepChallengeMedal?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function AchievementMedalsRow({
  lessonMedals = [],
  mazeMedals = [],
  pcepChallengeMedal = false,
  size = "sm",
  className = "",
}: AchievementMedalsRowProps) {
  const lessons = [...lessonMedals].sort((a, b) => a - b);
  const mazes = [...mazeMedals].sort((a, b) => a - b);

  if (lessons.length === 0 && mazes.length === 0 && !pcepChallengeMedal) return null;

  return (
    <span className={`achievement-medals-row ${className}`.trim()} aria-label="Orden">
      {lessons.map((lessonNumber) => (
        <AchievementBadge
          key={`lesson-${lessonNumber}`}
          icon={getLessonMedalIcon(lessonNumber)}
          title={getLessonMedalTitle(lessonNumber)}
          size={size}
        />
      ))}
      {mazes.map((levelId) => (
        <AchievementBadge
          key={`maze-${levelId}`}
          icon={getMazeMedalIcon(levelId)}
          title={getMazeMedalTitle(levelId)}
          size={size}
        />
      ))}
      {pcepChallengeMedal && (
        <AchievementBadge
          key="pcep-challenge"
          icon={getPcepChallengeMedalIcon()}
          title={getPcepChallengeMedalTitle()}
          size={size}
        />
      )}
    </span>
  );
}
