export interface MazeHighscoreEntry {
  visitorId: string;
  displayName: string;
  levelId: number;
  executeCount: number;
  achievedAt: string;
}

export function sortMazeHighscores(
  entries: MazeHighscoreEntry[],
): MazeHighscoreEntry[] {
  return [...entries].sort((a, b) => {
    if (a.executeCount !== b.executeCount) {
      return a.executeCount - b.executeCount;
    }
    return new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime();
  });
}

export function rankMazeHighscores(
  entries: MazeHighscoreEntry[],
  currentVisitorId?: string,
): Array<MazeHighscoreEntry & { rank: number; isCurrentUser: boolean }> {
  return sortMazeHighscores(entries).map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isCurrentUser: Boolean(currentVisitorId && entry.visitorId === currentVisitorId),
  }));
}
