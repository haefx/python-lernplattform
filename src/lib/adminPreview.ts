export const ADMIN_PREVIEW_SESSION_KEY = "pcep-admin-preview";

export function isAdminPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_PREVIEW_SESSION_KEY) === "1";
}

export function setAdminPreviewActive(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    sessionStorage.setItem(ADMIN_PREVIEW_SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(ADMIN_PREVIEW_SESSION_KEY);
  }
}

export const ADMIN_PREVIEW_PROGRESS_KEY = "pcep-visitor-progress-preview";
export const ADMIN_PREVIEW_MAZE_PROGRESS_KEY = "pcep-maze-progress-preview";
