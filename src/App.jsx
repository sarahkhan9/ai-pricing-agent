import { useEffect, useMemo, useState } from "react";
import SearchBar from "./components/SearchBar.jsx";
import ModelOutput from "./components/ModelOutput.jsx";

const API_BASE = "";

const initialSliders = {
  price: 59,
  margin: 70,
  churn: 4,
  cac: 300,
};

async function parseErrorMessage(res, fallbackPrefix) {
  try {
    const text = await res.text();
    if (!text) return `${fallbackPrefix} (${res.status}).`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) return `${fallbackPrefix} (${res.status}): ${parsed.error}`;
      return `${fallbackPrefix} (${res.status}).`;
    } catch {
      return `${fallbackPrefix} (${res.status}).`;
    }
  } catch {
    return `${fallbackPrefix} (${res.status}).`;
  }
}

export default function App() {
  const [companyInput, setCompanyInput] = useState("Mercury");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sliders, setSliders] = useState(initialSliders);
  const [isDemo, setIsDemo] = useState(false);

  const canRender = useMemo(() => Boolean(analysis), [analysis]);

  // ─── Auto-run Mercury on first load ───────────────────────────────────────
  useEffect(() => {
    handleAnalyze("Mercury", true);
  }, []);

  async function handleAnalyze(nextCompany, demo = false) {
    const company = (nextCompany ?? "").trim();
    if (!company) return;

    setError("");
    setLoading(true);
    setAnalysis(null);
    setIsDemo(demo);

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res, "Analyze request failed");
        throw new Error(msg);
      }

      const data = await res.json();
      setAnalysis(data);
      setSliders({
        price: Number(data.price),
        margin: Number(data.margin),
        churn: Number(data.churn),
        cac: Number(data.cac),
      });
    } catch (e) {
      setError(e?.message || "Failed to analyze company. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
          <span className="font-mono text-yellow-400 text-xs tracking-widest uppercase">
            PricingAgent
          </span>
          <div className="flex items-center gap-6">
            <a href="#how" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
              How it works
            </a>
            <button
              onClick={() => document.getElementById('cta-section').scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium px-4 py-1.5 rounded-md border border-yellow-400/60 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
            >
              Get access →
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4">

        {/* ── HERO ────────────────────────────────────────────────────────────── */}
        <div className="pt-16 pb-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Live competitive intelligence
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-100 tracking-tight leading-tight max-w-3xl mx-auto mb-5">
            Know exactly how your{" "}
            <span className="text-yellow-400">competitors price</span>.<br />
            In 30 seconds.
          </h1>

          {/* Subheadline */}
          <p className="text-gray-400 text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
            Type any company name. Get their full tier breakdown, unit economics,
            pricing gaps, and threat rating — before your next meeting.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-3">
            <SearchBar
              value={companyInput}
              onChange={setCompanyInput}
              onSubmit={(c) => handleAnalyze(c, false)}
              quickPicks={["Mercury", "Figma", "Notion", "Linear", "Ramp"]}
              disabled={loading}
            />
          </div>

          <p className="text-gray-600 text-xs mb-12">
            No signup required to preview · Results update in real time
          </p>
        </div>

        {/* ── SOCIAL PROOF BAR ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 border-y border-gray-800/60 mb-14 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <span>⚡</span>
            <span><strong className="text-gray-200">30 second</strong> analysis</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gray-800" />
          <div className="flex items-center gap-2 text-gray-400">
            <span>🔍</span>
            <span><strong className="text-gray-200">Live web search</strong> — not cached data</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gray-800" />
          <div className="flex items-center gap-2 text-gray-400">
            <span>📊</span>
            <span><strong className="text-gray-200">LTV · CAC · Payback</strong> modeled automatically</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gray-800" />
          <div className="flex items-center gap-2 text-gray-400">
            <span>🔒</span>
            <span><strong className="text-gray-200">No account</strong> needed to try</span>
          </div>
        </div>

        {/* ── DEMO LABEL ──────────────────────────────────────────────────────── */}
        {(loading || canRender) && (
          <div className="flex items-center gap-4 mb-5 justify-center">
            <div className="flex-1 max-w-40 h-px bg-gray-800" />
            <span className="font-mono text-xs tracking-widest uppercase text-gray-600">
              {loading
                ? "Analyzing..."
                : `${isDemo ? "Live sample output" : "Analysis"} — ${analysis?.company ?? companyInput}`}
            </span>
            <div className="flex-1 max-w-40 h-px bg-gray-800" />
          </div>
        )}

        {/* ── OUTPUT AREA ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="mb-20">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <LoadingState />
            </div>
          </div>
        ) : error ? (
          <div className="mb-20 bg-red-950/40 border border-red-900 rounded-xl p-5 text-red-200">
            <div className="font-mono text-sm">Error</div>
            <div className="mt-2 text-sm leading-relaxed">{error}</div>
          </div>
        ) : canRender ? (
          <div className="mb-6">
            <ModelOutput analysis={analysis} sliders={sliders} setSliders={setSliders} />
            {/* CTA beneath output */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 bg-gray-900 border border-gray-800 rounded-xl px-6 py-4">
              <p className="text-sm text-gray-400">
                Run this on your own competitor — results update live from the web.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    document.querySelector('input')?.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
                >
                  Try another company
                </button>
                <button
                  onClick={() => document.getElementById('cta-section').scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold px-5 py-2 rounded-lg bg-yellow-400 text-gray-950 hover:opacity-90 transition-opacity"
                >
                  Get full access →
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <div id="how" className="py-20 border-t border-gray-800/60">
          <h2 className="text-2xl font-semibold text-gray-100 tracking-tight text-center mb-3">
            How it works
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 font-light">
            Three steps. No spreadsheets. No manual research.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                num: "01 —",
                title: "Enter a company name",
                desc: "Type any B2B SaaS, fintech, or marketplace company. The agent live-searches their pricing page and public docs in real time.",
              },
              {
                num: "02 —",
                title: "Agent builds the model",
                desc: "In 30 seconds, PricingAgent infers tier structure, unit economics (LTV, CAC, churn), and competitive gaps — with its reasoning shown transparently.",
              },
              {
                num: "03 —",
                title: "Adjust, explore, decide",
                desc: "Use the interactive sliders to stress-test assumptions. See the Analyst Take for a strategic recommendation. Walk in prepared.",
              },
            ].map((s) => (
              <div
                key={s.num}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                <div className="font-mono text-xs text-yellow-400/60 tracking-widest mb-3">
                  {s.num}
                </div>
                <div className="font-semibold text-gray-100 mb-2">{s.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── USE CASES ───────────────────────────────────────────────────────── */}
        <div className="pb-20">
          <h2 className="text-2xl font-semibold text-gray-100 tracking-tight text-center mb-3">
            Built for people who can't afford to guess
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 font-light">
            From pre-sales prep to board decks — one tool, every use case.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🎯", title: "Founders setting price", desc: "See exactly where competitors land and find the gap before you publish your pricing page." },
              { icon: "📊", title: "PMs building business cases", desc: "Pull a competitive brief in minutes, not days. No analyst needed." },
              { icon: "🤝", title: "Sales handling objections", desc: '"How do you compare to X?" — answer it with data, not talking points.' },
              { icon: "💼", title: "Investors doing diligence", desc: "Benchmark any company's pricing model against its category in seconds." },
              { icon: "🔍", title: "Researchers & analysts", desc: "Map an entire competitive landscape in an afternoon instead of a week." },
              { icon: "🚀", title: "Interview prep", desc: "Walk into any company interview knowing their business model cold." },
            ].map((u) => (
              <div key={u.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-xl mb-3">{u.icon}</div>
                <div className="font-medium text-gray-200 text-sm mb-1.5">{u.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{u.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <div
          id="cta-section"
          className="text-center py-20 border-t border-gray-800/60 mb-10 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-48 bg-yellow-400/5 rounded-full blur-3xl" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-100 tracking-tight mb-4 relative">
            Start your first analysis free
          </h2>
          <p className="text-gray-400 font-light mb-10 relative">
            No credit card. No signup. Just paste a company name and see what the agent finds.
          </p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => document.querySelector('input')?.focus(), 600);
            }}
            className="relative text-base font-semibold px-8 py-3.5 rounded-xl bg-yellow-400 text-gray-950 hover:opacity-90 transition-opacity"
          >
            Analyze a competitor →
          </button>
          <p className="mt-6 text-xs text-gray-600 relative">
            Used by founders, PMs, and sales teams at B2B companies · Powered by Anthropic
          </p>
        </div>

      </div>
    </div>
  );
}

function LoadingState() {
  const messages = [
    "Researching pricing model...",
    "Estimating unit economics...",
    "Building sensitivity tables...",
    "Writing analyst brief...",
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((v) => (v + 1) % messages.length);
    }, 1700);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">
        <div className="w-6 h-6 border-2 border-gray-700 border-t-yellow-400 rounded-full animate-spin" />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-sm text-yellow-400">{messages[idx]}</div>
        <div className="mt-1 text-xs text-gray-400">Live-searching the web via Claude.</div>
      </div>
    </div>
  );
}
