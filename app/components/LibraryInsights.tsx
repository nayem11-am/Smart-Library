"use client";

import { useMemo } from "react";
import { useLibraryStore } from "../hooks/useLibraryStore";

export default function LibraryInsights() {
  const { store } = useLibraryStore();

  const stats = useMemo(() => {
    const books = store?.books ?? [];
    const loans = store?.loans ?? [];
    const available = books.reduce(
      (sum, book) => sum + (book.available ?? 0),
      0
    );
    const borrowed = loans.filter((loan) => !loan.returned).length;
    return {
      available,
      borrowed,
      totalBooks: books.length,
    };
  }, [store]);

  return (
    <div className="mt-6 grid gap-3 rounded-2xl border border-indigo-100/70 bg-white px-4 py-4 text-xs text-slate-600 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Available Books</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
          {stats.available}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Borrowed Books</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
          {stats.borrowed}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">Total Books</span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
          {stats.totalBooks}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">
        Updates automatically with borrowing activity.
      </p>
    </div>
  );
}
