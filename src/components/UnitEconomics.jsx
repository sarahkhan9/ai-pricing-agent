import {
  ltv,
  ltvToCacRatio,
  paybackMonths,
  paybackColor,
  ratioColor,
  formatUsd,
  formatMonths,
  formatNumber,
  estimateAcv,
  avgLifespanYears,
} from "../utils/calculations.js";

function toneStyles(tone) {
  if (tone === "green") {
    return {
      border: "border-green-400/40",
      text: "text-green-200",
      pill: "bg-green-400/10 border-green-400/30 text-green-200",
    };
  }
  if (tone === "yellow") {
    return {
      border: "border-yellow-400/40",
      text: "text-yellow-200",
      pill: "bg-yellow-400/10 border-yellow-400/30 text-yellow-200",
    };
  }
  return {
    border: "border-red-400/40",
    text: "text-red-200",
    pill: "bg-red-400/10 border-red-400/30 text-red-200",
  };
}

function MetricCard({ title, value, sub, tone }) {
  const t = tone ? toneStyles(tone) : null;
  return (
    <div className={["bg-gray-950/30 border rounded-lg p-4", t ? t.border : "border-gray-800"].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-xs text-gray-400">{title}</div>
        {tone ? <div className={["text-[11px] font-mono px-2 py-1 rounded-full border", t.pill].join(" ")}>{tone.toUpperCase()}</div> : null}
      </div>
      <div className={["mt-2 font-mono text-lg leading-tight", t ? t.text : "text-gray-100"].join(" ")}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-400 leading-relaxed">{sub}</div> : null}
    </div>
  );
}

function Slider({ label, value, min, max, step, formatValue, onChange }) {
  return (
    <div className="bg-gray-950/20 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-xs text-gray-400">{label}</div>
        <div className="font-mono text-sm text-yellow-300">{formatValue(value)}</div>
      </div>
      <input
        className="mt-3 w-full accent-yellow-400"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-[11px] font-mono text-gray-500">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

export default function UnitEconomics({ sliders, setSliders }) {
  const ltvValue = ltv(sliders.price, sliders.margin, sliders.churn);
  const ratio = ltvToCacRatio(ltvValue, sliders.cac);
  const payback = paybackMonths(sliders.cac, sliders.price, sliders.margin);
  const acvValue = estimateAcv(sliders.price, sliders.churn);
  const lifespanYears = avgLifespanYears(sliders.churn);

  const ratioTone = ratioColor(ratio);
  const paybackTone = paybackColor(payback);

  const ltvLabel = formatUsd(ltvValue);
  const cacLabel = formatUsd(sliders.cac);
  const ratioLabel = Number.isFinite(ratio) ? `${ratio.toFixed(1)}x` : "Infinity";
  const paybackLabel = formatMonths(payback);
  const acvLabel = formatUsd(acvValue);
  const lifespanLabel = Number.isFinite(lifespanYears) ? `${lifespanYears.toFixed(1)} years` : "Infinity";

  const interpretation = (() => {
    const paybackNum = payback;
    const ratioNum = ratio;
    let paybackText = "";
    if (Number.isFinite(paybackNum)) {
      if (paybackNum <= 12) paybackText = "fast payback (good capital efficiency)";
      else if (paybackNum <= 18) paybackText = "moderate payback (watch scalability)";
      else paybackText = "slow payback (pricing/CAC need improvement)";
    } else {
      paybackText = "no meaningful payback estimate (margin and churn need attention)";
    }

    let ratioText = "";
    if (Number.isFinite(ratioNum)) {
      if (ratioNum >= 3) ratioText = "strong LTV relative to CAC";
      else if (ratioNum >= 2) ratioText = "acceptable LTV relative to CAC";
      else ratioText = "weak LTV relative to CAC";
    } else {
      ratioText = "infinite ratio (CAC is ~0)";
    }

    return `With a ${formatUsd(sliders.price)}/mo price and ${formatNumber(sliders.margin, { decimals: 0 })}% gross margin, your monthly churn of ${formatNumber(sliders.churn, { decimals: 1 })}% implies an LTV of ${ltvLabel}. At ${cacLabel} CAC, the LTV:CAC ratio is ${ratioLabel} and payback is ${paybackLabel}, which means ${ratioText} and ${paybackText}.`;
  })();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Slider
          label="Monthly price"
          value={sliders.price}
          min={1}
          max={1000}
          step={1}
          formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
          onChange={(price) => setSliders((s) => ({ ...s, price }))}
        />

        <Slider
          label="Gross margin"
          value={sliders.margin}
          min={10}
          max={95}
          step={1}
          formatValue={(v) => `${Math.round(v)}%`}
          onChange={(margin) => setSliders((s) => ({ ...s, margin }))}
        />

        <Slider
          label="Monthly churn"
          value={sliders.churn}
          min={0.5}
          max={30}
          step={0.5}
          formatValue={(v) => `${Number(v).toFixed(1)}%`}
          onChange={(churn) => setSliders((s) => ({ ...s, churn }))}
        />

        <Slider
          label="Blended CAC"
          value={sliders.cac}
          min={10}
          max={10000}
          step={10}
          formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
          onChange={(cac) => setSliders((s) => ({ ...s, cac }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
        <MetricCard title="LTV" value={ltvLabel} sub={`LTV = (price x margin%) / churn%`} />
        <MetricCard title="CAC" value={cacLabel} sub="Blended CAC used in ratio and payback" />
        <MetricCard title="LTV:CAC" value={ratioLabel} sub="Green >= 3x, yellow 2-3x, red < 2x" tone={ratioTone} />
        <MetricCard title="Payback" value={paybackLabel} sub="Green <= 12mo, yellow 12-18mo, red > 18mo" tone={paybackTone} />
        <MetricCard title="Est. ACV" value={acvLabel} sub="Annual contract value" />
        <MetricCard title="Avg lifespan" value={lifespanLabel} />
      </div>

      <div className="bg-gray-950/20 border border-gray-800 rounded-lg p-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gray-400">What it implies</div>
        <p className="mt-2 text-sm text-gray-200 leading-relaxed">{interpretation}</p>
      </div>
    </div>
  );
}

