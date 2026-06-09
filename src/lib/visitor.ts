const VISITOR_NAME_KEY = "pcep-visitor-name";
const VISITOR_ONBOARDED_KEY = "pcep-visitor-onboarded";
const VISITOR_RETURNING_KEY = "pcep-visitor-returning";
const VISITOR_ID_KEY = "pcep-visitor-id";
const ANNOUNCED_LESSONS_KEY = "pcep-announced-lessons";

export function getVisitorState(): {
  name: string;
  onboarded: boolean;
  returning: boolean;
} {
  if (typeof window === "undefined") {
    return { name: "", onboarded: false, returning: false };
  }
  return {
    name: localStorage.getItem(VISITOR_NAME_KEY) ?? "",
    onboarded: localStorage.getItem(VISITOR_ONBOARDED_KEY) === "true",
    returning: localStorage.getItem(VISITOR_RETURNING_KEY) === "true",
  };
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function setVisitorOnboarded(name: string): void {
  getOrCreateVisitorId();
  localStorage.setItem(VISITOR_NAME_KEY, name.trim());
  localStorage.setItem(VISITOR_ONBOARDED_KEY, "true");
  localStorage.removeItem(VISITOR_RETURNING_KEY);
}

export function markVisitorReturning(): void {
  localStorage.setItem(VISITOR_RETURNING_KEY, "true");
}

export function getAnnouncedLessonIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANNOUNCED_LESSONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function markLessonsAnnounced(lessonIds: string[]): void {
  if (typeof window === "undefined" || lessonIds.length === 0) return;
  const current = new Set(getAnnouncedLessonIds());
  lessonIds.forEach((id) => current.add(id));
  localStorage.setItem(ANNOUNCED_LESSONS_KEY, JSON.stringify([...current]));
}

export function clearVisitorState(): void {
  localStorage.removeItem(VISITOR_NAME_KEY);
  localStorage.removeItem(VISITOR_ONBOARDED_KEY);
  localStorage.removeItem(VISITOR_RETURNING_KEY);
}

export function clearAllVisitorData(): void {
  clearVisitorState();
  if (typeof window !== "undefined") {
    localStorage.removeItem("pcep-visitor-progress");
    localStorage.removeItem(ANNOUNCED_LESSONS_KEY);
    window.dispatchEvent(new Event("pcep-progress-updated"));
  }
}

export { clearVisitorProgressOnly } from "./progressReset";
