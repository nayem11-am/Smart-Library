export type AppUser = {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  mobile: string;
  email: string;
  password: string;
  status: "active" | "blocked";
  createdAt: string;
};

const STORAGE_KEY = "sl_users_v1";
const USERS_EVENT = "sl_users_updated";

const defaultUsers: AppUser[] = [];

export function generateUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `u-${crypto.randomUUID()}`;
  }
  return `u-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

type LegacyAuthUser = {
  name: string;
  email: string;
  password: string;
};

function loadLegacyAuthUser(): LegacyAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("sl_auth_user_v1");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LegacyAuthUser;
  } catch {
    return null;
  }
}

export function loadUsers(): AppUser[] {
  if (typeof window === "undefined") return defaultUsers;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const legacy = loadLegacyAuthUser();
    const seeded = legacy
      ? [
          {
            id: generateUserId(),
            name: legacy.name || "Library Member",
            universityId: "N/A",
            universityName: "N/A",
            mobile: "N/A",
            email: legacy.email,
            password: legacy.password,
            status: "active" as const,
            createdAt: new Date().toISOString(),
          },
        ]
      : defaultUsers;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as AppUser[];
    const seen = new Set<string>();
    const normalized = parsed.map((user) => {
      if (seen.has(user.id)) {
        return { ...user, id: generateUserId() };
      }
      seen.add(user.id);
      return user;
    });
    if (normalized.length === 0) {
      const legacy = loadLegacyAuthUser();
      if (legacy) {
        const seeded = [
          {
            id: generateUserId(),
            name: legacy.name || "Library Member",
            universityId: "N/A",
            universityName: "N/A",
            mobile: "N/A",
            email: legacy.email,
            password: legacy.password,
            status: "active" as const,
            createdAt: new Date().toISOString(),
          },
        ];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
    }
    if (normalized.some((user, index) => user.id !== parsed[index]?.id)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
}

export function saveUsers(users: AppUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_EVENT));
}

export function addUser(user: AppUser) {
  const users = loadUsers();
  const ids = new Set(users.map((item) => item.id));
  const safeUser = ids.has(user.id)
    ? { ...user, id: generateUserId() }
    : user;
  const next = [safeUser, ...users];
  saveUsers(next);
  return next;
}

export function updateUser(userId: string, updates: Partial<AppUser>) {
  const users = loadUsers();
  const next = users.map((user) =>
    user.id === userId ? { ...user, ...updates } : user
  );
  saveUsers(next);
  return next;
}

export function deleteUser(userId: string) {
  const users = loadUsers();
  const next = users.filter((user) => user.id !== userId);
  saveUsers(next);
  return next;
}
