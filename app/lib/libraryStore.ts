export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  status: "available" | "reserved" | "on_loan";
  quantity: number;
  available: number;
};

export type LibraryMember = {
  id: string;
  name: string;
  email: string;
};

export type LibraryLoan = {
  id: string;
  bookId: string;
  memberId: string;
  borrowedAt: string;
  dueDate: string;
  returned: boolean;
};

export type LibraryStore = {
  books: LibraryBook[];
  members: LibraryMember[];
  loans: LibraryLoan[];
  updatedAt: string;
};

const STORAGE_KEY = "sl_library_store_v1";
const STORE_EVENT = "sl_library_store_updated";

export const defaultStore: LibraryStore = {
  books: [
    {
      id: "b-1",
      title: "The Indigo Atlas",
      author: "M. Hartwell",
      status: "available",
      quantity: 4,
      available: 3,
    },
    {
      id: "b-2",
      title: "Maps of Tomorrow",
      author: "L. Chen",
      status: "reserved",
      quantity: 3,
      available: 1,
    },
    {
      id: "b-3",
      title: "Quiet Algorithms",
      author: "R. Patel",
      status: "on_loan",
      quantity: 2,
      available: 0,
    },
  ],
  members: [
    { id: "m-1", name: "Amina Noor", email: "amina@library.local" },
    { id: "m-2", name: "Evan Reyes", email: "evan@library.local" },
  ],
  loans: [
    {
      id: "l-1",
      bookId: "b-3",
      memberId: "m-1",
      borrowedAt: "2026-04-06",
      dueDate: "2026-04-20",
      returned: false,
    },
  ],
  updatedAt: new Date().toISOString(),
};

export function loadStore(): LibraryStore {
  if (typeof window === "undefined") {
    return defaultStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
    return defaultStore;
  }

  try {
    const parsed = JSON.parse(raw) as LibraryStore;
    const normalizedBooks = parsed.books.map((book) => {
      const quantity = book.quantity ?? 1;
      const available =
        book.available ??
        (book.status === "available" ? quantity : Math.min(1, quantity));
      return {
        ...book,
        quantity,
        available: Math.min(available, quantity),
      };
    });
    return { ...parsed, books: normalizedBooks };
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
    return defaultStore;
  }
}

export function saveStore(store: LibraryStore) {
  if (typeof window === "undefined") return;
  const payload = { ...store, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function updateStore(updater: (current: LibraryStore) => LibraryStore) {
  const current = loadStore();
  const next = updater(current);
  saveStore(next);
  return next;
}
