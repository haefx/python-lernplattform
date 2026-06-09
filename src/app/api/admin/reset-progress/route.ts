import { NextResponse } from "next/server";
import { resetAllProgress } from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const resetAt = await resetAllProgress();
    return NextResponse.json({ ok: true, resetAt });
  } catch (error) {
    console.error("reset-progress failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Fortschritt konnte nicht zurückgesetzt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
