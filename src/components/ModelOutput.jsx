import { useMemo, useState } from "react";
import UnitEconomics from "./UnitEconomics.jsx";
import Scenarios from "./Scenarios.jsx";
import Sensitivity from "./Sensitivity.jsx";
import AnalystTake from "./AnalystTake.jsx";
import ChatPanel from "./ChatPanel.jsx";
import { formatUsd, formatNumber } from "../utils/calculations.js";

const TABS = [
  { id: "unit", label: "Unit economics" },
  { id: "scenarios", label: "Pricing scenarios" },
  { id: "sensitivity", label: "Sensitivity analysis" },
  { id: "take", label: "Analyst take" },
];

export default function ModelOutput({ analysis, sliders, setSliders }) {
  const [tab, setTab] = useState("unit");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState("");

  const company = analysis?.company ?? "";
  const category = analysis?.category ?? "";
  const context = analysis?.context ?? "";

  const rationale = analysis?.rationale ?? {};

  const priceLabel = analysis?.price_label;
  const dataSource = analysis?.source === "fallback" ? "fallback" : "live";
  const sourceNote = analysis?.source_note ?? "";
  const baseline = useMemo(() => {
    const p = formatUsd(sliders.price);
    const m = `${formatNumber(sliders.margin, { decimals: 0 })}%`;
    const c = `${formatNumber(sliders.churn, { decimals: 1 })}%`;
    const cac = formatUsd(sliders.cac);
    return { p, m, c, cac };
  }, [sliders]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-mono text-lg text-gray-100">{company}</h2>
              {category ? (
                <span className="font-mono text-xs px-2 py-1 rounded-full border border-yellow-400/40 text-yellow-300 bg-gray-950/30">
                  {category}
                </span>
              ) : null}
              <span
                className={[
                  "font-mono text-xs px-2 py-1 rounded-full border",
                  dataSource === "live"
                    ? "border-green-400/40 text-green-300 bg-gray-950/30"
                    : "border-blue-400/50 text-blue-200 bg-blue-950/40",
                ].join(" ")}
              >
                {dataSource === "live" ? "Live AI" : "Industry benchmarks"}
              </span>
            </div>
            {context ? <p className="mt-2 text-sm text-gray-300 leading-relaxed">{context}</p> : null}
            {dataSource === "fallback" && sourceNote ? (
              <div className="mt-3 rounded-lg border border-blue-500/40 bg-blue-950/35 px-3 py-2">
                <p className="text-xs text-blue-100/95 leading-relaxed">{sourceNote}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            {priceLabel ? (
              <div className="text-xs font-mono text-gray-300">
                Agent baseline: <span className="text-yellow-300">{priceLabel}</span>
              </div>
            ) : null}
            <div className="text-xs text-gray-500 font-mono">
              Editable: price {baseline.p}, margin {baseline.m}, churn {baseline.c}, CAC {baseline.cac}
            </div>
          </div>
        </div>

        <div className="mt-5 bg-gray-950/40 border border-gray-800 rounded-lg p-4">
          <div className="font-mono text-xs uppercase tracking-wide text-gray-400">How the agent reasoned</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <RationaleRow label="Price" value={rationale?.price} />
            <RationaleRow label="Margin" value={rationale?.margin} />
            <RationaleRow label="Churn" value={rationale?.churn} />
            <RationaleRow label="CAC" value={rationale?.cac} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              type="button"
              className={[
                "font-mono text-xs px-3 py-2 rounded-lg border transition",
                tab === t.id
                  ? "bg-gray-950 border-yellow-400/60 text-yellow-300"
                  : "bg-gray-900 border-gray-800 text-gray-200 hover:border-gray-700",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === "unit" ? (
          <UnitEconomics sliders={sliders} setSliders={setSliders} />
        ) : tab === "scenarios" ? (
          <Scenarios analysis={analysis} sliders={sliders} />
        ) : tab === "sensitivity" ? (
          <Sensitivity sliders={sliders} />
        ) : (
          <AnalystTake
            analysis={analysis}
            onPracticeQuestion={() => {
              setChatSeed(`Ask me one tough monetization question about ${company}. Evaluate my answer.`);
              setChatOpen(true);
            }}
          />
        )}

        <ChatPanel
          open={chatOpen}
          company={company}
          seedMessage={chatSeed}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </div>
  );
}

function RationaleRow({ label, value }) {
  return (
    <div className="bg-gray-950/30 border border-gray-800 rounded-lg p-3 min-w-0">
      <div className="font-mono text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-sm text-gray-200 leading-relaxed">{value}</div>
    </div>
  );
}

