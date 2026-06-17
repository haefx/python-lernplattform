export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
  pcepTopic?: string;
}

export type CardType = "flip" | "multiple_choice";

export interface MultipleChoiceData {
  options: string[];
  correctIndex: number;
}

export interface GapFillBlock {
  id: string;
  text: string;
  isDecoy?: boolean;
}

export interface GapFillGap {
  id: string;
  answers: string[];
  blockId: string;
}

export interface GapFillData {
  template: string;
  gaps: GapFillGap[];
  blocks: GapFillBlock[];
  /** Vollständiger Referenz-Code – nur diese Lösung ist korrekt. */
  canonicalCode?: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  order: number;
  question: string;
  tip: string;
  /** Wird beim Laden der Karte automatisch in Pytos Sprechblase angezeigt. */
  pytoIntroMessage?: string;
  tip2Messages?: string[];
  tip3Messages?: string[];
  answer: string;
  detail?: string;
  codeExample?: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
  cardType?: CardType;
  multipleChoice?: MultipleChoiceData;
}

export type ExerciseType = "code" | "gap_fill";

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
  exerciseType?: ExerciseType;
  gapFill?: GapFillData;
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
