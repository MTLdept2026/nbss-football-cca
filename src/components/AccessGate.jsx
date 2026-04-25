// src/components/AccessGate.jsx
// Uses cookies instead of localStorage — works across browser AND home screen (PWA) on iOS/Android.
//
// SECURITY NOTE: The access token is loaded from an environment variable (VITE_ACCESS_TOKEN).
// Vite inlines env vars into the client bundle at build time — this is NOT server-side secret
// storage. The benefit is the token is NOT in source code / git history, and can be rotated
// via Netlify Environment Variables without a code change.
// For higher security requirements, replace this gate with a proper auth backend.

import { useEffect, useState } from "react";

const TOKEN = import.meta.env.VITE_ACCESS_TOKEN ?? "";
const COOKIE_NAME = "nbssfc_access";
const COOKIE_DAYS = 400; // ~13 months — survives the school year

// --- Cookie helpers ---
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

// --- Gate component ---
export default function AccessGate({ children }) {
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("ref");

    if (urlToken === TOKEN) {
      setCookie(COOKIE_NAME, "true", COOKIE_DAYS);
      // Clean token from URL without reload
      window.history.replaceState({}, "", window.location.pathname);
      setGranted(true);
    } else if (getCookie(COOKIE_NAME) === "true") {
      setGranted(true);
    }

    setChecking(false);
  }, []);

  if (checking) return null;
  if (granted) return children;
  return <LockedScreen />;
}

// ── Nothing Design Language — locked screen ──
// OLED black · Space Mono labels · Space Grotesk reading text · no color except data status
// Flat surfaces · border separation · no shadows · no blur · no gradients
const FONT_HEAD  = "'Space Grotesk', 'DM Sans', system-ui, sans-serif";
const FONT_BODY  = "'Space Grotesk', 'DM Sans', system-ui, sans-serif";
const FONT_SERIF = "'Space Mono', monospace";
const FONT_DISPLAY = "'Doto', 'Space Mono', monospace";

function LockedScreen() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gp-type-micro: 0.75rem;
          --gp-type-caption: 0.8125rem;
          --gp-type-small: 0.875rem;
          --gp-type-compact: 0.9375rem;
          --gp-type-body: 1rem;
          --gp-type-lead: 1.0625rem;
        }
        html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        body { background: #000000; line-height: 1.55; }
        button, input, select, textarea { font: inherit; }
        @media (max-width: 640px) {
          :root {
            --gp-type-micro: 0.8125rem;
            --gp-type-caption: 0.875rem;
            --gp-type-small: 0.9375rem;
            --gp-type-compact: 1rem;
            --gp-type-body: 1rem;
            --gp-type-lead: 1.0625rem;
          }
        }
      `}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        padding: "24px",
      }}>
        <div style={{
          background: "#111111",
          border: "1px solid #222222",
          borderRadius: 8,
          padding: "48px 40px",
          maxWidth: 420,
          width: "100%",
        }}>
          {/* Flat monochrome mark */}
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 4,
              background: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: "var(--gp-type-caption)", color: "#000000", letterSpacing: "0.08em" }}>GP</span>
            </div>
            <div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 16, color: "#FFFFFF", letterSpacing: "0.06em" }}>GAMEPLAN</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: "var(--gp-type-micro)", color: "#666666", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>NBSS Football CCA</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#222222", marginBottom: 28 }} />

          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D71921", flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_SERIF, fontSize: "var(--gp-type-micro)", color: "#D71921", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Restricted Access
            </span>
          </div>

          {/* Headline */}
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 6vw, 40px)", color: "#FFFFFF", letterSpacing: "0.02em", lineHeight: 0.95, marginBottom: 20 }}>
            MEMBERS ONLY
          </div>

          {/* Body text */}
          <p style={{ fontFamily: FONT_BODY, fontSize: "var(--gp-type-body)", lineHeight: 1.7, color: "#999999", marginBottom: 12 }}>
            This platform is exclusively for members of the NBSS Football CCA.
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: "var(--gp-type-body)", lineHeight: 1.7, color: "#999999", marginBottom: 0 }}>
            Access is granted via an invite link from your teacher-in-charge. Approach your coach or CCA leader if you are a member without a link.
          </p>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #222222" }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: "var(--gp-type-micro)", color: "#444444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Naval Base Secondary School · Football CCA
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
