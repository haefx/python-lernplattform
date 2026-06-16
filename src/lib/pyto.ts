import { assetUrl } from "@/lib/assetUrl";
import type { LessonWithStats } from "./types";
import {
  allLessonsCompleted,
  allPublishedLessonsCompleted,
  getLessonNumber,
  hasUnpublishedLessons,
  sortLessonsByOrder,
} from "./lessonAccess";

export const PYTO_LESSON_COMPLETE_VIDEO = assetUrl(
  "/images/pyto/Lesson_complete.mp4",
);

export const PYTO_LESSON_COMPLETE2_VIDEO = assetUrl(
  "/images/pyto/Lesson_complete2.mp4",
);

export function getLessonCompleteVideo(lessonNumber: number): string {
  if (lessonNumber === 2) return PYTO_LESSON_COMPLETE2_VIDEO;
  return PYTO_LESSON_COMPLETE_VIDEO;
}

export const PYTO_TOP_VIEW = assetUrl("/images/pyto/pyto_top_view.png");

export const PYTO_IMAGES = {
  tutor: assetUrl("/images/pyto/pyto_tutor.png"),
  froehlich: assetUrl("/images/pyto/pyto_froehliches_winken.png"),
  buch: assetUrl("/images/pyto/pyto_winkt_mit_buch.png"),
  erfolg: assetUrl("/images/pyto/pyto_erfolg.png"),
  nachdenklich: assetUrl("/images/pyto/pyto_nachdenklich.png"),
  ueberlegt: assetUrl("/images/pyto/pyto_ueberlegt.png"),
  verwirrt: assetUrl("/images/pyto/pyto_verwirrt.png"),
  schlafend: assetUrl("/images/pyto/pyto_schlafend.png"),
} as const;

export type PytoVariant = keyof typeof PYTO_IMAGES;

function getNextUnpublishedLessonNumber(lessons: LessonWithStats[]): number | null {
  const next = sortLessonsByOrder(lessons).find((lesson) => !lesson.published);
  if (!next) return null;
  return getLessonNumber(next, lessons);
}

function isLessonCompleted(lessons: LessonWithStats[], lessonNumber: number): boolean {
  const lesson = lessons.find(
    (item) => getLessonNumber(item, lessons) === lessonNumber,
  );
  return Boolean(lesson?.lessonCompleted);
}

function getCaughtUpHomeMessage(lessons: LessonWithStats[]): string {
  const lesson1Done = isLessonCompleted(lessons, 1);
  const lesson2Done = isLessonCompleted(lessons, 2);
  const lesson3Done = isLessonCompleted(lessons, 3);
  const nextLesson = getNextUnpublishedLessonNumber(lessons);
  const nextLessonHint =
    nextLesson === 4
      ? "Lektion 4 – Funktionen & Fehler – ist in Arbeit und kommt bald!"
      : nextLesson
        ? `Lektion ${nextLesson} ist derzeit noch nicht verfügbar – folgt aber bald!`
        : "Die nächste Lektion folgt bald!";

  if (lesson1Done && lesson2Done && lesson3Done && isLessonCompleted(lessons, 4)) {
    return "Alle vier Lektionen geschafft! Die PCEP-Challenge mit 12 Prüfungsfragen wartet auf der Startseite auf dich.";
  }

  if (lesson1Done && lesson2Done && lesson3Done) {
    return `Großartig! Du hast Lektion 1 bis 3 gemeistert – Listen, Tupel und Strings sitzen. Als Belohnung bleibt das Python-Labyrinth freigeschaltet. ${nextLessonHint}`;
  }

  if (lesson1Done && lesson2Done) {
    return `Starke Leistung! Du hast Lektion 1 und 2 hinter dir – als Belohnung ist das Python-Labyrinth für dich freigeschaltet! ${nextLessonHint}`;
  }

  if (lesson1Done) {
    return `Starke Leistung! Du hast Lektion 1 hinter dir. ${nextLessonHint} Das Python-Labyrinth schalten wir frei, sobald du auch Lektion 2 geschafft hast.`;
  }

  return `Starke Leistung! Du hast alle verfügbaren Lektionen abgeschlossen. ${nextLessonHint}`;
}

export function getPytoForHome(
  onboarded: boolean,
  completedCards: number,
  totalCards: number,
  lessons: LessonWithStats[],
  newlyAvailableLesson?: { title: string; lessonNumber: number } | null,
): { variant: PytoVariant; message: string } {
  if (!onboarded) {
    return {
      variant: "buch",
      message:
        "Hallo! Ich bin Pyto, dein Lerntutor. Wie heißt du? Dann legen wir los mit Python!",
    };
  }

  if (newlyAvailableLesson) {
    return {
      variant: "froehlich",
      message: `Gute Neuigkeiten! ${newlyAvailableLesson.title} ist jetzt verfügbar – du kannst weitermachen!`,
    };
  }

  if (allLessonsCompleted(lessons)) {
    return {
      variant: "erfolg",
      message:
        "Wow, alle vier Lektionen geschafft! Die **PCEP-Challenge** wartet auf dich – 12 Prüfungsfragen gegen die Uhr. Ich bin stolz auf dich!",
    };
  }

  if (
    allPublishedLessonsCompleted(lessons) &&
    hasUnpublishedLessons(lessons)
  ) {
    return {
      variant: "erfolg",
      message: getCaughtUpHomeMessage(lessons),
    };
  }

  if (completedCards === 0) {
    return {
      variant: "froehlich",
      message:
        "Schön, dass du da bist! Starte mit Lektion 1 – ich bin bei jeder Übung an deiner Seite.",
    };
  }

  const publishedLessons = lessons.filter((lesson) => lesson.published);
  const publishedCardTotal = publishedLessons.reduce(
    (sum, lesson) => sum + lesson.cardCount,
    0,
  );
  const publishedCardDone = publishedLessons.reduce(
    (sum, lesson) => sum + lesson.completedCards,
    0,
  );

  if (
    publishedCardTotal > 0 &&
    publishedCardDone >= publishedCardTotal &&
    hasUnpublishedLessons(lessons)
  ) {
    return {
      variant: "erfolg",
      message: getCaughtUpHomeMessage(lessons),
    };
  }

  const percent =
    totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  if (percent >= 50) {
    return {
      variant: "erfolg",
      message: `Über die Hälfte geschafft – weiter so! Noch ${totalCards - completedCards} Karten bis zum Ziel.`,
    };
  }

  return {
    variant: "tutor",
    message:
      "Jede Karte bringt dich näher ans Zertifikat. Bleib dran – du schaffst das!",
  };
}

export function getPytoForLesson(
  completedCards: number,
  totalCards: number,
  onExercise: boolean,
): { variant: PytoVariant; message: string } {
  if (onExercise) {
    return {
      variant: "ueberlegt",
      message:
        "Zeit zum Üben! Tippe deinen Code ein und teste ihn mit Ausführen. Probier es aus!",
    };
  }

  if (completedCards === 0) {
    return {
      variant: "buch",
      message:
        "Lies die Frage genau. Klick mich neben der Karte für Tipps – Glühbirne zeigt die Lösung!",
    };
  }

  if (completedCards >= totalCards) {
    return {
      variant: "erfolg",
      message: "Lektion geschafft! Du hast alle Fragen und Übungen gemeistert.",
    };
  }

  return {
    variant: "nachdenklich",
    message: `Noch ${totalCards - completedCards} Fragen – du bist auf einem guten Weg!`,
  };
}

export function getPytoForLessonComplete(
  lessonNumber: number,
  totalLessons: number,
  nextLesson?: { title: string; published: boolean },
): { variant: PytoVariant; message: string } {
  if (lessonNumber >= totalLessons || lessonNumber === 4) {
    return {
      variant: "erfolg",
      message:
        "Wow! Du hast **alle vier Lektionen** geschafft – ich bin stolz auf dich! Auf der Startseite ist jetzt die **PCEP-Challenge** freigeschaltet: 12 Prüfungsfragen, deine Zeit wird gemessen. Zeig, was du drauf hast!",
    };
  }

  if (nextLesson?.published) {
    return {
      variant: "froehlich",
      message: `Lektion ${lessonNumber} geschafft! Als Nächstes wartet ${nextLesson.title} auf dich.`,
    };
  }

  if (lessonNumber === 3) {
    return {
      variant: "erfolg",
      message:
        "Lektion 3 geschafft! Listen, Tupel und Strings – du hast Datenstrukturen im Griff. **Lektion 4 – Funktionen & Fehler** kommt bald – ich sage dir Bescheid, sobald du weitermachen kannst!",
    };
  }

  return {
    variant: "erfolg",
    message: `Lektion ${lessonNumber} geschafft! Die nächsten Lektionen kommen bald – ich sage dir Bescheid, sobald du weitermachen kannst.`,
  };
}
