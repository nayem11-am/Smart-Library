"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearUser,
  loadUser,
  saveSession,
  saveUser,
} from "../lib/authStore";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  saveAdminSession,
} from "../lib/adminAuthStore";
import { addUser, generateUserId, loadUsers } from "../lib/usersStore";

type TabKey = "login" | "register";

const inputBase =
  "w-full rounded-2xl border border-indigo-100 bg-white/90 px-10 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";

const iconBase =
  "pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400";

export default function AuthPage() {
  const [tab, setTab] = useState<TabKey>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerUniversityId, setRegisterUniversityId] = useState("");
  const [registerUniversityName, setRegisterUniversityName] = useState("");
  const [registerMobile, setRegisterMobile] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const router = useRouter();

  const buttonLabel = useMemo(
    () => (tab === "login" ? "Login" : "Create Account"),
    [tab]
  );

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    const stored = loadUser();
    if (stored?.email) {
      setLoginEmail(normalizeEmail(stored.email));
    }
    setLoginPassword(stored?.password ?? "");
  }, []);

  useEffect(() => {
    setError("");
    setShowPassword(false);
  }, [tab]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (tab === "register") {
      if (!registerEmail || !registerPassword || !registerName) {
        setError("Email and password are required.");
        return;
      }
      const normalizedEmail = normalizeEmail(registerEmail);
      saveUser({
        name: registerName.trim(),
        email: normalizedEmail,
        password: registerPassword,
      });
      addUser({
        id: generateUserId(),
        name: registerName.trim(),
        universityId: registerUniversityId.trim(),
        universityName: registerUniversityName.trim(),
        mobile: registerMobile.trim(),
        email: normalizedEmail,
        password: registerPassword,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      saveSession({
        email: normalizedEmail,
        loggedInAt: new Date().toISOString(),
      });
      setLoginEmail(normalizedEmail);
      setLoginPassword(registerPassword);
      setLoading(true);
      window.setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 800);
      return;
    }

    const stored = loadUser();
    if (stored && !stored.password) {
      clearUser();
      setError("Stored password missing. Please register again.");
      return;
    }
    if (!stored) {
      setError("No account found. Please register first.");
      return;
    }
    const users = loadUsers();
    const activeUser = users.find(
      (user) => normalizeEmail(user.email) === normalizeEmail(stored.email)
    );
    if (!activeUser) {
      setError("Account removed. Please register again.");
      return;
    }
    if (activeUser.status === "blocked") {
      setError("Your account is blocked. Contact administration.");
      return;
    }
    if (
      normalizeEmail(stored.email) !== normalizeEmail(loginEmail) ||
      stored.password !== loginPassword
    ) {
      setError("Email or password does not match.");
      return;
    }
    saveSession({
      email: normalizeEmail(stored.email),
      loggedInAt: new Date().toISOString(),
    });
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-100 to-indigo-200 px-6 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-6xl justify-end gap-3">
        <button
          onClick={() => {
            const target = document.getElementById("user-auth-card");
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="rounded-full border border-indigo-200 bg-white/70 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
        >
          User Login
        </button>
        <button
          onClick={() => setAdminOpen(true)}
          className="rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
        >
          Admin Login
        </button>
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">
            Smart Library System
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl font-[var(--font-display)]">
            Access your library workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Sign in to manage reservations, or create a new account to start
            renting books instantly.
          </p>
        </div>

        <div
          id="user-auth-card"
          className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_30px_70px_rgba(30,41,59,0.15)] backdrop-blur"
        >
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-indigo-50 p-1 text-sm font-semibold text-indigo-700">
            <button
              onClick={() => setTab("login")}
              className={`rounded-2xl px-4 py-2 transition ${
                tab === "login"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-indigo-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("register")}
              className={`rounded-2xl px-4 py-2 transition ${
                tab === "register"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-indigo-500"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab === "register" && (
              <>
                <div className="relative">
                  <UserIcon className={iconBase} />
                  <input
                    className={inputBase}
                    type="text"
                    placeholder="Name"
                    required
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                  />
                </div>
                <div className="relative">
                  <IdIcon className={iconBase} />
                  <input
                    className={inputBase}
                    type="text"
                    placeholder="University ID"
                    required
                    value={registerUniversityId}
                    onChange={(event) =>
                      setRegisterUniversityId(event.target.value)
                    }
                  />
                </div>
                <div className="relative">
                  <SchoolIcon className={iconBase} />
                  <input
                    className={inputBase}
                    type="text"
                    placeholder="University Name"
                    required
                    value={registerUniversityName}
                    onChange={(event) =>
                      setRegisterUniversityName(event.target.value)
                    }
                  />
                </div>
                <div className="relative">
                  <PhoneIcon className={iconBase} />
                  <input
                    className={inputBase}
                    type="tel"
                    placeholder="Mobile"
                    required
                    value={registerMobile}
                    onChange={(event) => setRegisterMobile(event.target.value)}
                  />
                </div>
              </>
            )}

            <div className="relative">
              <MailIcon className={iconBase} />
              <input
                className={inputBase}
                type="email"
                placeholder="Email"
                required
                value={tab === "login" ? loginEmail : registerEmail}
                onChange={(event) =>
                  tab === "login"
                    ? setLoginEmail(event.target.value)
                    : setRegisterEmail(event.target.value)
                }
              />
            </div>

            <div className="relative">
              <LockIcon className={iconBase} />
              <input
                className={inputBase}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={tab === "login" ? loginPassword : registerPassword}
                onChange={(event) =>
                  tab === "login"
                    ? setLoginPassword(event.target.value)
                    : setRegisterPassword(event.target.value)
                }
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

            {tab === "login" && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-2 text-xs text-indigo-600">
                Forgot password? Contact administration — Phone: 01XXXXXXXXX
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
              {loading ? "Please wait..." : buttonLabel}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            By continuing, you agree to library access policies.
          </div>
        </div>
      </div>

      {adminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-10">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Admin Login
              </h3>
              <button
                onClick={() => setAdminOpen(false)}
                className="rounded-full p-1 text-slate-500 transition hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                if (
                  normalizeEmail(adminEmail) !== ADMIN_EMAIL ||
                  adminPassword !== ADMIN_PASSWORD
                ) {
                  setError("Invalid admin credentials.");
                  return;
                }
                saveAdminSession({
                  email: ADMIN_EMAIL,
                  loggedInAt: new Date().toISOString(),
                });
                router.push("/admin/dashboard");
              }}
              className="mt-4 space-y-4"
            >
              <div className="relative">
                <MailIcon className={iconBase} />
                <input
                  className={inputBase}
                  type="email"
                  placeholder="Admin Email"
                  required
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                />
              </div>
              <div className="relative">
                <LockIcon className={iconBase} />
                <input
                  className={inputBase}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
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
              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                Login as Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IdIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M8 9h5M8 13h8M8 17h6" />
    </svg>
  );
}

function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 9l8-4 8 4-8 4-8-4Z" />
      <path d="M6 11v6c0 1.1 2.7 2 6 2s6-.9 6-2v-6" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="6" y="2.5" width="12" height="19" rx="2.2" />
      <path d="M10 18h4" />
    </svg>
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
