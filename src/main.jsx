import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import posthog from "posthog-js";
import ShellApp from "./ShellApp.jsx";
import "./index.css";

console.log("PH key present:", !!import.meta.env.VITE_POSTHOG_KEY);

// Public PostHog project key (same as in browser bundle). Prefer VITE_POSTHOG_KEY from
// Vercel at build time; fallback fixes production when env is missing from the Vite build.
const POSTHOG_FALLBACK_KEY = "phc_rsQTbeSTUxdF6gkRyeLGmkSRXuQEzZjPLfuGdNWw8maT";
const posthogKey = import.meta.env.VITE_POSTHOG_KEY || POSTHOG_FALLBACK_KEY;

posthog.init(posthogKey, {
  api_host: "https://us.i.posthog.com",
  capture_pageview: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ShellApp />
    <Analytics />
  </React.StrictMode>,
);
