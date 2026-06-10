"use client";

import { useState } from "react";
import { getLessonMedalIcon, getLessonMedalTitle } from "@/lib/achievements";
import AchievementBadge from "./AchievementBadge";
import LessonCompleteModal from "./LessonCompleteModal";

interface LessonAchievementBadgeProps {
  lessonNumber: number;
  lessonTitle: string;
  show: boolean;
}

export default function LessonAchievementBadge({
  lessonNumber,
  lessonTitle,
  show,
}: LessonAchievementBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!show) return null;

  return (
    <>
      <AchievementBadge
        icon={getLessonMedalIcon(lessonNumber)}
        title={`${getLessonMedalTitle(lessonNumber)} – Erfolg nochmal ansehen`}
        onClick={() => setOpen(true)}
        className="lesson-achievement-badge"
      />

      <LessonCompleteModal
        open={open}
        lessonTitle={lessonTitle}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
