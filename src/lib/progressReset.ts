import { PROGRESS_UPDATED_EVENT } from "./visitorProgress";

export const PROGRESS_RESET_ACK_KEY = "pcep-progress-reset-ack";

function clearLocalCodeStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("pcep-code-")) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/** Löscht Lernfortschritt lokal, behält Namen und Besucher-ID. */
export function clearVisitorProgressOnly(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("pcep-visitor-progress");
  localStorage.removeItem("pcep-challenge-progress");
  localStorage.removeItem("pcep-announced-lessons");
  clearLocalCodeStorage();
  window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
  window.dispatchEvent(new Event("pcep-challenge-progress-updated"));
}

export function acknowledgeProgressReset(resetAt: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_RESET_ACK_KEY, resetAt);
}

export async function applyServerProgressResetIfNeeded(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const res = await fetch("/api/progress-reset", { cache: "no-store" });
    if (!res.ok) return false;

    const data = (await res.json()) as { resetAt?: string | null };
    const resetAt = data.resetAt;
    if (!resetAt) return false;

    const acknowledgedAt = localStorage.getItem(PROGRESS_RESET_ACK_KEY);
    if (acknowledgedAt && acknowledgedAt >= resetAt) return false;

    clearVisitorProgressOnly();
    acknowledgeProgressReset(resetAt);
    return true;
  } catch {
    return false;
  }
}
