"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getLessonAccessState,
  getPreviousLesson,
  sortLessonsByOrder,
} from "@/lib/lessonAccess";
import type { Lesson } from "@/lib/types";
import { getLessonProgressList } from "@/lib/visitorProgress";

interface LessonUnlockGateProps {
  lesson: Lesson;
  allLessons: Lesson[];
  children: React.ReactNode;
}

export default function LessonUnlockGate({
  lesson,
  allLessons,
  children,
}: LessonUnlockGateProps) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "allowed" | "blocked">("loading");
  const [previousTitle, setPreviousTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson.published) {
      router.replace("/");
      return;
    }

    const progress = getLessonProgressList();
    const access = getLessonAccessState(lesson, allLessons, progress);

    if (access === "available") {
      setState("allowed");
      return;
    }

    const previous = getPreviousLesson(lesson, sortLessonsByOrder(allLessons));
    setPreviousTitle(previous?.title ?? null);
    setState("blocked");
  }, [lesson, allLessons, router]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-3">Noch gesperrt</h1>
        <p className="opacity-80 mb-6">
          {previousTitle
            ? `Schließe zuerst „${previousTitle}“ ab, bevor du diese Lektion startest.`
            : "Diese Lektion ist noch nicht freigeschaltet."}
        </p>
        <Link href="/" className="btn btn-primary">
          Zur Übersicht
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
