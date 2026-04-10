export type AdminSession = {
  email: string;
  loggedInAt: string;
};

const SESSION_KEY = "sl_admin_session_v1";

export const ADMIN_EMAIL = "admin@library.local";
export const ADMIN_PASSWORD = "admin123";

export function loadAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
