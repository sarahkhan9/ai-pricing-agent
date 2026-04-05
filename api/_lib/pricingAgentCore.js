import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env");

dotenv.config({ path: ENV_PATH });

export const BENCHMARK_NOTICE =
  "Using industry benchmarks for this analysis. Assumptions based on public data and comparable company research.";

export const MODEL = "claude-sonnet-4-20250514";

function sanitizeAnthropicApiKey(raw) {
  if (raw == null) return "";
  let s = String(raw).replace(/^\uFEFF/, "").trim();
  s = s.replace(/^["']|["']$/g, "");
  const oneLine = s.split(/\r?\n/)[0] ?? "";
  const hash = oneLine.indexOf("#");
  const noComment = hash === -1 ? oneLine : oneLine.slice(0, hash).trim();
  return noComment.trim();
}

function readAnthropicKeyFromEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const match = content.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)$/m);
  if (!match) return "";
  return sanitizeAnthropicApiKey(match[1]);
}

export function loadApiKey() {
  let key = sanitizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);
  if (!key) {
    key = readAnthropicKeyFromEnvFile(ENV_PATH);
    if (key) process.env.ANTHROPIC_API_KEY = key;
  }
  return key;
}

let _anthropic = undefined;

export function getAnthropicOrNull() {
  const key = loadApiKey();
  if (!key) return null;
  if (_anthropic === undefined) {
    _anthropic = new Anthropic({ apiKey: key });
  }
  return _anthropic;
}

export function isApiKeyLoaded() {
  return Boolean(loadApiKey());
}

export function isAuthError(err) {
  const status = Number(err?.status ?? err?.statusCode ?? 0);
  const msg = String(err?.message ?? "").toLowerCase();
  return status === 401 || msg.includes("invalid x-api-key") || msg.includes("authentication_error");
}

export function fallbackAnalyze(company) {
  const c = company.toLowerCase();
  const presets = [
    {
      match: ["figma", "ramp", "mercury"],
      category: "PLG B2B SaaS",
      context: `${company} sells software to business teams with a self-serve to sales-assisted motion. Economic performance is driven by seat expansion, retention, and efficient paid acquisition.`,
      price: 39,
      price_label: "$39/mo estimated entry tier",
      margin: 83,
      churn: 3,
      cac: 900,
      subscribers: 120000,
      conversion_rate: 5,
      rationale: {
        price: "Estimated from common PLG SMB entry tiers when exact pricing is unclear.",
        margin: "Software gross margins for mature SaaS often cluster around 75-90%.",
        churn: "Healthy B2B logos often trend around low-single-digit monthly churn.",
        cac: "Blended CAC reflects paid + sales costs for a mixed PLG and sales motion.",
      },
      biggest_lever: "churn",
      lever_reason: "Retention improvements compound fastest because they lift both LTV and payback simultaneously.",
      key_risk: "If activation is weak, paid acquisition can scale faster than retained revenue.",
      interview_insight: "A strong pricing model here is less about headline ARPU and more about expanding retained gross profit per account.",
    },
    {
      match: ["duolingo", "coursera", "lovie"],
      category: "B2C subscription",
      context: `${company} monetizes consumers through a recurring premium plan layered on top of a free experience. Growth depends on conversion, habit retention, and disciplined performance marketing.`,
      price: 19,
      price_label: "$19/mo estimated premium plan",
      margin: 72,
      churn: 6,
      cac: 140,
      subscribers: 900000,
      conversion_rate: 4,
      rationale: {
        price: "Anchored to typical consumer premium monthly tiers in education/productivity apps.",
        margin: "Digital subscription products commonly carry high variable-margin profiles.",
        churn: "Consumer subscriptions often have materially higher monthly churn than B2B SaaS.",
        cac: "Consumer CAC reflects paid social/search blended with organic and referral channels.",
      },
      biggest_lever: "churn",
      lever_reason: "Even modest churn reduction has an outsized effect on LTV in monthly consumer subscriptions.",
      key_risk: "Discount-heavy pricing tests may inflate conversions but degrade long-run retention quality.",
      interview_insight: "If you cannot improve month-2 retention, price optimization alone rarely rescues economics.",
    },
  ];

  const chosen =
    presets.find((p) => p.match.some((token) => c.includes(token))) ?? {
      category: "Subscription software",
      context: `${company} appears to sell a recurring subscription with mixed self-serve and assisted conversion channels. Inputs are benchmark-based estimates due to limited verified public pricing detail.`,
      price: 29,
      price_label: "$29/mo benchmark estimate",
      margin: 78,
      churn: 5,
      cac: 260,
      subscribers: 150000,
      conversion_rate: 4,
      rationale: {
        price: "Benchmark estimate for a mainstream subscription entry tier.",
        margin: "Typical digital gross margins after infra, support, and payment costs.",
        churn: "Mid-range monthly churn estimate for blended subscription cohorts.",
        cac: "Blended acquisition estimate assuming paid + organic channels.",
      },
      biggest_lever: "churn",
      lever_reason: "At this baseline, retention gains produce the largest modeled LTV lift.",
      key_risk: "Benchmarks may diverge from true company economics without internal cohort data.",
      interview_insight: "When data confidence is low, sensitivity ranges matter more than point estimates.",
    };

  return {
    company,
    ...chosen,
  };
}

export function fallbackChat(company, safeMessages) {
  const lastUser = [...safeMessages].reverse().find((m) => m.role === "user")?.content ?? "";
  const hasAnswer = safeMessages.some((m) => m.role === "assistant");
  if (!hasAnswer) {
    return `Tough question for ${company}: Your model recommends reducing churn first. What single product or pricing experiment would you run in 30 days, what metric would you move, and what minimum effect size would justify scaling it?`;
  }
  return `Direct evaluation: your answer is ${lastUser.length > 120 ? "specific enough to be credible" : "too high-level"} for an investor interview. Tighten it by naming one segment, one experiment, one success metric, and one explicit downside risk.`;
}

export function extractJsonObject(text) {
  if (!text) throw new Error("Empty model response.");
  const str = String(text);

  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model did not return a JSON object.");
  }

  const candidate = str.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

export function extractAssistantText(anthropicResponse) {
  const content = anthropicResponse?.content;
  if (!Array.isArray(content) || !content.length) return "";
  const first = content.find((c) => c?.type === "text") ?? content[0];
  return first?.text ?? "";
}

export function buildAnalyzePrompt(company) {
  return `You are a senior monetization analyst. Research and model the unit economics for: ${company}

Return ONLY a valid JSON object with no markdown fences:
{
  company: string,
  category: string (e.g. B2C edtech, B2B fintech, PLG SaaS),
  context: string (2 sentence description of what they sell and who buys it),
  price: number (monthly price in USD),
  price_label: string (e.g. $59/mo Plus plan),
  margin: number (gross margin as integer 0-100),
  churn: number (monthly churn rate as integer 0-100),
  cac: number (blended CAC in USD),
  subscribers: number (estimated active paying subscribers),
  conversion_rate: number (free to paid conversion % as integer),
  rationale: {
    price: string,
    margin: string,
    churn: string,
    cac: string
  },
  biggest_lever: string (churn or price or cac),
  lever_reason: string (one sentence),
  key_risk: string (one sentence),
  interview_insight: string (one sharp sentence a monetization strategist would say about this company's pricing)
}

Use real knowledge of this company's pricing if available. If pre-launch or unknown, use industry benchmarks and label as estimates.`;
}

export async function runAnalyze(body) {
  const company = String(body?.company ?? "").trim();
  if (!company) {
    return { status: 400, json: { error: "Missing `company`." } };
  }

  const prompt = buildAnalyzePrompt(company);
  const anthropic = getAnthropicOrNull();

  if (!anthropic) {
    return {
      status: 200,
      json: {
        ...fallbackAnalyze(company),
        source: "fallback",
        source_note: BENCHMARK_NOTICE,
      },
    };
  }

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const text = extractAssistantText(msg);
    const json = extractJsonObject(text);
    return { status: 200, json: { ...json, source: "live" } };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Analyze error:", e);
    if (isAuthError(e)) {
      return {
        status: 200,
        json: {
          ...fallbackAnalyze(company || "Unknown company"),
          source: "fallback",
          source_note: BENCHMARK_NOTICE,
        },
      };
    }
    return { status: 500, json: { error: e?.message || "Analyze failed." } };
  }
}

export async function runChat(body) {
  const company = String(body?.company ?? "").trim();
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const safeMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role,
      content: String(m.content ?? ""),
    }));

  if (!company) {
    return { status: 400, json: { error: "Missing `company`." } };
  }

  const systemPrompt = `You are a sharp investor interviewing a product growth manager candidate. They just built a pricing model for ${company}. Ask them one tough monetization question and evaluate their answer. Be direct and specific.`;

  const anthropic = getAnthropicOrNull();
  if (!anthropic) {
    return { status: 200, json: { reply: fallbackChat(company, safeMessages), source: "fallback" } };
  }

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.2,
      system: systemPrompt,
      messages: safeMessages,
    });

    const text = extractAssistantText(msg);
    return { status: 200, json: { reply: text, source: "live" } };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Chat error:", e);
    if (isAuthError(e)) {
      return { status: 200, json: { reply: fallbackChat(company, safeMessages), source: "fallback" } };
    }
    return { status: 500, json: { error: e?.message || "Chat failed." } };
  }
}
