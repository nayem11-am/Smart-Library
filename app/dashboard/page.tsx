"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, loadUser } from "../lib/authStore";
import { useLibraryStore } from "../hooks/useLibraryStore";

export default function DashboardPage() {
  const [name, setName] = useState("Library Member");
  const [active, setActive] = useState<
    "Dashboard" | "Search Books" | "My Books" | "Logout"
  >("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [borrowDays, setBorrowDays] = useState(14);
  const [toast, setToast] = useState<null | {
    message: string;
    tone: "success" | "info" | "warning";
  }>(null);
  const { store, rentBook, returnBook } = useLibraryStore();
  const router = useRouter();

  useEffect(() => {
    const user = loadUser();
    if (user?.name) {
      setName(user.name);
    }
  }, []);

  const initials = useMemo(() => {
    const parts = name.split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "L";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }, [name]);

  const books = store?.books ?? [];
  const loans = store?.loans ?? [];

  const memberId = useMemo(() => {
    const email = loadUser()?.email;
    return email || "guest";
  }, []);

  function handleBorrow(bookId: string) {
    const book = books.find((item) => item.id === bookId);
    if (!book || book.status !== "available") {
      setToast({
        message: "This book is not available right now.",
        tone: "warning",
      });
      return;
    }
    const now = new Date();
    const due = new Date();
    due.setDate(now.getDate() + borrowDays);
    rentBook({
      id: `l-${Date.now()}`,
      bookId,
      memberId,
      borrowedAt: now.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      returned: false,
    });
    setToast({
      message: `Borrowed "${book.title}". Due in ${borrowDays} days.`,
      tone: "success",
    });
  }

  function computeFine(dueDate: string, returned: boolean) {
    if (returned) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil(
      (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff * 1.5 : 0;
  }

  function formatMoney(amount: number) {
    return `$${amount.toFixed(2)}`;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-200 to-indigo-300 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-6 px-6 py-8 lg:px-10">
        <aside
          className={`relative flex flex-col gap-6 rounded-3xl border border-white/70 bg-white/80 shadow-[0_22px_40px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 ${
            sidebarCollapsed ? "w-20 px-4" : "w-64 p-6"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <BookPenIcon className="h-5 w-5 text-indigo-600" />
              {!sidebarCollapsed && (
                <h2 className="text-xl font-semibold text-slate-900 font-[var(--font-display)]">
                  My Profile
                </h2>
              )}
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-600 shadow-[0_12px_24px_rgba(79,70,229,0.2)] transition hover:-translate-y-[55%] hover:bg-indigo-50 md:-right-4"
          >
            {sidebarCollapsed ? (
              <ArrowRightIcon className="h-4 w-4" />
            ) : (
              <ArrowLeftIcon className="h-4 w-4" />
            )}
          </button>
          <nav className="flex flex-1 flex-col gap-2 text-sm font-semibold text-slate-600">
            {(["Dashboard", "Search Books", "My Books", "Logout"] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === "Logout") {
                      clearSession();
                      router.push("/auth");
                      return;
                    }
                    setActive(item);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    item === active
                      ? "bg-indigo-600 text-white shadow-[0_16px_30px_rgba(79,70,229,0.3)]"
                      : "bg-white/70 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item === "Dashboard" && <HomeIcon className="h-4 w-4" />}
                    {item === "Search Books" && (
                      <SearchNavIcon className="h-4 w-4" />
                    )}
                    {item === "My Books" && <BookIcon className="h-4 w-4" />}
                    {item === "Logout" && <LogoutIcon className="h-4 w-4" />}
                    <span>{sidebarCollapsed ? item[0] : item}</span>
                  </span>
                </button>
              )
            )}
          </nav>
          {!sidebarCollapsed && (
            <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs text-indigo-600">
              Need help? Visit support.
            </div>
          )}
        </aside>

        <div className="flex min-h-full flex-1 flex-col gap-6">
          <header className="sticky top-0 z-10 flex items-center justify-between rounded-3xl border border-white/70 bg-white/90 px-6 py-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                Smart Library System
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {active === "Search Books" ? "Search Books" : "Welcome back"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {name}
                </p>
                <p className="text-xs text-slate-500">Library Member</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.3)]">
                {initials}
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
            {active === "Search Books" ? (
              <section className="flex flex-col gap-6">
                  <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
                        <input
                        className="w-full rounded-2xl border border-indigo-100 bg-white px-12 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                        type="text"
                        placeholder="Search books by title, ISBN, or keyword"
                      />
                      </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                        value={borrowDays}
                        onChange={(event) =>
                          setBorrowDays(Number(event.target.value))
                        }
                      >
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={21}>21 Days</option>
                        <option value={30}>30 Days</option>
                      </select>
                      <select className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                        <option>Category</option>
                        <option>Technology</option>
                        <option>Literature</option>
                        <option>History</option>
                      </select>
                      <select className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
                        <option>Author</option>
                        <option>M. Hartwell</option>
                        <option>L. Chen</option>
                        <option>R. Patel</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => {
                    const isAvailable = book.available > 0;
                    const status =
                      book.status === "reserved"
                        ? "Reserved"
                        : isAvailable
                          ? "Available"
                          : "On Loan";
                    const tone =
                      book.status === "reserved"
                        ? "bg-amber-100 text-amber-700"
                        : isAvailable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700";
                    return (
                    <div
                      key={book.title}
                      className="group rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(15,23,42,0.12)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {book.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {book.author}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
                        >
                          {status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleBorrow(book.id)}
                        disabled={!isAvailable || book.status === "reserved"}
                        className="mt-6 w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(79,70,229,0.25)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-200"
                      >
                        {isAvailable && book.status !== "reserved"
                          ? "Borrow"
                          : "Unavailable"}
                      </button>
                    </div>
                    );
                  })}
                </div>
              </section>
            ) : active === "My Books" ? (
              <section className="flex flex-col gap-4">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      My Books
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Track borrowed books, due dates, and fines.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {loans.length} Active
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Fine policy: $1.50 per day after the due date.
                </p>

                  <div className="mt-6 hidden overflow-hidden rounded-2xl border border-indigo-100/70 md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-indigo-50 text-xs uppercase tracking-[0.2em] text-indigo-600">
                        <tr>
                          <th className="px-4 py-3">Book</th>
                          <th className="px-4 py-3">Borrowed</th>
                          <th className="px-4 py-3">Return</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Fine</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100/70 bg-white">
                        {loans.map((loan) => {
                          const book = books.find(
                            (item) => item.id === loan.bookId
                          );
                          const fine = computeFine(
                            loan.dueDate,
                            loan.returned
                          );
                          const statusTone = loan.returned
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700";
                          return (
                            <tr key={loan.id}>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {book?.title ?? "Unknown"}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {loan.borrowedAt}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {loan.dueDate}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
                                >
                                  {loan.returned ? "Returned" : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatMoney(fine)}
                              </td>
                              <td className="px-4 py-3">
                                {!loan.returned && (
                                  <button
                                    onClick={() => returnBook(loan.id)}
                                    className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                                  >
                                    Return Book
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid gap-4 md:hidden">
                    {loans.map((loan) => {
                      const book = books.find(
                        (item) => item.id === loan.bookId
                      );
                      const fine = computeFine(loan.dueDate, loan.returned);
                      return (
                        <div
                          key={loan.id}
                          className="rounded-2xl border border-indigo-100/70 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                              {book?.title ?? "Unknown"}
                            </p>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                loan.returned
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {loan.returned ? "Returned" : "Pending"}
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            Borrowed: {loan.borrowedAt}
                          </div>
                          <div className="text-xs text-slate-500">
                            Return: {loan.dueDate}
                          </div>
                          <div className="mt-2 text-xs font-semibold text-slate-600">
                            Fine: {formatMoney(fine)}
                          </div>
                          {!loan.returned && (
                            <button
                              onClick={() => returnBook(loan.id)}
                              className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(79,70,229,0.3)] transition hover:bg-indigo-500"
                            >
                              Return Book
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : (
              <>
            <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-semibold text-slate-900">
                Good afternoon, {name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Here is a quick look at your reading activity and due dates.
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Borrowed Books",
                  value: loans.filter((loan) => !loan.returned).length,
                  tone: "from-indigo-600 to-indigo-400",
                  icon: <BookIcon className="h-6 w-6 text-white" />,
                },
                {
                  title: "Due Books",
                  value: loans.filter(
                    (loan) =>
                      !loan.returned && computeFine(loan.dueDate, false) > 0
                  ).length,
                  tone: "from-blue-500 to-cyan-400",
                  icon: <ClockIcon className="h-6 w-6 text-white" />,
                },
                {
                  title: "Total Books",
                  value: books.length,
                  tone: "from-slate-700 to-slate-500",
                  icon: <StackIcon className="h-6 w-6 text-white" />,
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${
              toast.tone === "success"
                ? "bg-emerald-600 text-white"
                : toast.tone === "warning"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-900 text-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white/90 transition hover:bg-white/25"
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

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
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

function SearchNavIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h12M10 8l4 4-4 4" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
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

function BookPenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M5 4h10a3 3 0 0 1 3 3v9" />
      <path d="M5 4v16a3 3 0 0 1 3-3h6" />
      <path d="M14.5 14.5l4 4" />
      <path d="M16.5 12.5l3 3" />
    </svg>
  );
}
