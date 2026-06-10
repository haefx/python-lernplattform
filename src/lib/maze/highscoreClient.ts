import { getOrCreateVisitorId, getVisitorState } from "@/lib/visitor";
import type { MazeHighscoreEntry } from "./highscores";

export async function submitMazeHighscore(
  levelId: number,
  executeCount: number,
): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  const { name } = getVisitorState();
  const displayName = name.trim() || "Spieler";

  await fetch("/api/maze-highscores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId,
      displayName,
      levelId,
      executeCount,
    }),
  });
}

export async function fetchMazeHighscores(
  levelId: number,
): Promise<MazeHighscoreEntry[]> {
  const visitorId = getOrCreateVisitorId();
  const res = await fetch(
    `/api/maze-highscores?levelId=${levelId}&visitorId=${encodeURIComponent(visitorId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { entries?: MazeHighscoreEntry[] };
  return data.entries ?? [];
}
