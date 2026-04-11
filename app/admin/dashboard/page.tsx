"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminSession,
  loadAdminSession,
} from "../../lib/adminAuthStore";
import { useLibraryStore } from "../../hooks/useLibraryStore";
import {
  AppUser,
  deleteUser,
  loadUsers,
  updateUser,
} from "../../lib/usersStore";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("admin@library.local");
  const [active, setActive] = useState<
    "Dashboard" | "Manage Books" | "Users" | "Transactions"
  >("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [available, setAvailable] = useState(1);
  const [error, setError] = useState("");
  const { store, addBook, updateBook, deleteBook, returnBook } =
    useLibraryStore();
  const books = store?.books ?? [];
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState<
    "all" | "borrowed" | "returned" | "overdue"
  >("all");

  useEffect(() => {
    const session = loadAdminSession();
    if (!session) {
      router.replace("/admin");
      return;
    }
    setAdminEmail(session.email);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setUsers(loadUsers());
    function handleStorage(event: StorageEvent) {
      if (event.key === "sl_users_v1") {
        setUsers(loadUsers());
      }
    }
    function handleUsersUpdated() {
      setUsers(loadUsers());
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("sl_users_updated", handleUsersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sl_users_updated", handleUsersUpdated);
    };
  }, []);

  useEffect(() => {
    if (active === "Users") {
      setUsers(loadUsers());
    }
  }, [active]);

  const initials = useMemo(() => adminEmail.slice(0, 2).toUpperCase(), [
    adminEmail,
  ]);

  function openAddModal() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setQuantity(1);
    setAvailable(1);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(bookId: string) {
    const book = books.find((item) => item.id === bookId);
    if (!book) return;
    setEditingId(bookId);
    setTitle(book.title);
    setAuthor(book.author);
    setQuantity(book.quantity);
    setAvailable(book.available);
    setError("");
    setIsModalOpen(true);
  }

  function handleSave() {
    if (!title.trim() || !author.trim()) {
      setError("Title and author are required.");
      return;
    }
    const safeQuantity = Math.max(1, Number(quantity));
    const safeAvailable = Math.min(
      safeQuantity,
      Math.max(0, Number(available))
    );
    const status =
      safeAvailable > 0 ? "available" : "on_loan";

    if (editingId) {
      updateBook(editingId, {
        title: title.trim(),
        author: author.trim(),
        quantity: safeQuantity,
        available: safeAvailable,
        status,
      });
    } else {
      addBook({
        id: `b-${Date.now()}`,
        title: title.trim(),
        author: author.trim(),
        quantity: safeQuantity,
        available: safeAvailable,
        status,
      });
    }
    setIsModalOpen(false);
  }

  const filteredUsers = useMemo(() => {
    const unique: AppUser[] = [];
    const seen = new Set<string>();
    users.forEach((user) => {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        unique.push(user);
      }
    });
    const query = userSearch.trim().toLowerCase();
    if (!query) return unique;
    return unique.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.universityId.toLowerCase().includes(query)
    );
  }, [userSearch, users]);

  const loans = store?.loans ?? [];

  const transactions = useMemo(() => {
    const query = txSearch.trim().toLowerCase();
    const now = new Date();
    return loans
      .map((loan) => {
        const book = books.find((item) => item.id === loan.bookId);
        const user =
          users.find((item) => item.email === loan.memberId) ?? null;
        const isOverdue =
          !loan.returned && new Date(loan.dueDate).getTime() < now.getTime();
        const status = loan.returned
          ? "Returned"
          : isOverdue
            ? "Overdue"
            : "Borrowed";
        const fine = !loan.returned && isOverdue
          ? Math.ceil(
              (now.getTime() - new Date(loan.dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) * 1.5
          : 0;
        return {
          id: loan.id,
          userName: user?.name ?? "Unknown",
          bookTitle: book?.title ?? "Unknown",
          borrowedAt: loan.borrowedAt,
          dueDate: loan.dueDate,
          status,
          fine,
          returned: loan.returned,
        };
      })
      .filter((item) => {
        if (txFilter === "returned" && item.status !== "Returned") {
          return false;
        }
        if (txFilter === "borrowed" && item.status !== "Borrowed") {
          return false;
        }
        if (txFilter === "overdue" && item.status !== "Overdue") {
          return false;
        }
        if (!query) return true;
        return (
          item.userName.toLowerCase().includes(query) ||
          item.bookTitle.toLowerCase().includes(query)
        );
      });
  }, [books, loans, txFilter, txSearch, users]);

  function formatMoney(amount: number) {
    return `$${amount.toFixed(2)}`;
  }

  const borrowedCount = useMemo(
    () => loans.filter((loan) => !loan.returned).length,
    [loans]
  );

  const overdueCount = useMemo(() => {
    const now = new Date().getTime();
    return loans.filter(
      (loan) =>
        !loan.returned && new Date(loan.dueDate).getTime() < now
    ).length;
  }, [loans]);

  function handleToggleUser(userId: string) {
    const current = users.find((user) => user.id === userId);
    if (!current) return;
    const nextStatus = current.status === "active" ? "blocked" : "active";
    const updated = updateUser(userId, { status: nextStatus });
    setUsers(updated);
  }

  function handleDeleteUser(userId: string) {
    const updated = deleteUser(userId);
    setUsers(updated);
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-100 via-indigo-200 to-indigo-300 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 lg:py-8">
        <aside
          className={`relative hidden flex-col gap-6 rounded-3xl border border-white/70 bg-white/85 shadow-[0_22px_40px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 lg:flex ${
            sidebarCollapsed ? "w-20 px-4 py-6" : "w-64 p-6"
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Admin
            </p>
            {!sidebarCollapsed && (
              <h2 className="mt-2 text-xl font-semibold text-slate-900 font-[var(--font-display)]">
                Control Panel
              </h2>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute -right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-[0_12px_24px_rgba(79,70,229,0.2)] transition hover:-translate-y-[55%] hover:bg-indigo-50"
          >
            {sidebarCollapsed ? (
              <ArrowRightIcon className="h-4 w-4" />
            ) : (
              <ArrowLeftIcon className="h-4 w-4" />
            )}
          </button>
          <nav className="flex flex-1 flex-col gap-2 text-sm font-semibold text-slate-600">
            {["Dashboard", "Manage Books", "Users", "Transactions"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() =>
                    setActive(
                      item as "Dashboard" | "Manage Books" | "Users" | "Transactions"
                    )
                  }
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    item === active
                      ? "bg-indigo-600 text-white shadow-[0_16px_30px_rgba(79,70,229,0.3)]"
                      : "bg-white/70 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item === "Dashboard" && <HomeIcon className="h-4 w-4" />}
                    {item === "Manage Books" && (
                      <BookIcon className="h-4 w-4" />
                    )}
                    {item === "Users" && <UsersIcon className="h-4 w-4" />}
                    {item === "Transactions" && (
                      <ReceiptIcon className="h-4 w-4" />
                    )}
                    <span>{sidebarCollapsed ? item[0] : item}</span>
                  </span>
                </button>
              )
            )}
          </nav>
          <button
            onClick={() => {
              clearAdminSession();
              router.push("/admin");
            }}
            className="rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
          >
            {sidebarCollapsed ? "Out" : "Logout"}
          </button>
        </aside>

        <div className="flex min-h-full flex-1 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 px-5 py-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                Library Management
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {adminEmail}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)]">
                {initials}
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6">
            {isMobile ? (
              <>
                <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Mobile Summary
                    </h2>
                    <button
                      onClick={() => {
                        clearAdminSession();
                        router.push("/admin");
                      }}
                      className="rounded-2xl border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                    >
                      Logout
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Full admin controls are available on desktop. On mobile, you
                    get a quick snapshot only.
                  </p>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Total Books",
                      value: books.length,
                      tone: "from-indigo-600 to-indigo-400",
                      icon: <StackIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Users",
                      value: users.length,
                      tone: "from-blue-500 to-cyan-400",
                      icon: <UsersIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Borrowed",
                      value: borrowedCount,
                      tone: "from-emerald-600 to-emerald-400",
                      icon: <BookIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Overdue",
                      value: overdueCount,
                      tone: "from-rose-600 to-rose-400",
                      icon: <AlertIcon className="h-6 w-6 text-white" />,
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                    >
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} shadow-[0_12px_24px_rgba(59,130,246,0.25)]`}
                      >
                        {card.icon}
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {card.title}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </section>
              </>
            ) : active === "Manage Books" ? (
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Manage Books
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add, update, and maintain your library inventory.
                    </p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)] transition hover:bg-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Book
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100/70">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-indigo-50 text-xs uppercase tracking-[0.2em] text-indigo-600">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Available</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100/70 bg-white">
                      {books.map((book) => (
                        <tr key={book.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {book.title}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {book.author}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {book.quantity}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {book.available}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(book.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                              >
                                <EditIcon className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBook(book.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : active === "Users" ? (
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Users
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage library members and access status.
                    </p>
                  </div>
                  <div className="relative w-full max-w-xs">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                      placeholder="Search name or ID"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 hidden overflow-hidden rounded-2xl border border-indigo-100/70 lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-indigo-50 text-xs uppercase tracking-[0.2em] text-indigo-600">
                      <tr>
                        <th className="px-4 py-3">User Name</th>
                        <th className="px-4 py-3">University ID</th>
                        <th className="px-4 py-3">University Name</th>
                        <th className="px-4 py-3">Mobile</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Password</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100/70 bg-white">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {user.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.universityId}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.universityName}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.mobile}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {user.password}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                user.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {user.status === "active" ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleUser(user.id)}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition ${
                                  user.status === "active"
                                    ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                              >
                                {user.status === "active" ? (
                                  <BlockIcon className="h-3.5 w-3.5" />
                                ) : (
                                  <UnlockIcon className="h-3.5 w-3.5" />
                                )}
                                {user.status === "active"
                                  ? "Block"
                                  : "Unblock"}
                              </button>
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                              >
                                <ViewIcon className="h-3.5 w-3.5" />
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid gap-4 lg:hidden">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-indigo-100/70 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {user.universityName}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {user.status === "active" ? "Active" : "Blocked"}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        ID: {user.universityId}
                      </div>
                      <div className="text-xs text-slate-500">
                        Mobile: {user.mobile}
                      </div>
                      <div className="text-xs text-slate-500">
                        Email: {user.email}
                      </div>
                      <div className="text-xs text-slate-500">
                        Password: {user.password}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleUser(user.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition ${
                            user.status === "active"
                              ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {user.status === "active" ? (
                            <BlockIcon className="h-3.5 w-3.5" />
                          ) : (
                            <UnlockIcon className="h-3.5 w-3.5" />
                          )}
                          {user.status === "active" ? "Block" : "Unblock"}
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                        >
                          <ViewIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : active === "Transactions" ? (
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Transactions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Track all borrowing activity and overdue items.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                      value={txFilter}
                      onChange={(event) =>
                        setTxFilter(
                          event.target.value as
                            | "all"
                            | "borrowed"
                            | "returned"
                            | "overdue"
                        )
                      }
                    >
                      <option value="all">All Status</option>
                      <option value="borrowed">Borrowed</option>
                      <option value="returned">Returned</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                      <input
                        className="w-full min-w-[200px] rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                        placeholder="Search user or book"
                        value={txSearch}
                        onChange={(event) => setTxSearch(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Fine policy: $1.50 per day after the due date.
                </p>

                <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-indigo-100/70">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="sticky top-0 bg-indigo-50 text-xs uppercase tracking-[0.2em] text-indigo-600">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Book</th>
                        <th className="px-4 py-3">Borrow Date</th>
                        <th className="px-4 py-3">Return Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Fine</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100/70 bg-white">
                      {transactions.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            item.status === "Overdue"
                              ? "bg-rose-50/70"
                              : ""
                          }
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {item.userName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.bookTitle}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.borrowedAt}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.dueDate}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "Returned"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status === "Borrowed"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatMoney(item.fine)}
                          </td>
                          <td className="px-4 py-3">
                            {!item.returned && (
                              <button
                                onClick={() => returnBook(item.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                              >
                                <CheckIcon className="h-3.5 w-3.5" />
                                Mark Returned
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <>
                <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Overview
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Monitor system health and current circulation at a glance.
                  </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: "Total Books",
                      value: books.length,
                      tone: "from-indigo-600 to-indigo-400",
                      icon: <StackIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Users",
                      value: users.length,
                      tone: "from-blue-500 to-cyan-400",
                      icon: <UsersIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Borrowed",
                      value: borrowedCount,
                      tone: "from-emerald-600 to-emerald-400",
                      icon: <BookIcon className="h-6 w-6 text-white" />,
                    },
                    {
                      title: "Overdue",
                      value: overdueCount,
                      tone: "from-rose-600 to-rose-400",
                      icon: <AlertIcon className="h-6 w-6 text-white" />,
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                    >
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} shadow-[0_12px_24px_rgba(59,130,246,0.25)]`}
                      >
                        {card.icon}
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {card.title}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-10">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Book" : "Add Book"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-500 transition hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                placeholder="Book Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                placeholder="Author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  type="number"
                  min={1}
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  type="number"
                  min={0}
                  placeholder="Available"
                  value={available}
                  onChange={(event) =>
                    setAvailable(Number(event.target.value))
                  }
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)] transition hover:bg-indigo-500"
              >
                {editingId ? "Update Book" : "Add Book"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-10">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                User Details
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-1 text-slate-500 transition hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Name:</span>{" "}
                {selectedUser.name}
              </p>
              <p>
                <span className="font-semibold text-slate-800">University ID:</span>{" "}
                {selectedUser.universityId}
              </p>
              <p>
                <span className="font-semibold text-slate-800">
                  University Name:
                </span>{" "}
                {selectedUser.universityName}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Mobile:</span>{" "}
                {selectedUser.mobile}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Email:</span>{" "}
                {selectedUser.email}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Password:</span>{" "}
                {selectedUser.password}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Status:</span>{" "}
                {selectedUser.status}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)] transition hover:bg-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 7l8-4 8 4-8 4-8-4Z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 17l8 4 8-4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M14 7l-5 5 5 5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 7l5 5-5 5" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 10l8-6 8 6v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-4v6H5.5A1.5 1.5 0 0 1 4 19z" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 4h10v16l-2-1-2 1-2-1-2 1-2-1-2 1V4z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4 20a8 8 0 0 1 12-7" />
      <path d="M5 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M5 4h10a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3V4Z" />
      <path d="M8 7h7M8 11h7M8 15h5" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
      <path d="M10.3 4.7 3.8 18.2a2 2 0 0 0 1.8 2.8h12.8a2 2 0 0 0 1.8-2.8L13.7 4.7a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M8 7l1 12h6l1-12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BlockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M8 8l8 8" />
    </svg>
  );
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 1 1 8 0" />
    </svg>
  );
}

function ViewIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}
