import { promises as fs } from "fs";
import path from "path";
import type { PcepChallengeQuestion } from "./types";

export const PCEP_CHALLENGE_QUESTION_COUNT = 12;

let cachedQuestions: PcepChallengeQuestion[] | null = null;

export async function getPcepChallengeQuestions(): Promise<PcepChallengeQuestion[]> {
  if (cachedQuestions) return cachedQuestions;
  const filePath = path.join(process.cwd(), "data", "pcep-challenge.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as PcepChallengeQuestion[];
  cachedQuestions = [...parsed].sort((a, b) => a.order - b.order);
  return cachedQuestions;
}
