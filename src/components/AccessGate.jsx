// src/components/AccessGate.jsx
// Drop this file into your src/components/ folder.
// Then wrap your app with it in main.jsx or App.jsx (see instructions below).

import { useEffect, useState } from "react";

const TOKEN = "majulahnavalites";
const STORAGE_KEY = "nbssfc_access";

export default function AccessGate({ children }) {
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check URL for token
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("ref");

    if (urlToken === TOKEN) {
      localStorage.setItem(STORAGE_KEY, "true");
      // Clean token from URL without page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      setGranted(true);
    } else if (localStorage.getItem(STORAGE_KEY) === "true") {
      setGranted(true);
    }

    setChecking(false);
  }, []);

  if (checking) return null;
  if (granted) return children;
  return <LockedScreen />;
}

function LockedScreen() {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Crest / Badge */}
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
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
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
