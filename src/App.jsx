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
  const [companyInput, setCompanyInput] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sliders, setSliders] = useState(initialSliders);

  const canRender = useMemo(() => Boolean(analysis), [analysis]);

  async function handleAnalyze(nextCompany) {
    const company = (nextCompany ?? "").trim();
    if (!company) return;

    setError("");
    setLoading(true);
    setAnalysis(null);

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-mono text-yellow-400 text-sm tracking-wide uppercase">
  AI Pricing Model Agent
</h1>
<p className="text-gray-300 text-xl font-semibold mt-2 mb-2">
  See how any company prices — and where the gaps are.
</p>
<p className="text-gray-500 text-sm mb-6">
  Type a company name and get a full pricing breakdown with competitive gaps and unit economics in 30 seconds.
</p>

        <SearchBar
          value={companyInput}
          onChange={setCompanyInput}
          onSubmit={handleAnalyze}
          quickPicks={["Mercury", "Coursera", "Duolingo", "Figma", "Ramp"]}
          disabled={loading}
        />

        {loading ? (
          <div className="mt-10">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <LoadingState />
            </div>
          </div>
        ) : error ? (
          <div className="mt-10 bg-red-950/40 border border-red-900 rounded-lg p-5 text-red-200">
            <div className="font-mono text-sm">Error</div>
            <div className="mt-2 text-sm leading-relaxed">{error}</div>
          </div>
        ) : canRender ? (
          <div className="mt-10">
            <ModelOutput analysis={analysis} sliders={sliders} setSliders={setSliders} />
          </div>
        ) : (
          <div className="mt-10 text-gray-400 text-sm leading-relaxed">
  Try it on a competitor, a company you're researching, or one you're interviewing at. Results in 30 seconds.
</div>
        )}
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
        <div className="mt-1 text-xs text-gray-400">Using a server-side Claude call.</div>
      </div>
    </div>
  );
}

