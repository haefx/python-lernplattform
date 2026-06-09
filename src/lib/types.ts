export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
  pcepTopic?: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  order: number;
  question: string;
  tip: string;
  tip2Messages?: string[];
  tip3Messages?: string[];
  answer: string;
  detail?: string;
  codeExample?: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
}

export interface Exercise {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  task: string;
  solution: string;
  notes?: string;
  starterCode?: string;
  solutionCode?: string;
}

export interface LessonProgress {
  lessonId: string;
  completedCardIds: string[];
  completedExerciseIds?: string[];
  lessonCompleted: boolean;
  completedAt?: string;
  /** Wie oft die Lektion vollständig abgeschlossen wurde. */
  completionCount?: number;
}

export interface SiteProgress {
  learnerName: string;
  onboarded: boolean;
  lessonProgress: LessonProgress[];
  updatedAt: string;
  progressResetAt?: string;
}

export interface LessonWithStats extends Lesson {
  cardCount: number;
  completedCards: number;
  lessonCompleted: boolean;
  completionCount: number;
}
