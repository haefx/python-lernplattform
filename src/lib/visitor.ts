const VISITOR_NAME_KEY = "pcep-visitor-name";
const VISITOR_ONBOARDED_KEY = "pcep-visitor-onboarded";

export function getVisitorState(): { name: string; onboarded: boolean } {
  if (typeof window === "undefined") {
    return { name: "", onboarded: false };
  }
  return {
    name: localStorage.getItem(VISITOR_NAME_KEY) ?? "",
    onboarded: localStorage.getItem(VISITOR_ONBOARDED_KEY) === "true",
  };
}

export function setVisitorOnboarded(name: string): void {
  localStorage.setItem(VISITOR_NAME_KEY, name.trim());
  localStorage.setItem(VISITOR_ONBOARDED_KEY, "true");
}

export function clearVisitorState(): void {
  localStorage.removeItem(VISITOR_NAME_KEY);
  localStorage.removeItem(VISITOR_ONBOARDED_KEY);
}

export function clearAllVisitorData(): void {
  clearVisitorState();
  if (typeof window !== "undefined") {
    localStorage.removeItem("pcep-visitor-progress");
    window.dispatchEvent(new Event("pcep-progress-updated"));
  }
}
