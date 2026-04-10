
import LibraryInsights from "./components/LibraryInsights";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 -translate-y-24 translate-x-24 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 translate-y-24 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-8 md:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_rgba(79,70,229,0.18)]">
              <span className="text-lg font-semibold text-indigo-600">SL</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">
                Library
              </p>
              <p className="text-base font-semibold text-slate-800">
                Smart Shelf
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            <a
              href="/auth"
              className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Login
            </a>
            <a
              href="/auth"
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.3)] transition hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Register
            </a>
          </nav>
        </header>

        <main className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 shadow-sm">
              New era of libraries
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl font-[var(--font-display)]">
                Smart Library System
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Search, reserve, and rent books in seconds with a streamlined
                catalog and real-time availability. Manage loans, returns, and
                members from one calm, intuitive workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/auth"
                className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                Get Started
              </a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                24/7 Catalog Access
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Instant Rental Requests
              </span>
            </div>
          </section>

          <section className="relative">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_26px_60px_rgba(30,41,59,0.15)] backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Library Insights
                </p>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Live
                </span>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Inventory at a glance
                  </p>
                  <p className="text-xs text-slate-500">
                    Book availability and circulation update in real time.
                  </p>
                </div>
              </div>
              <LibraryInsights />
            </div>
          </section>
        </main>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Search Books",
              description:
                "Filter by genre, author, or availability with an intelligent catalog search.",
              color: "from-indigo-100 to-indigo-50",
            },
            {
              title: "Rent Books",
              description:
                "Reserve titles instantly and manage due dates with automated reminders.",
              color: "from-blue-100 to-blue-50",
            },
            {
              title: "Manage Easily",
              description:
                "Track members, inventory, and analytics from a single clean dashboard.",
              color: "from-sky-100 to-sky-50",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_20px_40px_rgba(59,130,246,0.12)]"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color}`}
              >
                <span className="text-lg font-semibold text-indigo-600">
                  {feature.title.split(" ")[0][0]}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col items-start justify-between gap-4 border-t border-indigo-100/70 pt-8 text-sm text-slate-500 md:flex-row md:items-center">
          <p>Designed for modern libraries and effortless circulation.</p>
          <div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em]">
            <span>Support</span>
            <span>Privacy</span>
            <span>Contact</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
