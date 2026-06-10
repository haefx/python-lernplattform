import { NextResponse } from "next/server";
import { getMazeHighscoresForLevel, upsertMazeHighscore } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const levelId = Number(searchParams.get("levelId"));

  if (!Number.isFinite(levelId) || levelId < 1) {
    return NextResponse.json({ error: "levelId erforderlich" }, { status: 400 });
  }

  const entries = await getMazeHighscoresForLevel(levelId);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, displayName, levelId, executeCount } = body as {
    visitorId?: string;
    displayName?: string;
    levelId?: number;
    executeCount?: number;
  };

  if (!visitorId?.trim()) {
    return NextResponse.json({ error: "visitorId erforderlich" }, { status: 400 });
  }

  if (!Number.isFinite(levelId) || (levelId ?? 0) < 1) {
    return NextResponse.json({ error: "levelId erforderlich" }, { status: 400 });
  }

  if (!Number.isFinite(executeCount) || (executeCount ?? 0) < 1) {
    return NextResponse.json({ error: "executeCount erforderlich" }, { status: 400 });
  }

  const entry = await upsertMazeHighscore(
    visitorId.trim(),
    displayName?.trim() ?? "Spieler",
    levelId!,
    Math.round(executeCount!),
  );

  return NextResponse.json({ entry });
}
