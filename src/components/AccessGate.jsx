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

// --- Locked screen ---
function LockedScreen() {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.badge}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L6 12V24C6 33.94 13.94 43.26 24 46C34.06 43.26 42 33.94 42 24V12L24 4Z"
              fill="oklch(22% 0.04 240)"
              stroke="oklch(65% 0.18 140)"
              strokeWidth="1.5"
            />
            <path
              d="M18 24L22 28L30 20"
              stroke="oklch(65% 0.18 140)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p style={styles.schoolLabel}>NAVAL BASE SECONDARY SCHOOL</p>
        <h1 style={styles.title}>Football CCA</h1>

        <div style={styles.divider} />

        <p style={styles.body}>
          This platform is exclusively for members of the NBSS Football CCA.
        </p>
        <p style={styles.body}>
          Access is granted via an invite link distributed by your teacher-in-charge.
          If you are a member and do not have the link, please approach your coach or CCA leader.
        </p>

        <div style={styles.footer}>
          <span style={styles.footerText}>Restricted Access &nbsp;·&nbsp; NBSS FC</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "oklch(14% 0.02 240)",
    fontFamily: "'Instrument Sans', 'DM Sans', 'Segoe UI', system-ui, sans-serif",
    padding: "24px",
  },
  card: {
    background: "oklch(19% 0.03 240)",
    border: "1px solid oklch(30% 0.04 240)",
    borderRadius: "12px",
    padding: "48px 40px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
  },
  badge: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  schoolLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.2em",
    color: "oklch(55% 0.08 240)",
    textTransform: "uppercase",
    margin: "0 0 8px 0",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "oklch(92% 0.02 240)",
    margin: "0 0 24px 0",
    letterSpacing: "-0.02em",
  },
  divider: {
    height: "1px",
    background: "oklch(30% 0.04 240)",
    margin: "0 0 24px 0",
  },
  body: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "oklch(62% 0.04 240)",
    margin: "0 0 12px 0",
  },
  footer: {
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid oklch(25% 0.03 240)",
  },
  footerText: {
    fontSize: "11px",
    color: "oklch(40% 0.04 240)",
    letterSpacing: "0.05em",
  },
};
