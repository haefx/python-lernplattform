import { NextResponse } from "next/server";
import { getProgressResetAt } from "@/lib/data";

export async function GET() {
  const resetAt = await getProgressResetAt();
  return NextResponse.json({ resetAt });
}
