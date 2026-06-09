import Link from "next/link";
import { notFound } from "next/navigation";
import FlashcardDeck from "@/components/FlashcardDeck";
import VisitorLessonGate from "@/components/VisitorLessonGate";
import LessonUnlockGate from "@/components/LessonUnlockGate";
import {
  getCardsByLesson,
  getExercisesByLesson,
  getLessonById,
  getLessons,
} from "@/lib/data";
import { findNextLesson, getLessonNumber } from "@/lib/lessonAccess";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lesson, allLessons] = await Promise.all([getLessonById(id), getLessons()]);

  if (!lesson || !lesson.published) {
    notFound();
  }

  const [cards, exercises] = await Promise.all([
    getCardsByLesson(id),
    getExercisesByLesson(id),
  ]);

  const lessonNumber = getLessonNumber(lesson, allLessons);
  const nextLesson = findNextLesson(lesson, allLessons);

  return (
    <VisitorLessonGate>
    <LessonUnlockGate lesson={lesson} allLessons={allLessons}>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/">Start</Link>
          </li>
          <li>{lesson.title}</li>
        </ul>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        {lesson.pcepTopic && (
          <p className="text-primary text-sm mt-1">{lesson.pcepTopic}</p>
        )}
        <p className="opacity-70 mt-2">{lesson.description}</p>
        <p className="text-sm mt-2 opacity-60">
          {cards.length} Fragen · nach je 6 Fragen eine Übung ({exercises.length}{" "}
          Übungen)
        </p>
      </div>

      <FlashcardDeck
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        lessonNumber={lessonNumber}
        totalLessons={allLessons.length}
        nextLesson={
          nextLesson
            ? { title: nextLesson.title, published: nextLesson.published }
            : undefined
        }
        cards={cards}
        exercises={exercises}
      />
    </div>
    </LessonUnlockGate>
    </VisitorLessonGate>
  );
}
