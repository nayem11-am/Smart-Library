"use client";

import { useLibraryStore } from "../hooks/useLibraryStore";

export default function StoreStats() {
  const { stats } = useLibraryStore();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-100/70 bg-white/80 px-4 py-3 text-xs text-indigo-600 shadow-sm">
      <span className="font-semibold uppercase tracking-[0.2em]">
        Local Storage Active
      </span>
      <span className="text-slate-500">Books: {stats.books}</span>
      <span className="text-slate-500">Members: {stats.members}</span>
      <span className="text-slate-500">Active Loans: {stats.loans}</span>
    </div>
  );
}
