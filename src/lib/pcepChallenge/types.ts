export interface PcepChallengeQuestion {
  id: string;
  order: number;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PcepChallengeProgress {
  completed: boolean;
  bestTimeMs: number | null;
  lastTimeMs: number | null;
  completedAt?: string;
  attemptCount: number;
}
