import { useMemo, useRef, useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ltv, ltvToCacRatio, ratioColor } from "../utils/calculations.js";

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.contentRect;
      setSize({ width: next.width, height: next.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}

function HeatmapTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  const ratioText = Number.isFinite(p.ratio) ? `${p.ratio.toFixed(1)}x` : "Infinity";
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-100">
      <div className="font-mono text-[11px] uppercase tracking-wide text-gray-400">Cell</div>
      <div className="mt-1 font-mono">
        LTV: <span className="text-yellow-300">{Math.round(p.ltv).toLocaleString()}</span>
      </div>
      <div className="mt-1 text-gray-300 leading-relaxed">
        Price: <span className="font-mono">{p.priceMultiplier.toFixed(2)}x</span> · Churn:{" "}
        <span className="font-mono">{p.churnPercent.toFixed(1)}%</span>
      </div>
      <div className="mt-1 text-gray-300 leading-relaxed">
        LTV:CAC: <span className="font-mono">{ratioText}</span>
      </div>
    </div>
  );
}

export default function Sensitivity({ sliders }) {
  const [containerRef, size] = useElementSize();

  const chartMargin = { top: 30, right: 20, left: 70, bottom: 55 };

  const { points, xLabels, yLabels } = useMemo(() => {
    const priceMultipliers = [0.5, 0.75, 1, 1.3, 1.6, 2];
    const currentChurn = sliders.churn;
    const churnRates = [
      2,
      4,
      currentChurn,
      currentChurn * 1.5,
      currentChurn * 2,
      currentChurn * 3,
    ].map((v) => Math.max(0.2, Math.min(30, v)));

    const xLabelsInner = churnRates.map((c) => {
      if (Math.abs(c - currentChurn) < 1e-6) return `${c.toFixed(1)}% (current)`;
      return `${c.toFixed(1)}%`;
    });

    const yLabelsInner = priceMultipliers.map((m) => `${m.toFixed(2)}x`);

    const pointsInner = [];
    const basePrice = sliders.price;
    const margin = sliders.margin;
    const cac = sliders.cac;

    for (let r = 0; r < priceMultipliers.length; r++) {
      const priceMult = priceMultipliers[r];
      const price = basePrice * priceMult;
      const yCoord = priceMultipliers.length - 1 - r; // top row first

      for (let c = 0; c < churnRates.length; c++) {
        const churnPercent = churnRates[c];
        const xCoord = c;
        const ltvValue = ltv(price, margin, churnPercent);
        const ratio = ltvToCacRatio(ltvValue, cac);
        pointsInner.push({
          x: xCoord,
          y: yCoord,
          ltv: ltvValue,
          ratio,
          ratioTone: ratioColor(ratio),
          priceMultiplier: priceMult,
          churnPercent,
        });
      }
    }

    return { points: pointsInner, xLabels: churnRates, yLabels: priceMultipliers };
  }, [sliders]);

  const w = size.width;
  const h = Math.max(440, size.height || 0);
  const innerW = Math.max(1, w - chartMargin.left - chartMargin.right);
  const innerH = Math.max(1, h - chartMargin.top - chartMargin.bottom);
  const cellW = innerW / xLabels.length;
  const cellH = innerH / yLabels.length;
  const rectW = cellW * 0.92;
  const rectH = cellH * 0.92;

  const cellShape = (shapeProps) => {
    const { payload } = shapeProps;
    if (!payload) return null;
    const cx = shapeProps.cx ?? shapeProps.x;
    const cy = shapeProps.cy ?? shapeProps.y;
    if (cx == null || cy == null) return null;

    const tone = payload.ratioTone;
    const style =
      tone === "green"
        ? { fill: "rgba(34,197,94,0.25)", stroke: "rgba(34,197,94,0.8)" }
        : tone === "yellow"
          ? { fill: "rgba(234,179,8,0.25)", stroke: "rgba(234,179,8,0.85)" }
          : { fill: "rgba(239,68,68,0.22)", stroke: "rgba(239,68,68,0.85)" };

    const label = Math.round(payload.ltv).toLocaleString();
    const showLabel = rectW >= 70 && rectH >= 32;

    return (
      <g>
        <rect x={cx - rectW / 2} y={cy - rectH / 2} width={rectW} height={rectH} rx={4} ry={4} fill={style.fill} stroke={style.stroke} strokeWidth={1} />
        {showLabel ? (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill="rgba(229,231,235,0.95)"
            style={{ pointerEvents: "none" }}
          >
            {label}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-950/30 border border-gray-800 rounded-lg p-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gray-400">
          Heatmap (LTV by price + churn)
        </div>
        <div className="mt-1 text-sm text-gray-200 leading-relaxed">
          Cell color encodes <span className="text-yellow-300 font-mono">LTV:CAC</span> (green &gt;= 3x, yellow 2-3x, red &lt; 2x).
          Hover for exact values.
        </div>
      </div>

      <div ref={containerRef} className="w-full" style={{ height: h }}>
        {w > 10 ? (
          <ScatterChart
            width={w}
            height={h}
            margin={chartMargin}
          >
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, xLabels.length - 1]}
              ticks={xLabels.map((_, i) => i)}
              tickFormatter={(v) => {
                const i = Math.round(v);
                const c = xLabels[i];
                if (i === 0) return "2%";
                if (i === 1) return "4%";
                if (Math.abs(c - sliders.churn) < 1e-6) return "current";
                return `${(c / sliders.churn).toFixed(1)}x`;
              }}
              tick={{ fill: "rgba(156,163,175,1)", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
              stroke="rgba(55,65,81,1)"
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, yLabels.length - 1]}
              ticks={yLabels.map((_, i) => i)}
              tickFormatter={(v) => {
                const yCoord = Math.round(v);
                const rowIndex = yLabels.length - 1 - yCoord;
                const mult = yLabels[rowIndex];
                return `${mult.toFixed(2)}x`;
              }}
              tick={{ fill: "rgba(156,163,175,1)", fontSize: 11, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
              stroke="rgba(55,65,81,1)"
            />
            <Tooltip cursor={{ stroke: "rgba(250,204,21,0.8)", strokeWidth: 1, fill: "rgba(250,204,21,0.08)" }} content={<HeatmapTooltip />} />
            <Scatter
              data={points}
              shape={cellShape}
            />
          </ScatterChart>
        ) : (
          <div className="text-gray-500 font-mono text-sm">Preparing heatmap...</div>
        )}
      </div>
    </div>
  );
}

