import type { Exercise, Flashcard } from "./types";

export const CARDS_PER_BLOCK = 6;

export function getExerciseIndexAfterCard(
  cardIndex: number,
  totalCards?: number,
): number | null {
  if ((cardIndex + 1) % CARDS_PER_BLOCK === 0) {
    return (cardIndex + 1) / CARDS_PER_BLOCK - 1;
  }

  // Letzte Karte eines unvollständigen Blocks (z. B. Karte 20 nach 18 Karten + Übung)
  if (totalCards !== undefined && cardIndex === totalCards - 1) {
    return Math.floor(cardIndex / CARDS_PER_BLOCK);
  }

  return null;
}

export function getInitialLessonState(
  cards: Flashcard[],
  exercises: Exercise[],
  completedCardIds: string[],
  completedExerciseIds: string[],
  lessonCompleted: boolean
): {
  mode: "card" | "exercise" | "done";
  cardIndex: number;
  exerciseIndex: number | null;
} {
  if (lessonCompleted) {
    return { mode: "done", cardIndex: 0, exerciseIndex: null };
  }

  const blockCount = Math.ceil(cards.length / CARDS_PER_BLOCK);

  for (let block = 0; block < blockCount; block++) {
    const start = block * CARDS_PER_BLOCK;
    const blockCards = cards.slice(start, start + CARDS_PER_BLOCK);
    const exercise = exercises[block];

    const allCardsDone = blockCards.every((c) => completedCardIds.includes(c.id));

    if (!allCardsDone) {
      const firstInBlock = blockCards.findIndex(
        (c) => !completedCardIds.includes(c.id)
      );
      return {
        mode: "card",
        cardIndex: start + firstInBlock,
        exerciseIndex: null,
      };
    }

    if (exercise && !completedExerciseIds.includes(exercise.id)) {
      return { mode: "exercise", cardIndex: start, exerciseIndex: block };
    }
  }

  const allCardsDone = cards.every((c) => completedCardIds.includes(c.id));
  const allExercisesDone =
    exercises.length === 0 ||
    exercises.every((e) => completedExerciseIds.includes(e.id));

  if (allCardsDone && allExercisesDone) {
    return { mode: "done", cardIndex: 0, exerciseIndex: null };
  }

  return { mode: "card", cardIndex: 0, exerciseIndex: null };
}
