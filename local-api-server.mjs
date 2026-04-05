/**
 * Local development API only. Production uses Vercel /api/* serverless routes.
 */
import express from "express";
import cors from "cors";
import { runAnalyze, runChat, isApiKeyLoaded } from "./api/_lib/pricingAgentCore.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiKeyLoaded: isApiKeyLoaded() });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const result = await runAnalyze(req.body ?? {});
    res.status(result.status).json(result.json);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Analyze failed." });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const result = await runChat(req.body ?? {});
    res.status(result.status).json(result.json);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Chat failed." });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local API http://127.0.0.1:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`API key loaded: ${isApiKeyLoaded() ? "YES" : "NO"}`);
});
