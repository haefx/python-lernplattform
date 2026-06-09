import { getCards, getPublishedLessons } from "@/lib/data";
import HomeClient from "@/components/HomeClient";
import type { LessonWithCardCount } from "@/lib/visitorProgress";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [lessons, cards] = await Promise.all([
    getPublishedLessons(),
    getCards(),
  ]);

  const lessonsWithCounts: LessonWithCardCount[] = lessons.map((lesson) => ({
    ...lesson,
    cardCount: cards.filter((c) => c.lessonId === lesson.id).length,
  }));

  return <HomeClient lessons={lessonsWithCounts} />;
}
