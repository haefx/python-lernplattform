import Link from "next/link";
import type { LessonWithAccess } from "@/lib/lessonAccess";
import LessonAchievementBadge from "./LessonAchievementBadge";
import ProgressBar from "./ProgressBar";

interface LessonCardProps {
  lesson: LessonWithAccess;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const isComingSoon = lesson.accessState === "coming_soon";
  const isLocked = lesson.accessState === "locked";

  const statusBadge = isComingSoon ? (
    <span className="badge badge-neutral gap-1">Coming soon</span>
  ) : lesson.lessonCompleted ? (
    <span className="badge badge-success gap-1">✓ Abgeschlossen</span>
  ) : isLocked ? (
    <span className="badge badge-ghost">Gesperrt</span>
  ) : lesson.completedCards > 0 ? (
    <span className="badge badge-warning">In Bearbeitung</span>
  ) : (
    <span className="badge badge-ghost">Neu</span>
  );

  const showAchievement =
    (lesson.lessonNumber === 1 || lesson.lessonNumber === 2) &&
    lesson.lessonCompleted &&
    !isComingSoon;

  return (
    <div
      className={`card bg-base-100 shadow-md border transition-shadow relative overflow-visible ${
        isComingSoon
          ? "border-dashed border-base-300 opacity-80"
          : isLocked
            ? "border-base-300 opacity-75"
            : "border-base-300 hover:shadow-lg"
      }`}
    >
      <LessonAchievementBadge
        lessonNumber={lesson.lessonNumber}
        lessonTitle={lesson.title}
        show={showAchievement}
      />
      <div className="card-body">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="card-title text-lg">{lesson.title}</h2>
          {statusBadge}
        </div>
        {lesson.pcepTopic && (
          <p className="text-xs text-primary font-medium">{lesson.pcepTopic}</p>
        )}
        <p className="text-sm opacity-70">{lesson.description}</p>

        {isComingSoon ? (
          <p className="text-sm opacity-60 mt-2">
            Diese Lektion ist in Vorbereitung. Pyto sagt dir Bescheid, sobald du
            weitermachen kannst.
          </p>
        ) : isLocked ? (
          <p className="text-sm opacity-60 mt-2">
            Schließe zuerst „{lesson.previousLessonTitle}“ ab, um hier
            fortzufahren.
          </p>
        ) : (
          <div className="mt-2">
            <ProgressBar
              value={lesson.completedCards}
              max={lesson.cardCount}
              label="Lernkarten"
            />
          </div>
        )}

        <div className="card-actions justify-end mt-4">
          {lesson.accessState === "available" ? (
            <Link href={`/lektion/${lesson.id}`} className="btn btn-primary btn-sm">
              {lesson.lessonCompleted ? "Wiederholen" : "Lernen"}
            </Link>
          ) : (
            <button type="button" className="btn btn-sm btn-disabled" disabled>
              {isComingSoon ? "Bald verfügbar" : "Noch gesperrt"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
