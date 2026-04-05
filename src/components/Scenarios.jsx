import { ltv, ltvToCacRatio, paybackMonths, paybackColor, ratioColor, formatUsd, formatMonths } from "../utils/calculations.js";

function MetricMini({ label, value, sub, tone }) {
  const t =
    tone === "green"
      ? { border: "border-green-400/40", text: "text-green-200" }
      : tone === "yellow"
        ? { border: "border-yellow-400/40", text: "text-yellow-200" }
        : { border: "border-red-400/40", text: "text-red-200" };

  return (
    <div className={["rounded-lg border p-3 bg-gray-950/30", t.border].join(" ")}>
      <div className="font-mono text-xs text-gray-400">{label}</div>
      <div className={["mt-1 font-mono text-lg", t.text].join(" ")}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-gray-500 leading-relaxed">{sub}</div> : null}
    </div>
  );
}

function ScenarioCard({ title, recommended, children }) {
  return (
    <div
      className={[
        "bg-gray-950/20 border rounded-xl p-4",
        recommended ? "border-yellow-400/70" : "border-gray-800",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-sm text-gray-200">{title}</div>
        {recommended ? (
          <div className="font-mono text-[11px] text-yellow-300 border border-yellow-400/50 px-2 py-1 rounded-full">
            Recommended
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">{children}</div>
    </div>
  );
}

export default function Scenarios({ sliders }) {
  const current = {
    price: sliders.price,
    margin: sliders.margin,
    churn: sliders.churn,
    cac: sliders.cac,
  };

  const halveChurn = {
    ...current,
    churn: current.churn * 0.5,
  };

  // Fewer conversions means higher effective CAC for the same spend.
  // Assume CAC scales inversely with conversion rate.
  const raisePrice = {
    ...current,
    price: current.price * 1.3,
    cac: current.cac / 0.8, // 20% fewer conversions => CAC / 0.8
  };

  const scenarios = [
    { id: "current", label: "Current", data: current, recommended: false, note: "" },
    { id: "halveChurn", label: "Halve churn", data: halveChurn, recommended: true, note: "Same price & CAC." },
    {
      id: "raisePrice",
      label: "Raise price 30%",
      data: raisePrice,
      recommended: false,
      note: "Assumes 20% fewer conversions (CAC increases).",
    },
  ];

  const currentLtv = ltv(current.price, current.margin, current.churn);
  const midLtv = ltv(halveChurn.price, halveChurn.margin, halveChurn.churn);

  const ltvDelta = currentLtv > 0 ? ((midLtv - currentLtv) / currentLtv) * 100 : 0;
  const lever = "churn";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {scenarios.map((s) => {
          const ltvValue = ltv(s.data.price, s.data.margin, s.data.churn);
          const ratio = ltvToCacRatio(ltvValue, s.data.cac);
          const payback = paybackMonths(s.data.cac, s.data.price, s.data.margin);
          const ratioTone = ratioColor(ratio);
          const paybackTone = paybackColor(payback);
          return (
            <ScenarioCard key={s.id} title={s.label} recommended={s.recommended}>
              <MetricMini
                label="LTV"
                value={formatUsd(ltvValue)}
                tone={ratioTone}
                sub={`Using price=${Math.round(s.data.price)}/mo, margin=${Math.round(s.data.margin)}%, churn=${s.data.churn.toFixed(1)}%`}
              />
              <MetricMini
                label="LTV:CAC"
                value={`${Number.isFinite(ratio) ? ratio.toFixed(1) : "Infinity"}x`}
                tone={ratioTone}
                sub="Color-coded by LTV:CAC."
              />
              <MetricMini
                label="Payback"
                value={formatMonths(payback)}
                tone={paybackTone}
                sub="CAC / monthly gross profit."
              />
              {s.note ? <div className="text-[12px] text-gray-400 leading-relaxed">{s.note}</div> : null}
            </ScenarioCard>
          );
        })}
      </div>

      <div className="bg-gray-950/40 border border-gray-800 rounded-lg p-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gray-400">Experiment insight</div>
        <div className="mt-2 text-sm text-gray-200 leading-relaxed">
          For these assumptions, <span className="text-yellow-300 font-mono">{lever}</span> produces{" "}
          <span className="font-mono text-yellow-300">
            {ltvDelta >= 0 ? "+" : ""}
            {ltvDelta.toFixed(0)}% higher LTV
          </span>
          . That's the experiment to run first.
        </div>
      </div>
    </div>
  );
}

