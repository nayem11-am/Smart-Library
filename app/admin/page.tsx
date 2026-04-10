"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  saveAdminSession,
} from "../lib/adminAuthStore";

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";

const iconBase =
  "pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isReady = useMemo(() => email.length > 0 && password.length > 0, [
    email,
    password,
  ]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady || loading) return;
    setError("");
    if (
      email.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      setError("Invalid admin credentials.");
      return;
    }
    setLoading(true);
    saveAdminSession({
      email: ADMIN_EMAIL,
      loggedInAt: new Date().toISOString(),
    });
    window.setTimeout(() => {
      setLoading(false);
      router.push("/admin/dashboard");
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">
            Admin Access
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl font-[var(--font-display)]">
            Library Control Center
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Securely manage inventory, users, and transactions from one place.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_30px_70px_rgba(30,41,59,0.15)] backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <MailIcon className={iconBase} />
              <input
                className={inputBase}
                type="email"
                placeholder="Admin Email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="relative">
              <LockIcon className={iconBase} />
              <input
                className={inputBase}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-indigo-500 shadow-sm transition hover:text-indigo-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!isReady || loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
              {loading ? "Verifying..." : "Login as Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
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

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M3 4l18 16" />
      <path d="M10.5 6.6A9 9 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-4.3 4.8" />
      <path d="M6.2 7.8C3.9 9.8 2 12 2 12s4 6 10 6a9.6 9.6 0 0 0 2.2-.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
