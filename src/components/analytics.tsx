/**
 * Privacy-conscious analytics component.
 *
 * Gated behind the public env flag VITE_ANALYTICS_ENABLED.
 * No secrets are shipped to the client — only a public measurement ID.
 *
 * Supported providers (set VITE_ANALYTICS_PROVIDER):
 *   - "plausible"  (default) — Plausible Analytics (self-hosted or cloud)
 *   - "umami"      — Umami Cloud
 *
 * Required env variables:
 *   VITE_ANALYTICS_ENABLED=true
 *   VITE_ANALYTICS_PROVIDER=plausible        (optional, defaults to "plausible")
 *   VITE_ANALYTICS_DOMAIN=ammikulaviestate.com  (Plausible: domain to track)
 *   VITE_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js  (or your self-hosted URL)
 *
 * For Umami:
 *   VITE_ANALYTICS_SCRIPT_URL=https://analytics.umami.is/script.js
 *   VITE_ANALYTICS_WEBSITE_ID=<your-umami-website-id>
 */
import { useEffect, useRef } from "react";

const ENABLED = import.meta.env["VITE_ANALYTICS_ENABLED"] === "true";
const PROVIDER = import.meta.env["VITE_ANALYTICS_PROVIDER"] || "plausible";
const SCRIPT_URL = import.meta.env["VITE_ANALYTICS_SCRIPT_URL"];
const DOMAIN = import.meta.env["VITE_ANALYTICS_DOMAIN"];
const WEBSITE_ID = import.meta.env["VITE_ANALYTICS_WEBSITE_ID"];

export function Analytics() {
  const inserted = useRef(false);

  useEffect(() => {
    if (!ENABLED || inserted.current) return;
    inserted.current = true;

    const script = document.createElement("script");
    script.defer = true;

    if (PROVIDER === "umami") {
      if (!SCRIPT_URL || !WEBSITE_ID) return;
      script.src = SCRIPT_URL;
      script.dataset["websiteId"] = WEBSITE_ID;
    } else {
      // Plausible (default)
      if (!SCRIPT_URL) return;
      script.src = SCRIPT_URL;
      if (DOMAIN) script.dataset["domain"] = DOMAIN;
    }

    document.head.appendChild(script);
  }, []);

  // Render nothing — script is injected imperatively.
  return null;
}
