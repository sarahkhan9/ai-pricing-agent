import { useEffect, useMemo, useState } from "react";
import App from "./App.jsx";

const ACTIVITY_STORAGE_KEY = "pricingagent_recent_activity_v1";

const FREE_USAGE_LIMITS = {
  "Reality Check": 3,
  "Competitive Intel": 3,
  "Pivot Lab": 1,
};

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/reality-check", label: "Reality Check" },
  { path: "/competitive-intel", label: "Competitive Intel" },
  { path: "/pivot-lab", label: "Pivot Lab" },
];

function readStoredActivity() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        typeof entry?.tool === "string" &&
        typeof entry?.timestamp === "number" &&
        typeof entry?.company === "string",
    );
  } catch {
    return [];
  }
}

export default function ShellApp() {
  const [recentActivity, setRecentActivity] = useState(() => readStoredActivity());
  const [currentPath, setCurrentPath] = useState(() => getCurrentPath());

  useEffect(() => {
    const onPopState = () => setCurrentPath(getCurrentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(recentActivity));
  }, [recentActivity]);

  const usageByTool = useMemo(() => {
    const counts = {
      "Reality Check": 0,
      "Competitive Intel": 0,
      "Pivot Lab": 0,
    };
    for (const activity of recentActivity) {
      if (Object.hasOwn(counts, activity.tool)) {
        counts[activity.tool] += 1;
      }
    }
    return counts;
  }, [recentActivity]);

  function handleRunLogged(entry) {
    setRecentActivity((current) => [entry, ...current].slice(0, 25));
  }

  function navigateTo(path) {
    if (path === currentPath) return;
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-[#BA7517]/20 bg-[#F5F4F0] px-5 py-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#BA7517]">
              PricingAgent
            </div>
            <div className="mt-2 text-xl font-semibold">SaaS Workspace</div>
          </div>

          <nav className="mt-8 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateTo(item.path)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  currentPath === item.path
                    ? "bg-[#BA7517] text-white"
                    : "text-stone-700 hover:bg-[#BA7517]/10 hover:text-[#BA7517]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-[#BA7517]/25 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Free usage
            </div>
            <div className="mt-3 space-y-3">
              {Object.entries(FREE_USAGE_LIMITS).map(([tool, limit]) => {
                const used = usageByTool[tool] ?? 0;
                const cappedUsed = Math.min(used, limit);
                const fillWidth = `${(cappedUsed / limit) * 100}%`;
                return (
                  <div key={tool}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-stone-600">{tool}</span>
                      <span className="font-medium text-stone-800">
                        {cappedUsed}/{limit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-[#BA7517]"
                        style={{ width: fillWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#BA7517] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Upgrade to Pro
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {currentPath === "/" && (
            <HomePage recentActivity={recentActivity} onNavigate={navigateTo} />
          )}
          {currentPath === "/competitive-intel" && <App onRunLogged={handleRunLogged} />}
          {currentPath === "/reality-check" && (
            <PlaceholderPage
              title="Reality Check"
              subtitle="Stress-test your assumptions against market willingness to pay."
            />
          )}
          {currentPath === "/pivot-lab" && (
            <PlaceholderPage
              title="Pivot Lab"
              subtitle="Explore pricing pivots before making high-impact changes."
            />
          )}
          {!isKnownPath(currentPath) && (
            <HomePage recentActivity={recentActivity} onNavigate={navigateTo} />
          )}
        </main>
      </div>
    </div>
  );
}

function HomePage({ recentActivity, onNavigate }) {
  const featureCards = [
    {
      title: "Reality Check",
      description: "Validate your pricing assumptions before you launch.",
      to: "/reality-check",
    },
    {
      title: "Competitive Intel",
      description: "Analyze competitors and model unit economics in minutes.",
      to: "/competitive-intel",
    },
    {
      title: "Pivot Lab",
      description: "Simulate pricing strategy pivots with confidence.",
      to: "/pivot-lab",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Know what to charge.</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Move from guesswork to confident pricing decisions with focused tools for analysis and experimentation.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Tools</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => onNavigate(card.to)}
              className="rounded-xl border border-[#BA7517]/20 bg-white p-5 shadow-sm transition hover:border-[#BA7517]/50 hover:shadow"
            >
              <div className="text-base font-semibold text-stone-900">{card.title}</div>
              <p className="mt-2 text-sm text-stone-600">{card.description}</p>
              <div className="mt-4 text-sm font-medium text-[#BA7517]">Open tool →</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Recent activity</h2>
        <div className="mt-4 rounded-xl border border-[#BA7517]/20 bg-white p-5 shadow-sm">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-stone-500">
              No runs yet. Your completed tool runs will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.slice(0, 8).map((entry, idx) => (
                <li
                  key={`${entry.tool}-${entry.timestamp}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 text-sm last:border-b-0 last:pb-0"
                >
                  <div className="text-stone-800">
                    <span className="font-medium">{entry.tool}</span>{" "}
                    {entry.company ? `· ${entry.company}` : ""}
                  </div>
                  <div className="text-xs text-stone-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">{subtitle}</p>
      <div className="mt-8 rounded-xl border border-[#BA7517]/20 bg-white p-8 text-sm text-stone-500 shadow-sm">
        Coming soon
      </div>
    </div>
  );
}

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function isKnownPath(path) {
  return NAV_ITEMS.some((item) => item.path === path);
}
