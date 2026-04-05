export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function ltv(priceUsd, marginPercent, churnPercent) {
  const price = safeNumber(priceUsd);
  const margin = safeNumber(marginPercent);
  const churn = safeNumber(churnPercent);
  // churnPercent is a percentage (e.g. 4 => 4%)
  // LTV = (price * margin%) / churn% = price * margin / churn
  const churnSafe = Math.max(churn, 0.0001);
  return (price * margin) / churnSafe;
}

export function ltvToCacRatio(ltvValue, cacUsd) {
  const l = safeNumber(ltvValue);
  const cac = safeNumber(cacUsd);
  if (cac <= 0) return Infinity;
  return l / cac;
}

export function paybackMonths(cacUsd, priceUsd, marginPercent) {
  const cac = safeNumber(cacUsd);
  const price = safeNumber(priceUsd);
  const margin = safeNumber(marginPercent);
  // Monthly gross profit per subscriber = price * margin%
  // payback = CAC / monthly gross profit
  const monthlyGross = price * (margin / 100);
  if (monthlyGross <= 0) return Infinity;
  return cac / monthlyGross;
}

/**
 * ACV = monthly price x 12 x (1 - annual churn rate).
 * Annual churn rate = monthly churn % x 12 (linear approximation).
 */
export function estimateAcv(priceUsd, monthlyChurnPercent) {
  const price = safeNumber(priceUsd);
  const monthlyChurn = safeNumber(monthlyChurnPercent);
  const annualChurnPercent = monthlyChurn * 12;
  const retentionFactor = Math.max(0, 1 - annualChurnPercent / 100);
  return price * 12 * retentionFactor;
}

/**
 * Average customer lifespan in years: (1 / monthly churn as decimal) / 12.
 * e.g. 3% monthly -> 1/0.03 months / 12 = 2.8 years.
 */
export function avgLifespanYears(monthlyChurnPercent) {
  const m = safeNumber(monthlyChurnPercent);
  const churnSafe = Math.max(m, 0.0001);
  const monthlyDecimal = churnSafe / 100;
  return (1 / monthlyDecimal) / 12;
}

export function ratioColor(ratio) {
  if (!Number.isFinite(ratio)) return "green";
  if (ratio >= 3) return "green";
  if (ratio >= 2) return "yellow";
  return "red";
}

export function paybackColor(months) {
  if (!Number.isFinite(months)) return "red";
  if (months <= 12) return "green";
  if (months <= 18) return "yellow";
  return "red";
}

export function formatUsd(n) {
  const num = safeNumber(n);
  if (!Number.isFinite(num)) return "Infinity";
  const rounded = Math.round(num);
  return `$${rounded.toLocaleString()}`;
}

export function formatNumber(n, opts = {}) {
  const num = safeNumber(n);
  if (!Number.isFinite(num)) return "Infinity";
  if (opts.decimals != null) return num.toFixed(opts.decimals);
  return String(Math.round(num));
}

export function formatMonths(n) {
  const num = safeNumber(n);
  if (!Number.isFinite(num)) return "Infinity";
  if (num < 1) return `${Math.round(num * 10) / 10}mo`;
  return `${Math.round(num)}mo`;
}

