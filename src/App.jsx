import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { CoachDashboardSurface, CoachOperationsSurface, CoachSquadSurface, PlayerMatchSurface, PlayerPerformanceSurface } from "./components/PremiumExperience";
import LocalTrustPanel from "./components/LocalTrustPanel";

// ── SCREENSHOT / SHARE UTILITY ──
// Uses html2canvas loaded from CDN at runtime (no extra npm dep needed)
async function loadHtml2Canvas() {
  if (window.html2canvas) return window.html2canvas;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve(window.html2canvas);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function captureAndDownload(el, filename = "gameplan-export.png", opts = {}) {
  const h2c = await loadHtml2Canvas();
  const canvas = await h2c(el, {
    backgroundColor: "#000000",
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth:  opts.width  || el.scrollWidth,
    windowHeight: opts.height || el.scrollHeight,
    width:        opts.width  || el.scrollWidth,
    height:       opts.height || el.scrollHeight,
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function canvasToBlob(canvas, type = "image/png") {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image blob."));
    }, type);
  });
}

async function captureAndShare(el, title = "GamePlan", opts = {}) {
  const h2c = await loadHtml2Canvas();
  const canvas = await h2c(el, {
    backgroundColor: "#000000",
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth:  opts.width  || el.scrollWidth,
    windowHeight: opts.height || el.scrollHeight,
    width:        opts.width  || el.scrollWidth,
    height:       opts.height || el.scrollHeight,
  });
  const blob = await canvasToBlob(canvas);
  if (typeof File !== "undefined") {
    const file = new File([blob], "gameplan-share.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return "shared";
    }
  }
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return "copied";
  }
  await captureAndDownload(el, "gameplan-share.png", opts);
  return "downloaded";
}

// Reusable Share+Save action bar
function ShareSaveBar({ targetRef, filename, title, style: s = {} }) {
  const C = useTheme();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: "success"|"error" }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!targetRef.current) return;
    setSaving(true);
    try { await captureAndDownload(targetRef.current, filename || "gameplan-export.png"); }
    catch (e) { showToast("Screenshot failed — please try again.", "error"); }
    setSaving(false);
  };

  const handleShare = async () => {
    if (!targetRef.current) return;
    setSharing(true);
    try {
      const outcome = await captureAndShare(targetRef.current, title || "GamePlan");
      showToast(
        outcome === "copied"
          ? "Image copied to clipboard!"
          : outcome === "downloaded"
            ? "Sharing unsupported here, so the image was downloaded."
            : "Shared successfully!"
      );
    }
    catch (e) { showToast("Share failed — use Save Photo instead.", "error"); }
    setSharing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...s }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleShare} disabled={sharing} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999,
          background: sharing ? C.navyCard : `${C.electric}15`,
          border: `1px solid ${C.electric}30`, color: C.electric,
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: sharing ? "wait" : "pointer",
          transition: "opacity 0.15s ease",
        }}>
          {sharing ? "Sharing…" : "↗ Share"}
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999,
          background: saving ? C.navyCard : `${C.orange}15`,
          border: `1px solid ${C.orange}30`, color: C.orange,
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: saving ? "wait" : "pointer",
          transition: "opacity 0.15s ease",
        }}>
          {saving ? "Saving…" : "📸 Save Photo"}
        </button>
      </div>
      {toast && (
        <div style={{
          padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: FONT_BODY,
          background: toast.type === "error" ? `${C.danger}12` : `${C.success}12`,
          border: `1px solid ${toast.type === "error" ? C.danger : C.success}30`,
          color: toast.type === "error" ? C.danger : C.success,
        }}>{toast.msg}</div>
      )}
    </div>
  );
}


// ── IMAGE COMPRESSION UTILITY ──
// Crops to square, resizes to maxSize px, returns base64 JPEG
// 400px handles 2× retina without bloating storage (≈ 25–40 KB at 0.72 quality)
function compressImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext("2d");
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = url;
  });
}

// ═══════════════════════════════════════════════════════════════
//  NBSS FOOTBALL CCA — PREMIUM EDITION
//  Naval Base Secondary School · GamePlan Platform
// ═══════════════════════════════════════════════════════════════

// ── DESIGN SYSTEM — Nothing Design Language ──
// Dark: OLED instrument panel. Light: printed technical manual.
// Monochromatic — color encodes data status only, never decoration.
const DARK_C = {
  // Surfaces — pure OLED stack, no blue tinting
  navy:          "#000000",          // --black: OLED page background
  navyDeep:      "#000000",          // deep insets — same true black
  navyCard:      "#111111",          // --surface: elevated cards
  navyBorder:    "#222222",          // --border: subtle dividers
  navyHover:     "#1A1A1A",          // --surface-raised: hover / secondary elevation

  // No decorative gold — white is the active / primary accent in Nothing's system
  gold:          "#FFFFFF",          // active state, primary interactive (was gold)
  goldLight:     "#E8E8E8",          // --text-primary: supporting highlight
  goldDim:       "#999999",          // --text-secondary: metadata, labels
  goldGlow:      "rgba(255,255,255,0.06)", // subtle white tint for active backgrounds

  // Interactive / data blue — links and tappable values only, not buttons
  electric:      "#5B9BF6",          // --interactive (dark)
  electricDim:   "#3B7DE0",
  electricGlow:  "rgba(91,155,246,0.10)",

  // Data status — exempt from "no color" rule when encoding values
  success:       "#4A9E5C",          // --success: in range, confirmed
  danger:        "#D71921",          // --accent: signal red — one per screen, urgent only
  orange:        "#D4A843",          // --warning: caution zone

  // Text — four-level grayscale hierarchy (the hierarchy IS the palette)
  textBright:    "#FFFFFF",          // --text-display 100%: hero numbers, one per screen
  textMid:       "#E8E8E8",          // --text-primary  90%: body, primary content
  textDim:       "#999999",          // --text-secondary 60%: labels, captions, metadata

  // Semantic surface aliases
  surface:       "#111111",          // --surface
  surfaceRaised: "#1A1A1A",          // --surface-raised
  surfaceBorder: "#333333",          // --border-visible: intentional / structural borders
  surfaceSubtle: "rgba(255,255,255,0.03)", // barely-there tint for active rows
};

// ── LIGHT MODE — Nothing Design Language ──
// Printed technical manual: off-white paper, black ink. No warmth, no decoration.
// Cards = white (#FFFFFF) on off-white (#F5F5F5) = subtle elevation without shadows.
const LIGHT_C = {
  // Surfaces
  navy:          "#F5F5F5",          // --black (light): off-white page background
  navyDeep:      "#F0F0F0",          // deeper inset areas
  navyCard:      "#FFFFFF",          // --surface (light): cards on off-white
  navyBorder:    "#E8E8E8",          // --border (light)
  navyHover:     "#F0F0F0",          // --surface-raised (light): hover

  // Active accent — pure black in light mode
  gold:          "#000000",          // active / primary interactive
  goldLight:     "#1A1A1A",          // --text-primary (light)
  goldDim:       "#666666",          // --text-disabled (light)
  goldGlow:      "rgba(0,0,0,0.04)",

  // Interactive blue — light mode variant
  electric:      "#007AFF",          // --interactive (light)
  electricDim:   "#0066DD",
  electricGlow:  "rgba(0,122,255,0.08)",

  // Status — identical across modes
  success:       "#4A9E5C",
  danger:        "#D71921",
  orange:        "#D4A843",

  // Text — four-level grayscale (inverted)
  textBright:    "#000000",          // --text-display (light) 100%
  textMid:       "#1A1A1A",          // --text-primary (light) 90%
  textDim:       "#666666",          // --text-secondary (light) 60%

  // Semantic surface aliases
  surface:       "#FFFFFF",
  surfaceRaised: "#F0F0F0",
  surfaceBorder: "#CCCCCC",          // --border-visible (light)
  surfaceSubtle: "rgba(0,0,0,0.02)",
};

// ── RESPONSIVE HOOK ──
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ── THEME CONTEXT ──
const ThemeContext = createContext(DARK_C);
const useTheme = () => useContext(ThemeContext);

// Fallback for module-level usage (StoryExportCard always uses dark)
const C = DARK_C;

// ── NOTHING DESIGN FONTS ──
// Doto: variable dot-matrix display — Nothing's NDot 57 spiritual twin.
//   36px+ only, tight tracking, never body text. One hero moment per screen.
// Space Grotesk: body and UI text — same Colophon foundry DNA as Nothing's typefaces.
// Space Mono: ALL CAPS labels, data readouts, numeric values. The instrument-panel voice.
const FONT_HEAD  = "'Doto', 'Space Mono', monospace";
const FONT_BODY  = "'Space Grotesk', 'DM Sans', system-ui, sans-serif";
const FONT_SERIF = "'Space Mono', 'JetBrains Mono', 'SF Mono', monospace"; // data / labels

// ── SHARED STYLES (theme-aware helpers) ──
// Labels: always Space Mono (FONT_SERIF), ALL CAPS, 0.08em spacing — "instrument panel" voice.
const makeLabelStyle = (C) => ({
  fontFamily: FONT_SERIF, fontSize: 11, color: C.textDim,
  fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em",
  display: "block", marginBottom: 8,
});
// Inputs: underline-preferred. Border brightens to --text-primary on focus.
const makeInputStyle = (C) => ({
  width: "100%", padding: "11px 0", borderRadius: 0,
  background: "transparent", border: "none",
  borderBottom: `1px solid ${C.surfaceBorder}`,
  color: C.textBright, fontFamily: FONT_SERIF, fontSize: 14, outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s ease-out",
});
// Module-level fallbacks (used by StoryExportCard which always uses dark theme)
const labelStyle = makeLabelStyle(DARK_C);
const inputStyle = makeInputStyle(DARK_C);

// ── STORAGE ──
const STORAGE_KEYS = {
  sessions: "nbss-sessions", squad: "nbss-squad", checklist: "nbss-checklist",
  growthJournal: "nbss-growth-journal", goals: "nbss-goals",
  quizScores: "nbss-quiz-scores", lineups: "nbss-lineups",
  fitnessResults: "nbss-fitness-results", profile: "nbss-profile",
  roster: "nbss-cluster-roster", attendance: "nbss-attendance-log",
  matchHistory: "nbss-match-history", wellnessLog: "nbss-wellness-log",
};
const DRAFT_KEYS = {
  trackerForm: "gameplan-draft-session-entry",
  wellnessForm: "gameplan-draft-availability-entry",
  matchForm: "gameplan-draft-match-entry",
  matchReview: "gameplan-draft-match-review",
  lineupBuilder: "gameplan-draft-lineup-builder",
};

// SECURITY NOTE: loaded from env var — not hardcoded in source.
// Set VITE_TEACHER_PASSWORD in .env (local) or Netlify Environment Variables (production).
const ATTENDANCE_TEACHER_PASSWORD = import.meta.env.VITE_TEACHER_PASSWORD ?? "";
const ATTENDANCE_TEACHER_SESSION_KEY = "nbss-attendance-teacher-access";
const STORAGE_META_SUFFIX = "__meta";

// Increment this to force all existing users through the onboarding flow again.
const PROFILE_VERSION = 2;

function buildMetaForValue(value) {
  return {
    updatedAt: new Date().toISOString(),
    count: Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value).length : value ? 1 : 0,
  };
}

function writeStorageMeta(key, value) {
  try {
    localStorage.setItem(`${key}${STORAGE_META_SUFFIX}`, JSON.stringify(buildMetaForValue(value)));
  } catch {}
}

function readStorageMeta(key) {
  try {
    const raw = localStorage.getItem(`${key}${STORAGE_META_SUFFIX}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stampRecord(record, previous = null) {
  const now = new Date().toISOString();
  return {
    ...record,
    createdAt: previous?.createdAt || record.createdAt || now,
    updatedAt: now,
  };
}

function usePersistedState(key, defaultVal) {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultVal; }
    catch { return defaultVal; }
  });
  const setPersisted = useCallback((valOrFn) => {
    setState(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      try {
        localStorage.setItem(key, JSON.stringify(next));
        writeStorageMeta(key, next);
      } catch (e) { console.error(e); }
      return next;
    });
  }, [key]);
  return [state, setPersisted, true];
}

function useDraftState(key, initialState) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      writeStorageMeta(key, state);
    } catch {}
  }, [key, state]);

  const clearDraft = useCallback((nextState = initialState) => {
    setState(nextState);
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}${STORAGE_META_SUFFIX}`);
    } catch {}
  }, [initialState, key]);

  return [state, setState, clearDraft];
}

function getReadinessDirective(readiness) {
  if (readiness == null) return "Complete sleep, energy, and soreness inputs to unlock a decision-grade readiness score.";
  if (readiness < 60) return "Recovery takes priority. Reduce intensity, stay technical, and protect sleep before adding more load.";
  if (readiness < 75) return "Train with control. Keep quality high but trim unnecessary volume and repeated high-speed work.";
  return "Clear to push the planned session. Hold quality and capture the full recovery check-in afterwards.";
}

function getLoadDirective(acwr) {
  if (acwr == null) return "Log session duration and RPE consistently to unlock load guidance.";
  if (acwr > 1.5) return "Load spike is elevated. Pull back high-intensity exposure and monitor soreness closely.";
  if (acwr > 1.3) return "Load is climbing. Keep the next block controlled and prioritise recovery behaviours.";
  if (acwr < 0.8) return "You are underloaded. Rebuild rhythm with quality work before chasing intensity.";
  return "Load is in range. Stay consistent and avoid unnecessary swings in volume.";
}

function getComplianceDirective(compliance) {
  if (compliance >= 80) return "Data quality is strong enough to support confident coaching decisions.";
  if (compliance >= 50) return "Capture the missing recovery and load fields so the guidance stays reliable.";
  return "The decision layer is still weak. Complete your entries fully after each session.";
}

function getAvailabilityDirective(activeIssues) {
  const severeIssue = activeIssues.some((log) => Number(log.severity) >= 3);
  const moderateIssue = activeIssues.some((log) => Number(log.severity) === 2);
  if (severeIssue) return "Medical or coach review should come before full-intensity training.";
  if (moderateIssue) return "Modify sprint, contact, and volume demands until the issue settles.";
  if (activeIssues.length) return "Minor issue logged. Train, but keep the area under review.";
  return "No active constraints are recorded. Full availability is clear.";
}

// ── NAVIGATION ──
// Top-level groups (5 + home)
const NAV_GROUPS = [
  { id: "home",     label: "Home" },
  { id: "train",    label: "Train" },
  { id: "match",    label: "Match" },
  { id: "progress", label: "Progress" },
  { id: "culture",  label: "Culture" },
  { id: "hub",      label: "Hub" },
];

const PLAYER_PRIMARY_NAV = [
  { id: "dashboard",   label: "Dashboard" },
  { id: "performance", label: "Performance" },
  { id: "match",       label: "Match" },
  { id: "hub",         label: "Hub" },
];

const COACH_PRIMARY_NAV = [
  { id: "dashboard",  label: "Dashboard" },
  { id: "squad",      label: "Squad" },
  { id: "operations", label: "Operations" },
  { id: "hub",        label: "Hub" },
];

// ══════════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════════

const QUOTES = [
  { text: "You have to fight to reach your dream. You have to sacrifice and work hard for it.", author: "Lionel Messi", emoji: "🐐" },
  { text: "Talent without working hard is nothing.", author: "Cristiano Ronaldo", emoji: "💎" },
  { text: "I'm not the next anyone. I'm the first Kylian Mbappé.", author: "Kylian Mbappé", emoji: "⚡" },
  { text: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé", emoji: "👑" },
  { text: "I learned all about life with a ball at my feet.", author: "Ronaldinho", emoji: "😁" },
  { text: "Every disadvantage has its advantage.", author: "Johan Cruyff", emoji: "🧠" },
  { text: "Football is not just about scoring goals. It's about the heart you put into every game.", author: "Fandi Ahmad", emoji: "🇸🇬" },
  { text: "Success is not final, failure is not fatal. It is the courage to continue that counts.", author: "Aleksandar Đurić", emoji: "🦁" },
];

const TRAINING_DATA = {
  beginner: {
    title: "Foundation Builder", subtitle: "Sec 1–2 · Building Your Base", color: C.success,
    weeks: [
      { name: "Ball Mastery", icon: "🎯", focus: "Get comfortable with the ball at your feet. Do these barefoot at home to build feel.", drills: [
        { text: "Toe taps (2×30s)", video: "https://www.youtube.com/results?search_query=toe+taps+football+drill+tutorial" },
        { text: "Inside-outside rolls (2×20)", video: "https://www.youtube.com/results?search_query=inside+outside+rolls+football+drill" },
        { text: "Figure-8 dribbling (3×1min)", video: "https://www.youtube.com/results?search_query=figure+8+dribbling+drill+football" },
        { text: "Sole rolls forward/back (2×20)", video: "https://www.youtube.com/results?search_query=sole+rolls+football+drill+tutorial" },
      ]},
      { name: "First Touch", icon: "🦶", focus: "A great first touch separates good players from average ones. Fandi Ahmad's first touch was legendary.", drills: [
        { text: "Wall passes — inside foot (3×20)", video: "https://www.youtube.com/results?search_query=wall+pass+inside+foot+drill" },
        { text: "Cushion control — thigh (2×15)", video: "https://www.youtube.com/results?search_query=thigh+cushion+control+football" },
        { text: "Chest-and-volley (2×10)", video: "https://www.youtube.com/results?search_query=chest+and+volley+football+drill" },
        { text: "Turn on first touch (3×10)", video: "https://www.youtube.com/results?search_query=turn+on+first+touch+football+drill" },
      ]},
      { name: "Passing Accuracy", icon: "📐", focus: "Pass to where your teammate WILL be, not where they are now.", drills: [
        { text: "5m target passing (3×15)", video: "https://www.youtube.com/results?search_query=target+passing+drill+football" },
        { text: "One-touch passing pairs (5min)", video: "https://www.youtube.com/results?search_query=one+touch+passing+pairs+football" },
        { text: "Triangle passing (3×2min)", video: "https://www.youtube.com/results?search_query=triangle+passing+drill+football" },
        { text: "Long ball to zone (2×10)", video: "https://www.youtube.com/results?search_query=long+ball+passing+drill+football" },
      ]},
      { name: "Shooting Basics", icon: "💥", focus: "Power comes from technique, not just strength. Lock that ankle!", drills: [
        { text: "Laces drive — standing ball (3×10)", video: "https://www.youtube.com/results?search_query=laces+drive+shooting+technique+football" },
        { text: "Side-foot placement (3×10)", video: "https://www.youtube.com/results?search_query=side+foot+placement+shot+football" },
        { text: "One-touch finish (2×10)", video: "https://www.youtube.com/results?search_query=one+touch+finish+football+drill" },
        { text: "Volleys from cross (2×8)", video: "https://www.youtube.com/results?search_query=volley+from+cross+football+drill" },
      ]},
    ],
  },
  intermediate: {
    title: "Game Sharpener", subtitle: "Sec 2–3 · Levelling Up", color: C.gold,
    weeks: [
      { name: "1v1 Skills", icon: "⚔️", focus: "Messi says: 'The ball never comes at the speed you want.' Adapt and react.", drills: [
        { text: "Stepover + accelerate (3×8)", video: "https://www.youtube.com/results?search_query=stepover+skill+tutorial+football" },
        { text: "Body feint both sides (3×8)", video: "https://www.youtube.com/results?search_query=body+feint+football+skill+tutorial" },
        { text: "Cruyff turn (2×10)", video: "https://www.youtube.com/results?search_query=cruyff+turn+tutorial+football" },
        { text: "Elastico (2×10)", video: "https://www.youtube.com/results?search_query=elastico+skill+tutorial+football" },
      ]},
      { name: "Positional Play", icon: "♟️", focus: "Xavi checked his shoulder 843 times per game. Awareness is everything.", drills: [
        { text: "Rondo 4v2 (3×3min)", video: "https://www.youtube.com/results?search_query=rondo+4v2+football+drill" },
        { text: "Positional rotations (15min)", video: "https://www.youtube.com/results?search_query=positional+rotation+football+drill" },
        { text: "Half-space receiving (3×10)", video: "https://www.youtube.com/results?search_query=half+space+receiving+football+tactical" },
        { text: "Scanning before receiving (constant)", video: "https://www.youtube.com/results?search_query=scanning+before+receiving+football" },
      ]},
      { name: "Defensive Shape", icon: "🛡️", focus: "Defending is about patience. Don't dive in — make them make the mistake.", drills: [
        { text: "Mirror shadowing (3×2min)", video: "https://www.youtube.com/results?search_query=mirror+shadowing+defending+drill" },
        { text: "Jockey and delay (3×1min)", video: "https://www.youtube.com/results?search_query=jockey+delay+defending+football" },
        { text: "Recovery runs (2×6)", video: "https://www.youtube.com/results?search_query=recovery+run+defending+drill+football" },
        { text: "1v1 defending channel (3×3min)", video: "https://www.youtube.com/results?search_query=1v1+defending+channel+drill+football" },
      ]},
      { name: "Set Pieces", icon: "📌", focus: "30% of goals come from set pieces. Free goals if you practise them.", drills: [
        { text: "Corner delivery to zones (2×10)", video: "https://www.youtube.com/results?search_query=corner+kick+delivery+zones+football" },
        { text: "Free kick wall + curl (3×8)", video: "https://www.youtube.com/results?search_query=free+kick+curl+technique+tutorial" },
        { text: "Throw-in routines (2×5)", video: "https://www.youtube.com/results?search_query=throw+in+routines+football" },
        { text: "Penalty technique (2×5)", video: "https://www.youtube.com/results?search_query=penalty+kick+technique+tutorial" },
      ]},
    ],
  },
  advanced: {
    title: "Elite Pathway", subtitle: "Sec 3–4 · Competing at the Top", color: C.danger,
    weeks: [
      { name: "Press Triggers", icon: "🔥", focus: "Klopp's gegenpressing: Win the ball back within 5 seconds of losing it.", drills: [
        { text: "Team press on back-pass (5×2min)", video: "https://www.youtube.com/results?search_query=team+press+back+pass+trigger+football" },
        { text: "Counter-press 5s rule (3×3min)", video: "https://www.youtube.com/results?search_query=gegenpressing+counter+press+drill" },
        { text: "Press traps wide areas (3×3min)", video: "https://www.youtube.com/results?search_query=press+trap+wide+areas+football+tactical" },
        { text: "Transition sprints (2×6)", video: "https://www.youtube.com/results?search_query=transition+sprint+football+drill" },
      ]},
      { name: "Build-Up Play", icon: "🏗️", focus: "Pep Guardiola: 'Take the ball, pass the ball.' Simplicity under pressure.", drills: [
        { text: "GK to striker in 5 passes (3×3min)", video: "https://www.youtube.com/results?search_query=build+up+play+goalkeeper+to+striker+drill" },
        { text: "Playing through pressure (4v3, 10min)", video: "https://www.youtube.com/results?search_query=playing+through+pressure+football+drill" },
        { text: "Switch of play drills (3×8)", video: "https://www.youtube.com/results?search_query=switch+of+play+football+drill" },
        { text: "Third-man runs (3×3min)", video: "https://www.youtube.com/results?search_query=third+man+run+football+tactical" },
      ]},
      { name: "Match Intelligence", icon: "🧩", focus: "The best players see the game 2 seconds ahead of everyone else.", drills: [
        { text: "Game film review (20min)", video: "https://www.youtube.com/results?search_query=football+match+analysis+for+players" },
        { text: "Decision-making rondos (3×4min)", video: "https://www.youtube.com/results?search_query=decision+making+rondo+football" },
        { text: "Tactical scenarios walk-through", video: "https://www.youtube.com/results?search_query=football+tactical+scenarios+training" },
        { text: "Communication drills (10min)", video: "https://www.youtube.com/results?search_query=communication+drills+football+team" },
      ]},
      { name: "Peak Performance", icon: "🏆", focus: "Champions don't do extraordinary things — they do ordinary things extraordinarily well.", drills: [
        { text: "High-intensity match simulation", video: "https://www.youtube.com/results?search_query=high+intensity+match+simulation+football" },
        { text: "Fatigue decision-making drills", video: "https://www.youtube.com/results?search_query=fatigue+decision+making+football+drill" },
        { text: "Leadership under pressure", video: "https://www.youtube.com/results?search_query=leadership+under+pressure+sports+training" },
        { text: "Pre-match routine practice", video: "https://www.youtube.com/results?search_query=pre+match+routine+football+player" },
      ]},
    ],
  },
};

// ── POSITION-SPECIFIC DRILLS ──
const POSITION_DRILLS = {
  GK: {
    label: "Goalkeeper", icon: "🧤", color: "#22d3a5",
    focus: "Distribution, shot-stopping angles and decision-making under pressure.",
    drills: [
      { text: "Set-position + reaction dive (3×8 each side)", video: "https://www.youtube.com/results?search_query=goalkeeper+reaction+dive+drill" },
      { text: "Distribution — driven throws to flanks (3×10)", video: "https://www.youtube.com/results?search_query=goalkeeper+distribution+driven+throw+drill" },
      { text: "1v1 angle narrowing — close down attacker (3×6)", video: "https://www.youtube.com/results?search_query=goalkeeper+1v1+angle+narrowing+drill" },
      { text: "Cross claiming — jump + call 'Keeper!' (3×10)", video: "https://www.youtube.com/results?search_query=goalkeeper+cross+claiming+drill" },
    ],
  },
  CB: {
    label: "Centre Back", icon: "🏔️", color: C.electric,
    focus: "Aerial dominance, blocking channels and composure in possession from the back.",
    drills: [
      { text: "Heading duels — timed jumps (3×10)", video: "https://www.youtube.com/results?search_query=centre+back+heading+drill+aerial+duel" },
      { text: "Covering + intercepting through balls (3×8)", video: "https://www.youtube.com/results?search_query=centre+back+intercept+through+ball+drill" },
      { text: "Switch of play from deep — long diagonal (3×10)", video: "https://www.youtube.com/results?search_query=centre+back+long+diagonal+pass+drill" },
      { text: "Press trigger — step + block passing lane (3×5 scenarios)", video: "https://www.youtube.com/results?search_query=centre+back+press+trigger+drill" },
    ],
  },
  LB: {
    label: "Left Back", icon: "🏃", color: C.orange,
    focus: "Overlapping runs, recovery pace and delivery from wide areas.",
    drills: [
      { text: "Overlap run + cross to near/far post (3×10 each)", video: "https://www.youtube.com/results?search_query=full+back+overlap+cross+drill" },
      { text: "Recovery sprint + 1v1 defending (3×6)", video: "https://www.youtube.com/results?search_query=full+back+recovery+sprint+defending+drill" },
      { text: "Inside cut onto stronger foot + shot (2×8)", video: "https://www.youtube.com/results?search_query=full+back+inside+cut+finish+drill" },
      { text: "Whipped first-time cross from byline (3×8)", video: "https://www.youtube.com/results?search_query=whipped+cross+byline+football+drill" },
    ],
  },
  RB: {
    label: "Right Back", icon: "🏃", color: C.orange,
    focus: "Overlapping runs, recovery pace and delivery from wide areas.",
    drills: [
      { text: "Overlap run + cross to near/far post (3×10 each)", video: "https://www.youtube.com/results?search_query=full+back+overlap+cross+drill" },
      { text: "Recovery sprint + 1v1 defending (3×6)", video: "https://www.youtube.com/results?search_query=full+back+recovery+sprint+defending+drill" },
      { text: "Inside cut onto stronger foot + shot (2×8)", video: "https://www.youtube.com/results?search_query=full+back+inside+cut+finish+drill" },
      { text: "Whipped first-time cross from byline (3×8)", video: "https://www.youtube.com/results?search_query=whipped+cross+byline+football+drill" },
    ],
  },
  CDM: {
    label: "Defensive Mid", icon: "🛡️", color: C.electric,
    focus: "Screening the defence, winning second balls and playing simple under pressure.",
    drills: [
      { text: "Interception reads — shadow ball through middle (3×8)", video: "https://www.youtube.com/results?search_query=defensive+midfielder+interception+drill" },
      { text: "Win the second ball — box-to-box shuttle (3×3min)", video: "https://www.youtube.com/results?search_query=defensive+mid+second+ball+winning+drill" },
      { text: "Pivot + split pass under pressure (3×10)", video: "https://www.youtube.com/results?search_query=pivot+pass+defensive+midfielder+drill" },
      { text: "Covering runs when CB steps (3×5 scenarios)", video: "https://www.youtube.com/results?search_query=defensive+midfielder+cover+shadow+drill" },
    ],
  },
  CM: {
    label: "Central Mid", icon: "♟️", color: C.orange,
    focus: "Box-to-box engine: pressing, receiving on the half-turn and arriving late into the box.",
    drills: [
      { text: "Half-turn receive + drive forward (3×12)", video: "https://www.youtube.com/results?search_query=central+midfielder+half+turn+receive+drill" },
      { text: "Box-to-box pressing shuttle (4×2min)", video: "https://www.youtube.com/results?search_query=box+to+box+midfielder+pressing+drill" },
      { text: "Late runs into box + finish (3×8)", video: "https://www.youtube.com/results?search_query=central+mid+late+run+box+finish" },
      { text: "Vertical combination play in tight space (3×3min)", video: "https://www.youtube.com/results?search_query=combination+play+central+midfield+drill" },
    ],
  },
  CAM: {
    label: "Attacking Mid", icon: "🎨", color: C.orange,
    focus: "Creating in tight spaces, vision, and timing runs in behind the defensive line.",
    drills: [
      { text: "Turn + shoot in the pocket (3×10)", video: "https://www.youtube.com/results?search_query=attacking+midfielder+turn+shoot+pocket+drill" },
      { text: "Through-ball timing — split the defence (3×8)", video: "https://www.youtube.com/results?search_query=attacking+mid+split+pass+drill" },
      { text: "Tight rondo — 1-2 touch in triangle (3×3min)", video: "https://www.youtube.com/results?search_query=tight+space+rondo+attacking+midfielder" },
      { text: "Dribble through pressure + switch (3×8)", video: "https://www.youtube.com/results?search_query=CAM+dribble+through+pressure+switch+play" },
    ],
  },
  LW: {
    label: "Left Wing", icon: "⚡", color: C.orange,
    focus: "1v1 dominance, cutting inside and delivering quality from wide areas.",
    drills: [
      { text: "Winger 1v1 — body feint + burst past cone (3×10)", video: "https://www.youtube.com/results?search_query=winger+1v1+body+feint+burst+drill" },
      { text: "Receive wide + cut inside + shoot (3×10)", video: "https://www.youtube.com/results?search_query=winger+cut+inside+shoot+drill" },
      { text: "Underlap run combination with fullback (3×6)", video: "https://www.youtube.com/results?search_query=winger+underlap+combination+fullback+drill" },
      { text: "Crossing on the run — whipped + floated (3×8 each)", video: "https://www.youtube.com/results?search_query=winger+crossing+run+whipped+floated" },
    ],
  },
  RW: {
    label: "Right Wing", icon: "⚡", color: C.orange,
    focus: "1v1 dominance, cutting inside and delivering quality from wide areas.",
    drills: [
      { text: "Winger 1v1 — body feint + burst past cone (3×10)", video: "https://www.youtube.com/results?search_query=winger+1v1+body+feint+burst+drill" },
      { text: "Receive wide + cut inside + shoot (3×10)", video: "https://www.youtube.com/results?search_query=winger+cut+inside+shoot+drill" },
      { text: "Underlap run combination with fullback (3×6)", video: "https://www.youtube.com/results?search_query=winger+underlap+combination+fullback+drill" },
      { text: "Crossing on the run — whipped + floated (3×8 each)", video: "https://www.youtube.com/results?search_query=winger+crossing+run+whipped+floated" },
    ],
  },
  ST: {
    label: "Striker", icon: "🎯", color: C.danger,
    focus: "Movement to lose your marker, clinical finishing and hold-up play.",
    drills: [
      { text: "Movement to lose defender — check + spin (3×10)", video: "https://www.youtube.com/results?search_query=striker+movement+check+spin+lose+defender" },
      { text: "Hold-up play under pressure + lay-off (3×10)", video: "https://www.youtube.com/results?search_query=striker+hold+up+play+drill+football" },
      { text: "Penalty-box finishing — 6 angles (3×8)", video: "https://www.youtube.com/results?search_query=striker+penalty+box+finishing+angles+drill" },
      { text: "Offside line timing — break at pass (3×8)", video: "https://www.youtube.com/results?search_query=striker+offside+line+timing+run+drill" },
    ],
  },
};

// Position aliases for PositionFinder output → POSITION_DRILLS key
const POSITION_ALIAS = {
  "Goalkeeper": "GK", "Centre Back": "CB", "Left Back": "LB", "Right Back": "RB",
  "Defensive Mid": "CDM", "Central Mid": "CM", "Attacking Mid": "CAM",
  "Left Winger": "LW", "Right Winger": "RW", "Striker": "ST",
  "GK": "GK", "CB": "CB", "LB": "LB", "RB": "RB", "CDM": "CDM",
  "CM": "CM", "CAM": "CAM", "LW": "LW", "RW": "RW", "ST": "ST",
};

// ── PRE-SESSION WARM-UP STEPS ──
const WARM_UP_STEPS = [
  { name: "Light jog", duration: "2 min", desc: "Easy pace around the pitch or in a 20m box. Get blood flowing.", icon: "🏃" },
  { name: "High knees", duration: "30 sec", desc: "Drive your knees up to hip height with a quick cadence. Activates hip flexors.", icon: "⬆️" },
  { name: "Butt kicks", duration: "30 sec", desc: "Heel flicks up toward your glutes. Warms up the hamstrings.", icon: "👟" },
  { name: "Leg swings (front-back)", duration: "20 each leg", desc: "Hold a post or wall. Swing one leg forward and back freely — increase range each rep.", icon: "🦵" },
  { name: "Leg swings (side-side)", duration: "20 each leg", desc: "Same position, now swing the leg across your body and out wide.", icon: "↔️" },
  { name: "Hip circles", duration: "10 each direction", desc: "Hands on hips, draw a big circle with your hips. Open then close the hip joint.", icon: "⭕" },
  { name: "Ankle rolls", duration: "10 each ankle", desc: "Stand on one foot, roll the raised ankle slowly in full circles.", icon: "🦶" },
  { name: "Lateral shuffles", duration: "30 sec each way", desc: "Side-step quickly over ~5m. Stay low, light on your feet.", icon: "↔️" },
  { name: "Accelerations (3×20m)", duration: "Build to ~80% pace", desc: "Short sprint — don't go flat out yet. Just prime the engine.", icon: "⚡" },
];

// ── POST-SESSION COOL-DOWN STEPS ──
// These reuse RECOVERY_STRETCHES data but as structured steps
const COOL_DOWN_STEPS = [
  { name: "Walk & breathe", duration: "2 min", desc: "Slow walk to gradually lower your heart rate. Breathe in through nose, out through mouth.", icon: "🧘" },
  { name: "Hamstring stretch", duration: "30 sec each leg", desc: "Sit, extend one leg, reach for toes without bouncing.", icon: "🦵" },
  { name: "Quad stretch", duration: "30 sec each leg", desc: "Standing, pull heel to glute. Keep knees together.", icon: "🦿" },
  { name: "Hip flexor lunge", duration: "30 sec each side", desc: "Kneeling lunge — push hips gently forward.", icon: "🏋️" },
  { name: "Calf stretch", duration: "30 sec each", desc: "Lean against a wall, back leg straight, heel flat on floor.", icon: "🦶" },
  { name: "Child's pose", duration: "60 sec", desc: "Kneel, sit back on heels, stretch arms forward. Breathe deeply.", icon: "🧘" },
  { name: "Neck & shoulder rolls", duration: "10 each direction", desc: "Slow, controlled circles. Release tension from the session.", icon: "🔄" },
];

// ── PRE-MATCH ROUTINE ITEMS ──
const PRE_MATCH_ITEMS = [
  { id: "sleep", label: "Slept 8+ hrs (ideally 2 nights before counts most)", icon: "😴", category: "Recovery" },
  { id: "hydration", label: "Drank 500ml water in the 2 hours before kick-off", icon: "💧", category: "Fuelling" },
  { id: "meal", label: "Ate pre-match meal 2–3 hrs before (carbs, light on fat)", icon: "🍚", category: "Fuelling" },
  { id: "kit", label: "Kit bag packed — boots, shin guards, jersey, water bottle", icon: "🎒", category: "Preparation" },
  { id: "warmup", label: "Completed dynamic warm-up 15–20 min before kick-off", icon: "🏃", category: "Physical" },
  { id: "gameplan", label: "Reviewed the formation and your role in it", icon: "📋", category: "Tactical" },
  { id: "breathing", label: "Done 3 rounds of box breathing (4-4-4-4)", icon: "🫁", category: "Mental" },
  { id: "intention", label: "Set your intention for the match (one focus word)", icon: "🎯", category: "Mental" },
];

// ── INJURY BODY LOCATIONS ──
const BODY_LOCATIONS = [
  "Head / Neck", "Shoulder", "Upper Arm", "Elbow", "Forearm / Wrist",
  "Chest", "Lower Back", "Hip / Groin", "Thigh (Quadriceps)",
  "Thigh (Hamstring)", "Knee", "Shin", "Calf", "Ankle", "Foot / Toe",
];

const FOOD_DB = [
  { name: "Chicken rice", cal: 600, carb: "high", protein: "med", fat: "med", pre: "green", post: "green", match: "green", note: "Great staple. Go for smaller portion pre-training." },
  { name: "Nasi lemak", cal: 700, carb: "high", protein: "med", fat: "high", pre: "amber", post: "amber", match: "red", note: "High fat content slows digestion. Not ideal before intense activity." },
  { name: "Mee goreng", cal: 550, carb: "high", protein: "low", fat: "med", pre: "green", post: "amber", match: "amber", note: "Good carbs for fuel. Add an egg for more protein." },
  { name: "Peanut butter toast", cal: 300, carb: "med", protein: "med", fat: "med", pre: "green", post: "green", match: "green", note: "Perfect light pre-training snack. Easy to digest." },
  { name: "Banana", cal: 100, carb: "med", protein: "low", fat: "low", pre: "green", post: "green", match: "green", note: "Nature's energy bar. Great before or during half-time." },
  { name: "Chocolate milk", cal: 250, carb: "med", protein: "med", fat: "low", pre: "amber", post: "green", match: "amber", note: "The BEST post-training recovery drink. Seriously — science backs this." },
  { name: "Roti prata", cal: 350, carb: "high", protein: "low", fat: "high", pre: "red", post: "amber", match: "red", note: "High in oil and refined carbs. Save for cheat day, not match day." },
  { name: "Pasta with sauce", cal: 500, carb: "high", protein: "med", fat: "low", pre: "green", post: "green", match: "green", note: "Classic carb-loading meal. Keep the sauce light." },
  { name: "Tuna sandwich", cal: 350, carb: "med", protein: "high", fat: "low", pre: "green", post: "green", match: "green", note: "Great balance of protein and carbs. Solid choice." },
  { name: "Fried chicken", cal: 500, carb: "low", protein: "high", fat: "high", pre: "red", post: "amber", match: "red", note: "Too heavy and greasy before training. Grilled is a better swap." },
  { name: "Bubble tea", cal: 400, carb: "high", protein: "low", fat: "med", pre: "red", post: "red", match: "red", note: "Sugar crash incoming. Stick to water or isotonic drinks." },
  { name: "Rice with grilled chicken", cal: 500, carb: "high", protein: "high", fat: "low", pre: "green", post: "green", match: "green", note: "The athlete's go-to meal. Simple, clean, effective." },
  { name: "Instant noodles", cal: 450, carb: "high", protein: "low", fat: "high", pre: "red", post: "red", match: "red", note: "Low nutrition, high sodium. Your body deserves better fuel." },
  { name: "Overnight oats", cal: 350, carb: "high", protein: "med", fat: "low", pre: "green", post: "green", match: "green", note: "Slow-release energy. Prep the night before for easy mornings." },
  { name: "Protein shake", cal: 200, carb: "low", protein: "high", fat: "low", pre: "amber", post: "green", match: "amber", note: "Best within 30 minutes after training for muscle recovery." },
  { name: "Energy drink", cal: 150, carb: "high", protein: "low", fat: "low", pre: "red", post: "red", match: "red", note: "You don't need this. Caffeine + sugar = crash. Water is king." },
  { name: "Porridge with honey", cal: 300, carb: "high", protein: "low", fat: "low", pre: "green", post: "green", match: "green", note: "Light, warm, easy to digest. Add banana for extra fuel." },
  { name: "Curry with rice", cal: 650, carb: "high", protein: "med", fat: "high", pre: "amber", post: "amber", match: "red", note: "Heavy curries sit in your stomach. Light curry is fine, rich curry isn't." },
  { name: "Fruit juice", cal: 180, carb: "med", protein: "low", fat: "low", pre: "green", post: "green", match: "green", note: "Good for quick energy. Fresh is better than packaged." },
  { name: "Water", cal: 0, carb: "none", protein: "none", fat: "none", pre: "green", post: "green", match: "green", note: "The MVP. Drink before you're thirsty. Always." },
];

const NUTRITION_DATA = [
  { meal: "Pre-Training", time: "1.5–2hrs before", options: ["Chicken rice (smaller portion)","Peanut butter banana toast","Overnight oats with berries","Mee goreng with egg"], tip: "Carbs are your fuel. Don't train on empty — and don't train on full.", icon: "⛽", color: C.success },
  { meal: "During Training", time: "Every 15–20 mins", options: ["Water (most important!)","Isotonic drink for 90min+ sessions","Small banana at half-time","Avoid sugary drinks"], tip: "Even 2% dehydration drops performance by 10–20%. Drink before you're thirsty.", icon: "💧", color: C.electric },
  { meal: "Post-Training", time: "Within 30–45 mins", options: ["Chocolate milk (seriously, it works!)","Chicken breast with rice","Tuna sandwich","Protein smoothie with banana"], tip: "The 'golden window' — your muscles absorb nutrients best right after training.", icon: "🔄", color: C.gold },
  { meal: "Match Day", time: "3hrs before kickoff", options: ["Pasta with light sauce","Rice with grilled chicken","Porridge with honey","Hydrate all morning"], tip: "Ronaldo eats fish, salad, and rice before every game. Keep it simple and clean.", icon: "⚽", color: C.danger },
];

const MINDSET_CARDS = [
  { title: "Pre-Game Nerves", content: "Butterflies are NORMAL. Even Messi gets nervous. Try box breathing: breathe in 4s, hold 4s, out 4s, hold 4s. Do 5 rounds before kick-off.", technique: "Box Breathing", icon: "🫁" },
  { title: "After a Mistake", content: "Flush it in 5 seconds. Clap your hands, reset your stance, focus on the next action. The best players have short memories for errors.", technique: "5-Second Reset", icon: "🔄" },
  { title: "Confidence Dip", content: "Write 3 things you did well after every session. Your brain remembers what you tell it to. Build your own highlight reel.", technique: "Success Journal", icon: "📓" },
  { title: "Team Conflict", content: "Talk it out, not online. Face-to-face conversations beat WhatsApp arguments. Use 'I feel...' instead of 'You always...' Great teams argue — but they resolve fast.", technique: "Direct Communication", icon: "🤝" },
  { title: "Comparison Trap", content: "Don't compare your Chapter 1 to someone's Chapter 10. Track YOUR progress, not theirs. Mbappé was once a beginner too.", technique: "Growth Mindset", icon: "📈" },
  { title: "Burnout Signs", content: "If you dread training, feel tired all the time, or get injured often — talk to your coach. Rest is part of training, not the opposite of it.", technique: "Active Recovery", icon: "🔋" },
];

const GROWTH_MINDSET_FRAMEWORK = [
  { phase: "Pre-Game", fixed: "What if I mess up in front of everyone?", growth: "Nerves mean I care — I'll channel this energy into focus.", icon: "🫁" },
  { phase: "Pre-Game", fixed: "The other team looks way better than us.", growth: "We don't know until we play. Let's bring our best.", icon: "👀" },
  { phase: "Pre-Game", fixed: "I always play badly in big matches.", growth: "Big matches are chances to show what I've been building.", icon: "🔥" },
  { phase: "During Game", fixed: "I made a mistake — the whole team is watching.", growth: "Flush it in 5 seconds. The next ball is what matters.", icon: "🔄" },
  { phase: "During Game", fixed: "He's faster than me — I can't win this duel.", growth: "I'll use positioning and timing to stay in the game.", icon: "♟️" },
  { phase: "During Game", fixed: "Coach is watching and I'm playing terribly.", growth: "This is exactly when I show my mental strength.", icon: "💪" },
  { phase: "Post-Game", fixed: "We lost. I was useless.", growth: "What can I take from today to be better next session?", icon: "📓" },
  { phase: "Post-Game", fixed: "I'm just not talented enough for this level.", growth: "Today showed me exactly what I need to work on.", icon: "🌱" },
  { phase: "Post-Game", fixed: "Feedback from coach is embarrassing.", growth: "Feedback is a gift — it shortens the path to improvement.", icon: "🎁" },
  { phase: "General", fixed: "I'm not good at this.", growth: "I'm not good at this YET.", icon: "🪜" },
  { phase: "General", fixed: "He's so talented, I'll never be that good.", growth: "His success shows me what's possible with effort.", icon: "🔬" },
  { phase: "General", fixed: "This drill is too hard.", growth: "This drill is challenging — that means I'm growing.", icon: "⚡" },
];

const FITNESS_TESTS = [
  { name: "2.4km Run", unit: "min:sec", levels: { beginner: "14:00", intermediate: "12:00", advanced: "10:30", elite: "9:30" }, tip: "Pace yourself. Negative splits (faster second half) = smart running." },
  { name: "Shuttle Run (Beep Test)", unit: "level", levels: { beginner: "6.0", intermediate: "8.0", advanced: "10.0", elite: "12.0" }, tip: "This tests your ability to recover between sprints — crucial in football." },
  { name: "Standing Broad Jump", unit: "cm", levels: { beginner: "170", intermediate: "200", advanced: "220", elite: "240" }, tip: "Explosive power. Use your arms to generate momentum." },
  { name: "Sit-Ups (1 min)", unit: "reps", levels: { beginner: "30", intermediate: "38", advanced: "45", elite: "50+" }, tip: "Core strength affects everything: shooting power, balance, heading." },
  { name: "Push-Ups (1 min)", unit: "reps", levels: { beginner: "20", intermediate: "30", advanced: "40", elite: "50+" }, tip: "Upper body strength helps you hold off defenders and win aerial duels." },
  { name: "Sprint 50m", unit: "seconds", levels: { beginner: "8.5", intermediate: "7.5", advanced: "7.0", elite: "6.5" }, tip: "First 5m acceleration matters most. Explosive starts win races to the ball." },
];

const LEGENDS_GLOBAL = [
  { name: "Virgil van Dijk", shortName: "van Dijk", era: "2011–present", recipe: "Resilience", recipeValues: ["Resilience", "Excellence"], lesson: "Virgil van Dijk's path to becoming the world's best central defender is not a story of instant recognition or early success. It is a story of doors closing, of people saying not good enough, and of a man who refused to accept that verdict. As a teenager, he was released from his club's youth academy. Coaches looked at him and decided he wasn't ready — too raw, not quite there. He dropped into lower levels, kept working, kept growing, and made his way back up through Groningen, Celtic, and Southampton before Liverpool paid a world-record fee for a centre-back. He was 26 years old when that move happened. What followed was nothing short of extraordinary. He anchored Liverpool's defence through a Champions League-winning season, a Premier League title, and consistently formed one of the most formidable defensive partnerships the game has seen. But the chapter of his story that speaks loudest about Resilience is what happened after his ACL injury in 2020 — an injury so severe that it robbed him of almost an entire season. Many wondered if he would ever return as the same player. He came back better. Resilience isn't dramatic or loud. It's the quiet decision to turn up, do the work, and let the results follow. Van Dijk is the definition of that.", badge: "🏔️", stat: "UCL + PL winner · World-record fee for a defender", reflectionPrompt: "Van Dijk was told 'not good enough' and kept going anyway. Think of a time you faced rejection or failure — in football, school, or life. What did you do? Looking back now, what would the resilient version of you do differently?" },
  { name: "Mohamed Salah", shortName: "Salah", era: "2010–present", recipe: "Resilience", recipeValues: ["Resilience", "Care"], lesson: "When Mohamed Salah left Egypt as a young man with a dream, nobody could have predicted what would follow. He was signed by Chelsea — one of the world's biggest clubs — but was given almost no opportunity to play. He sat on the bench, watched weeks pass, and when chances finally came, they didn't stick. Chelsea loaned him, then sold him on. To many observers, it looked like the end of a story that had barely started. Salah chose to see it as a beginning. He moved to Fiorentina, then Roma, and it was there that the world finally began to see the full scope of what this man could do. His pace, his directness, his ability to score from angles that seemed impossible — it was all being built, refined, tested. When Liverpool came calling, the rest is history. In his first season at Anfield, he broke the Premier League's single-season scoring record. He won the Champions League, the Premier League, multiple Golden Boots. He became the most feared attacker in the world. But the detail that elevates him further is how he has quietly given back to his home village in Egypt — building hospitals, improving infrastructure, transforming lives long before it was fashionable. His career teaches Resilience in its truest form: that one rejection, or five, means nothing if you refuse to stop.", badge: "👑", stat: "PL Golden Boot × 4 · Champions League winner", reflectionPrompt: "Salah turned rejection at Chelsea into a platform to change lives in Egypt. Think of one door that has recently closed for you. What is your 'Salah pivot' — the shift in mindset that turns that setback into a new direction?" },
  { name: "Lamine Yamal", shortName: "Yamal", era: "2023–present", recipe: "Excellence", recipeValues: ["Excellence", "Passion"], lesson: "There is no gentle way to say this: Lamine Yamal is doing things in football that have never been done before. At 16 years old, he became the youngest goalscorer in the history of the UEFA European Championship — scoring a bending, brilliant goal in the semi-final against France that left the entire stadium open-mouthed. He went on to win the tournament with Spain, collecting the Young Player award as a 16-year-old competing against men who had been professionals for a decade. He had already broken records at Barcelona — youngest to appear for the club, youngest to score — erasing numbers that had stood for generations. What makes Yamal extraordinary is not just the talent, which is obvious to anyone watching. It is the composure and the joy. He plays with a freedom that is rare at any age, let alone at 16. There is no hesitation, no fear, no shrinking from the moment. When the ball comes to him in a big game, he takes on defenders and creates chances as if the pressure simply doesn't register. This is Excellence pursued with absolute Passion — football played with complete joy and complete commitment. For every young player at NBSS who wonders whether their generation can produce something special, Lamine Yamal is the answer. He is your generation. He is 16 and already changing the game. What are you building right now?", badge: "🌟", stat: "Euro 2024 champion at 16 · Youngest ever Euros goalscorer", reflectionPrompt: "Yamal plays with total freedom and joy — no hesitation, no fear. When was the last time you played or trained with that same fearless energy? What holds you back from expressing yourself fully on the pitch?" },
  { name: "Kylian Mbappé", shortName: "Mbappé", era: "2015–present", recipe: "Excellence", recipeValues: ["Excellence", "Care"], lesson: "Kylian Mbappé grew up in Bondy, a suburb of Paris, where football was everything and the dreams were as large as the city felt distant. From the moment he emerged as a teenager at Monaco, it was clear this was not an ordinary talent. His pace was frightening. His finishing was clinical. His composure in the biggest moments — the kind that makes senior professionals nervous — was somehow already fully formed at 18 and 19. At 19, he was a World Cup winner with France, scoring in the final and becoming only the second teenager in history to score in a World Cup final, after Pelé. What has followed has only confirmed what those early glimpses suggested: one of the most gifted attackers the sport has ever produced. But the detail that elevates him beyond his statistics is this: Mbappé donates every euro he earns from the French national team — every match fee — to a charity he founded for underprivileged children. He has done this quietly, consistently, without fanfare. He has also spoken publicly about using his platform to stand against racism and for social justice, understanding that the biggest stage carries the biggest responsibility. This is Excellence with Care — not just pursuing greatness on the pitch, but caring about the world you are part of. Mbappé is fast, yes. But the most important speed is how quickly he chooses to give back.", badge: "⚡", stat: "World Cup winner at 19 · Donates all national team earnings to charity", reflectionPrompt: "Mbappé uses his platform to give back quietly and consistently. Even as a student, you have a platform — your voice, your actions, your presence in this team. How could you use it right now to lift someone else?" },
  { name: "Manuel Neuer", shortName: "Neuer", era: "2004–present", recipe: "Excellence", recipeValues: ["Excellence", "Resilience"], lesson: "Manuel Neuer did not just become a great goalkeeper. He changed what the position means. Before Neuer, the goalkeeper's job was largely defined by what happened in an 18-yard box — stop the shots, command the area, stay between the sticks. Neuer tore that definition up. He became the sweeper-keeper — a goalkeeper who operates like an additional outfield player, sweeping behind the defensive line, reading the game, distributing with the precision of a midfielder. He extended his team's defensive line by 20 or 30 metres. He won duels in areas no goalkeeper had any business being in. And he did all of it with a composure that made the previously unthinkable look routine. To pull on the German national shirt and the Bayern Munich jersey for as long as he did, to lift the World Cup, to collect Bundesliga titles at a rate that defied belief — this is Excellence at its highest. But the chapter of Neuer's story that speaks most directly to Resilience is what happened across 2017 and 2023, when serious injuries threatened to end his career. Each time, he came back. Methodically, professionally, with the same quiet determination that has defined every part of his career. At 37, he was still performing at the highest level in Europe. Resilience isn't loud. Manuel Neuer's career is the proof.", badge: "🧤", stat: "World Cup winner · 10× Bundesliga · Revolutionised modern goalkeeping", reflectionPrompt: "Neuer redefined what his position could be by refusing to accept the traditional limits. Are there any expectations — about your position, your role in the team, or your ability — that you've accepted without questioning? What could YOU redefine?" },
  { name: "Pelé", shortName: "Pelé", era: "1956–1977", recipe: "Passion", flag: "br", recipeValues: ["Passion", "Resilience"], lesson: "Before we understood what football could be — before the global game, before the Champions League, before the billions — there was Pelé. And even measured against everything that has come since, the story of Edson Arantes do Nascimento remains one of the most remarkable in the history of sport. He grew up in such poverty in Brazil that his family could not afford a football. He played with a sock stuffed with newspapers, or with grapefruits, or with anything round enough to kick. He shined shoes to contribute to the household income. Football was not a hobby — it was an escape, a dream, and a way of seeing what the world might hold for a boy with nothing but talent and an absolute, unconditional love for the game. He turned professional at 15. He played in his first World Cup at 17, scoring in the final to help Brazil lift the trophy, and he wept on the pitch — a child, overcome with joy. He would go on to win two more World Cups. He became synonymous with football itself in a way that no player before or since can quite claim. Pelé's lesson is about Passion in its most essential form: a love for the game so complete, so unconditional, that no obstacle — not poverty, not circumstance, not anything — could prevent him from giving everything he had. When you step onto the NBSS pitch, you carry more than most who came before you ever did. Play like you mean it.", badge: "🇧🇷", stat: "3× World Cup winner · Only player to win three World Cups", reflectionPrompt: "Pelé had almost nothing — no ball, no resources — and still showed up with everything. Think about the access and opportunities you have compared to him. Are you using them with that same unconditional passion? What would it look like if you truly played like you meant it?" },
  { name: "Ronaldo Nazário", shortName: "Ronaldo", era: "1993–2011", recipe: "Resilience", recipeValues: ["Resilience", "Excellence"], lesson: "Ask any footballer of the 1990s and early 2000s who the best player in the world was, and the answer would almost always be the same: Ronaldo. Not Cristiano. El Fenómeno. The original. Ronaldo Nazário arrived in European football like a force of nature — a centre forward with the first touch of a magician, the pace of a sprinter, and a finishing ability so complete that goalkeepers across Europe ran out of answers. He scored extraordinary goals with disturbing regularity. He scored in finals. He delivered under the biggest pressure the sport could generate, and made it look inevitable. At his peak, those who saw him play will tell you with total certainty: he was the most complete forward the game has ever seen. And then the injuries came. His knee, in 2000 — a rupture so severe that rehabilitation alone took the better part of two years. He came back. Then it happened again. And again. At one point, many in football wondered if they would ever see the real Ronaldo again. They did. In 2002, he led Brazil's World Cup campaign, won the Golden Boot, and scored twice in the final — returning from total devastation to the highest stage in football, delivering at the defining moment. This is Resilience in its most powerful form: being knocked down harder than anyone should have to be, and getting back up anyway. His story is proof that what defines you is not the injury. It is the comeback.", badge: "🔥", stat: "2× World Cup winner · 2× Ballon d'Or · El Fenómeno", reflectionPrompt: "Ronaldo came back from knee injuries that would have ended most careers — not once, but three times. Think about the hardest setback you've faced in sport or life. What actually helped you get back up? What do you need more of to face the next challenge?" },
];

const LEGENDS_SG = [
  { name: "Fandi Ahmad", shortName: "Fandi Ahmad", era: "1978–1997", recipe: "Excellence", recipeValues: ["Excellence", "Passion"], lesson: "There is a simple reason why, decades after he last played, Fandi Ahmad's name still stops a room. He is widely accepted as the greatest footballer Singapore has ever produced — and no one who has come since has come close to changing that verdict. Fandi didn't just dominate Southeast Asia; at 17, he was already scoring against Pelé's Santos, announcing himself on a stage most Singaporeans could barely imagine. He then made the journey to Europe, signing for Dutch club FC Groningen and famously scoring against Inter Milan — a moment that proved, beyond any doubt, that this was a player of genuine global quality. He returned to Singapore as its all-time top scorer, a record that still stands. But the numbers only tell part of the story. What Fandi gave Singapore was something far bigger than goals — he gave an entire generation the belief that a Singaporean could compete at the very highest level of world football. Not just participate. Compete. His talent was extraordinary. His courage was greater. And his love for the game, for his country, and for the players who came after him has never wavered. When young players in Singapore dream of making it, they are walking a path that Fandi Ahmad blazed before any of them were born.", badge: "⭐", stat: "Singapore's greatest player ever · Scored vs Inter Milan", reflectionPrompt: "Fandi gave a whole generation of Singaporeans the belief that it was possible. Who in your life has given YOU that belief — that you could be more than you thought? And looking at your team right now, who could YOU give that same belief to?" },
  { name: "Ikhsan Fandi", shortName: "Ikhsan Fandi", era: "2018–present", recipe: "Integrity", recipeValues: ["Integrity", "Resilience"], lesson: "Growing up as the son of Singapore's greatest ever footballer could easily become a burden — a name too large to carry, an expectation impossible to meet. Ikhsan Fandi chose to see it differently. He used his father's story not as a shadow to hide from, but as a standard to chase. And he has chased it fearlessly. Ikhsan became the first Singaporean to play in the Norwegian top flight, earning professional contracts in Europe on his own merit and proving that the Fandi legacy is not nostalgia — it is a living, breathing force in Singapore football right now. On the pitch, he plays with courage and directness, never backing down from a challenge, always demanding the ball and making things happen. He carries the Lions badge with pride every time he pulls it on, and he understands the weight of what that badge means. But what makes Ikhsan truly special as a figure for young players is this: he didn't get to where he is because of his father's name. He got there because he outworked the doubts, embraced the pressure, and refused to let the size of the legacy stop him from writing his own. Integrity means doing things the right way even when the easy path is available. Your background is not your ceiling. Ikhsan Fandi is proof of that.", badge: "🚀", stat: "First SG player in Norwegian top flight", reflectionPrompt: "Ikhsan built his own identity despite carrying one of football's biggest names in Singapore. What expectations or comparisons do you carry — from family, friends, or your own past performance? How do you stay true to who you are within that pressure?" },
  { name: "Nazri Nasir", shortName: "Nazri Nasir", era: "1993–2012", recipe: "Resilience", recipeValues: ["Resilience", "Passion"], lesson: "The story begins before the football. Born the youngest of ten children, Nazri was diagnosed with asthma at eight years old — a moment that could have ended any dream of sport before it started. It didn't. His passion and determination were so clear that his selection for Singapore's Under-16 Asian Youth team in 1986 convinced his parents that football was his path. From that point on, he never looked back. Nazri became a midfield general in every sense — a dynamo who covered every blade of grass, won every tackle he could reach, and gave absolutely everything every single time he crossed the white line. He was the kind of player who never shied away, never hid, and never complained — even when asked to play striker, he delivered without a word of protest. He could score from distance too, with some truly spectacular efforts that left goalkeepers with no chance. At club level, he was part of the historic Malaysia League and Malaysia Cup double-winning side in 1994. But it was as captain of the Singapore National Team from 1998 to 2003 that he sealed his legacy — leading the Lions to Tiger Cup glory in 1998 and becoming the first Singapore captain ever to lift an international trophy. From a child told his asthma might stop him playing, to the man who raised Singapore's first international silverware. That is Nazri Nasir.", badge: "⚡", stat: "First SG captain to lift international trophy · Tiger Cup 1998", reflectionPrompt: "Nazri was told his asthma might stop him from playing sport — it didn't stop him, it became his origin story. What is the 'asthma' in your football journey — the challenge, doubt, or obstacle you've been told is too big? How are you writing your own comeback story?" },
  { name: "Aleksandar Đurić", shortName: "Aleksandar Đurić", era: "1996–2013", recipe: "Resilience", recipeValues: ["Resilience", "Integrity"], lesson: "There are footballers, and then there is Aleksandar Đurić — a man whose story reads like it was written for the screen. He arrived in Singapore with little, could not speak the language, and had no guarantee of anything. What he had was a relentless drive, a warrior's mentality, and a penalty box presence that defenders simply could not handle. He went on to become the S.League's all-time top scorer — a record that speaks to years of consistency, professionalism, and sheer refusal to stop. What made Đurić truly remarkable was that he was still scoring crucial goals well into his 40s, at an age when most professionals are long retired. He became a naturalised Singaporean, wore the Lions badge with immense pride, and gave everything for his adopted nation. His message to every young player is simple and powerful: it doesn't matter where you start, where you come from, or what others expect of you. What matters is the hunger you carry, the work you put in every single day, and the courage to keep going when it gets hard. Đurić lived that. Every single day.", badge: "🦁", stat: "S.League all-time top scorer", reflectionPrompt: "Đurić arrived with nothing but hunger and eventually gave everything for his adopted home. What do YOU give everything for right now? Name one area — training, school, a relationship, a goal — that truly deserves more of your complete effort. What's stopping you?" },
  { name: "Shahril Ishak", shortName: "Shahril Ishak", era: "2002–2019", recipe: "Respect", lesson: "Not every leader fills a room with noise. Some fill it with something quieter, and rarer — a calm authority that everyone around them instinctively trusts. That was Shahril Ishak. The 'Wizard' captained the Singapore national team not through speeches or chest-beating, but through the sheer quality of his football and the unshakeable composure he brought to every situation. His vision was immaculate. He could see passes that others couldn't even imagine, picking out teammates in pockets of space with a weight and accuracy that looked effortless — though nothing that precise ever is. Defenders tried to press him, rush him, knock him off his rhythm. It rarely worked. Shahril processed the game at his own pace, always one step ahead. His leadership style reflected his playing style — he didn't demand attention, he earned it. Quietly, consistently, and completely. When Singapore needed someone to step up in a big game, the ball would find Shahril. And Shahril would find the right answer. He carried the Lions badge with dignity across nearly two decades of service, winning the AFF Cup and cementing himself as one of the finest technicians Singaporean football has ever seen. Respect is earned, never demanded. A true Wizard — and a true captain.", badge: "🎩", stat: "National team captain · AFF Cup winner", reflectionPrompt: "Shahril led with calm authority and quality instead of noise. When pressure rises in your team, how can you show that same kind of quiet leadership and earn trust through your actions?" },
  { name: "Indra Sahdan", shortName: "Indra Sahdan", era: "1997–2016", recipe: "Passion", lesson: "Every great team needs a striker who makes opponents genuinely nervous. Someone who, the moment the ball plays in behind, the defence knows it's a race they might not win. Indra Sahdan was exactly that player. He was a pure predator — explosive movement in behind the defensive line, a poacher's instinct for being in the right place at exactly the right moment, and a composure in front of goal that was almost unsettling in its coldness. He didn't panic. He didn't snatch. He finished. His greatest individual moment came against Manchester United, one of the most famous football clubs on the planet, when Indra scored against them — a goal that resonated far beyond Singapore and announced to a wider audience that this nation had a striker worth watching. Over nearly two decades in the game, he terrorised defences across Southeast Asia and became one of the most reliable and feared forwards the Lions have ever had. He is proof that clinical finishing is a skill — one built on Passion, relentless practice, intelligent movement, and the mental strength to stay calm when the goal is right in front of you. He loved this game completely. It showed in every shot he took.", badge: "🎯", stat: "Scored vs Manchester United · Nearly two decades serving the Lions", reflectionPrompt: "Indra combined relentless practice with calm finishing in the biggest moments. Which part of your game needs that same repeated work right now, and how will you train it until it becomes natural under pressure?" },];

const BADGES = [
  { id: "first_log", name: "First Touch", desc: "Logged your first session", icon: "🏅", xp: 50 },
  { id: "streak_5", name: "Five Alive", desc: "Logged 5 sessions", icon: "🔥", xp: 100 },
  { id: "streak_10", name: "Tenacious", desc: "Logged 10 sessions", icon: "⚡", xp: 200 },
  { id: "streak_25", name: "Quarter Century", desc: "Logged 25 sessions", icon: "🏆", xp: 500 },
  { id: "perfect_5", name: "Perfect Five", desc: "Rated 5/5 on a session", icon: "⭐", xp: 75 },
  { id: "growth_log", name: "Growth Thinker", desc: "Made a Growth Journal entry", icon: "🌱", xp: 60 },
  { id: "week_warrior", name: "Week Warrior", desc: "Logged 3+ sessions in one week", icon: "🗓️", xp: 150 },
  { id: "all_rounder", name: "All-Rounder", desc: "Logged training, match, fitness & recovery", icon: "🎯", xp: 300 },
];

function getLevel(xp) {
  if (xp >= 2000) return { level: 10, title: "Captain Material", next: null };
  if (xp >= 1500) return { level: 9, title: "Playmaker", next: 2000 };
  if (xp >= 1100) return { level: 8, title: "Game Changer", next: 1500 };
  if (xp >= 800) return { level: 7, title: "Rising Star", next: 1100 };
  if (xp >= 600) return { level: 6, title: "Committed", next: 800 };
  if (xp >= 400) return { level: 5, title: "Sharpening", next: 600 };
  if (xp >= 250) return { level: 4, title: "In the Squad", next: 400 };
  if (xp >= 120) return { level: 3, title: "Getting Started", next: 250 };
  if (xp >= 50) return { level: 2, title: "Rookie", next: 120 };
  return { level: 1, title: "New Recruit", next: 50 };
}

function computeXpAndBadges(sessions, growthEntries) {
  let xp = sessions.length * 30;
  const earned = [];
  if (sessions.length >= 1) earned.push("first_log");
  if (sessions.length >= 5) earned.push("streak_5");
  if (sessions.length >= 10) earned.push("streak_10");
  if (sessions.length >= 25) earned.push("streak_25");
  if (sessions.some(s => s.rating === 5)) earned.push("perfect_5");
  if (growthEntries && growthEntries.length > 0) earned.push("growth_log");
  const types = new Set(sessions.map(s => s.type));
  if (types.has("training") && types.has("match") && types.has("fitness") && types.has("recovery")) earned.push("all_rounder");
  earned.forEach(b => { const badge = BADGES.find(x => x.id === b); if (badge) xp += badge.xp; });
  return { xp, earned };
}

const RECOVERY_STRETCHES = [
  { name: "Hamstring Stretch", duration: "30s each leg", how: "Sit on the ground, extend one leg, reach for your toes. Don't bounce — hold steady.", when: "Post-training", icon: "🦵", muscle: "Hamstrings" },
  { name: "Quad Stretch (Standing)", duration: "30s each leg", how: "Stand on one foot, pull the other heel to your glute. Keep knees together, stand tall.", when: "Post-training", icon: "🦿", muscle: "Quadriceps" },
  { name: "Hip Flexor Lunge", duration: "30s each side", how: "Kneel on one knee, push hips forward gently. You'll feel it in the front of your hip.", when: "Post-training", icon: "🏋️", muscle: "Hip Flexors" },
  { name: "Calf Raises & Stretch", duration: "20 reps + 30s hold", how: "Stand on a step edge, raise up on toes, then lower heels below step level and hold.", when: "Daily", icon: "🦶", muscle: "Calves" },
  { name: "Glute Bridge", duration: "3×15 reps", how: "Lie on your back, feet flat, push hips up. Squeeze at the top. Great for injury prevention.", when: "Pre-training / Daily", icon: "🍑", muscle: "Glutes" },
  { name: "Foam Roll — IT Band", duration: "60s each side", how: "Lie on your side on the roller, roll from hip to just above knee. Slow and controlled.", when: "Post-training", icon: "🧊", muscle: "IT Band" },
  { name: "Child's Pose", duration: "60s", how: "Kneel, sit back on heels, stretch arms forward on the ground. Breathe deeply.", when: "Post-training / Before bed", icon: "🧘", muscle: "Lower back, shoulders" },
  { name: "Neck & Shoulder Rolls", duration: "10 each direction", how: "Slow circles with your neck, then roll shoulders forward and back.", when: "Anytime", icon: "🔄", muscle: "Neck, Traps" },
];

const SLEEP_TIPS = [
  { tip: "Aim for 8–10 hours per night. Teenage athletes need MORE sleep than adults, not less.", icon: "😴" },
  { tip: "Stop screens 30 mins before bed. Blue light tricks your brain into thinking it's daytime.", icon: "📵" },
  { tip: "Keep a consistent sleep schedule — even on weekends. Your body clock matters.", icon: "⏰" },
  { tip: "Cool room, dark room. 18–20°C is ideal for deep sleep.", icon: "❄️" },
  { tip: "The sleep TWO nights before a match matters more than the night before.", icon: "📅" },
];

const QUIZ_QUESTIONS = [
  { q: "How long is a standard football match (excluding extra time)?", opts: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"], correct: 1, explain: "A standard match is 90 minutes — two halves of 45 minutes each, plus stoppage time." },
  { q: "What does 'offside' mean?", opts: ["The ball goes out of play", "A player is ahead of the second-last defender when the ball is played to them", "A player fouls from behind", "The goalkeeper leaves the box"], correct: 1, explain: "You're offside if you're closer to the goal line than the second-last defender when the ball is played to you." },
  { q: "In a 4-3-3 formation, how many midfielders are there?", opts: ["2", "3", "4", "5"], correct: 1, explain: "4-3-3 = 4 defenders, 3 midfielders, 3 forwards." },
  { q: "What is a 'rondo' in training?", opts: ["A shooting drill", "A fitness test", "A possession game (e.g. 4v2 keep-ball)", "A defensive shape exercise"], correct: 2, explain: "Rondos are possession circles. Barcelona made this famous." },
  { q: "What does 'gegenpressing' mean?", opts: ["Defending deep in your own half", "Immediately pressing to win the ball back after losing it", "Playing long balls forward", "Man-marking every opponent"], correct: 1, explain: "Counter-pressing means winning the ball back within seconds of losing it. Made famous by Jürgen Klopp." },
  { q: "Which Singapore footballer scored against Pelé's Santos at age 17?", opts: ["Shahril Ishak", "Noh Alam Shah", "Fandi Ahmad", "V. Sundramoorthy"], correct: 2, explain: "Fandi Ahmad scored against Santos in 1977 as a 17-year-old — one of Singapore football's greatest moments." },
  { q: "What is a 'false 9'?", opts: ["A goalkeeper who plays as a striker", "A centre-forward who drops deep to create space", "A winger who plays in goal", "A defender who scores own goals"], correct: 1, explain: "A false 9 is a striker who drops into midfield to confuse defenders. Messi made this role famous at Barcelona." },
  { q: "How many players must a team have to continue a match?", opts: ["9", "7", "8", "6"], correct: 1, explain: "If a team drops below 7 players, the match is abandoned." },
  { q: "What is the 'D' on the edge of the penalty box for?", opts: ["Decorative purposes", "Where free kicks are taken", "Ensures all players are 10 yards from the penalty spot during a penalty kick", "Where the goalkeeper must stand"], correct: 2, explain: "The 'D' marks the area where all players must stay 10 yards from the penalty spot during a penalty kick." },
  { q: "In a 'negative split' 2.4km run, what happens?", opts: ["You run the first half faster", "You run the second half faster than the first", "You sprint the whole way", "You walk the last 400m"], correct: 1, explain: "A negative split means running the second half faster than the first — the smartest pacing strategy." },
  { q: "What's the 'golden window' in nutrition?", opts: ["The best time to eat breakfast", "The 30–45 minutes after training when your body absorbs nutrients best", "Eating only golden-coloured food", "Fasting before a match"], correct: 1, explain: "The 30–45 minutes after training is when your muscles are primed to absorb protein and carbs for recovery." },
  { q: "When did Singapore last win the AFF Suzuki Cup?", opts: ["2004", "2007", "2012", "Singapore hasn't won it"], correct: 2, explain: "Singapore won the AFF Suzuki Cup in 2004, 2007, and 2012 — a proud part of Singapore football history!" },
  { q: "What does VAR stand for?", opts: ["Video Assisted Referee", "Video Assistant Referee", "Virtual Action Review", "Visual Accuracy Review"], correct: 1, explain: "VAR is the Video Assistant Referee system, used to review key match decisions like goals, penalties, and red cards." },
  { q: "Which Singapore player famously scored against Manchester United?", opts: ["Fandi Ahmad", "Shahril Ishak", "Nazri Nasir", "Indra Sahdan"], correct: 3, explain: "Indra Sahdan scored against Manchester United — a goal that put Singapore football on the world stage." },
  { q: "What is a 'box-to-box midfielder'?", opts: ["A midfielder who only defends", "A midfielder who covers the full pitch — defending in their own box and attacking the opponent's", "A midfielder who stays in the centre circle", "A midfielder used only at corners"], correct: 1, explain: "A box-to-box midfielder contributes both defensively and offensively, covering the entire length of the pitch. Think Kante or Gerrard." },
  { q: "What does 'CAM' stand for in football positions?", opts: ["Centre Attacking Midfielder", "Central Area Marker", "Counter Attack Midfielder", "Corner Assist Man"], correct: 0, explain: "CAM stands for Central Attacking Midfielder — the creative No. 10 role, linking midfield to attack." },
  { q: "What is 'carbo-loading' and when should a player do it?", opts: ["Eating lots of protein the night before a match", "Increasing carbohydrate intake in the 1–2 days before a big match to maximise energy stores", "Eating only carbs all week", "Skipping meals before a match to feel lighter"], correct: 1, explain: "Carbo-loading tops up your glycogen (energy) stores before a big match. Think pasta, rice, or bread the night before." },
  { q: "How many substitutions are allowed per team in a standard competitive match?", opts: ["3", "4", "5", "Unlimited"], correct: 2, explain: "Since 2020, FIFA allows 5 substitutions per team in most competitions — a change introduced during the COVID period and made permanent." },
  { q: "A defender deliberately handles the ball on the goal line to stop a certain goal. What happens?", opts: ["A penalty is given only", "A free kick outside the box", "The player is red-carded and a penalty is awarded", "A yellow card and a penalty"], correct: 2, explain: "Denying a goal with a deliberate handball results in a red card (straight) plus a penalty — the most severe punishment in football." },
  { q: "What does it mean to play with 'Passion' — the P in NBSS's RECIPE values?", opts: ["Playing only when you feel like it", "Giving maximum effort and loving what you do, in every session, every match", "Scoring goals every game", "Being the loudest player on the pitch"], correct: 1, explain: "Passion means total commitment — loving the process, not just the result. It's what separates those who improve from those who stagnate." },
];

const GOAL_CATEGORIES = [
  { cat: "Technical", icon: "⚽", examples: ["Master the Cruyff turn", "Complete 20 consecutive juggles", "Score from a free kick in training"] },
  { cat: "Physical", icon: "💪", examples: ["Run 2.4km under 12 minutes", "Do 40 push-ups in 1 minute", "Improve beep test by 1 level"] },
  { cat: "Mental", icon: "🧠", examples: ["Use box breathing before every match", "Write in Growth Journal 3x this week", "Give 1 positive call-out per training"] },
  { cat: "Teamwork", icon: "🤝", examples: ["Help a junior with a drill", "Communicate 5+ times per match", "Encourage a teammate after a mistake"] },
];

const FORMATIONS = {
  "4-3-3": { label: "4-3-3", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "LB", x: 15, y: 72 }, { role: "CB", x: 37, y: 76 }, { role: "CB", x: 63, y: 76 }, { role: "RB", x: 85, y: 72 },
    { role: "CM", x: 30, y: 52 }, { role: "CM", x: 50, y: 48 }, { role: "CM", x: 70, y: 52 },
    { role: "LW", x: 18, y: 26 }, { role: "ST", x: 50, y: 20 }, { role: "RW", x: 82, y: 26 },
  ]},
  "4-4-2": { label: "4-4-2", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "LB", x: 15, y: 72 }, { role: "CB", x: 37, y: 76 }, { role: "CB", x: 63, y: 76 }, { role: "RB", x: 85, y: 72 },
    { role: "LM", x: 15, y: 50 }, { role: "CM", x: 37, y: 52 }, { role: "CM", x: 63, y: 52 }, { role: "RM", x: 85, y: 50 },
    { role: "ST", x: 37, y: 24 }, { role: "ST", x: 63, y: 24 },
  ]},
  "4-2-3-1": { label: "4-2-3-1", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "LB", x: 15, y: 72 }, { role: "CB", x: 37, y: 76 }, { role: "CB", x: 63, y: 76 }, { role: "RB", x: 85, y: 72 },
    { role: "CDM", x: 37, y: 56 }, { role: "CDM", x: 63, y: 56 },
    { role: "LW", x: 18, y: 36 }, { role: "CAM", x: 50, y: 38 }, { role: "RW", x: 82, y: 36 },
    { role: "ST", x: 50, y: 18 },
  ]},
  "3-5-2": { label: "3-5-2", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "CB", x: 25, y: 76 }, { role: "CB", x: 50, y: 78 }, { role: "CB", x: 75, y: 76 },
    { role: "LWB", x: 10, y: 52 }, { role: "CM", x: 33, y: 54 }, { role: "CM", x: 50, y: 50 }, { role: "CM", x: 67, y: 54 }, { role: "RWB", x: 90, y: 52 },
    { role: "ST", x: 37, y: 22 }, { role: "ST", x: 63, y: 22 },
  ]},
  "4-1-4-1": { label: "4-1-4-1", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "LB", x: 15, y: 72 }, { role: "CB", x: 37, y: 76 }, { role: "CB", x: 63, y: 76 }, { role: "RB", x: 85, y: 72 },
    { role: "CDM", x: 50, y: 58 },
    { role: "LM", x: 15, y: 40 }, { role: "CM", x: 37, y: 42 }, { role: "CM", x: 63, y: 42 }, { role: "RM", x: 85, y: 40 },
    { role: "ST", x: 50, y: 18 },
  ]},
  "3-4-3": { label: "3-4-3", positions: [
    { role: "GK", x: 50, y: 92 },
    { role: "CB", x: 25, y: 76 }, { role: "CB", x: 50, y: 78 }, { role: "CB", x: 75, y: 76 },
    { role: "LM", x: 15, y: 52 }, { role: "CM", x: 40, y: 54 }, { role: "CM", x: 60, y: 54 }, { role: "RM", x: 85, y: 52 },
    { role: "LW", x: 20, y: 26 }, { role: "ST", x: 50, y: 20 }, { role: "RW", x: 80, y: 26 },
  ]},
};

const EMPTY_MATCH = {
  formation: "4-3-3", date: "", time: "", opponent: "", competition: "", venue: "",
  players: Array(11).fill(""), subs: ["", "", "", "", ""], notes: "",
};

// ══════════════════════════════════════════════════
//  SHARED COMPONENTS
// ══════════════════════════════════════════════════

function SectionHeader({ icon, title, subtitle, accent }) {
  const C = useTheme();
  // Nothing design: flat divider, no gradient, Space Mono label above Doto headline
  return (
    <div style={{ marginBottom: 40, borderBottom: `1px solid ${C.navyBorder}`, paddingBottom: 24 }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        {icon ? `${icon} ` : ""}{title}
      </div>
      <h2 style={{
        fontFamily: FONT_HEAD, fontSize: "clamp(28px, 5vw, 44px)",
        color: C.textBright, margin: "0 0 8px", letterSpacing: "0.02em", lineHeight: 1,
      }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: 0, lineHeight: 1.6, maxWidth: 760 }}>{subtitle}</p>}
    </div>
  );
}

function Pill({ children, active, onClick, color }) {
  const C = useTheme();
  // Nothing design: segmented control style — active = solid white/black inverted, inactive = transparent outlined
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 999, cursor: "pointer",
      background: active ? C.textBright : "transparent",
      color: active ? C.navy : C.textMid,
      border: `1px solid ${active ? C.textBright : C.navyBorder}`,
      fontFamily: FONT_SERIF, fontSize: 11, fontWeight: 400,
      textTransform: "uppercase", letterSpacing: "0.06em",
      transition: "all 0.15s ease",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>{children}</button>
  );
}

function ContextTabs({ items, active, setActive, color }) {
  const C = useTheme();
  // Nothing design: flat sticky bar, OLED black, no blur, underline-only active indicator
  return (
    <div style={{
      position: "sticky",
      top: 64,
      zIndex: 900,
      background: C.navy,
      borderBottom: `1px solid ${C.navyBorder}`,
      padding: "0 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 0, overflowX: "auto" }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              padding: "12px 16px",
              borderRadius: 0,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${active === item.id ? C.textBright : "transparent"}`,
              color: active === item.id ? C.textBright : C.textDim,
              fontFamily: FONT_SERIF,
              fontSize: 11,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricPanel({ label, value, note, tone, compact }) {
  const C = useTheme();
  // Nothing design: flat card, no shadow, 12px radius, status color on value only
  const color = tone || C.textBright;
  return (
    <div style={{
      padding: compact ? "14px 16px" : "18px 20px",
      borderRadius: 12,
      background: C.navyCard,
      border: `1px solid ${C.navyBorder}`,
    }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: compact ? 26 : 36, color, letterSpacing: "0.02em", lineHeight: 1 }}>{value}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, lineHeight: 1.6, marginTop: 8 }}>{note}</div>}
    </div>
  );
}

// ── SegmentedBar — Nothing instrument-panel style ──
// N discrete rectangular segments filled left-to-right. Color per zone threshold.
// zones: [{ from, to, color }] where from/to are in 0–max scale.
function SegmentedBar({ value, max = 100, segments = 12, zones, style: s = {} }) {
  const C = useTheme();
  const filled = Math.round((Math.min(Math.max(value, 0), max) / max) * segments);
  const getColor = (idx) => {
    const segVal = ((idx + 1) / segments) * max;
    if (zones) { for (const z of zones) { if (segVal > z.from && segVal <= z.to) return z.color; } }
    return C.gold;
  };
  return (
    <div style={{ display: "flex", gap: 3, height: 5, ...s }}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 1, background: i < filled ? getColor(i) : C.navyBorder }} />
      ))}
    </div>
  );
}

// ── DotMatrixPanel — large Doto display + segmented bar below ──
// Reserved for Readiness % and ACWR — one hero moment per metric.
// value: numeric for bar calculation; displayValue: formatted string shown in display.
function DotMatrixPanel({ label, value, displayValue, sub, zones, max = 100, segments = 10, tone, style: s = {}, compact }) {
  const C = useTheme();
  const color = tone || C.textBright;
  const numeric = typeof value === "number" ? value : null;
  return (
    <div style={{ padding: compact ? "16px 18px" : "22px 26px", borderRadius: 12, background: C.navyCard, border: `1px solid ${C.navyBorder}`, ...s }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: compact ? 44 : 60, color, letterSpacing: "0.04em", lineHeight: 0.88, marginBottom: 14 }}>
        {displayValue ?? value}
      </div>
      {numeric !== null && (
        <SegmentedBar value={numeric} max={max} segments={segments} zones={zones} style={{ marginBottom: 8 }} />
      )}
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, lineHeight: 1.5, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function GoldButton({ children, onClick, style: s = {}, secondary, destructive }) {
  const C = useTheme();
  // Nothing design: Primary = solid white pill, Secondary = transparent outlined pill, Destructive = accent-bordered
  const base = {
    padding: "12px 24px", borderRadius: 999, cursor: "pointer",
    fontFamily: FONT_SERIF, fontSize: 13, fontWeight: 400,
    textTransform: "uppercase", letterSpacing: "0.06em",
    minHeight: 44, border: "none", background: "none",
    transition: "opacity 0.15s ease",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
  let variant = {};
  if (destructive) {
    variant = { border: `1px solid ${C.accent}`, color: C.accent };
  } else if (secondary) {
    variant = { border: `1px solid ${C.surfaceBorder}`, color: C.textMid };
  } else {
    variant = { background: C.textBright, color: C.navy, border: "none" };
  }
  return (
    <button onClick={onClick} style={{ ...base, ...variant, ...s }}>{children}</button>
  );
}

function Card({ children, style: s = {}, glow }) {
  const C = useTheme();
  // Nothing design: flat surface, border separation, no shadows
  return (
    <div style={{
      background: C.navyCard, border: `1px solid ${C.navyBorder}`,
      borderRadius: 16, padding: 24,
      ...s,
    }}>{children}</div>
  );
}

// ══════════════════════════════════════════════════
//  ONBOARDING MODAL
// ══════════════════════════════════════════════════
function OnboardingModal({ onComplete }) {
  const C = useTheme();
  const labelStyle = makeLabelStyle(C);
  const inputStyle = makeInputStyle(C);
  // step 1 = role, step 2 = name/(position for players), step 3 = level (players only), step 4 = goal
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("player"); // "player" | "coach"
  const [name, setName] = useState("");
  const [position, setPosition] = useState("Midfielder");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

  // Coaches skip step 3 (level selection). Total visible steps: players = 4, coaches = 3.
  const totalSteps = role === "coach" ? 3 : 4;
  // Map actual step number to displayed progress dot index
  const displayStep = role === "coach" && step === 4 ? 3 : step;

  const handleComplete = () => {
    onComplete({
      name: name.trim() || (role === "coach" ? "Coach" : "Player"),
      position: role === "coach" ? "Coach/Teacher" : position,
      level: role === "coach" ? null : level,
      firstGoal: goal,
      role,
      onboarded: true,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Nothing design: OLED solid black overlay — no blur, no gradient */}
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Flat monochrome mark — solid white on black, no gradient, no shadow */}
          <div style={{ width: 48, height: 48, borderRadius: 4, background: C.textBright, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 13, color: C.navy, letterSpacing: "0.08em" }}>GP</span>
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textBright, letterSpacing: "0.04em", lineHeight: 1 }}>GAMEPLAN</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6 }}>Performance Platform</div>
        </div>
        {/* Progress bar — dots scale with role */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, maxWidth: 80, borderRadius: 2, background: displayStep > i ? C.gold : C.navyBorder, transition: "background 0.3s" }} />
          ))}
        </div>
        <Card glow>
          {/* ── STEP 1: Role Selection ── */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>SELECT YOUR ROLE</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 20 }}>We will configure the platform around the decisions you need to make most often.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {[
                  { key: "player", mono: "PLR", label: "Player", desc: "Performance, readiness, load, and match output." },
                  { key: "coach",  mono: "MCH", label: "Coach",  desc: "Squad availability, attendance, lineups, and operations." },
                ].map(r => (
                  <div key={r.key} onClick={() => setRole(r.key)} style={{
                    padding: "18px 16px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                    background: role === r.key ? C.textBright : C.navyCard,
                    border: `1px solid ${role === r.key ? C.textBright : C.navyBorder}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}>
                    {/* Monochrome monogram mark */}
                    <div style={{ fontFamily: FONT_SERIF, fontSize: 11, color: role === r.key ? C.navy : C.textDim, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{r.mono}</div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 15, color: role === r.key ? C.navy : C.textBright, letterSpacing: "0.04em", marginBottom: 6 }}>{r.label.toUpperCase()}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: role === r.key ? `${C.navy}99` : C.textDim, lineHeight: 1.4 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
              <GoldButton onClick={() => setStep(2)} style={{ width: "100%" }}>Continue</GoldButton>
            </>
          )}

          {/* ── STEP 2: Name + Position (players) / Name only (coaches) ── */}
          {step === 2 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>IDENTITY</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 20 }}>This sets the profile header and command-centre context.</p>
              <div style={{ marginBottom: role === "player" ? 16 : 0 }}>
                <label style={labelStyle}>{role === "coach" ? "Your name" : "Your name"}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={role === "coach" ? "e.g. Mr Herwanto" : "e.g. Aryan"} style={inputStyle} autoFocus onKeyDown={e => e.key === "Enter" && setStep(role === "coach" ? 4 : 3)} />
              </div>
              {role === "player" && (
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Your position</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {positions.map(p => <Pill key={p} active={position === p} onClick={() => setPosition(p)} color={C.gold}>{p}</Pill>)}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                <GoldButton onClick={() => setStep(1)} secondary style={{ flex: 1 }}>Back</GoldButton>
                <GoldButton onClick={() => setStep(role === "coach" ? 4 : 3)} style={{ flex: 2 }}>Continue</GoldButton>
              </div>
            </>
          )}

          {/* ── STEP 3: Training Level (players only) ── */}
          {step === 3 && role === "player" && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>WHAT'S YOUR LEVEL?</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 20 }}>We'll set up your training program accordingly.</p>
              {/* Nothing design: inverted solid card for active, bordered neutral for inactive */}
              {Object.entries(TRAINING_DATA).map(([key, val]) => (
                <div key={key} onClick={() => setLevel(key)} style={{ padding: "14px 18px", borderRadius: 8, cursor: "pointer", marginBottom: 8, background: level === key ? C.textBright : C.navyCard, border: `1px solid ${level === key ? C.textBright : C.navyBorder}`, transition: "background 0.15s, border-color 0.15s" }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: level === key ? C.navy : C.textBright, letterSpacing: "0.04em" }}>{val.title.toUpperCase()}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: level === key ? `${C.navy}99` : C.textDim, marginTop: 2 }}>{val.subtitle}</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <GoldButton onClick={() => setStep(2)} secondary style={{ flex: 1 }}>Back</GoldButton>
                <GoldButton onClick={() => setStep(4)} style={{ flex: 2 }}>Continue</GoldButton>
              </div>
            </>
          )}

          {/* ── STEP 4: Goal (both roles, different prompts) ── */}
          {step === 4 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>
                {role === "coach" ? "SET A TEAM FOCUS" : "SET YOUR FIRST GOAL"}
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 16 }}>
                {role === "coach" ? "What's your primary focus for the team this term?" : "What do you want to achieve this term?"}
              </p>
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder={role === "coach" ? "e.g. Qualify for the next round" : "e.g. Run 2.4km under 12 minutes"} style={{ ...inputStyle, marginBottom: 12 }} />
              {/* Nothing design: Pill chips — active = solid inverted, inactive = outlined neutral */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {(role === "coach"
                  ? ["Win cluster championship", "Improve team fitness", "Develop B Div squad", "Build team discipline", "Rotate squad evenly"]
                  : ["Master the Cruyff turn", "Run 2.4km under 12 min", "Complete 20 juggles", "Score in a match", "Improve beep test by 1 level"]
                ).map(ex => (
                  <button key={ex} onClick={() => setGoal(ex)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", background: goal === ex ? C.textBright : "transparent", border: `1px solid ${goal === ex ? C.textBright : C.navyBorder}`, fontFamily: FONT_SERIF, fontSize: 10, color: goal === ex ? C.navy : C.textDim, letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.15s" }}>{ex}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <GoldButton onClick={() => setStep(role === "coach" ? 2 : 3)} secondary style={{ flex: 1 }}>Back</GoldButton>
                <GoldButton onClick={handleComplete} style={{ flex: 2 }}>Enter Platform</GoldButton>
              </div>
            </>
          )}
        </Card>
        {step === 4 && (
          <button onClick={handleComplete} style={{ background: "none", border: "none", color: C.textDim, fontFamily: FONT_BODY, fontSize: 12, cursor: "pointer", display: "block", margin: "12px auto 0", textDecoration: "underline" }}>Skip for now</button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  GROUP WRAPPERS (sub-navigation for 5-group nav)
// ══════════════════════════════════════════════════
function SubNav({ items, active, setActive, color }) {
  const C = useTheme();
  // Nothing design: flat OLED black sub-bar — no blur, no frosted glass
  return (
    <div style={{ position: "sticky", top: 64, zIndex: 900, background: C.navy, borderBottom: `1px solid ${C.navyBorder}`, padding: "10px 24px", display: "flex", gap: 6, overflowX: "auto" }}>
      {items.map(t => <Pill key={t.id} active={active === t.id} onClick={() => setActive(t.id)} color={color}>{t.label}</Pill>)}
    </div>
  );
}

function TrainGroup() {
  const C = useTheme();
  const [sub, setSub] = useState("training");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.success} active={sub} setActive={setSub} items={[
        { id: "training", label: "Training" },
        { id: "warmup",   label: "Preparation" },
        { id: "fitness",  label: "Testing" },
        { id: "mindset",  label: "Mental Performance" },
      ]} />
      {sub === "training" && <TrainingSection />}
      {sub === "warmup"   && <WarmUpSection />}
      {sub === "fitness"  && <FitnessSection />}
      {sub === "mindset"  && <MindsetSection />}
    </div>
  );
}

function MatchGroup() {
  const C = useTheme();
  const [sub, setSub] = useState("prematch");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.electric} active={sub} setActive={setSub} items={[
        { id: "prematch",  label: "Preparation" },
        { id: "history",   label: "Match Output" },
        { id: "lineup",    label: "Lineups" },
        { id: "nutrition", label: "Nutrition" },
      ]} />
      {sub === "prematch"  && <PreMatchSection />}
      {sub === "history"   && <MatchHistorySection />}
      {sub === "lineup"    && <LineupBuilderSection />}
      {sub === "nutrition" && <NutritionSection />}
    </div>
  );
}

function ProgressGroup({ profile, setActive }) {
  const C = useTheme();
  const isCoach = profile?.role === "coach";
  const [sub, setSub] = useState(isCoach ? "squad" : "tracker");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.electric} active={sub} setActive={setSub} items={[
        ...(!isCoach ? [{ id: "tracker", label: "Sessions" }] : []),
        ...(!isCoach ? [{ id: "wellness", label: "Availability" }] : []),
        { id: "squad", label: isCoach ? "Squad Operations" : "Profile" },
      ]} />
      {sub === "tracker" && !isCoach && <TrackerSection />}
      {sub === "wellness" && !isCoach && <WellnessSection />}
      {sub === "squad" && (
        <div>
          {isCoach && (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 0" }}>
              {/* Nothing design: flat card, neutral border, no colored tint */}
              <div style={{ padding: "16px 18px", borderRadius: 8, background: C.navyCard, border: `1px solid ${C.navyBorder}`, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Coach navigation
                  </span>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 12 }}>
                  This view is player-facing. Use the coach tools below for squad management and operations.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { id: "dashboard", label: "Dashboard" },
                    { id: "operations", label: "Operations" },
                    { id: "match", label: "Lineups" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 999,
                        cursor: "pointer",
                        background: "transparent",
                        border: `1px solid ${C.navyBorder}`,
                        color: C.textMid,
                        fontFamily: FONT_SERIF,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <SquadSection />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════════
function Navbar({ active, setActive, isDark, onToggleTheme, navItems = [], roleLabel = "", isCoach = false, viewAsPlayer = false, onToggleView = null }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Nothing design: flat OLED black bar, no blur, no gradient. Border only when scrolled.
  const navBg = C.navy; // pure black (dark) / off-white (light)

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBg,
      borderBottom: `1px solid ${scrolled ? C.navyBorder : "transparent"}`,
      transition: "border-color 0.2s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo + coach/player toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" aria-label="Open dashboard" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "none", border: "none" }} onClick={() => setActive("dashboard")}>
            <div style={{
              width: 32, height: 32, borderRadius: 4,
              background: C.textBright,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontFamily: FONT_SERIF, letterSpacing: "0.08em",
              color: C.navy, fontWeight: 400,
            }}>GP</div>
            <div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 14, color: C.textBright, letterSpacing: "0.1em", lineHeight: 1, textTransform: "uppercase" }}>GamePlan</div>
              {roleLabel && <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "left", marginTop: 2 }}>{roleLabel}</div>}
            </div>
          </button>
          {/* Coach ↔ Player view toggle — only for coach accounts */}
          {isCoach && onToggleView && (
            <div style={{ display: "inline-flex", alignItems: "center", background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
              <button
                onClick={() => { onToggleView(false); }}
                style={{ padding: "4px 12px", border: "none", cursor: "pointer", fontFamily: FONT_SERIF, fontSize: 9, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase", background: !viewAsPlayer ? C.textBright : "transparent", color: !viewAsPlayer ? C.navy : C.textDim, transition: "all 0.15s", whiteSpace: "nowrap" }}
              >Coach</button>
              <button
                onClick={() => { onToggleView(true); }}
                style={{ padding: "4px 12px", border: "none", cursor: "pointer", fontFamily: FONT_SERIF, fontSize: 9, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase", background: viewAsPlayer ? C.textBright : "transparent", color: viewAsPlayer ? C.navy : C.textDim, transition: "all 0.15s", whiteSpace: "nowrap" }}
              >Player</button>
            </div>
          )}
        </div>

        {/* Right side: Instagram link, theme toggle + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="https://www.instagram.com/nbssfootball/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Instagram"
            title="Open @nbssfootball on Instagram"
            style={{
              background: "none",
              border: `1px solid ${C.navyBorder}`,
              color: C.textMid,
              width: 36,
              height: 36,
              borderRadius: 4,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              transition: "color 0.15s, border-color 0.15s",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, lineHeight: 1, fontFamily: FONT_SERIF, letterSpacing: "0.06em", textTransform: "uppercase" }}>IG</span>
          </a>

          {/* Theme toggle — flat, no colored glow */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background: "none",
              border: `1px solid ${C.navyBorder}`,
              color: C.textMid,
              width: 36, height: 36, borderRadius: 4, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_SERIF, fontSize: 10, letterSpacing: "0.06em",
              textTransform: "uppercase", transition: "color 0.15s", flexShrink: 0,
            }}
          >{isDark ? "LT" : "DK"}</button>

          {/* Hamburger — mobile only */}
          <button className="mob-btn" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: `1px solid ${C.navyBorder}`, color: C.textBright, fontFamily: FONT_SERIF, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer", padding: "6px 10px", borderRadius: 4 }}>
            {open ? "[ X ]" : "[ ≡ ]"}
          </button>
        </div>

        {/* Nav items — Nothing bracket/underline treatment, Space Mono ALL CAPS */}
        <div className={`nav-l ${open ? "nav-open" : ""}`} style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {navItems.map(g => (
            <button key={g.id} onClick={() => { setActive(g.id); setOpen(false); }} style={{
              background: "transparent",
              color: active === g.id ? C.textBright : C.textDim,
              border: "none",
              borderBottom: active === g.id ? `2px solid ${C.textBright}` : "2px solid transparent",
              padding: "7px 16px",
              cursor: "pointer",
              fontFamily: FONT_SERIF, fontSize: 11, fontWeight: 400,
              textTransform: "uppercase", letterSpacing: "0.08em",
              transition: "color 0.15s, border-color 0.15s",
            }}
              onMouseEnter={e => { if (active !== g.id) e.currentTarget.style.color = C.textMid; }}
              onMouseLeave={e => { if (active !== g.id) e.currentTarget.style.color = C.textDim; }}
            >{active === g.id ? `[ ${g.label} ]` : g.label}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════
//  HERO TICKER
// ══════════════════════════════════════════════════
function HeroTicker({ profile, sessions, streak, daysSinceLast }) {
  const C = useTheme();
  const [allEvents, setAllEvents] = useState([]);

  // Compute latest ACWR from sessions that have load data
  const acwrData = sessions?.length ? computeACWR(sessions) : [];
  const latestACWR = acwrData.length ? acwrData[acwrData.length - 1].acwr : null;
  const acwrZone = latestACWR === null ? null
    : latestACWR < 0.8  ? { label: "Under-loaded", color: C.electric,  emoji: "📉" }
    : latestACWR <= 1.3 ? { label: "Optimal Zone", color: C.success,   emoji: "✅" }
    : latestACWR <= 1.5 ? { label: "Caution Zone",  color: C.gold,     emoji: "⚠️" }
    :                     { label: "High Risk",      color: C.danger,   emoji: "🚨" };

  const isCoach = profile?.role === "coach";
  const name = profile?.name?.trim();

  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then((events) => { if (active) setAllEvents(events); })
      .catch(() => { if (active) setAllEvents(SEEDED_SCHEDULE_EVENTS); });
    return () => { active = false; };
  }, []);

  // Derive next match and next training separately from the full event list
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allEvents.filter(e => e.date >= today);
  const nextMatch    = upcoming.find(e => e.type === "Match" || e.type === "Friendly") || null;
  const nextTraining = upcoming.find(e => e.type === "Training") || null;
  const nextEvent    = upcoming[0] || null;

  // Days until next match
  const daysToMatch = nextMatch
    ? Math.ceil((new Date(nextMatch.date + "T00:00:00") - new Date()) / 86400000)
    : null;
  const daysToTraining = nextTraining
    ? Math.ceil((new Date(nextTraining.date + "T00:00:00") - new Date()) / 86400000)
    : null;

  const coachTrustItems = [
    { key: STORAGE_KEYS.lineups, label: "Lineups", fallback: [], tone: C.orange },
    { key: STORAGE_KEYS.roster, label: "Roster", fallback: [], tone: C.gold },
    { key: STORAGE_KEYS.attendance, label: "Attendance", fallback: {}, tone: C.success },
    { key: STORAGE_KEYS.sessions, label: "Sessions", fallback: [], tone: C.electric },
    { key: STORAGE_KEYS.matchHistory, label: "Match records", fallback: [], tone: C.goldLight },
    { key: STORAGE_KEYS.wellnessLog, label: "Availability", fallback: [], tone: C.danger },
  ];

  // Build dynamic ticker items
  const items = [];

  // ── Identity ──
  if (name) {
    items.push({ icon: isCoach ? "📋" : "⚽", text: isCoach ? `Coach ${name} — Team Dashboard Active` : `Welcome back, ${name}!`, color: C.gold });
  } else {
    items.push({ icon: "GP", text: "GamePlan — Performance Platform", color: C.gold });
  }

  // ── Next Match ──
  if (nextMatch) {
    const matchTime = nextMatch.time ? ` · ${nextMatch.time}` : "";
    if (daysToMatch === 0) {
      items.push({ icon: "🏆", text: `MATCH DAY — ${nextMatch.title} is TODAY${matchTime}. Lock your checklist and intentions NOW.`, color: C.gold });
    } else if (daysToMatch === 1) {
      items.push({ icon: "🏆", text: `Match TOMORROW — ${nextMatch.title}${matchTime}. Final prep day. Sleep early, eat right.`, color: C.gold });
    } else if (daysToMatch !== null && daysToMatch <= 7) {
      items.push({ icon: "🏆", text: `${nextMatch.title} in ${daysToMatch} day${daysToMatch === 1 ? "" : "s"}${matchTime}. Pre-match routine opens now.`, color: C.gold });
    } else if (nextMatch) {
      items.push({ icon: "📅", text: `Next match — ${nextMatch.title} · ${nextMatch.date}${matchTime}`, color: C.gold });
    }
  }

  // ── Next Training ──
  if (nextTraining && (!nextMatch || nextTraining.date !== nextMatch.date)) {
    const trainTime = nextTraining.time ? ` · ${nextTraining.time}` : "";
    if (daysToTraining === 0) {
      items.push({ icon: "🏃", text: `Training TODAY — ${nextTraining.title}${trainTime}. Log your RPE afterwards.`, color: C.success });
    } else if (daysToTraining === 1) {
      items.push({ icon: "🏃", text: `Training TOMORROW — ${nextTraining.title}${trainTime}. Prep your kit tonight.`, color: C.success });
    } else if (daysToTraining !== null && daysToTraining <= 5) {
      items.push({ icon: "🏃", text: `Next training — ${nextTraining.title} in ${daysToTraining} days${trainTime}`, color: C.success });
    }
  }

  // ── Announcements: any future event with notes ──
  upcoming
    .filter(e => e.notes && e.notes.trim())
    .slice(0, 2)
    .forEach(e => {
      items.push({ icon: "📢", text: `Announcement: ${e.notes.trim()} (${e.title} · ${e.date})`, color: C.electric });
    });

  // ── Session stats (players) ──
  if (!isCoach && sessions?.length > 0) {
    items.push({ icon: "📊", text: `${sessions.length} session${sessions.length === 1 ? "" : "s"} logged total`, color: C.electric });
    if (streak > 1) items.push({ icon: "🔥", text: `${streak}-session training streak — keep it up!`, color: C.danger });
    if (daysSinceLast === 0) items.push({ icon: "✅", text: "You trained today — great work.", color: C.success });
    else if (daysSinceLast === 1) items.push({ icon: "⏰", text: "Last session was yesterday — time to go again?", color: C.gold });
    else if (daysSinceLast >= 3) items.push({ icon: "💤", text: `${daysSinceLast} days since last session — your body misses the pitch.`, color: C.orange });
  }

  // ── Coach stats ──
  if (isCoach && sessions?.length > 0) {
    items.push({ icon: "📅", text: `${sessions.length} squad session${sessions.length === 1 ? "" : "s"} on record`, color: C.electric });
  }

  // ── ACWR load alert ──
  if (acwrZone && latestACWR !== null) {
    items.push({ icon: acwrZone.emoji, text: `Training Load (ACWR): ${latestACWR.toFixed(2)} — ${acwrZone.label}`, color: acwrZone.color });
    if (latestACWR > 1.3) items.push({ icon: "🧊", text: "High load detected — prioritise sleep, hydration and a proper cool-down today.", color: C.orange });
  }

  // ── Contextual reminders ──
  // Match countdown nudge
  if (daysToMatch !== null && daysToMatch <= 3 && daysToMatch > 0) {
    items.push({ icon: "📝", text: `${daysToMatch === 1 ? "1 day" : `${daysToMatch} days`} to match day — complete your pre-match checklist in the Match tab.`, color: C.gold });
  }
  // Training day nudge
  if (daysToTraining === 0) {
    items.push({ icon: "📈", text: "Training today — log your session RPE and wellness check-in afterwards. Takes 60 seconds.", color: C.electric });
  }

  // ── Standing reminders ──
  items.push({ icon: "💧", text: "Hydration reminder — water before, during and after every session.", color: C.electric });
  items.push({ icon: "😴", text: "Sleep is your #1 recovery tool — aim for 8–9 hours on school nights.", color: "#a78bfa" });
  items.push({ icon: "🧠", text: "Today's Football IQ question is below — one question a day sharpens the mind.", color: C.gold });
  items.push({ icon: "💪", text: "RECIPE Value of the day: push your EXCELLENCE in every drill.", color: C.success });
  items.push({ icon: "🎯", text: "Set one micro-goal before the next session — one specific thing to improve.", color: C.gold });

  // Separator dot
  const DOT = <span style={{ color: `${C.gold}60`, margin: "0 10px", fontSize: 16, userSelect: "none" }}>•</span>;

  // Double items for seamless loop
  const doubled = [...items, ...items];

  // Bright orange bg always; text contrast flips with theme
  const TICKER_BG = "#FF6200";
  const tickerText = C.navy === "#000000" ? "#FFFFFF" : "#000000";

  return (
    <div style={{
      position: "fixed", top: 64, left: 0, right: 0, zIndex: 990,
      overflow: "hidden", height: 36,
      background: TICKER_BG,
      display: "flex", alignItems: "center",
    }}>
      {/* Left fade */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: `linear-gradient(to right, ${TICKER_BG}, transparent)`, zIndex: 3, pointerEvents: "none" }} />
      {/* Right fade */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: `linear-gradient(to left, ${TICKER_BG}, transparent)`, zIndex: 3, pointerEvents: "none" }} />

      <div style={{
        display: "inline-flex", alignItems: "center",
        animation: `tickerScroll ${Math.max(35, items.length * 6)}s linear infinite`,
        whiteSpace: "nowrap",
        willChange: "transform",
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "0 20px",
            fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
            color: tickerText, letterSpacing: 0.3,
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.text}</span>
            {DOT}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  HERO
// ══════════════════════════════════════════════════
function HeroSection({ setActive, profile, sessions }) {
  const C = useTheme();
  const [qi, setQi] = useState(0);
  const [fade, setFade] = useState(true);
  const [iqRevealed, setIqRevealed] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setQi(i => (i + 1) % QUOTES.length); setFade(true); }, 350);
    }, 5500);
    return () => clearInterval(iv);
  }, []);

  const q = QUOTES[qi];

  // Daily IQ question rotates by day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayQ = QUIZ_QUESTIONS[dayOfYear % QUIZ_QUESTIONS.length];

  // Streak & last session stats
  const streak = (() => {
    if (!sessions?.length) return 0;
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    let count = 0; let cur = new Date(); cur.setHours(0,0,0,0);
    for (const s of sorted) {
      const d = new Date(s.date); d.setHours(0,0,0,0);
      if (Math.round((cur - d) / 86400000) <= 1) { count++; cur = d; } else break;
    }
    return count;
  })();
  const lastSession = sessions?.length ? [...sessions].sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
  const daysSinceLast = lastSession ? Math.round((new Date() - new Date(lastSession.date)) / 86400000) : null;
  const isPersonalised = profile?.name?.trim();

  // Dot-matrix live metrics (players only, computed once here)
  const heroSorted = sessions?.length ? [...sessions].filter(s => s?.date).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const heroReadiness = heroSorted.find(s => s.readinessScore != null)?.readinessScore ?? null;
  const heroAcwrData  = sessions?.length ? computeACWR(sessions) : [];
  const heroACWR      = heroAcwrData.length ? heroAcwrData[heroAcwrData.length - 1].acwr : null;
  const heroRColor    = heroReadiness === null ? C.textDim : heroReadiness < 60 ? C.danger : heroReadiness < 75 ? C.orange : C.success;
  const heroAColor    = heroACWR === null ? C.textDim : heroACWR < 0.8 ? C.electric : heroACWR <= 1.3 ? C.success : heroACWR <= 1.5 ? C.orange : C.danger;
  const showLiveMetrics = profile?.role !== "coach" && (heroReadiness !== null || heroACWR !== null);

  // Nothing design: left-anchored, asymmetric, monochrome, no gradients/blobs
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "flex-start",
      padding: "96px 24px 64px", position: "relative",
      background: C.navy,
      maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Eyebrow label — Space Mono ALL CAPS, no pill background */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.success, display: "inline-block" }} />
          <span style={{ fontFamily: FONT_SERIF, fontSize: 11, color: C.textMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {isPersonalised
              ? `${profile.role === "coach" ? "Coach" : "Player"} — ${profile.name}`
              : "Naval Base Secondary School · Football CCA"}
          </span>
        </div>

        {/* Hero headline — Doto display, tight tracking, left-anchored */}
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(52px, 9vw, 96px)", color: C.textBright, margin: "0 0 8px", lineHeight: 0.95, letterSpacing: "0.02em" }}>
          FOOTBALL
        </h1>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(52px, 9vw, 96px)", color: C.accent, margin: "0 0 32px", lineHeight: 0.95, letterSpacing: "0.02em" }}>
          CCA
        </h1>
        <p style={{ fontFamily: FONT_SERIF, fontSize: 11, color: C.textDim, margin: "0 0 48px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Train · Grow · Compete · Together</p>

        {/* CTA buttons — Nothing pill spec */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 56 }}>
          {(profile.role === "coach"
            ? [
                { s: "operations", label: "Lineups & Ops", primary: true },
                { s: "squad",      label: "Squad" },
                { s: "dashboard",  label: "Overview" },
                { s: "hub",        label: "Team Hub" },
              ]
            : [
                { s: "train",    label: "Start Training", primary: true },
                { s: "progress", label: "Track Progress" },
                { s: "match",    label: "Match Day" },
                { s: "culture",  label: "Legends" },
              ]
          ).map(b => (
            <GoldButton key={b.s} onClick={() => setActive(b.s)} secondary={!b.primary}>
              {b.label}
            </GoldButton>
          ))}
        </div>

        {/* Quote carousel — flat card, no shadow, border only */}
        <div style={{ padding: "20px 24px", background: C.navyCard, borderRadius: 12, border: `1px solid ${C.navyBorder}`, opacity: fade ? 1 : 0, transition: "opacity 0.35s ease", marginBottom: 48 }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 15, color: C.textBright, fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.6 }}>"{q.text}"</p>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>— {q.author}</p>
        </div>

        {/* Stats strip — Nothing stat row style, no color on values by default */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 48, borderTop: `1px solid ${C.navyBorder}`, paddingTop: 24 }}>
          {(profile.role === "coach"
            ? [
                { val: sessions?.length ?? 0, label: "Sessions Logged" },
                { val: streak > 0 ? `${streak}` : "—", label: "Streak" },
                { val: "B + C", label: "Divisions" },
                { val: 4, label: "Cluster Schools" },
              ]
            : sessions?.length > 0
              ? [
                  { val: sessions.length, label: "Sessions" },
                  { val: streak > 0 ? `${streak}` : "—", label: "Streak", color: streak > 0 ? C.warning : null },
                  { val: profile.level ? profile.level.charAt(0).toUpperCase() + profile.level.slice(1) : "—", label: "Level" },
                  { val: daysSinceLast === 0 ? "Today" : daysSinceLast === 1 ? "Yesterday" : daysSinceLast ? `${daysSinceLast}d ago` : "—", label: "Last Session", color: daysSinceLast > 3 ? C.accent : null },
                ]
              : [
                  { val: "3", label: "Training Levels" },
                  { val: "10+", label: "Mindset Cards" },
                  { val: "20+", label: "Nutrition Items" },
                  { val: "20", label: "IQ Questions" },
                ]
          ).map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: s.color || C.textBright, letterSpacing: "0.02em", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Live Metrics: dot-matrix panels ── */}
        {showLiveMetrics && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
            {heroReadiness !== null && (
              <DotMatrixPanel
                label="Readiness"
                value={heroReadiness}
                displayValue={`${heroReadiness}%`}
                sub={getReadinessDirective(heroReadiness)}
                max={100} segments={10}
                zones={[
                  { from: 0,  to: 60,  color: C.danger  },
                  { from: 60, to: 75,  color: C.orange  },
                  { from: 75, to: 100, color: C.success },
                ]}
                tone={heroRColor} compact
                style={{ flex: "1 1 200px" }}
              />
            )}
            {heroACWR !== null && (
              <DotMatrixPanel
                label="ACWR"
                value={Math.min(heroACWR / 2, 1) * 100}
                displayValue={heroACWR.toFixed(2)}
                sub={getLoadDirective(heroACWR)}
                max={100} segments={10}
                zones={[
                  { from: 0,  to: 40,  color: C.electric },
                  { from: 40, to: 65,  color: C.success  },
                  { from: 65, to: 75,  color: C.orange   },
                  { from: 75, to: 100, color: C.danger   },
                ]}
                tone={heroAColor} compact
                style={{ flex: "1 1 200px" }}
              />
            )}
          </div>
        )}

        {/* Daily IQ Question — flat, no colored icon background */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderBottom: `1px solid ${C.navyBorder}`, paddingBottom: 8 }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>Football IQ · Daily Question</span>
          </div>
          <div style={{ padding: "16px 20px", background: C.navyCard, borderRadius: 8, border: `1px solid ${C.navyBorder}` }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, margin: "0 0 14px", lineHeight: 1.5 }}>{todayQ.q}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {todayQ.opts.map((opt, i) => (
                <button key={i} onClick={() => setIqRevealed(true)} style={{
                  padding: "9px 12px", borderRadius: 4, cursor: "pointer", textAlign: "left",
                  background: "transparent",
                  border: `1px solid ${iqRevealed ? (i === todayQ.correct ? C.success : C.navyBorder) : C.navyBorder}`,
                  fontFamily: FONT_BODY, fontSize: 13,
                  color: iqRevealed ? (i === todayQ.correct ? C.success : C.textDim) : C.textMid,
                  fontWeight: 400, transition: "border-color 0.2s, color 0.2s",
                }}>{opt}</button>
              ))}
            </div>
            {iqRevealed
              ? <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.success, margin: 0, lineHeight: 1.5, borderTop: `1px solid ${C.navyBorder}`, paddingTop: 10 }}>{todayQ.explain}</p>
              : <p style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Tap any answer to reveal</p>
            }
          </div>
        </div>
      </div>

      {/* ── ROLLING TICKER STRIP ── */}
      <HeroTicker profile={profile} sessions={sessions} streak={streak} daysSinceLast={daysSinceLast} />
    </section>
  );
}

// ══════════════════════════════════════════════════
//  TRAINING
// ══════════════════════════════════════════════════
function PerformanceHome({ setActive, profile, sessions }) {
  const C = useTheme();
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "", photo: "" });
  const [wellnessLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const [nextEvent, setNextEvent] = useState(null);
  const sorted = [...(sessions || [])].filter(s => s?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 4);
  const last = recent[0] || null;
  const streak = (() => {
    if (!sorted.length) return 0;
    let count = 0;
    let cur = new Date();
    cur.setHours(0, 0, 0, 0);
    for (const s of sorted) {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      if (Math.round((cur - d) / 86400000) <= 1) { count++; cur = d; } else break;
    }
    return count;
  })();
  const daysSinceLast = last ? Math.round((new Date() - new Date(last.date)) / 86400000) : null;
  const avgRating = sessions?.length ? sessions.reduce((sum, s) => sum + (Number(s.rating) || 0), 0) / sessions.length : null;
  const recentAvg = recent.length ? recent.reduce((sum, s) => sum + (Number(s.rating) || 0), 0) / recent.length : null;
  const latestReady = sorted.find(s => s.readinessScore != null)?.readinessScore ?? null;
  const latestSleep = (() => { const s = sorted.find(x => x.sleep != null); return s ? Number(s.sleep) : null; })();
  const latestEnergy = (() => { const s = sorted.find(x => x.energy != null); return s ? Number(s.energy) : null; })();
  const completeRecentEntries = recent.filter(s => s.duration && s.rpe && s.sleep && s.energy && s.soreness).length;
  const compliance = recent.length ? Math.round((completeRecentEntries / recent.length) * 100) : 0;
  const weeklyLoad = sorted.reduce((sum, s) => {
    const diff = (new Date() - new Date(s.date)) / 86400000;
    return diff >= 0 && diff < 7 ? sum + (Number(s.load) || 0) : sum;
  }, 0);
  const acwrData = computeACWR(sessions || []);
  const latestACWR = acwrData.length ? acwrData[acwrData.length - 1].acwr : null;
  const latestLoad = acwrData.length ? acwrData[acwrData.length - 1] : null;
  const readinessTrend = sorted
    .filter(s => s.readinessScore != null)
    .slice(0, 6)
    .reverse()
    .map(s => ({ date: s.date.slice(5), readiness: Number(s.readinessScore) }));
  const loadTrend = acwrData.slice(-6).map(s => ({ date: s.date.slice(5), acute: s.acute, chronic: s.chronic }));
  const { xp, earned } = computeXpAndBadges(sessions || [], growthEntries || []);
  const level = getLevel(xp);
  const name = squad.name?.trim() || profile?.name?.trim() || "Player";
  const position = squad.position?.trim() || profile?.position?.trim() || "Midfielder";
  const activeIssues = (wellnessLogs || []).filter(log => !log.resolved);
  const availability = activeIssues.some(log => Number(log.severity) >= 3)
    ? { label: "Unavailable", color: C.danger, note: "Severe issue on record. Recover before full load." }
    : activeIssues.some(log => Number(log.severity) === 2)
      ? { label: "Modified", color: C.orange, note: "Monitor pain and adjust load." }
      : activeIssues.length > 0
        ? { label: "Available", color: C.gold, note: "Minor issue logged. Watch response." }
        : { label: "Available", color: C.success, note: "No active issues recorded." };
  const recommendation = latestReady !== null && latestReady < 60
    ? "Reduce intensity today. Prioritise recovery work and log your next session honestly."
    : latestACWR !== null && latestACWR > 1.3
      ? "Load is rising. Keep volume controlled and protect sleep over the next 48 hours."
      : daysSinceLast !== null && daysSinceLast >= 3
        ? "Rebuild momentum with a controlled technical session before pushing intensity."
        : "You are in a stable zone. Execute the next session with intent and maintain data quality.";
  const currentFocus = last?.goals?.trim() || profile?.firstGoal?.trim() || "Set a single performance focus for the next session.";
  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };
  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then(events => { if (active) setNextEvent(getNextScheduledEvent(events)); })
      .catch(() => { if (active) setNextEvent(getNextScheduledEvent(SEEDED_SCHEDULE_EVENTS)); });
    return () => { active = false; };
  }, []);
  const squadDirective = activeIssues.length ? getAvailabilityDirective(activeIssues) : "Squad availability is clear enough to plan the next block aggressively.";
  const loadDirective = getLoadDirective(latestLoad?.acwr ?? null);
  const stats = [
    { label: "Sessions", value: sessions?.length ?? 0, sub: "Total logged", color: C.gold },
    { label: "Avg Rating", value: avgRating !== null ? avgRating.toFixed(1) : "-", sub: "All sessions", color: C.electric },
    { label: "Streak", value: streak || "-", sub: "Current run", color: C.success },
    { label: "Readiness", value: latestReady !== null ? `${latestReady}%` : "-", sub: "Latest status", color: latestReady !== null && latestReady < 60 ? C.danger : C.goldLight },
    { label: "Acute Load", value: latestLoad ? latestLoad.acute : "-", sub: "7-day average", color: C.orange },
    { label: "Chronic Load", value: latestLoad ? latestLoad.chronic : "-", sub: "28-day average", color: C.electric },
    { label: "XP", value: xp, sub: `Level ${level.level}`, color: C.success },
  ];

  return (
    <section style={{ minHeight: "100vh", padding: "96px 24px 88px", background: C.navy, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(135deg, transparent 0%, transparent 48%, ${C.gold} 49%, transparent 50%)`, backgroundSize: "140px 140px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ borderRadius: 24, padding: 28, background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navyCard} 100%)`, border: `1px solid ${C.gold}24`, boxShadow: "0 18px 60px rgba(0,0,0,0.32)" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1.7, textTransform: "uppercase", marginBottom: 12 }}>Player Performance</div>
            <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(46px, 8vw, 86px)", color: C.textBright, margin: 0, lineHeight: 0.92, letterSpacing: 2 }}>{name.toUpperCase()}</h1>
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textMid, lineHeight: 1.65, margin: "18px 0 0" }}>{position} · Level {level.level} {level.title}. This homepage is now built around your work, your load, and your recent form.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              <GoldButton onClick={() => setActive("progress")} style={{ minWidth: 150 }}>Open Progress</GoldButton>
              <GoldButton onClick={() => setActive("train")} secondary style={{ minWidth: 150 }}>Training Lab</GoldButton>
              <GoldButton onClick={() => setActive("match")} secondary style={{ minWidth: 150 }}>Match Day</GoldButton>
            </div>
          </div>

          <Card style={{ borderRadius: 24, padding: 28, boxShadow: "0 18px 60px rgba(0,0,0,0.22)" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Today's status</div>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Performance snapshot</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[{ label: "Recent form", value: recentAvg !== null ? `${recentAvg.toFixed(1)}/5` : "No data", note: recentAvg !== null ? `Last ${recent.length} sessions` : "Start logging sessions", color: C.gold }, { label: "Readiness", value: latestReady !== null ? `${latestReady}%` : "Not tracked", note: latestReady !== null ? (latestReady >= 75 ? "Body looks ready" : latestReady >= 60 ? "Train smart today" : "Recovery first") : "Log sleep, energy, soreness", color: latestReady !== null && latestReady < 60 ? C.danger : C.success }, { label: "ACWR", value: latestACWR !== null ? latestACWR.toFixed(2) : "Not available", note: latestACWR !== null ? (latestACWR > 1.3 ? "Load is climbing" : latestACWR < 0.8 ? "Load is low" : "Load is balanced") : "Add duration and RPE", color: latestACWR !== null && latestACWR > 1.3 ? C.orange : C.electric }].map((item, idx) => (
                <div key={idx} style={{ padding: "15px 16px", borderRadius: 16, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.4 }}>{item.label}</div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 26, color: item.color }}>{item.value}</div>
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, marginTop: 8, lineHeight: 1.6 }}>{item.note}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
          {stats.map((card, idx) => (
            <div key={idx} style={{ padding: "18px 16px", borderRadius: 16, background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 34, color: card.color, letterSpacing: 1 }}>{card.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 20 }}>
          <Card style={{ borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>Recent sessions</h3>
              <button onClick={() => setActive("progress")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>Open full log</button>
            </div>
            {recent.length === 0 ? <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>No performance data yet. Log your first session and this page will start working for you.</div> : <div style={{ display: "grid", gap: 10 }}>{recent.map((entry) => (<div key={entry.id} style={{ padding: "14px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textBright, fontWeight: 700 }}>{(entry.type || "session").toUpperCase()}</div><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>{formatDate(entry.date)}</div></div><div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: FONT_BODY, fontSize: 12, color: C.textMid }}><span>Rating: {Number(entry.rating || 0).toFixed(1)}</span><span>Load: {entry.load || "-"}</span><span>Readiness: {entry.readinessScore != null ? `${entry.readinessScore}%` : "-"}</span></div></div>))}</div>}
          </Card>

          <Card style={{ borderRadius: 20 }}>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>What needs attention</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {[`${daysSinceLast === null ? "No sessions logged yet." : daysSinceLast === 0 ? "You trained today." : `Last session was ${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago.`}`, `${latestSleep !== null || latestEnergy !== null ? `Recovery inputs: sleep ${latestSleep ?? "-"} / energy ${latestEnergy ?? "-"}.` : "Recovery inputs are not being tracked yet."}`, `${latestACWR !== null ? `Current ACWR is ${latestACWR.toFixed(2)}.` : "Training load is not unlocked yet."}`, `${earned.length} badge${earned.length === 1 ? "" : "s"} earned so far.`].map((text, idx) => (
                <div key={idx} style={{ padding: "14px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{text}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TrainingSection() {
  const C = useTheme();
  const [level, setLevel] = useState("beginner");
  const [openWeek, setOpenWeek] = useState(0);
  const [showPosDrills, setShowPosDrills] = useState(true);
  const data = TRAINING_DATA[level];

  // Read stored profile to get player position
  const [profile] = usePersistedState(STORAGE_KEYS.profile, { position: "" });
  const posKey = POSITION_ALIAS[profile?.position] || null;
  const posDrillData = posKey ? POSITION_DRILLS[posKey] : null;

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="TRAINING" subtitle="Progressive technical work from foundation to advanced execution." accent={C.success} />

      {/* Level selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {Object.entries(TRAINING_DATA).map(([key, val]) => (
          <button key={key} onClick={() => { setLevel(key); setOpenWeek(0); }} style={{
            padding: "10px 22px", borderRadius: 999, cursor: "pointer",
            background: level === key ? val.color : C.navyCard,
            color: level === key ? (key === "beginner" ? C.navy : C.textBright) : C.textMid,
            border: level === key ? "none" : `1px solid ${C.navyBorder}`,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
            transition: "opacity 0.15s ease",
          }}>
            {val.title}
            <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 1, opacity: 0.8 }}>{val.subtitle.split("·")[0].trim()}</span>
          </button>
        ))}
      </div>

      {/* ── Position-Specific Drills Panel ── */}
      {posDrillData && (
        <div style={{ marginBottom: 28, borderRadius: 14, overflow: "hidden", border: `1px solid ${posDrillData.color}35`, background: C.navyCard }}>
          <button onClick={() => setShowPosDrills(v => !v)} style={{
            width: "100%", background: `${posDrillData.color}10`, border: "none", padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{posDrillData.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: posDrillData.color, letterSpacing: 1 }}>
                  YOUR POSITION — {posDrillData.label.toUpperCase()} DRILLS
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{posDrillData.drills.length} position-specific drills · tap 🎬 to watch</div>
              </div>
            </div>
            <span style={{ color: C.textDim, fontSize: 12, transform: showPosDrills ? "rotate(180deg)" : "", transition: "transform 0.3s" }}>▼</span>
          </button>
          {showPosDrills && (
            <div style={{ padding: "0 22px 20px" }}>
              <div style={{ background: `${posDrillData.color}08`, border: `1px solid ${posDrillData.color}20`, borderRadius: 10, padding: "12px 16px", margin: "14px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.6, fontStyle: "italic" }}>
                💡 {posDrillData.focus}
              </div>
              {posDrillData.drills.map((d, di) => (
                <div key={di} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: di % 2 === 0 ? C.surfaceSubtle : "transparent", borderRadius: 8, marginBottom: 2 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: posDrillData.color, color: C.navyDeep, fontSize: 11, fontWeight: 800, fontFamily: FONT_BODY, flexShrink: 0 }}>{di + 1}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, flex: 1 }}>{d.text}</span>
                  <a href={d.video} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, background: `${C.electric}10`, border: `1px solid ${C.electric}25`, textDecoration: "none", fontFamily: FONT_BODY, fontSize: 11, color: C.electric, fontWeight: 700, flexShrink: 0 }}>🎬 Watch</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.weeks.map((week, idx) => (
          <div key={idx} style={{
            background: C.navyCard, border: `1px solid ${openWeek === idx ? data.color + "40" : C.navyBorder}`,
            borderRadius: 14, overflow: "hidden", transition: "all 0.3s",
            boxShadow: openWeek === idx ? `0 4px 24px ${data.color}10` : "none",
          }}>
            <button onClick={() => setOpenWeek(openWeek === idx ? -1 : idx)} style={{
              width: "100%", background: "none", border: "none", padding: "18px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, background: `${data.color}15`, flexShrink: 0,
                }}>{week.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 19, color: C.textBright, letterSpacing: 1 }}>
                    WEEK {idx + 1}: {week.name.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{week.drills.length} drills · tap 🎬 for video demos</div>
                </div>
              </div>
              <span style={{ color: C.textDim, fontSize: 12, transform: openWeek === idx ? "rotate(180deg)" : "", transition: "transform 0.3s" }}>▼</span>
            </button>

            {openWeek === idx && (
              <div style={{ padding: "0 22px 22px" }}>
                <div style={{
                  background: `${data.color}08`, border: `1px solid ${data.color}20`,
                  borderRadius: 10, padding: "12px 16px", marginBottom: 14,
                  fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.6, fontStyle: "italic",
                }}>
                  💡 {week.focus}
                </div>
                {week.drills.map((drill, di) => (
                  <div key={di} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                    background: di % 2 === 0 ? C.surfaceSubtle : "transparent",
                    borderRadius: 8, marginBottom: 2,
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: data.color, color: C.navy, fontSize: 11, fontWeight: 800, fontFamily: FONT_BODY, flexShrink: 0,
                    }}>{di + 1}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, flex: 1 }}>{drill.text}</span>
                    <a href={drill.video} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6,
                      background: `${C.electric}10`, border: `1px solid ${C.electric}25`,
                      textDecoration: "none", fontFamily: FONT_BODY, fontSize: 11,
                      color: C.electric, fontWeight: 700, flexShrink: 0,
                    }}>🎬 Watch</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  NUTRITION
// ══════════════════════════════════════════════════
function NutritionSection() {
  const C = useTheme();
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timing, setTiming] = useState("pre");
  const [selectedFood, setSelectedFood] = useState(null);

  const timingLabels = { pre: "Pre-Training", post: "Post-Training", match: "Match Day" };
  const ratingColors = { green: C.success, amber: C.orange, red: C.danger };
  const ratingLabels = { green: "Great choice", amber: "Okay, not ideal", red: "Avoid this" };
  const filteredFoods = searchTerm.trim().length > 0 ? FOOD_DB.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())) : FOOD_DB;

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="NUTRITION" subtitle="Meal timing, food choices, and fuelling support for performance." accent={C.success} />

      {/* Food Checker */}
      <button onClick={() => setCheckerOpen(!checkerOpen)} style={{
        width: "100%", padding: 16, borderRadius: 14, cursor: "pointer", marginBottom: 24,
        background: checkerOpen ? C.navyCard : `linear-gradient(135deg, ${C.navy}, ${C.navyCard})`,
        color: checkerOpen ? C.danger : C.gold,
        border: checkerOpen ? `1px solid ${C.danger}30` : `1px solid ${C.gold}30`,
        fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        {checkerOpen ? "Close Food Checker" : "Open Food Checker"}
      </button>

      {checkerOpen && (
        <Card style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>FOOD CHECKER</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 16px" }}>Search for a food, pick the timing, get instant feedback.</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedFood(null); }}
              placeholder="Search: chicken rice, banana, bubble tea..."
              style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(timingLabels).map(([key, label]) => (
                <Pill key={key} active={timing === key} onClick={() => setTiming(key)} color={C.electric}>{label}</Pill>
              ))}
            </div>
          </div>
          {searchTerm.trim().length > 0 && (
            <div style={{ display: "grid", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {filteredFoods.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, textAlign: "center", padding: 20 }}>No match found.</p>
              ) : filteredFoods.map((food, i) => {
                const rating = food[timing];
                const isSelected = selectedFood?.name === food.name;
                return (
                  <div key={i}>
                    <div role="button" tabIndex={0} onClick={() => setSelectedFood(isSelected ? null : food)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                      background: isSelected ? `${ratingColors[rating]}08` : C.surfaceSubtle,
                      border: `1px solid ${isSelected ? ratingColors[rating] + "40" : C.navyBorder}`,
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, fontWeight: 600 }}>{food.name}</span>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{food.cal} kcal</span>
                      </div>
                      <span style={{
                        padding: "4px 12px", borderRadius: 6, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
                        background: `${ratingColors[rating]}15`, color: ratingColors[rating],
                      }}>{ratingLabels[rating]}</span>
                    </div>
                    {isSelected && (
                      <div style={{ padding: "12px 16px", borderRadius: "0 0 10px 10px", background: `${ratingColors[rating]}06`, borderLeft: `3px solid ${ratingColors[rating]}50` }}>
                        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.6 }}>{food.note}</p>
                        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                          {["carb","protein","fat"].map(m => (
                            <span key={m} style={{ fontFamily: FONT_BODY, fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.surfaceSubtle, color: C.textDim }}>
                              {m}: <strong style={{ color: C.textMid }}>{food[m]}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Meal timing cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {NUTRITION_DATA.map((item, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${item.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, margin: 0, letterSpacing: 0.5 }}>{item.meal.toUpperCase()}</h3>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: item.color }}>{item.time}</span>
              </div>
            </div>
            <ul style={{ padding: 0, margin: "0 0 14px", listStyle: "none" }}>
              {item.options.map((opt, j) => (
                <li key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontFamily: FONT_BODY, fontSize: 13, color: C.textMid }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  {opt}
                </li>
              ))}
            </ul>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: C.surfaceSubtle, borderLeft: `2px solid ${item.color}40` }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{item.tip}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  BOX BREATHING TIMER
// ══════════════════════════════════════════════════
function BoxBreathingTimer() {
  const C = useTheme();
  const PHASES = [
    { label: "INHALE", duration: 4, color: C.electric, instruction: "Breathe in slowly through your nose" },
    { label: "HOLD", duration: 4, color: C.gold, instruction: "Hold your breath gently" },
    { label: "EXHALE", duration: 4, color: C.success, instruction: "Breathe out slowly through your mouth" },
    { label: "HOLD", duration: 4, color: "#a855f7", instruction: "Hold and prepare for the next breath" },
  ];

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [rounds, setRounds] = useState(0);
  const totalRounds = 5;
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const phase = PHASES[phaseIdx];
  const progress = (phase.duration - secondsLeft) / phase.duration;

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhaseIdx(0);
    setSecondsLeft(4);
    setRounds(0);
    setDone(false);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setPhaseIdx(pIdx => {
            const next = (pIdx + 1) % 4;
            if (next === 0) {
              setRounds(r => {
                const newR = r + 1;
                if (newR >= totalRounds) {
                  clearInterval(intervalRef.current);
                  setRunning(false);
                  setDone(true);
                }
                return newR;
              });
            }
            return next;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - progress);

  return (
    <Card style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>BOX BREATHING TIMER</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 24px" }}>4-4-4-4 breathing to calm nerves before kick-off. Complete {totalRounds} rounds.</p>

      {/* Phase steps */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
        {PHASES.map((p, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 14px", borderRadius: 10,
            background: running && phaseIdx === i ? `${p.color}18` : C.surfaceSubtle,
            border: `1px solid ${running && phaseIdx === i ? p.color + "50" : C.navyBorder}`,
            transition: "all 0.4s",
          }}>
            <span style={{ fontFamily: FONT_HEAD, fontSize: 11, color: running && phaseIdx === i ? p.color : C.textDim, letterSpacing: 1 }}>{p.label}</span>
            <span style={{ fontFamily: FONT_HEAD, fontSize: 18, color: running && phaseIdx === i ? p.color : C.textDim }}>{p.duration}s</span>
          </div>
        ))}
      </div>

      {/* Circle timer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="52" fill="none" stroke={`${phase.color}15`} strokeWidth="8" />
            <circle
              cx="70" cy="70" r="52" fill="none"
              stroke={running || done ? phase.color : C.navyBorder}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={running ? dashOffset : circumference}
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {done ? (
              <span style={{ fontSize: 32 }}>✅</span>
            ) : (
              <>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 38, color: running ? phase.color : C.textDim, lineHeight: 1, transition: "color 0.4s" }}>
                  {secondsLeft}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: running ? phase.color : C.textDim, fontWeight: 700, letterSpacing: 1, marginTop: 2, textTransform: "uppercase", transition: "color 0.4s" }}>
                  {running ? phase.label : "READY"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Round dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i < rounds ? C.success : (running && i === rounds ? phase.color : C.navyBorder),
              transition: "all 0.4s",
              boxShadow: running && i === rounds ? `0 0 8px ${phase.color}60` : "none",
            }} />
          ))}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "10px 0 0", textAlign: "center" }}>
          {done ? "Well done! You've completed 5 rounds. 🎉" : running ? phase.instruction : "Press Start when you're ready"}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {done ? (
          <GoldButton onClick={reset}>Repeat</GoldButton>
        ) : (
          <>
            <GoldButton onClick={() => setRunning(r => !r)}>
              {running ? "⏸ Pause" : rounds === 0 ? "▶ Start" : "▶ Resume"}
            </GoldButton>
            {(running || rounds > 0) && (
              <GoldButton secondary onClick={reset}>Reset</GoldButton>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════
//  MINDSET
// ══════════════════════════════════════════════════
function MindsetSection() {
  const C = useTheme();
  const [activeCard, setActiveCard] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [mindsetFilter, setMindsetFilter] = useState("All");
  const [journalEntries, setJournalEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [journalForm, setJournalForm] = useState({ date: new Date().toISOString().slice(0, 10), fixed: "", growth: "", reflection: "" });
  const [showJournal, setShowJournal] = useState(false);
  const journalRef = useRef(null);

  const addJournalEntry = () => {
    if (!journalForm.reflection.trim()) return;
    setJournalEntries(prev => [...prev, { ...journalForm, id: Date.now() }]);
    setJournalForm({ date: new Date().toISOString().slice(0, 10), fixed: "", growth: "", reflection: "" });
    setShowJournal(false);
  };

  const toggleFlip = (i) => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }));

  const phaseFilters = ["All", "Pre-Game", "During Game", "Post-Game", "General"];
  const phaseColors = { "Pre-Game": C.electric, "During Game": C.gold, "Post-Game": C.success, "General": "#a855f7" };

  const filteredFramework = mindsetFilter === "All"
    ? GROWTH_MINDSET_FRAMEWORK
    : GROWTH_MINDSET_FRAMEWORK.filter(item => item.phase === mindsetFilter);

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="MENTAL PERFORMANCE" subtitle="Mental routines, composure, and growth habits that support performance." accent={C.electric} />

      {/* Mindset cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 40 }}>
        {MINDSET_CARDS.map((card, i) => (
          <div key={i} onClick={() => setActiveCard(activeCard === i ? null : i)} style={{
            background: C.navyCard, border: `1px solid ${activeCard === i ? C.electric + "50" : C.navyBorder}`,
            borderRadius: 14, padding: 22, cursor: "pointer",
            boxShadow: activeCard === i ? `0 4px 24px ${C.electric}10` : "none",
            transition: "all 0.25s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: activeCard === i ? 14 : 0 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, background: `${C.electric}12`,
              }}>{card.icon}</span>
              <div>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, color: C.textBright, margin: 0, letterSpacing: 0.5 }}>{card.title.toUpperCase()}</h3>
                <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.electric, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{card.technique}</span>
              </div>
            </div>
            {activeCard === i && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: 0, lineHeight: 1.65 }}>{card.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* Box Breathing Timer */}
      <BoxBreathingTimer />

      {/* Fixed vs Growth Mindset — Flippable Cards */}
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>FIXED vs GROWTH MINDSET</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 16px" }}>Tap a card to flip from fixed thinking to growth thinking.</p>

        {/* Phase filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {phaseFilters.map(f => (
            <button key={f} onClick={() => { setMindsetFilter(f); setFlippedCards({}); }} style={{
              padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: "none",
              fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              background: mindsetFilter === f ? (phaseColors[f] || C.electric) : C.surfaceSubtle,
              color: mindsetFilter === f ? C.navy : C.textDim,
              transition: "all 0.2s",
            }}>{f}</button>
          ))}
        </div>

        {/* Flip cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {filteredFramework.map((item, i) => {
            const isFlipped = !!flippedCards[i];
            const phaseColor = phaseColors[item.phase] || C.electric;
            return (
              <div key={i} onClick={() => toggleFlip(i)} style={{ perspective: 800, cursor: "pointer", height: 130 }}>
                <div style={{
                  position: "relative", width: "100%", height: "100%",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}>
                  {/* Front — Fixed mindset */}
                  <div style={{
                    position: "absolute", inset: 0, backfaceVisibility: "hidden",
                    borderRadius: 12, padding: "14px 16px",
                    background: `${C.danger}08`, border: `1px solid ${C.danger}25`,
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: phaseColor, background: `${phaseColor}15`, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.phase}</span>
                    </div>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.danger, margin: 0, lineHeight: 1.5 }}>"{item.fixed}"</p>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textAlign: "right" }}>Tap to flip →</span>
                  </div>
                  {/* Back — Growth mindset */}
                  <div style={{
                    position: "absolute", inset: 0, backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: 12, padding: "14px 16px",
                    background: `${C.success}08`, border: `1px solid ${C.success}30`,
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 22 }}>🌱</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: C.success, background: `${C.success}15`, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Growth</span>
                    </div>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.success, margin: 0, lineHeight: 1.5 }}>"{item.growth}"</p>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textAlign: "right" }}>← Tap to flip back</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Growth Journal */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>GROWTH JOURNAL</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0 }}>{journalEntries.length} entries saved</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {journalEntries.length > 0 && <ShareSaveBar targetRef={journalRef} filename="nbss-journal.png" title="My NBSS Growth Journal" />}
            <GoldButton onClick={() => setShowJournal(!showJournal)} secondary={showJournal}>
              {showJournal ? "Cancel" : "+ New Entry"}
            </GoldButton>
          </div>
        </div>
        {showJournal && (
          <div style={{ padding: 20, background: C.surfaceSubtle, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={journalForm.date} onChange={e => setJournalForm({ ...journalForm, date: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Fixed mindset thought today</label>
              <input value={journalForm.fixed} onChange={e => setJournalForm({ ...journalForm, fixed: e.target.value })} placeholder="e.g. I'll never be good at headers..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Growth mindset flip</label>
              <input value={journalForm.growth} onChange={e => setJournalForm({ ...journalForm, growth: e.target.value })} placeholder="e.g. I can improve my heading with more practice..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Reflection</label>
              <textarea value={journalForm.reflection} onChange={e => setJournalForm({ ...journalForm, reflection: e.target.value })} placeholder="What did you learn today?" style={{ ...inputStyle, height: 70, resize: "vertical" }} />
            </div>
            <GoldButton onClick={addJournalEntry} style={{ width: "100%" }}>Save Entry ✓</GoldButton>
          </div>
        )}
        {journalEntries.length > 0 && (
          <div ref={journalRef} style={{ background: C.navyCard, borderRadius: 10, padding: "4px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {journalEntries.slice().reverse().map(entry => (
                <div key={entry.id} style={{ padding: "12px 16px", borderRadius: 10, background: C.surfaceSubtle, borderLeft: `3px solid ${C.electric}40` }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginBottom: 4 }}>{entry.date}</div>
                  {entry.fixed && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.danger, margin: "0 0 3px" }}>Fixed: {entry.fixed}</p>}
                  {entry.growth && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.success, margin: "0 0 3px" }}>Growth: {entry.growth}</p>}
                  {entry.reflection && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{entry.reflection}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  WARM-UP / COOL-DOWN
// ══════════════════════════════════════════════════
function WarmUpSection() {
  const C = useTheme();
  const [mode, setMode] = useState("warmup"); // "warmup" | "cooldown"
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState({});

  const steps = mode === "warmup" ? WARM_UP_STEPS : COOL_DOWN_STEPS;
  const accentColor = mode === "warmup" ? C.success : C.electric;
  const allDone = steps.every((_, i) => done[`${mode}-${i}`]);

  const toggleDone = (idx) => {
    const key = `${mode}-${idx}`;
    setDone(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFlow = () => { setDone({}); setActiveStep(0); };

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="PREPARATION AND RECOVERY" subtitle="Structured pre-session and post-session routines that support availability." accent={accentColor} />

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[{ id: "warmup", label: "Pre-Session Preparation" }, { id: "cooldown", label: "Post-Session Recovery" }].map(t => (
          <button key={t.id} onClick={() => { setMode(t.id); setActiveStep(0); }} style={{
            padding: "10px 20px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
            background: mode === t.id ? accentColor : C.navyCard,
            color: mode === t.id ? C.navyDeep : C.textMid,
            border: mode === t.id ? "none" : `1px solid ${C.navyBorder}`,
            transition: "opacity 0.15s ease",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, fontWeight: 700 }}>
            {mode === "warmup" ? "WARM-UP PROGRESS" : "COOL-DOWN PROGRESS"}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: accentColor, fontWeight: 700 }}>
            {Object.keys(done).filter(k => k.startsWith(mode) && done[k]).length}/{steps.length} steps
          </span>
        </div>
        <div style={{ height: 8, background: C.navyBorder, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, background: accentColor,
            width: `${(Object.keys(done).filter(k => k.startsWith(mode) && done[k]).length / steps.length) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* All done state */}
      {allDone && (
        <div style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, textAlign: "center" }}>
          <span style={{ fontSize: 36 }}>✅</span>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: accentColor, letterSpacing: 1, margin: "8px 0 4px" }}>
            {mode === "warmup" ? "FULLY WARMED UP — YOU'RE READY." : "RECOVERY COMPLETE — WELL DONE."}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 12 }}>
            {mode === "warmup" ? "Your joints, muscles and brain are primed. Go play your game." : "Your body is in recovery mode. Hydrate, eat within 45 mins, rest."}
          </p>
          <button onClick={resetFlow} style={{ padding: "8px 20px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.textMid }}>Reset Protocol</button>
        </div>
      )}

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, idx) => {
          const isDone = done[`${mode}-${idx}`];
          const isActive = activeStep === idx && !isDone;
          return (
            <div key={idx} onClick={() => { toggleDone(idx); if (!isDone && idx + 1 < steps.length) setActiveStep(idx + 1); }} style={{
              background: isDone ? `${accentColor}08` : isActive ? `${accentColor}12` : C.navyCard,
              border: `1px solid ${isDone ? accentColor + "40" : isActive ? accentColor + "60" : C.navyBorder}`,
              borderRadius: 14, padding: "16px 20px", cursor: "pointer",
              display: "flex", alignItems: "flex-start", gap: 16,
              transition: "all 0.25s",
              opacity: !isDone && !isActive && activeStep > idx ? 0.5 : 1,
            }}>
              {/* Checkbox */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? accentColor : "transparent", border: `2px solid ${isDone ? accentColor : C.navyBorder}`,
                marginTop: 2,
              }}>
                {isDone && <span style={{ color: C.navyDeep, fontSize: 16, fontWeight: 900 }}>✓</span>}
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{step.icon}</span>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 16, color: isDone ? accentColor : C.textBright, letterSpacing: 0.5 }}>{step.name.toUpperCase()}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: accentColor, background: `${accentColor}15`, padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>{step.duration}</span>
                </div>
                {isActive && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                )}
                {isDone && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: accentColor, margin: 0, fontStyle: "italic" }}>Complete ✓</p>}
              </div>
              {/* Step number */}
              <span style={{ fontFamily: FONT_HEAD, fontSize: 22, color: isDone ? accentColor : C.textDim, opacity: isDone ? 1 : 0.4 }}>{String(idx + 1).padStart(2, "0")}</span>
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: FONT_SERIF, fontSize: 13, color: C.textDim, textAlign: "center", margin: "28px 0 0", fontStyle: "italic" }}>
        "The more I practise, the luckier I get." — Players who skip warm-up get to test that theory the hard way.
      </p>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  FITNESS
// ══════════════════════════════════════════════════
function FitnessSection() {
  const C = useTheme();
  const [results, setResults] = usePersistedState(STORAGE_KEYS.fitnessResults, {});
  const [showLog, setShowLog] = useState(null);
  const [showChart, setShowChart] = useState(null);
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().slice(0, 10), value: "" });
  const exportRef = useRef(null);

  const levelColors = { beginner: C.textDim, intermediate: C.electric, advanced: C.gold, elite: C.success };

  const addResult = (testName) => {
    if (!logForm.value || !logForm.date) return;
    setResults(prev => {
      const existing = prev[testName] || { entries: [], target: "" };
      return { ...prev, [testName]: { ...existing, entries: [...existing.entries, { ...logForm, id: Date.now() }] } };
    });
    setLogForm({ date: new Date().toISOString().slice(0, 10), value: "" });
    setShowLog(null);
  };

  const deleteResult = (testName, id) => {
    if (!window.confirm("Delete this benchmark entry?")) return;
    setResults(prev => ({ ...prev, [testName]: { ...prev[testName], entries: prev[testName].entries.filter(e => e.id !== id) } }));
  };

  const setTarget = (testName, val) => {
    setResults(prev => ({ ...prev, [testName]: { ...(prev[testName] || { entries: [] }), target: val } }));
  };

  const getChartData = (testName) => ((results[testName]?.entries || [])).map(e => ({ date: e.date.slice(5), value: parseFloat(e.value) || 0 }));

  const [eduOpen, setEduOpen] = useState(null); // "acwr" | "rpe" | null

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="" title="FITNESS BENCHMARKS" subtitle="Track results, monitor progress, and set performance targets." accent={C.danger} />

      {/* ── ATHLETE EDUCATION: ACWR & RPE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
        {/* ACWR Card */}
        <div style={{ background: C.navyCard, border: `1px solid ${eduOpen === "acwr" ? C.gold + "60" : C.navyBorder}`, borderRadius: 16, overflow: "hidden", transition: "all 0.3s" }}>
          <button onClick={() => setEduOpen(eduOpen === "acwr" ? null : "acwr")} style={{
            width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.gold}15`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚖️</div>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>WHAT IS ACWR?</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>Acute:Chronic Workload Ratio — your injury risk indicator</div>
              </div>
            </div>
            <span style={{ color: C.gold, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{eduOpen === "acwr" ? "▲" : "▼"}</span>
          </button>
          {eduOpen === "acwr" && (
            <div style={{ padding: "0 20px 20px" }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>
                <strong style={{ color: C.textBright }}>ACWR compares your recent training load (last 7 days) against your long-term load (last 28 days).</strong> Think of it as your fitness GPS — it tells you if you're training too much, too little, or just right.
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>
                <strong style={{ color: C.textBright }}>How it's calculated:</strong> Each session's load = RPE × Duration (minutes). ACWR = 7-day average ÷ 28-day average.
              </p>
              {/* Zone chart */}
              <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.navyBorder}`, marginBottom: 16 }}>
                {[
                  { range: "Below 0.8", label: "Under-loaded", desc: "You're doing too little. Risk of detraining and injury when load suddenly spikes.", color: C.electric, bg: `${C.electric}20` },
                  { range: "0.8 – 1.3", label: "Optimal Zone", desc: "Sweet spot. Training load is well-managed. Keep this range to perform and stay healthy.", color: C.success, bg: `${C.success}18` },
                  { range: "1.3 – 1.5", label: "Caution Zone", desc: "Load is rising quickly. Prioritise recovery — sleep, nutrition, stretching.", color: C.orange, bg: `${C.orange}18` },
                  { range: "Above 1.5", label: "High Risk", desc: "Overload warning. High injury risk. Reduce session intensity and rest immediately.", color: C.danger, bg: `${C.danger}15` },
                ].map((z, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: z.bg, borderBottom: i < 3 ? `1px solid ${C.navyBorder}` : "none" }}>
                    <div style={{ minWidth: 72, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: z.color, paddingTop: 1 }}>{z.range}</div>
                    <div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: z.color, marginBottom: 2 }}>{z.label}</div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{z.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, lineHeight: 1.6, margin: 0 }}>
                💡 Log your session <strong style={{ color: C.textMid }}>RPE and duration</strong> in the Progress Tracker to see your ACWR chart automatically.
              </p>
            </div>
          )}
        </div>

        {/* RPE Card */}
        <div style={{ background: C.navyCard, border: `1px solid ${eduOpen === "rpe" ? C.electric + "60" : C.navyBorder}`, borderRadius: 16, overflow: "hidden", transition: "all 0.3s" }}>
          <button onClick={() => setEduOpen(eduOpen === "rpe" ? null : "rpe")} style={{
            width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.electric}15`, border: `1px solid ${C.electric}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💬</div>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>WHAT IS RPE?</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>Rate of Perceived Exertion — your personal effort score</div>
              </div>
            </div>
            <span style={{ color: C.electric, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{eduOpen === "rpe" ? "▲" : "▼"}</span>
          </button>
          {eduOpen === "rpe" && (
            <div style={{ padding: "0 20px 20px" }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>
                <strong style={{ color: C.textBright }}>RPE is a simple 1–10 scale of how hard you felt you worked.</strong> It's used by elite sports scientists because it captures the real mental and physical toll of training — not just distance or time.
              </p>
              {/* RPE Scale */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                {[
                  { val: "1–2", label: "Very Easy", desc: "Light walk, warm-up", color: C.textDim },
                  { val: "3–4", label: "Easy", desc: "Comfortable jog, recovery session", color: C.electric },
                  { val: "5–6", label: "Moderate", desc: "You're working but can still talk", color: C.success },
                  { val: "7–8", label: "Hard", desc: "Breathless, high effort, match intensity", color: C.orange },
                  { val: "9",   label: "Very Hard", desc: "Near max — sprint intervals, final whistle push", color: C.orange },
                  { val: "10",  label: "Maximum", desc: "Total effort — cannot sustain beyond seconds", color: C.danger },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: `${r.color}10`, border: `1px solid ${r.color}25` }}>
                    <div style={{ minWidth: 32, fontFamily: FONT_HEAD, fontSize: 15, color: r.color, letterSpacing: 1 }}>{r.val}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}> — {r.desc}</span>
                    </div>
                    {/* Mini bar */}
                    <div style={{ width: 40, height: 6, borderRadius: 3, background: C.navyBorder, overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ height: "100%", width: `${(i + 1) / 6 * 100}%`, background: r.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, lineHeight: 1.6, margin: 0 }}>
                💡 Most team training sessions should sit at <strong style={{ color: C.textMid }}>RPE 6–8</strong>. Recovery sessions should be RPE 3–4. Always honest with yourself — no one benefits from inflated scores.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {FITNESS_TESTS.map((test, idx) => {
          const entries = results[test.name]?.entries || [];
          const target = results[test.name]?.target || "";
          const chartData = getChartData(test.name);
          const latest = entries.length > 0 ? entries[entries.length - 1].value : null;

          return (
            <Card key={idx} glow>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>{test.name.toUpperCase()}</h3>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.navyBorder}` }}>{test.unit}</span>
                </div>
                {latest && (
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.gold, background: `${C.gold}10`, padding: "4px 14px", borderRadius: 8, border: `1px solid ${C.gold}20` }}>
                    Latest: {latest}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                {Object.entries(test.levels).map(([lvl, val]) => (
                  <div key={lvl} style={{ padding: "12px 6px", borderRadius: 10, textAlign: "center", background: `${levelColors[lvl]}08`, border: `1px solid ${levelColors[lvl]}20` }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 9, color: levelColors[lvl], textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>{lvl}</div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 22, color: levelColors[lvl], marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, margin: "0 0 14px", paddingTop: 12, borderTop: `1px solid ${C.navyBorder}` }}>💡 {test.tip}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => { setShowLog(showLog === test.name ? null : test.name); setShowChart(null); }} style={{
                  padding: "8px 16px", borderRadius: 999, cursor: "pointer", border: "none",
                  background: showLog === test.name ? `${C.danger}15` : C.gold,
                  color: showLog === test.name ? C.danger : C.navy,
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                }}>
                  {showLog === test.name ? "Cancel" : `+ Log Result (${entries.length})`}
                </button>
                {entries.length >= 2 && (
                  <button onClick={() => { setShowChart(showChart === test.name ? null : test.name); setShowLog(null); }} style={{
                    padding: "8px 16px", borderRadius: 999, cursor: "pointer",
                    background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`,
                    color: C.textMid, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                  }}>
                    {showChart === test.name ? "Hide Chart" : "📈 Progress"}
                  </button>
                )}
              </div>

              {showLog === test.name && (
                <div style={{ padding: 18, background: C.surfaceSubtle, borderRadius: 12, marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div><label style={labelStyle}>Date</label><input type="date" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} style={{ ...inputStyle, width: 160 }} /></div>
                    <div><label style={labelStyle}>Result ({test.unit})</label><input value={logForm.value} onChange={e => setLogForm({ ...logForm, value: e.target.value })} placeholder={`e.g. ${test.levels.intermediate}`} style={{ ...inputStyle, width: 140 }} /></div>
                    <div><label style={labelStyle}>Target ({test.unit})</label><input value={target} onChange={e => setTarget(test.name, e.target.value)} placeholder={`e.g. ${test.levels.advanced}`} style={{ ...inputStyle, width: 140 }} /></div>
                    <GoldButton onClick={() => addResult(test.name)} style={{ height: 42 }}>Save</GoldButton>
                  </div>
                  {entries.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Recent Results</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {entries.slice(-8).reverse().map(e => (
                          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: C.navyCard, border: `1px solid ${C.navyBorder}` }}>
                            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{e.date}</span>
                            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, fontWeight: 700 }}>{e.value}</span>
                            <button onClick={() => deleteResult(test.name, e.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, opacity: 0.5 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showChart === test.name && chartData.length >= 2 && (
                <div style={{ marginTop: 14, padding: 16, background: C.surfaceSubtle, borderRadius: 12 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textDim }} />
                      <YAxis tick={{ fontSize: 10, fill: C.textDim }} />
                      <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 8, fontFamily: FONT_BODY, fontSize: 12, color: C.textBright }} />
                      <Line type="monotone" dataKey="value" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 4 }} activeDot={{ r: 6 }} />
                      {target && <ReferenceLine y={parseFloat(target)} stroke={C.success} strokeDasharray="5 5" label={{ value: "Target", fill: C.success, fontSize: 10 }} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      </div>
      {Object.keys(results).some(k => results[k]?.entries?.length > 0) && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <ShareSaveBar targetRef={exportRef} filename="nbss-fitness.png" title="My NBSS Fitness Results" />
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  TRACKER
// ══════════════════════════════════════════════════

// ── PERSONALISED ALERT BUILDER ──
// Produces structured InsightStack items with tone, delta, and rolling-baseline context.
// Compares against the player's own rolling history — not just fixed thresholds.
function buildPlayerAlerts({ C, availability, activeIssues, latestLoad, latestReady, readinessTrend, sessions, currentFocus, acwrData }) {
  const alerts = [];

  // 1. AVAILABILITY — colour-coded by severity
  const availHigh = activeIssues.some((l) => Number(l.severity) >= 3);
  const availMod  = activeIssues.some((l) => Number(l.severity) === 2);
  const availTone = availHigh ? C.danger : availMod ? C.orange : activeIssues.length ? C.gold : C.success;
  alerts.push({
    label: "Availability",
    labelTone: availTone,
    value: `${availability.label}. ${getAvailabilityDirective(activeIssues)}`,
    bg:     availHigh ? `${C.danger}08`  : availMod ? `${C.orange}08`  : undefined,
    border: availHigh ? `${C.danger}25`  : availMod ? `${C.orange}25`  : undefined,
  });

  // 2. LOAD STATUS — ACWR with session-over-session delta
  if (latestLoad) {
    const acwr    = latestLoad.acwr;
    const prevACWR = acwrData.length >= 2 ? acwrData[acwrData.length - 2].acwr : null;
    const delta    = prevACWR !== null ? acwr - prevACWR : null;
    const deltaStr = delta !== null
      ? ` (${delta > 0.01 ? `↑ ${delta.toFixed(2)}` : delta < -0.01 ? `↓ ${Math.abs(delta).toFixed(2)}` : "→ stable"} vs last session)`
      : "";
    const loadTone = acwr > 1.5 ? C.danger : acwr > 1.3 ? C.orange : acwr < 0.8 ? C.electric : C.success;
    alerts.push({
      label: "Load status",
      labelTone: loadTone,
      value: `ACWR ${acwr.toFixed(2)}${deltaStr}. ${getLoadDirective(acwr)}`,
      note:  `Acute ${latestLoad.acute} AU · Chronic ${latestLoad.chronic} AU`,
      bg:     acwr > 1.5 ? `${C.danger}08`  : acwr > 1.3 ? `${C.orange}08`  : undefined,
      border: acwr > 1.5 ? `${C.danger}25`  : acwr > 1.3 ? `${C.orange}25`  : undefined,
    });
  } else {
    alerts.push({ label: "Load status", value: "Log sessions with duration and RPE to unlock load guidance." });
  }

  // 3. RECOVERY — readiness vs rolling 4-session baseline (personalised, not fixed threshold)
  if (latestReady !== null) {
    const prevPoints = (readinessTrend || []).slice(1, 5); // exclude most recent, look back 4
    const baseline = prevPoints.length
      ? Math.round(prevPoints.reduce((s, p) => s + p.readiness, 0) / prevPoints.length)
      : null;
    const delta = baseline !== null ? latestReady - baseline : null;
    const deltaStr = delta !== null
      ? ` (${delta >= 0 ? `↑ ${delta}pts` : `↓ ${Math.abs(delta)}pts`} vs ${prevPoints.length}-session avg of ${baseline}%)`
      : "";
    const readyTone = latestReady < 60 ? C.danger : latestReady < 75 ? C.gold : C.success;
    alerts.push({
      label: "Recovery status",
      labelTone: readyTone,
      value: `Readiness ${latestReady}%${deltaStr}. ${getReadinessDirective(latestReady)}`,
      bg:     latestReady < 60 ? `${C.danger}08`  : undefined,
      border: latestReady < 60 ? `${C.danger}25`  : undefined,
    });
  } else {
    alerts.push({ label: "Recovery status", value: "Track sleep, energy, and soreness to unlock recovery signals." });
  }

  // 4. PERFORMANCE DIRECTION — recent-block vs previous-block trend
  if (sessions && sessions.length) {
    const sorted5  = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent5  = sorted5.slice(0, 5);
    const prev5    = sorted5.slice(5, 10);
    const recentAvg = recent5.reduce((s, x) => s + (Number(x.rating) || 0), 0) / recent5.length;
    const prevAvg   = prev5.length ? prev5.reduce((s, x) => s + (Number(x.rating) || 0), 0) / prev5.length : null;
    const trendStr  = prevAvg !== null
      ? recentAvg > prevAvg + 0.1
        ? ` — ↑ ${(recentAvg - prevAvg).toFixed(1)} from previous block.`
        : recentAvg < prevAvg - 0.1
          ? ` — ↓ ${(prevAvg - recentAvg).toFixed(1)} from previous block. Review session quality.`
          : " — consistent with previous block."
      : "";
    const perfTone = prevAvg !== null && recentAvg < prevAvg - 0.1 ? C.orange : C.electric;
    alerts.push({
      label: "Performance direction",
      labelTone: perfTone,
      value: `Last 5 sessions avg ${recentAvg.toFixed(1)}/5${trendStr}`,
      note:  `Current focus: ${currentFocus}`,
    });
  } else {
    alerts.push({ label: "Performance direction", value: "No performance records logged yet. Log your first session to activate the centre." });
  }

  return alerts;
}

// ACWR (Acute:Chronic Workload Ratio) computation
function computeACWR(sessions) {
  const withLoad = sessions.filter(s => s.date && s.load > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (withLoad.length < 2) return [];
  return withLoad.map(session => {
    const d = new Date(session.date);
    const acute  = withLoad.filter(s => { const diff = (d - new Date(s.date)) / 86400000; return diff >= 0 && diff < 7;  }).reduce((sum, s) => sum + (s.load||0), 0) / 7;
    const chronic = withLoad.filter(s => { const diff = (d - new Date(s.date)) / 86400000; return diff >= 0 && diff < 28; }).reduce((sum, s) => sum + (s.load||0), 0) / 28;
    const acwr = chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : 0;
    return { date: session.date, acute: Math.round(acute * 10) / 10, chronic: Math.round(chronic * 10) / 10, acwr };
  });
}

function TrackerSection() {
  const C = useTheme();
  const [sessions, setSessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { date: "", type: "training", rating: 3, notes: "", goals: "", mood: "4", duration: "", rpe: 5, sleep: 3, energy: 3, soreness: 3 };
  const [form, setForm, clearFormDraft] = useDraftState(DRAFT_KEYS.trackerForm, emptyForm);
  const [year, setYear] = useState("Sec 1");
  const [quickType, setQuickType] = useState("training");
  const [quickRating, setQuickRating] = useState(3);
  const exportRef = useRef(null);

  const moods = ["1", "2", "3", "4", "5"];

  const addEntry = () => {
    if (!form.date) return;
    const load = (parseInt(form.rpe) || 0) * (parseInt(form.duration) || 0);
    const readinessScore = Math.round(((+form.sleep + +form.energy + (6 - +form.soreness)) / 15) * 100);
    setSessions(prev => [...prev, stampRecord({ ...form, id: Date.now(), year, load, readinessScore })]);
    clearFormDraft(emptyForm);
    setShowForm(false);
  };

  const quickLog = () => {
    const today = new Date().toISOString().split("T")[0];
    setSessions(prev => [...prev, stampRecord({ date: today, type: quickType, rating: quickRating, notes: "", goals: "", mood: "4", id: Date.now(), year, load: 0, readinessScore: null })]);
  };

  const deleteEntry = (id) => {
    if (!window.confirm("Delete this session entry?")) return;
    setSessions(prev => prev.filter(e => e.id !== id));
  };

  const yearSessions = sessions.filter(s => s.year === year);
  const avgRating = yearSessions.length ? (yearSessions.reduce((s, e) => s + e.rating, 0) / yearSessions.length).toFixed(1) : "–";

  const draftUpdatedAt = readStorageMeta(DRAFT_KEYS.trackerForm)?.updatedAt;
  const sessionsMeta = readStorageMeta(STORAGE_KEYS.sessions);
  const latestAcwr = computeACWR(sessions).slice(-1)[0]?.acwr ?? null;
  const typeColors = { training: C.electric, match: C.gold, fitness: C.success, recovery: C.orange };

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="" title="SESSION LOG" subtitle="Log sessions, track workload, and monitor performance progression." accent={C.electric} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "-20px 0 20px", fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
        <span>Last updated {formatDateTime(sessionsMeta?.updatedAt)}</span>
        <span>Autosave draft {draftUpdatedAt ? `active · ${formatDateTime(draftUpdatedAt)}` : "inactive"}</span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total sessions", value: sessions.length, icon: "", color: C.electric },
          { label: `${year} sessions`, value: yearSessions.length, icon: "", color: C.gold },
          { label: "Average rating", value: avgRating, icon: "", color: C.success },
          { label: "Current year", value: year, icon: "", color: C.orange },
        ].map((s, i) => (
          <div key={i} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 14, padding: "18px 14px", textAlign: "center", borderTop: `3px solid ${s.color}` }}>
            {s.icon ? <span style={{ fontSize: 22 }}>{s.icon}</span> : null}
            <div style={{ fontFamily: FONT_HEAD, fontSize: 30, color: s.color, marginTop: 6 }}>{s.value}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ACWR Chart */}
      {(() => {
        const acwrData = computeACWR(sessions);
        if (acwrData.length < 2) return null;
        const last = acwrData[acwrData.length - 1];
        const acwrColor = last.acwr > 1.5 ? C.danger : last.acwr > 1.3 ? C.orange : last.acwr < 0.8 ? C.electric : C.success;
        return (
          <Card style={{ marginBottom: 24, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>TRAINING LOAD - ACWR</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 22, color: acwrColor }}>{last.acwr.toFixed(2)}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, padding: "3px 10px", borderRadius: 6, background: `${acwrColor}15`, color: acwrColor, fontWeight: 700 }}>
                  {last.acwr > 1.5 ? "HIGH RISK" : last.acwr > 1.3 ? "CAUTION" : last.acwr < 0.8 ? "UNDERLOADED" : "OPTIMAL"}
                </span>
              </div>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>Acute:Chronic Workload Ratio (7-day vs 28-day). Target zone: 0.8 - 1.3.</p>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 14 }}>
              {getLoadDirective(last.acwr)}
            </div>
            <div style={{ width: "100%", overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={acwrData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                <XAxis dataKey="date" tick={{ fontFamily: FONT_BODY, fontSize: 9, fill: C.textDim }} tickLine={false} />
                <YAxis domain={[0, 2.5]} tick={{ fontFamily: FONT_BODY, fontSize: 9, fill: C.textDim }} tickLine={false} />
                <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 8, fontFamily: FONT_BODY, fontSize: 12 }} />
                <ReferenceArea y1={0.8} y2={1.3} fill={`${C.success}12`} />
                <ReferenceArea y1={1.3} y2={1.5} fill={`${C.orange}12`} />
                <ReferenceArea y1={1.5} y2={2.5} fill={`${C.danger}10`} />
                <ReferenceLine y={1.5} stroke={C.danger} strokeDasharray="4 2" strokeWidth={1} />
                <ReferenceLine y={0.8} stroke={C.electric} strokeDasharray="4 2" strokeWidth={1} />
                <Line type="monotone" dataKey="acwr" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 3 }} activeDot={{ r: 5 }} name="ACWR" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </Card>
        );
      })()}

      {/* Sleep Quality Trend Chart */}
      {(() => {
        const sleepData = sessions
          .filter(s => s.sleep && s.date)
          .sort((a, b) => a.date > b.date ? 1 : -1)
          .slice(-30) // last 30 sessions
          .map(s => ({ date: s.date.slice(5), sleep: Number(s.sleep), energy: Number(s.energy) || undefined }));
        if (sleepData.length < 2) return null;
        return (
          <Card style={{ marginBottom: 24, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>SLEEP AND ENERGY TREND</div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: FONT_BODY }}>
                <span style={{ color: C.electric }}>— Sleep quality (1–5)</span>
                <span style={{ color: C.success }}>— Energy (1–5)</span>
              </div>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>Last {sleepData.length} sessions · higher = better · aim for consistent 4–5</p>
            <div style={{ width: "100%", overflow: "hidden" }}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={sleepData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT_BODY, fontSize: 9, fill: C.textDim }} tickLine={false} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontFamily: FONT_BODY, fontSize: 9, fill: C.textDim }} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 8, fontFamily: FONT_BODY, fontSize: 12 }} />
                  <ReferenceLine y={4} stroke={C.success} strokeDasharray="4 2" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 9, fill: C.success, fontFamily: FONT_BODY }} />
                  <Line type="monotone" dataKey="sleep" stroke={C.electric} strokeWidth={2} dot={{ fill: C.electric, r: 3 }} activeDot={{ r: 5 }} name="Sleep" connectNulls />
                  <Line type="monotone" dataKey="energy" stroke={C.success} strokeWidth={2} dot={{ fill: C.success, r: 3 }} activeDot={{ r: 5 }} name="Energy" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      })()}

      {/* Year filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["Sec 1","Sec 2","Sec 3","Sec 4"].map(y => <Pill key={y} active={year === y} onClick={() => setYear(y)} color={C.gold}>{y}</Pill>)}
      </div>

      {/* Quick Log */}
      <Card style={{ marginBottom: 16, border: `1px solid ${C.electric}25` }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.electric, letterSpacing: 1, marginBottom: 8 }}>QUICK ENTRY</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 12 }}>Log today quickly when speed matters.</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {[{type:"training",label:"Training",color:C.electric},{type:"match",label:"Match",color:C.gold},{type:"fitness",label:"Fitness",color:C.success},{type:"recovery",label:"Recovery",color:C.orange}].map(t => (
            <button key={t.type} onClick={() => setQuickType(t.type)} style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", background: quickType === t.type ? `${t.color}20` : C.navyCard, border: `1px solid ${quickType === t.type ? t.color : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 12, color: quickType === t.type ? t.color : C.textMid, fontWeight: quickType === t.type ? 700 : 400 }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Quality:</span>
          {[1,2,3,4,5].map(r => (
            <button key={r} onClick={() => setQuickRating(r)} style={{ width: 36, height: 36, borderRadius: 8, cursor: "pointer", background: quickRating >= r ? C.gold : C.navyCard, border: quickRating >= r ? "none" : `1px solid ${C.navyBorder}`, color: quickRating >= r ? C.navy : C.textDim, fontSize: 14, fontWeight: 700 }}>{r}</button>
          ))}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
          {getLoadDirective(latestAcwr)}
        </div>
        <GoldButton onClick={quickLog} style={{ width: "100%" }}>Save {quickType.charAt(0).toUpperCase()+quickType.slice(1)} Session</GoldButton>
      </Card>

      <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm} style={{ width: "100%", marginBottom: 20 }}>
        {showForm ? "Cancel" : "Open Detailed Session Entry"}
      </GoldButton>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="training">Training</option><option value="match">Match</option><option value="fitness">Fitness Test</option><option value="recovery">Recovery</option>
              </select>
            </div>
            <div><label style={labelStyle}>Duration (minutes)</label><input type="number" min="0" max="300" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 90" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>RPE — effort 1–10 (load = RPE × mins)</label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[1,2,3,4,5,6,7,8,9,10].map(r => {
                  const rpeColor = r <= 3 ? C.success : r <= 6 ? C.gold : r <= 8 ? C.orange : C.danger;
                  return (
                    <button key={r} onClick={() => setForm({ ...form, rpe: r })} style={{ width: 32, height: 32, borderRadius: 8, cursor: "pointer", background: form.rpe === r ? `${rpeColor}30` : C.navyCard, border: `1px solid ${form.rpe === r ? rpeColor : C.navyBorder}`, color: form.rpe === r ? rpeColor : C.textDim, fontSize: 12, fontWeight: form.rpe === r ? 800 : 400 }}>{r}</button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Readiness check-in */}
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: `${C.electric}08`, border: `1px solid ${C.electric}20` }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.electric, letterSpacing: 1, marginBottom: 10 }}>READINESS CHECK-IN</div>
            {[{key:"sleep",label:"Sleep quality last night",inverse:false},{key:"energy",label:"Energy level right now",inverse:false},{key:"soreness",label:"Body soreness (lower = better)",inverse:true}].map(({key,label,inverse}) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 4 }}>{label}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5].map(v => {
                    const isActive = form[key] === v;
                    const col = inverse ? (v <= 2 ? C.success : v === 3 ? C.gold : C.danger) : (v <= 2 ? C.danger : v === 3 ? C.gold : C.success);
                    return <button key={v} onClick={() => setForm({ ...form, [key]: v })} style={{ width: 40, height: 32, borderRadius: 8, cursor: "pointer", background: isActive ? `${col}25` : C.navyCard, border: `1px solid ${isActive ? col : C.navyBorder}`, color: isActive ? col : C.textDim, fontFamily: FONT_BODY, fontSize: 12, fontWeight: isActive ? 700 : 400 }}>{v}</button>;
                  })}
                </div>
              </div>
            ))}
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, marginTop: 4 }}>
              Readiness score: <strong style={{ color: C.electric }}>{Math.round(((+form.sleep + +form.energy + (6 - +form.soreness)) / 15) * 100)}%</strong>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Performance Rating</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => setForm({ ...form, rating: r })} style={{
                  width: 44, height: 44, borderRadius: 10, cursor: "pointer",
                  background: form.rating >= r ? C.gold : C.navyCard,
                  border: form.rating >= r ? "none" : `1px solid ${C.navyBorder}`,
                  color: form.rating >= r ? C.navy : C.textDim,
                  fontSize: 16, fontFamily: FONT_BODY, fontWeight: 700,
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Session State</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {moods.map(m => (
                <button key={m} onClick={() => setForm({ ...form, mood: m })} style={{
                  width: 44, height: 44, borderRadius: 10, cursor: "pointer", fontSize: 20,
                  background: form.mood === m ? `${C.electric}20` : C.navyCard,
                  border: form.mood === m ? `1px solid ${C.electric}50` : `1px solid ${C.navyBorder}`,
                }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Reflections</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What went well? What to improve?" style={{ ...inputStyle, height: 70, resize: "vertical" }} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Goal for next session</label>
            <input value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="e.g. Complete 5 successful dribbles" style={inputStyle} />
          </div>
          <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
            Draft autosaves on this device. Updated {formatDateTime(draftUpdatedAt)}.
          </div>
          <GoldButton onClick={addEntry} style={{ marginTop: 18, width: "100%" }}>Save Entry</GoldButton>
        </Card>
      )}

      {yearSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No sessions logged for {year} yet.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Use the quick entry above to start building your performance history.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {yearSessions.slice().reverse().map(entry => (
            <div key={entry.id} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderLeft: `3px solid ${typeColors[entry.type] || C.textDim}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{entry.mood}</span>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: C.textBright, letterSpacing: 0.5 }}>{entry.type.toUpperCase()}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>— {entry.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    {entry.load > 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.orange, background: `${C.orange}15`, padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>Load: {entry.load}</span>}
                    {entry.readinessScore != null && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: entry.readinessScore >= 70 ? C.success : entry.readinessScore >= 50 ? C.gold : C.danger, background: `${entry.readinessScore >= 70 ? C.success : entry.readinessScore >= 50 ? C.gold : C.danger}15`, padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>Ready: {entry.readinessScore}%</span>}
                  </div>
                  {entry.updatedAt && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 4 }}>Updated {formatDateTime(entry.updatedAt)}</div>}
                  {entry.notes && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, marginTop: 2 }}>{entry.notes}</div>}
                  {entry.goals && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.electric, marginTop: 2 }}>Focus: {entry.goals}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>{[1,2,3,4,5].map(r => <span key={r} style={{ color: entry.rating >= r ? C.gold : C.navyBorder, fontSize: 14 }}>★</span>)}</div>
                <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      {sessions.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <ShareSaveBar targetRef={exportRef} filename="gameplan-tracker.png" title="GamePlan Training Progress" />
        </div>
      )}
    </section>
  );
}
// ══════════════════════════════════════════════════
//  WELLNESS / INJURY LOG
// ══════════════════════════════════════════════════
function WellnessSection() {
  const C = useTheme();
  const [logs, setLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { date: "", type: "injury", location: "", severity: 2, notes: "", rtp: "", resolved: false };
  const [form, setForm, clearFormDraft] = useDraftState(DRAFT_KEYS.wellnessForm, emptyForm);

  const addLog = () => {
    if (!form.date || !form.location) return;
    setLogs(prev => [...prev, stampRecord({ ...form, id: Date.now() })]);
    clearFormDraft(emptyForm);
    setShowForm(false);
  };

  const toggleResolved = (id) => setLogs(prev => prev.map(l => l.id === id ? stampRecord({ ...l, resolved: !l.resolved }, l) : l));
  const deleteLog = (id) => {
    if (!window.confirm("Delete this availability record?")) return;
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const active = logs.filter(l => !l.resolved);
  const resolved = logs.filter(l => l.resolved);
  const draftUpdatedAt = readStorageMeta(DRAFT_KEYS.wellnessForm)?.updatedAt;
  const logsMeta = readStorageMeta(STORAGE_KEYS.wellnessLog);

  const severityLabel = (s) => ["", "Mild — continue training", "Moderate — modify load", "Severe — rest & see physio"][s] || "";
  const severityColor = (s) => [C.textDim, C.success, C.gold, C.danger][s] || C.textDim;

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="AVAILABILITY LOG" subtitle="Track issues, return-to-play timelines, and current training status." accent={C.orange} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "-20px 0 20px", fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
        <span>Last updated {formatDateTime(logsMeta?.updatedAt)}</span>
        <span>Autosave draft {draftUpdatedAt ? `active · ${formatDateTime(draftUpdatedAt)}` : "inactive"}</span>
      </div>

      {/* Info banner */}
      <div style={{ background: `${C.orange}08`, border: `1px solid ${C.orange}25`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
        This log supports awareness only. Always tell your coach about injuries and do not train through pain without guidance.
      </div>

      {/* Active injuries */}
      {active.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.danger, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Active</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {active.map(log => (
              <div key={log.id} style={{ background: C.navyCard, border: `1px solid ${severityColor(log.severity)}35`, borderRadius: 14, padding: "16px 20px", borderLeft: `4px solid ${severityColor(log.severity)}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontFamily: FONT_HEAD, fontSize: 15, color: C.textBright, letterSpacing: 0.5 }}>{log.location}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: severityColor(log.severity), background: `${severityColor(log.severity)}15`, padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>{severityLabel(log.severity)}</span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginBottom: log.notes ? 6 : 0 }}>
                      Logged: {log.date}{log.rtp ? ` · Est. return: ${log.rtp}` : ""}
                    </div>
                    {log.updatedAt && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginBottom: 6 }}>Updated {formatDateTime(log.updatedAt)}</div>}
                    {log.notes && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, margin: 0 }}>{log.notes}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={() => toggleResolved(log.id)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: `${C.success}10`, border: `1px solid ${C.success}30`, color: C.success, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>Mark Resolved</button>
                    <button onClick={() => deleteLog(log.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm} style={{ width: "100%", marginBottom: 20 }}>
        {showForm ? "Cancel" : "Open Availability Entry"}
      </GoldButton>

      {/* Log form */}
      {showForm && (
        <div style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><label style={makeLabelStyle(C)}>Date of injury / knock</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={makeInputStyle(C)} /></div>
            <div><label style={makeLabelStyle(C)}>Body location</label>
              <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={makeInputStyle(C)}>
                <option value="">Select location</option>
                {BODY_LOCATIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={makeLabelStyle(C)}>Severity</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {[1, 2, 3].map(v => (
                <button key={v} onClick={() => setForm({ ...form, severity: v })} style={{
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: form.severity === v ? `${severityColor(v)}15` : C.surfaceSubtle,
                  border: `1px solid ${form.severity === v ? severityColor(v) + "50" : C.navyBorder}`,
                  fontFamily: FONT_BODY, fontSize: 13, color: form.severity === v ? severityColor(v) : C.textMid, fontWeight: form.severity === v ? 700 : 400,
                }}>{["", "1 — Mild: light discomfort, can train normally", "2 — Moderate: noticeable pain, should modify load", "3 — Severe: significant pain, rest + see physio"][v]}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={makeLabelStyle(C)}>Estimated return date (optional)</label><input type="date" value={form.rtp} onChange={e => setForm({ ...form, rtp: e.target.value })} style={makeInputStyle(C)} /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={makeLabelStyle(C)}>Notes (how it happened, what it feels like)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Twisted ankle going for a 50-50, dull ache in outer ankle when running." style={{ ...makeInputStyle(C), height: 70, resize: "vertical", marginTop: 4 }} />
          </div>
          <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
            Draft autosaves on this device. Updated {formatDateTime(draftUpdatedAt)}.
          </div>
          <GoldButton onClick={addLog} style={{ marginTop: 16, width: "100%" }}>Save Log</GoldButton>
        </div>
      )}

      {/* Resolved log */}
      {resolved.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Resolved</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {resolved.map(log => (
              <div key={log.id} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, opacity: 0.6 }}>
                <div>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: C.textBright, letterSpacing: 0.5 }}>{log.location}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginLeft: 8 }}>{log.date}</span>
                  {log.updatedAt && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 4 }}>Updated {formatDateTime(log.updatedAt)}</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => toggleResolved(log.id)} style={{ padding: "4px 12px", borderRadius: 999, cursor: "pointer", background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textDim, fontFamily: FONT_BODY, fontSize: 11 }}>Reopen</button>
                  <button onClick={() => deleteLog(log.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, color: C.success, fontSize: 15, fontWeight: 600 }}>No availability issues are currently logged.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Use this log if you pick up a knock so you can track your recovery properly.</p>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
function SquadSection() {
  const C = useTheme();
  const isMobile = useIsMobile();
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad, setSquad] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "", photo: "" });
  const [editing, setEditing] = useState(false);
  const [tempSquad, setTempSquad] = useState({ name: "", position: "", number: "", photo: "" });
  const photoInputRef = useRef(null);
  const exportRef = useRef(null);

  const { xp, earned } = computeXpAndBadges(sessions, growthEntries);
  const lvl = getLevel(xp);
  const hasProfile = squad.name?.trim().length > 0;

  const saveProfile = () => { setSquad(tempSquad); setEditing(false); };
  const startEdit = () => { setTempSquad({ ...squad }); setEditing(true); };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 220);
    setTempSquad(prev => ({ ...prev, photo: compressed }));
  };

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="" title="PLAYER PROFILE" subtitle="Identity, development history, and performance progression in one profile." accent={C.gold} />

      {/* Player Card */}
      {!hasProfile || editing ? (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 18px", letterSpacing: 1 }}>
            {editing ? "EDIT PLAYER PROFILE" : "CREATE PLAYER PROFILE"}
          </h3>

          {/* Photo upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20, overflow: "hidden", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`,
              border: `2px solid ${C.gold}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {tempSquad.photo
                ? <img src={tempSquad.photo} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: FONT_HEAD, fontSize: 32, color: C.gold }}>{tempSquad.number || "?"}</span>
              }
            </div>
            <div>
              <button onClick={() => photoInputRef.current?.click()} style={{
                padding: "8px 16px", borderRadius: 999, cursor: "pointer",
                background: `${C.gold}15`, border: `1px solid ${C.gold}30`,
                color: C.gold, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
              }}>{tempSquad.photo ? "Change Photo" : "Add Photo"}</button>
              {tempSquad.photo && (
                <button onClick={() => setTempSquad(p => ({ ...p, photo: "" }))} style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 999, cursor: "pointer", background: "none", border: `1px solid ${C.navyBorder}`, color: C.textDim, fontFamily: FONT_BODY, fontSize: 12 }}>Remove</button>
              )}
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, margin: "6px 0 0" }}>Square photos work best. Stored on your device only.</p>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: isMobile ? "1 / -1" : undefined }}><label style={labelStyle}>Name</label><input value={tempSquad.name} onChange={e => setTempSquad({ ...tempSquad, name: e.target.value })} placeholder="Your name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Position</label>
              <select value={tempSquad.position} onChange={e => setTempSquad({ ...tempSquad, position: e.target.value })} style={inputStyle}>
                <option value="">Select</option><option value="GK">Goalkeeper</option><option value="CB">Centre Back</option><option value="LB">Left Back</option><option value="RB">Right Back</option><option value="CDM">Defensive Mid</option><option value="CM">Central Mid</option><option value="CAM">Attacking Mid</option><option value="LW">Left Wing</option><option value="RW">Right Wing</option><option value="ST">Striker</option>
              </select>
            </div>
            <div><label style={labelStyle}>Number</label><input type="number" min="1" max="99" value={tempSquad.number} onChange={e => setTempSquad({ ...tempSquad, number: e.target.value })} placeholder="#" style={inputStyle} /></div>
          </div>
          <GoldButton onClick={saveProfile} style={{ marginTop: 16 }}>Save Player Card</GoldButton>
        </Card>
      ) : (
        <div style={{
          borderRadius: 20, padding: 32, marginBottom: 24, position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navyCard} 100%)`,
          border: `1px solid ${C.gold}30`,
          boxShadow: `0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 ${C.gold}20`,
        }}>
          {/* Decorative */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}06, transparent 70%)` }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* Avatar / jersey number — tappable to change photo */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={startEdit}
                    title="Change photo"
                    style={{
                      display: "block", padding: 0, border: "none", background: "none", cursor: "pointer",
                      borderRadius: 20, position: "relative",
                    }}
                  >
                    <div style={{
                      width: 80, height: 80, borderRadius: 20, overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`,
                      border: `2px solid ${C.gold}40`,
                      fontFamily: FONT_HEAD, fontSize: 38, color: C.gold,
                    }}>
                      {squad.photo
                        ? <img src={squad.photo} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : (squad.number || "?")}
                    </div>
                    {/* Camera edit badge — always visible */}
                    <div style={{
                      position: "absolute", bottom: -4, right: -4, width: 24, height: 24,
                      borderRadius: "50%", background: C.navyCard, border: `2px solid ${C.navyBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, lineHeight: 1,
                    }}>✎</div>
                  </button>
                  {squad.photo && squad.number && (
                    <div style={{
                      position: "absolute", top: -6, left: -6, width: 22, height: 22,
                      borderRadius: 6, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_HEAD, fontSize: 11, color: C.navyDeep,
                      border: `2px solid ${C.navyDeep}`,
                    }}>{squad.number}</div>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 34, color: C.textBright, letterSpacing: 2 }}>{squad.name.toUpperCase()}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>{squad.position || "No position"} · GamePlan</div>
                </div>
              </div>
              <button onClick={startEdit} style={{ background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textMid, padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Edit ✎</button>
            </div>

            {/* XP Bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.gold, letterSpacing: 1 }}>LVL {lvl.level} · {lvl.title.toUpperCase()}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>{xp} XP{lvl.next ? ` / ${lvl.next}` : " · MAX"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.navyBorder }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                  width: lvl.next ? `${Math.min(100, (xp / lvl.next) * 100)}%` : "100%",
                  transition: "width 0.8s ease", boxShadow: `0 0 8px ${C.gold}40`,
                }} />
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
              {[
                { label: "Sessions", value: sessions.length },
                { label: "Badges Earned", value: earned.length },
                { label: "XP Total", value: xp },
              ].map((s, i) => (
                <div key={i} style={{ padding: "12px 10px", borderRadius: 10, background: C.surfaceSubtle, textAlign: "center", border: `1px solid ${C.navyBorder}` }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 24, color: C.textBright }}>{s.value}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <Card>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>ACHIEVEMENT BADGES</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {BADGES.map(badge => {
            const unlocked = earned.includes(badge.id);
            return (
              <div key={badge.id} style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "center",
                background: unlocked ? `${C.gold}08` : C.surfaceSubtle,
                border: `1px solid ${unlocked ? C.gold + "30" : C.navyBorder}`,
                opacity: unlocked ? 1 : 0.45, transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 28, display: "block", filter: unlocked ? "none" : "grayscale(1)" }}>{badge.icon}</span>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: unlocked ? C.gold : C.textDim, fontWeight: 700, marginTop: 6 }}>{badge.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 3 }}>{badge.desc}</div>
                {unlocked && <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.success, fontWeight: 700, marginTop: 6 }}>+{badge.xp} XP ✓</div>}
              </div>
            );
          })}
        </div>
      </Card>
      </div>
      {hasProfile && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <ShareSaveBar targetRef={exportRef} filename="gameplan-player-card.png" title={`${squad.name} - GamePlan Player Card`} />
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  LEGENDS
// ══════════════════════════════════════════════════
function BadgeIcon({ legend, size = 28 }) {
  const C = useTheme();
  if (legend.flag) {
    return (
      <img
        src={`https://flagcdn.com/w40/${legend.flag}.png`}
        alt={`${legend.name} flag`}
        style={{ width: size, height: "auto", borderRadius: 3, display: "block" }}
      />
    );
  }
  return <>{legend.badge}</>;
}

const RECIPE_COLORS = { Respect: C.electric, Resilience: C.orange, Care: C.success, Integrity: "#a855f7", Passion: C.danger, Excellence: C.orange };

function getLegendReflectionPrompt(legend) {
  if (!legend) return "";
  if (legend.reflectionPrompt?.trim()) return legend.reflectionPrompt;
  const name = legend.shortName || legend.name || "this legend";
  return `What part of ${name}'s story speaks to you most, and how will you apply it to your own football journey?`;
}

function LegendsSection() {
  const C = useTheme();
  const labelStyle = makeLabelStyle(C);
  const inputStyle = makeInputStyle(C);
  const [tab, setTab] = useState("global");
  const [activeIdx, setActiveIdx] = useState(0);
  const [reflections, setReflections] = usePersistedState("nbss-recipe-reflections", {});
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  const legends = tab === "global" ? LEGENDS_GLOBAL : tab === "sg" ? LEGENDS_SG : [];
  const legend = legends[activeIdx];
  const reflectionKey = legend ? legend.name : "";
  const reflectionPrompt = getLegendReflectionPrompt(legend);
  const savedReflection = reflections[reflectionKey] || "";

  // Sync draft when switching legends or tabs
  const prevKey = useRef(reflectionKey);
  useEffect(() => {
    if (prevKey.current !== reflectionKey) {
      setDraft(reflections[reflectionKey] || "");
      setSaved(false);
      prevKey.current = reflectionKey;
    }
  }, [reflectionKey, reflections]);

  // Also initialise draft when first loading a legend
  useEffect(() => {
    setDraft(reflections[reflectionKey] || "");
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveReflection = () => {
    if (!reflectionKey || !draft.trim()) return;
    setReflections(prev => ({ ...prev, [reflectionKey]: draft.trim() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const allLegends = [...LEGENDS_GLOBAL, ...LEGENDS_SG];
  const journalEntries = allLegends.filter(l => reflections[l.name]?.trim());

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🌟" title="LEGENDS" subtitle="Lessons from the greatest — reflect on their RECIPE values and write your own story" accent={C.gold} />

      {/* Tab row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        <Pill active={tab === "global"} onClick={() => { setTab("global"); setActiveIdx(0); }} color={C.gold}>🌍 Global Icons</Pill>
        <Pill active={tab === "sg"} onClick={() => { setTab("sg"); setActiveIdx(0); }} color={C.gold}>🇸🇬 Singapore Legends</Pill>
        <Pill active={tab === "journal"} onClick={() => setTab("journal")} color="#a855f7">
          📓 RECIPE Journal {journalEntries.length > 0 && `(${journalEntries.length})`}
        </Pill>
      </div>

      {/* ── RECIPE JOURNAL TAB ── */}
      {tab === "journal" && (
        <div>
          {journalEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", borderRadius: 16, background: C.navyCard, border: `1px solid ${C.navyBorder}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 10px", letterSpacing: 1 }}>YOUR JOURNAL IS EMPTY</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textDim, lineHeight: 1.7, margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Read a legend's story, answer the reflection prompt, and your entry will appear here. Your thoughts are private — only you can see them.
              </p>
              <button onClick={() => { setTab("global"); setActiveIdx(0); }} style={{ background: C.textBright, color: C.navy, border: "none", padding: "12px 24px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
                Start with a Legend →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "12px 16px", borderRadius: 10, background: `${"#a855f7"}12`, border: `1px solid ${"#a855f7"}25` }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#a855f7", margin: 0, fontWeight: 600 }}>
                  📓 {journalEntries.length} reflection{journalEntries.length !== 1 ? "s" : ""} saved — your private growth journal
                </p>
              </div>
              {journalEntries.map((l, i) => {
                const isGlobal = LEGENDS_GLOBAL.some(gl => gl.name === l.name);
                return (
                  <Card key={i}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                      <span style={{ fontSize: 32, flexShrink: 0 }}><BadgeIcon legend={l} size={32} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <span style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>{l.name.toUpperCase()}</span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, background: C.surfaceSubtle, padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.navyBorder}` }}>{isGlobal ? "🌍 Global" : "🇸🇬 Singapore"}</span>
                          {(l.recipeValues || [l.recipe]).map(rv => {
                            const rc = RECIPE_COLORS[rv] || C.gold;
                            return <span key={rv} style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: rc, background: `${rc}15`, padding: "2px 8px", borderRadius: 6, border: `1px solid ${rc}30`, textTransform: "uppercase", letterSpacing: 1 }}>{rv}</span>;
                          })}
                        </div>
                        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, fontStyle: "italic", lineHeight: 1.5, margin: "0 0 10px" }}>"{getLegendReflectionPrompt(l)}"</p>
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: `${"#a855f7"}08`, border: `1px solid ${"#a855f7"}20` }}>
                          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                            {reflections[l.name]}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => { setTab(isGlobal ? "global" : "sg"); setActiveIdx(isGlobal ? LEGENDS_GLOBAL.findIndex(g => g.name === l.name) : LEGENDS_SG.findIndex(g => g.name === l.name)); setDraft(reflections[l.name] || ""); }} style={{ background: "none", border: `1px solid ${C.navyBorder}`, color: C.textDim, padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12 }}>
                        Edit ✎
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LEGEND BROWSER (global / sg) ── */}
      {tab !== "journal" && (
        <>
          {/* Legend selector grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 24 }}>
            {legends.map((l, idx) => {
              const hasReflection = !!reflections[l.name]?.trim();
              return (
                <button key={idx} onClick={() => { setActiveIdx(idx); setDraft(reflections[l.name] || ""); setSaved(false); }} style={{
                  background: activeIdx === idx ? `${C.gold}15` : C.navyCard,
                  border: activeIdx === idx ? `1px solid ${C.gold}50` : `1px solid ${C.navyBorder}`,
                  borderRadius: 12, padding: "14px 8px", cursor: "pointer", textAlign: "center",
                  transition: "all 0.2s", position: "relative",
                }}>
                  {hasReflection && (
                    <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#a855f7", display: "block" }} />
                  )}
                  <span style={{ fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><BadgeIcon legend={l} size={28} /></span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: activeIdx === idx ? C.gold : C.textDim, marginTop: 5, display: "block", lineHeight: 1.3 }}>
                    {l.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active legend card */}
          {legend && (
            <>
              <Card glow style={{ borderLeft: `4px solid ${C.gold}` }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 52, width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold}10`, borderRadius: 18, border: `1px solid ${C.gold}20` }}>
                    <BadgeIcon legend={legend} size={52} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(24px, 5vw, 34px)", color: C.textBright, margin: 0, letterSpacing: 2 }}>{legend.name.toUpperCase()}</h2>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.navyBorder}` }}>{legend.era}</span>
                      {(legend.recipeValues || [legend.recipe]).map(rv => {
                        const rc = RECIPE_COLORS[rv] || C.gold;
                        return (
                          <span key={rv} style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: rc, background: `${rc}15`, padding: "4px 10px", borderRadius: 6, border: `1px solid ${rc}30`, textTransform: "uppercase", letterSpacing: 1 }}>
                            {rv}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Stat chip */}
                <div style={{ padding: "8px 14px", borderRadius: 8, background: `${C.gold}10`, border: `1px solid ${C.gold}25`, marginBottom: 18, display: "inline-block" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, fontWeight: 700 }}>🏆 {legend.stat}</span>
                </div>

                {/* Lesson text */}
                <div style={{ padding: "20px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, marginBottom: 24 }}>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textBright, lineHeight: 1.85, margin: 0 }}>
                    {legend.lesson}
                  </p>
                </div>

                {/* RECIPE breakdown chips */}
                <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 12, background: C.navyCard, border: `1px solid ${C.navyBorder}` }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>RECIPE Values in this story</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(legend.recipeValues || [legend.recipe]).map(rv => {
                      const rc = RECIPE_COLORS[rv] || C.gold;
                      const descriptions = {
                        Respect: "Treating teammates, opponents and coaches with dignity — on and off the pitch.",
                        Resilience: "Bouncing back from setbacks, injuries and failure without giving up.",
                        Care: "Looking out for others, giving back, and taking responsibility beyond yourself.",
                        Integrity: "Doing the right thing even when no one is watching.",
                        Passion: "Unconditional love for the game — the fire that keeps you going.",
                        Excellence: "Pushing beyond good enough — always striving to be your best self.",
                      };
                      return (
                        <div key={rv} style={{ padding: "10px 14px", borderRadius: 10, background: `${rc}10`, border: `1px solid ${rc}25`, flex: "1 1 200px" }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: rc, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{rv}</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{descriptions[rv] || ""}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reflection prompt + input */}
                <div style={{ borderRadius: 14, border: `1px solid ${"#a855f7"}30`, background: `${"#a855f7"}08`, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>✍️</span>
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: "#a855f7", letterSpacing: 1 }}>REFLECT</span>
                  </div>
                  <p style={{ fontFamily: FONT_SERIF, fontSize: 14, color: C.textBright, fontStyle: "italic", lineHeight: 1.75, margin: "0 0 16px" }}>
                    "{reflectionPrompt}"
                  </p>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ ...labelStyle, color: "#a855f7" }}>Your reflection (private — only you can see this)</label>
                    <textarea
                      value={draft}
                      onChange={e => { setDraft(e.target.value); setSaved(false); }}
                      placeholder="Write your thoughts here..."
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, minHeight: 100 }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={saveReflection} disabled={!draft.trim()} style={{
                      background: draft.trim() ? C.textBright : C.surfaceSubtle,
                      color: draft.trim() ? C.navy : C.textDim,
                      border: "none", padding: "10px 20px", borderRadius: 999, cursor: draft.trim() ? "pointer" : "not-allowed",
                      fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, transition: "opacity 0.15s ease",
                    }}>
                      {saved ? "✅ Saved!" : "Save Reflection"}
                    </button>
                    {savedReflection && !saved && (
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#a855f7" }}>📓 Reflection saved — edit anytime</span>
                    )}
                  </div>
                </div>
              </Card>

              <div style={{ marginTop: 16, padding: "12px 20px", borderRadius: 10, background: C.navyCard, border: `1px solid ${C.navyBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, margin: 0 }}>Every legend started as someone who just loved kicking a ball around. Your story is still being written. ✍️</p>
                {journalEntries.length > 0 && (
                  <button onClick={() => setTab("journal")} style={{ background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textMid, padding: "7px 16px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
                    View Journal ({journalEntries.length})
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  LINEUP STORY EXPORT — fixed 540×960px (9:16)
//  Rendered off-screen, captured by html2canvas at 2×
//  → final PNG is 1080×1920, perfect for IG Stories
// ══════════════════════════════════════════════════

// Fixed pixel constants for the 540px-wide canvas
const EX = {
  W: 540,   // canvas width
  H: 960,   // canvas height (9:16)
  PAD: 28,  // outer padding
  // pitch sits between header and footer sections
  PITCH_TOP: 210,
  PITCH_H: 560,
  // derived
  get PITCH_W() { return this.W - this.PAD * 2; },
};

function StoryExportCard({ lineup }) {
  const formation = FORMATIONS[lineup.formation];
  if (!formation) return null;
  const activeSubs = lineup.subs?.filter(s => (s || "").trim()) || [];
  const hasNotes = (lineup.notes || "").trim().length > 0;

  // Player dot size in the fixed canvas
  const DOT = 36;
  const NAME_W = 68;

  return (
    <div style={{
      position: "relative",
      width: EX.W,
      height: EX.H,
      background: C.navy,
      overflow: "hidden",
      fontFamily: FONT_BODY,
      flexShrink: 0,
    }}>
      {/* ── Ambient glows ── */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}10, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.electric}08, transparent 70%)`, pointerEvents: "none" }} />

      {/* ════════ TOP HEADER ════════ */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: `${EX.PAD}px ${EX.PAD}px 0` }}>
        {/* Branding row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚽</div>
            <div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 2, lineHeight: 1 }}>GAMEPLAN</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, letterSpacing: 3, textTransform: "uppercase" }}>Match Lineup</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.electric, background: `${C.electric}12`, padding: "5px 16px", borderRadius: 8, border: `1px solid ${C.electric}30`, letterSpacing: 1 }}>
            {lineup.formation}
          </div>
        </div>

        {/* Match title */}
        <div style={{ background: C.navyCard, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.navyBorder}` }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 30, color: C.textBright, letterSpacing: 1, lineHeight: 1, marginBottom: 10 }}>
            GamePlan <span style={{ color: C.gold }}>vs</span> {lineup.opponent || "TBD"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {lineup.competition && <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, background: `${C.gold}12`, padding: "3px 11px", borderRadius: 5, fontWeight: 700 }}>🏆 {lineup.competition}</span>}
            {lineup.date       && <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, background: C.surfaceSubtle, padding: "3px 11px", borderRadius: 5, border: `1px solid ${C.navyBorder}` }}>📅 {lineup.date}</span>}
            {lineup.time       && <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, background: C.surfaceSubtle, padding: "3px 11px", borderRadius: 5, border: `1px solid ${C.navyBorder}` }}>🕐 {lineup.time}</span>}
            {lineup.venue      && <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, background: C.surfaceSubtle, padding: "3px 11px", borderRadius: 5, border: `1px solid ${C.navyBorder}` }}>📍 {lineup.venue}</span>}
          </div>
        </div>
      </div>

      {/* ════════ PITCH ════════ */}
      <div style={{
        position: "absolute",
        top: EX.PITCH_TOP,
        left: EX.PAD,
        width: EX.PITCH_W,
        height: EX.PITCH_H,
        background: "linear-gradient(180deg, #0b5c1a 0%, #0f7022 50%, #0b5c1a 100%)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.45)",
      }}>
        {/* Pitch stripe texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 40px, transparent 40px, transparent 80px)`,
        }} />

        {/* SVG markings — viewBox matches pitch pixel size */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={EX.PITCH_W}
          height={EX.PITCH_H}
          viewBox={`0 0 ${EX.PITCH_W} ${EX.PITCH_H}`}
        >
          {/* Outer border */}
          <rect x="8" y="8" width={EX.PITCH_W-16} height={EX.PITCH_H-16} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2"/>
          {/* Centre line */}
          <line x1="8" y1={EX.PITCH_H/2} x2={EX.PITCH_W-8} y2={EX.PITCH_H/2} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"/>
          {/* Centre circle */}
          <circle cx={EX.PITCH_W/2} cy={EX.PITCH_H/2} r="58" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
          <circle cx={EX.PITCH_W/2} cy={EX.PITCH_H/2} r="4" fill="rgba(255,255,255,0.4)"/>
          {/* Top penalty area */}
          <rect x={EX.PITCH_W*0.22} y="8" width={EX.PITCH_W*0.56} height={EX.PITCH_H*0.155} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
          {/* Top 6-yard box */}
          <rect x={EX.PITCH_W*0.34} y="8" width={EX.PITCH_W*0.32} height={EX.PITCH_H*0.07} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>
          {/* Top penalty spot */}
          <circle cx={EX.PITCH_W/2} cy={EX.PITCH_H*0.115} r="3.5" fill="rgba(255,255,255,0.4)"/>
          {/* Bottom penalty area */}
          <rect x={EX.PITCH_W*0.22} y={EX.PITCH_H-8-EX.PITCH_H*0.155} width={EX.PITCH_W*0.56} height={EX.PITCH_H*0.155} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
          {/* Bottom 6-yard box */}
          <rect x={EX.PITCH_W*0.34} y={EX.PITCH_H-8-EX.PITCH_H*0.07} width={EX.PITCH_W*0.32} height={EX.PITCH_H*0.07} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>
          {/* Bottom penalty spot */}
          <circle cx={EX.PITCH_W/2} cy={EX.PITCH_H-EX.PITCH_H*0.115} r="3.5" fill="rgba(255,255,255,0.4)"/>
          {/* Corner arcs */}
          {[[8,8,1,1],[EX.PITCH_W-8,8,-1,1],[8,EX.PITCH_H-8,1,-1],[EX.PITCH_W-8,EX.PITCH_H-8,-1,-1]].map(([cx,cy,sx,sy],i) => (
            <path key={i} d={`M${cx+sx*20},${cy} A20,20 0 0,${sx===sy?0:1} ${cx},${cy+sy*20}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
          ))}
        </svg>

        {/* Player tokens */}
        {formation.positions.map((pos, idx) => {
          const name = (lineup.players[idx] || "").trim();
          // pos.x and pos.y are 0-100 percentages of the pitch
          const px = (pos.x / 100) * EX.PITCH_W;
          const py = (pos.y / 100) * EX.PITCH_H;
          return (
            <div key={idx} style={{
              position: "absolute",
              left: px,
              top: py,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              width: NAME_W,
              zIndex: 3,
            }}>
              {/* Dot */}
              <div style={{
                width: DOT, height: DOT, borderRadius: "50%",
                margin: "0 auto 4px",
                background: name
                  ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`
                  : "rgba(255,255,255,0.15)",
                border: `2.5px solid ${name ? C.gold : "rgba(255,255,255,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_HEAD, fontSize: 10, color: name ? C.navy : "rgba(255,255,255,0.6)",
                letterSpacing: 0.5,
                boxShadow: name ? `0 3px 12px ${C.gold}60` : "none",
              }}>{pos.role}</div>
              {/* Name */}
              <div style={{
                fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10,
                color: name ? "#ffffff" : "rgba(255,255,255,0.35)",
                textShadow: "0 1px 4px rgba(0,0,0,1)",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", lineHeight: 1.2,
              }}>{name || ""}</div>
            </div>
          );
        })}
      </div>

      {/* ════════ BOTTOM PANEL ════════ */}
      <div style={{
        position: "absolute",
        top: EX.PITCH_TOP + EX.PITCH_H + 16,
        left: EX.PAD,
        right: EX.PAD,
        bottom: EX.PAD,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Subs */}
        {activeSubs.length > 0 && (
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>Substitutes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {activeSubs.map((s, i) => (
                <span key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "5px 14px", borderRadius: 7, background: C.navyCard, color: C.textMid, border: `1px solid ${C.navyBorder}` }}>
                  <span style={{ color: C.textDim, fontSize: 10, marginRight: 5 }}>{i + 12}</span>{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {hasNotes && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: `${C.gold}08`, borderLeft: `3px solid ${C.gold}60`, flex: 1 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 5 }}>Coach's Notes</div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{lineup.notes}</p>
          </div>
        )}

        {/* Footer watermark */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 4 }}>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.gold, letterSpacing: 2 }}>GAMEPLAN</span>
          <span style={{ color: C.navyBorder, fontSize: 12 }}>·</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, letterSpacing: 1 }}>GamePlan</span>
        </div>
      </div>
    </div>
  );
}

function LineupCard({ lineup, filled, subCount, onEdit, onDuplicate, onDelete }) {
  const C = useTheme();
  const storyRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cardToast, setCardToast] = useState(null);
  const activeSubs = lineup.subs?.filter(s => (s || "").trim()) || [];

  const storyOpts = { width: EX.W, height: EX.H };

  const showCardToast = (msg, type = "success") => {
    setCardToast({ msg, type });
    setTimeout(() => setCardToast(null), 3000);
  };

  const handleSaveStory = async () => {
    if (!storyRef.current || saving) return;
    setSaving(true);
    try {
      await captureAndDownload(
        storyRef.current,
        `nbss-lineup-${(lineup.opponent || "lineup").replace(/\s+/g, "-").toLowerCase()}.png`,
        storyOpts
      );
    } catch { showCardToast("Screenshot failed — please try again.", "error"); }
    setSaving(false);
  };

  const handleShareStory = async () => {
    if (!storyRef.current || sharing) return;
    setSharing(true);
    try {
      await captureAndShare(
        storyRef.current,
        `NBSS vs ${lineup.opponent || "TBD"} — Lineup`,
        storyOpts
      );
      showCardToast("Shared successfully!");
    } catch { showCardToast("Share failed — use Save Story instead.", "error"); }
    setSharing(false);
  };

  return (
    <Card glow>
      {/* ── Visible summary card (in-page preview) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>
              GamePlan <span style={{ color: C.gold }}>vs</span> {lineup.opponent || "TBD"}
            </h3>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {lineup.date        && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.navyBorder}` }}>{lineup.date}</span>}
              {lineup.competition && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, background: `${C.gold}10`, padding: "2px 8px", borderRadius: 4 }}>{lineup.competition}</span>}
              <span style={{ fontFamily: FONT_HEAD, fontSize: 11, color: C.electric, background: `${C.electric}10`, padding: "2px 8px", borderRadius: 4 }}>{lineup.formation}</span>
            </div>
          </div>
        </div>

        {/* Compact player grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 5, marginBottom: activeSubs.length ? 10 : 0 }}>
          {FORMATIONS[lineup.formation]?.positions.map((pos, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.surfaceSubtle, borderRadius: 6 }}>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 10, color: C.gold, width: 28, flexShrink: 0 }}>{pos.role}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(lineup.players[idx] || "").trim() || "—"}</span>
            </div>
          ))}
        </div>

        {activeSubs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginRight: 4, alignSelf: "center" }}>Subs:</span>
            {activeSubs.map((s, i) => (
              <span key={i} style={{ fontFamily: FONT_BODY, fontSize: 12, padding: "2px 9px", borderRadius: 5, background: C.surfaceSubtle, color: C.textMid, border: `1px solid ${C.navyBorder}` }}>{s}</span>
            ))}
          </div>
        )}

        {(lineup.notes || "").trim() && (
          <div style={{ padding: "9px 13px", borderRadius: 8, background: `${C.gold}06`, borderLeft: `3px solid ${C.gold}30` }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{lineup.notes}</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <GoldButton onClick={onEdit} style={{ fontSize: 12, padding: "8px 16px" }}>Edit ✎</GoldButton>
        <GoldButton secondary onClick={onDuplicate} style={{ fontSize: 12, padding: "8px 16px" }}>Duplicate</GoldButton>
        <button onClick={onDelete} style={{ padding: "8px 16px", borderRadius: 999, background: `${C.danger}10`, color: C.danger, border: `1px solid ${C.danger}20`, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleShareStory} disabled={sharing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: sharing ? C.navyCard : `${C.electric}15`, border: `1px solid ${C.electric}30`, color: C.electric, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: sharing ? "wait" : "pointer" }}>
            {sharing ? "Sharing…" : "↗ Share"}
          </button>
          <button onClick={handleSaveStory} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: saving ? C.navyCard : `${C.orange}15`, border: `1px solid ${C.orange}30`, color: C.orange, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : "📸 Save Story"}
          </button>
        </div>
      </div>
      {cardToast && (
        <div style={{
          marginTop: 8, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: FONT_BODY,
          background: cardToast.type === "error" ? `${C.danger}12` : `${C.success}12`,
          border: `1px solid ${cardToast.type === "error" ? C.danger : C.success}30`,
          color: cardToast.type === "error" ? C.danger : C.success,
        }}>{cardToast.msg}</div>
      )}

      {/* ── Hidden 9:16 story card — rendered off-screen, captured by html2canvas ── */}
      <div style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: EX.W,
        height: EX.H,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}>
        <div ref={storyRef} style={{ width: EX.W, height: EX.H }}>
          <StoryExportCard lineup={lineup} />
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════
//  PRE-MATCH ROUTINE
// ══════════════════════════════════════════════════
function PreMatchSection() {
  const C = useTheme();
  const [checked, setChecked] = usePersistedState("nbss-prematch-checklist", {});
  const [intention, setIntention] = usePersistedState("nbss-prematch-intention", "");
  const [editIntention, setEditIntention] = useState(false);
  const [tempIntention, setTempIntention] = useState("");

  const toggleItem = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const totalChecked = PRE_MATCH_ITEMS.filter(i => checked[i.id]).length;
  const allReady = totalChecked === PRE_MATCH_ITEMS.length;

  const categories = [...new Set(PRE_MATCH_ITEMS.map(i => i.category))];

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="PRE-MATCH ROUTINE" subtitle="Match-day preparation checklist across physical, mental, and tactical readiness." accent={C.gold} />

      {/* Readiness meter */}
      <div style={{ background: C.navyCard, border: `1px solid ${allReady ? C.success + "50" : C.navyBorder}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 18, color: allReady ? C.success : C.textBright, letterSpacing: 1 }}>
            {allReady ? "MATCH READY" : "MATCH READINESS"}
          </span>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 26, color: allReady ? C.success : C.gold }}>
            {Math.round((totalChecked / PRE_MATCH_ITEMS.length) * 100)}%
          </span>
        </div>
        <div style={{ height: 10, background: C.navyBorder, borderRadius: 5, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 5,
            background: allReady ? C.success : `linear-gradient(90deg, ${C.gold}, ${C.electric})`,
            width: `${(totalChecked / PRE_MATCH_ITEMS.length) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        {allReady && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.success, marginTop: 10 }}>
            You've done the preparation. Now trust it and go play your game.
          </p>
        )}
      </div>

      {/* Checklist by category */}
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PRE_MATCH_ITEMS.filter(i => i.category === cat).map(item => (
              <button key={item.id} onClick={() => toggleItem(item.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                background: checked[item.id] ? `${C.success}08` : C.navyCard,
                border: `1px solid ${checked[item.id] ? C.success + "40" : C.navyBorder}`,
                textAlign: "left", width: "100%", transition: "all 0.2s",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: checked[item.id] ? C.success : "transparent",
                  border: `2px solid ${checked[item.id] ? C.success : C.navyBorder}`,
                }}>
                  {checked[item.id] && <span style={{ color: C.navyDeep, fontWeight: 900, fontSize: 14 }}>✓</span>}
                </div>
                <span style={{
                  fontFamily: FONT_BODY, fontSize: 14, color: checked[item.id] ? C.textDim : C.textBright,
                  textDecoration: checked[item.id] ? "line-through" : "none", flex: 1,
                }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Match intention */}
      <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25`, borderRadius: 14, padding: "20px 24px", marginTop: 12 }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.gold, letterSpacing: 1, marginBottom: 8 }}>MATCH INTENTION</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
          One word or phrase that captures your focus for today's match. Write it and lock it in.
        </p>
        {editIntention ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tempIntention} onChange={e => setTempIntention(e.target.value)} placeholder="e.g. Aggressive. First. Calm." style={{ ...makeInputStyle(C), flex: 1 }} maxLength={40} />
            <button onClick={() => { setIntention(tempIntention); setEditIntention(false); }} style={{ padding: "10px 18px", borderRadius: 999, cursor: "pointer", background: C.gold, border: "none", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.navyDeep }}>Save</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.gold, letterSpacing: 2, flex: 1 }}>
              {intention || <span style={{ color: C.textDim, fontFamily: FONT_BODY, fontSize: 14, fontStyle: "italic" }}>Not set yet…</span>}
            </div>
            <button onClick={() => { setTempIntention(intention); setEditIntention(true); }} style={{ padding: "7px 16px", borderRadius: 999, cursor: "pointer", background: `${C.gold}15`, border: `1px solid ${C.gold}30`, color: C.gold, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
              {intention ? "Edit" : "Set Intention"}
            </button>
          </div>
        )}
      </div>

      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, textAlign: "center", margin: "28px 0 0", lineHeight: 1.6 }}>
        Preparation quality should reduce noise and sharpen the first actions of the match.
      </p>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  MATCH HISTORY LOG
// ══════════════════════════════════════════════════
function MatchHistorySection() {
  const C = useTheme();
  const [matches, setMatches] = usePersistedState(STORAGE_KEYS.matchHistory, []);
  const [showForm, setShowForm] = useState(false);
  const [showReview, setShowReview] = useState(null); // id of match being reviewed
  const emptyForm = {
    date: "", opponent: "", competition: "", venue: "Home", position: "",
    minutesPlayed: 90, goalsScored: 0, assists: 0, rating: 3,
    scoreFor: "", scoreAgainst: "", notes: "",
  };
  const [form, setForm, clearFormDraft] = useDraftState(DRAFT_KEYS.matchForm, emptyForm);

  // Post-match review form (5 guided questions)
  const emptyReview = { q1: "", q2: "", q3: 3, q4: 3, q5: "" };
  const [review, setReview, clearReviewDraft] = useDraftState(DRAFT_KEYS.matchReview, emptyReview);

  const addMatch = () => {
    if (!form.date || !form.opponent) return;
    const id = Date.now();
    setMatches(prev => [...prev, stampRecord({ ...form, id, review: null })]);
    clearFormDraft(emptyForm);
    setShowForm(false);
    // Prompt for review immediately
    setShowReview(id);
  };

  const saveReview = (id) => {
    setMatches(prev => prev.map(m => m.id === id ? stampRecord({ ...m, review: stampRecord(review, m.review) }, m) : m));
    clearReviewDraft(emptyReview);
    setShowReview(null);
  };

  const deleteMatch = (id) => {
    if (!window.confirm("Delete this match record?")) return;
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  // Aggregate stats
  const totalGoals = matches.reduce((s, m) => s + (Number(m.goalsScored) || 0), 0);
  const totalAssists = matches.reduce((s, m) => s + (Number(m.assists) || 0), 0);
  const avgRating = matches.length ? (matches.reduce((s, m) => s + Number(m.rating), 0) / matches.length).toFixed(1) : "–";
  const totalMinutes = matches.reduce((s, m) => s + (Number(m.minutesPlayed) || 0), 0);
  const matchesMeta = readStorageMeta(STORAGE_KEYS.matchHistory);
  const matchDraftUpdatedAt = readStorageMeta(DRAFT_KEYS.matchForm)?.updatedAt;
  const reviewDraftUpdatedAt = readStorageMeta(DRAFT_KEYS.matchReview)?.updatedAt;

  const resultColor = (sf, sa) => {
    const f = Number(sf), a = Number(sa);
    if (isNaN(f) || isNaN(a) || sf === "" || sa === "") return C.textDim;
    return f > a ? C.success : f < a ? C.danger : C.gold;
  };
  const resultLabel = (sf, sa) => {
    const f = Number(sf), a = Number(sa);
    if (isNaN(f) || isNaN(a) || sf === "" || sa === "") return "—";
    return f > a ? "W" : f < a ? "L" : "D";
  };

  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="MATCH OUTPUT" subtitle="Record results, track output, and review match performance." accent={C.electric} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "-20px 0 20px", fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
        <span>Last updated {formatDateTime(matchesMeta?.updatedAt)}</span>
        <span>Entry draft {matchDraftUpdatedAt ? `active · ${formatDateTime(matchDraftUpdatedAt)}` : "inactive"}</span>
      </div>

      {/* Aggregate stats */}
      {matches.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Appearances", value: matches.length, icon: "", color: C.electric },
            { label: "Goals", value: totalGoals, icon: "", color: C.gold },
            { label: "Assists", value: totalAssists, icon: "", color: C.success },
            { label: "Minutes", value: totalMinutes, icon: "", color: C.orange },
            { label: "Avg Rating", value: avgRating, icon: "", color: C.electric },
          ].map((s, i) => (
            <div key={i} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 14, padding: "16px 14px", textAlign: "center", borderTop: `3px solid ${s.color}` }}>
              {s.icon ? <span style={{ fontSize: 20 }}>{s.icon}</span> : null}
              <div style={{ fontFamily: FONT_HEAD, fontSize: 28, color: s.color, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm} style={{ width: "100%", marginBottom: 20 }}>
        {showForm ? "Cancel" : "Open Match Entry"}
      </GoldButton>

      {/* Add match form */}
      {showForm && (
        <div style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.electric, letterSpacing: 1, marginBottom: 16 }}>MATCH DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={makeLabelStyle(C)}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={makeInputStyle(C)} /></div>
            <div><label style={makeLabelStyle(C)}>Opponent</label><input value={form.opponent} onChange={e => setForm({ ...form, opponent: e.target.value })} placeholder="vs. who?" style={makeInputStyle(C)} /></div>
            <div><label style={makeLabelStyle(C)}>Competition</label><input value={form.competition} onChange={e => setForm({ ...form, competition: e.target.value })} placeholder="e.g. NSG, friendly, C Div" style={makeInputStyle(C)} /></div>
            <div><label style={makeLabelStyle(C)}>Venue</label>
              <select value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} style={makeInputStyle(C)}>
                <option>Home</option><option>Away</option><option>Neutral</option>
              </select>
            </div>
            <div><label style={makeLabelStyle(C)}>Position Played</label>
              <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={makeInputStyle(C)}>
                <option value="">Select</option>
                {["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={makeLabelStyle(C)}>Minutes Played</label><input type="number" min="0" max="120" value={form.minutesPlayed} onChange={e => setForm({ ...form, minutesPlayed: e.target.value })} style={makeInputStyle(C)} /></div>
          </div>

          {/* Score */}
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: `${C.electric}08`, border: `1px solid ${C.electric}20` }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.electric, letterSpacing: 1, marginBottom: 10 }}>FINAL SCORE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}><label style={makeLabelStyle(C)}>We scored</label><input type="number" min="0" max="20" value={form.scoreFor} onChange={e => setForm({ ...form, scoreFor: e.target.value })} placeholder="0" style={makeInputStyle(C)} /></div>
              <span style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textDim, marginTop: 14 }}>–</span>
              <div style={{ flex: 1 }}><label style={makeLabelStyle(C)}>They scored</label><input type="number" min="0" max="20" value={form.scoreAgainst} onChange={e => setForm({ ...form, scoreAgainst: e.target.value })} placeholder="0" style={makeInputStyle(C)} /></div>
            </div>
          </div>

          {/* Personal stats */}
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: `${C.gold}08`, border: `1px solid ${C.gold}20` }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.gold, letterSpacing: 1, marginBottom: 10 }}>YOUR STATS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={makeLabelStyle(C)}>Goals</label><input type="number" min="0" max="20" value={form.goalsScored} onChange={e => setForm({ ...form, goalsScored: e.target.value })} style={makeInputStyle(C)} /></div>
              <div><label style={makeLabelStyle(C)}>Assists</label><input type="number" min="0" max="20" value={form.assists} onChange={e => setForm({ ...form, assists: e.target.value })} style={makeInputStyle(C)} /></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={makeLabelStyle(C)}>Personal Rating</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setForm({ ...form, rating: r })} style={{
                    width: 44, height: 44, borderRadius: 10, cursor: "pointer",
                    background: form.rating >= r ? C.gold : C.navyCard,
                    border: form.rating >= r ? "none" : `1px solid ${C.navyBorder}`,
                    color: form.rating >= r ? C.navyDeep : C.textDim,
                    fontSize: 16, fontFamily: FONT_BODY, fontWeight: 700,
                  }}>{r}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={makeLabelStyle(C)}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anything worth remembering about this match?" style={{ ...makeInputStyle(C), height: 60, resize: "vertical" }} />
          </div>
          <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
            Draft autosaves on this device. Updated {formatDateTime(matchDraftUpdatedAt)}.
          </div>
          <GoldButton onClick={addMatch} style={{ marginTop: 16, width: "100%" }}>Save Match And Open Review</GoldButton>
        </div>
      )}

      {/* Post-match review modal */}
      {showReview && (
        <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "24px", marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.gold, letterSpacing: 1, marginBottom: 4 }}>POST-MATCH REVIEW</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 20 }}>Five questions. Honest answers. This is how you grow faster than everyone else.</p>
          {[
            { key: "q1", label: "What went well for you personally in this match?", type: "text" },
            { key: "q2", label: "What's the ONE thing you want to improve before the next match?", type: "text" },
            { key: "q3", label: "How well did you execute the game plan? (1–5)", type: "rating" },
            { key: "q4", label: "How did the team perform as a unit? (1–5)", type: "rating" },
            { key: "q5", label: "What's your main focus heading into the next match or training?", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={makeLabelStyle(C)}>{label}</label>
              {type === "text" ? (
                <textarea value={review[key]} onChange={e => setReview({ ...review, [key]: e.target.value })} placeholder="Be specific…" style={{ ...makeInputStyle(C), height: 60, resize: "vertical", marginTop: 4 }} />
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setReview({ ...review, [key]: v })} style={{
                      width: 44, height: 44, borderRadius: 10, cursor: "pointer",
                      background: review[key] >= v ? C.gold : C.navyCard,
                      border: review[key] >= v ? "none" : `1px solid ${C.navyBorder}`,
                      color: review[key] >= v ? C.navyDeep : C.textDim,
                      fontSize: 16, fontFamily: FONT_BODY, fontWeight: 700,
                    }}>{v}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginBottom: 16, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
            Review draft autosaves on this device. Updated {formatDateTime(reviewDraftUpdatedAt)}.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GoldButton onClick={() => saveReview(showReview)} style={{ flex: 1 }}>Save Review ✓</GoldButton>
            <button onClick={() => setShowReview(null)} style={{ padding: "10px 18px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.textDim, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>Skip for now</button>
          </div>
        </div>
      )}

      {/* Match list */}
      {matches.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No matches logged yet.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Log your first match above — track goals, assists, result and write your review.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {matches.slice().reverse().map(m => {
            const rc = resultColor(m.scoreFor, m.scoreAgainst);
            const rl = resultLabel(m.scoreFor, m.scoreAgainst);
            return (
              <div key={m.id} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 14, overflow: "hidden" }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", flexWrap: "wrap" }}>
                  {/* Result badge */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${rc}15`, border: `2px solid ${rc}40`, flexShrink: 0 }}>
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 20, color: rc }}>{rl}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 0.5 }}>vs {m.opponent}</span>
                      {m.scoreFor !== "" && m.scoreAgainst !== "" && (
                        <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: rc }}>{m.scoreFor}–{m.scoreAgainst}</span>
                      )}
                      {m.position && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "2px 8px", borderRadius: 5 }}>{m.position}</span>}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>
                      {m.date}{m.competition ? ` · ${m.competition}` : ""}{m.venue ? ` · ${m.venue}` : ""}
                    </div>
                  </div>
                  {m.updatedAt && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 4 }}>Updated {formatDateTime(m.updatedAt)}</div>}
                  {/* Personal stats */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {Number(m.goalsScored) > 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, background: `${C.gold}15`, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>⚽ {m.goalsScored}</span>}
                    {Number(m.assists) > 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.success, background: `${C.success}15`, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>Assists {m.assists}</span>}
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>⏱ {m.minutesPlayed}′</span>
                    <div style={{ display: "flex" }}>{[1,2,3,4,5].map(r => <span key={r} style={{ fontSize: 11, color: Number(m.rating) >= r ? C.gold : C.navyBorder }}>★</span>)}</div>
                    {!m.review && (
                      <button onClick={() => setShowReview(m.id)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: `${C.gold}10`, border: `1px solid ${C.gold}25`, color: C.gold, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700 }}>Review</button>
                    )}
                    <button onClick={() => deleteMatch(m.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
                  </div>
                </div>
                {/* Review preview */}
                {m.review && (
                  <div style={{ padding: "10px 18px 14px", borderTop: `1px solid ${C.navyBorder}`, background: `${C.gold}05` }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Review</div>
                    {m.review.q1 && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, margin: "0 0 4px" }}>✅ <em>{m.review.q1}</em></p>}
                    {m.review.q2 && <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, margin: 0 }}>🔧 <em>{m.review.q2}</em></p>}
                  </div>
                )}
                {m.notes && (
                  <div style={{ padding: "8px 18px 12px", borderTop: `1px solid ${C.navyBorder}` }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>{m.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  LINEUP BUILDER
// ══════════════════════════════════════════════════
function LineupBuilderSection() {
  const C = useTheme();
  const [lineups, setLineups] = usePersistedState(STORAGE_KEYS.lineups, []);
  const [current, setCurrent, clearCurrentDraft] = useDraftState(DRAFT_KEYS.lineupBuilder, { ...EMPTY_MATCH });
  const [viewMode, setViewMode] = useState("builder");
  const [editingId, setEditingId] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1280);
  const [isDrawFullscreen, setIsDrawFullscreen] = useState(false);

  const formation = FORMATIONS[current.formation];
  const isPhoneLayout = viewportWidth <= 768;
  const isTabletLayout = viewportWidth > 768 && viewportWidth <= 1180;
  const isCompactLayout = isPhoneLayout || isTabletLayout;
  const builderColumns = isPhoneLayout ? "1fr" : isTabletLayout ? "minmax(0, 1.15fr) minmax(340px, 0.85fr)" : "1fr 1fr";
  const builderGap = isPhoneLayout ? 18 : isTabletLayout ? 22 : 24;
  const formColumns = isPhoneLayout ? "1fr" : "1fr 1fr";
  const pitchMaxWidth = isPhoneLayout ? 440 : isTabletLayout ? 720 : "none";
  const pitchAspectRatio = "140%"; // always match SVG viewBox (0 0 100 140)
  const playerBadgeSize = isPhoneLayout ? 36 : isTabletLayout ? 40 : 32;
  const playerRoleSize = isPhoneLayout ? 10 : isTabletLayout ? 11 : 9;
  const playerNameSize = isPhoneLayout ? 8.5 : isTabletLayout ? 9 : 8;
  const playerNameWidth = isPhoneLayout ? 42 : isTabletLayout ? 54 : 36;

  useEffect(() => {
    const syncLayout = () => setViewportWidth(window.innerWidth);
    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, []);

  useEffect(() => {
    if (!isCompactLayout) setIsDrawFullscreen(false);
  }, [isCompactLayout]);

  useEffect(() => {
    if (viewMode !== "builder") setIsDrawFullscreen(false);
  }, [viewMode]);

  useEffect(() => {
    if (!isDrawFullscreen || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawFullscreen]);

  const updatePlayer = (idx, name) => { const p = [...current.players]; p[idx] = name; setCurrent({ ...current, players: p }); };
  const updateSub = (idx, name) => { const s = [...current.subs]; s[idx] = name; setCurrent({ ...current, subs: s }); };
  const addSub = () => { if (current.subs.length >= 9) return; setCurrent({ ...current, subs: [...current.subs, ""] }); };
  const removeSub = (idx) => { const s = [...current.subs]; s.splice(idx, 1); setCurrent({ ...current, subs: s }); };

  const saveLineup = () => {
    if (!current.opponent && !current.date) return;
    if (editingId) {
      setLineups(prev => prev.map(l => l.id === editingId ? stampRecord({ ...current, id: editingId }, l) : l));
      setEditingId(null);
    } else {
      setLineups(prev => [...prev, stampRecord({ ...current, id: Date.now() })]);
    }
    clearCurrentDraft({ ...EMPTY_MATCH });
    setViewMode("saved");
  };

  const loadLineup = (lineup) => { setCurrent({ ...lineup }); setEditingId(lineup.id); setViewMode("builder"); };
  const deleteLineup = (id) => {
    if (!window.confirm("Delete this lineup?")) return;
    setLineups(prev => prev.filter(l => l.id !== id));
  };
  const duplicateLineup = (lineup) => { setLineups(prev => [...prev, stampRecord({ ...lineup, id: Date.now(), date: "", opponent: lineup.opponent + " (copy)" })]); };

  const filled = current.players.filter(p => p?.trim()).length;
  const subCount = current.subs.filter(s => s?.trim()).length;
  const lineupsMeta = readStorageMeta(STORAGE_KEYS.lineups);
  const lineupDraftUpdatedAt = readStorageMeta(DRAFT_KEYS.lineupBuilder)?.updatedAt;

  // Drawing layer state
  const [drawMode, setDrawMode] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const pitchRef = useRef(null);
  const DRAW_STROKE = "rgba(255,90,90,0.95)";
  const ACTIVE_DRAW_STROKE = "rgba(255,160,50,0.9)";

  const getXY = (e) => {
    const rect = pitchRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 140 };
  };
  const getArrowShape = (path) => {
    if (!path || path.length < 2) return null;

    const tip = path[path.length - 1];
    let anchor = path[path.length - 2];

    for (let i = path.length - 2; i >= 0; i -= 1) {
      const candidate = path[i];
      const dx = tip.x - candidate.x;
      const dy = tip.y - candidate.y;
      if (Math.hypot(dx, dy) >= 4) {
        anchor = candidate;
        break;
      }
    }

    const dx = tip.x - anchor.x;
    const dy = tip.y - anchor.y;
    const length = Math.hypot(dx, dy);
    if (!length) return null;

    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    const headLength = 5.2;
    const headWidth = 2.6;
    const shaftEnd = {
      x: tip.x - ux * (headLength * 0.9),
      y: tip.y - uy * (headLength * 0.9),
    };
    const base = {
      x: tip.x - ux * headLength,
      y: tip.y - uy * headLength,
    };
    const left = {
      x: base.x + px * headWidth,
      y: base.y + py * headWidth,
    };
    const right = {
      x: base.x - px * headWidth,
      y: base.y - py * headWidth,
    };

    return {
      shaftPoints: [...path.slice(0, -1), shaftEnd].map((p) => `${p.x},${p.y}`).join(" "),
      headPoints: `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`,
    };
  };
  const onDrawStart = (e) => { if (!drawMode) return; e.preventDefault(); setActivePath([getXY(e)]); };
  const onDrawMove = (e) => { if (!drawMode || !activePath) return; e.preventDefault(); setActivePath(prev => [...prev, getXY(e)]); };
  const onDrawEnd = () => { if (activePath && activePath.length > 1) setDrawPaths(prev => [...prev, activePath]); setActivePath(null); };
  const renderPitchPanel = (fullscreen = false) => (
    <div style={{ width: "100%", maxWidth: fullscreen ? (isTabletLayout ? 860 : 560) : pitchMaxWidth, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <label style={labelStyle}>Formation</label>
          {fullscreen && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>
              Full-screen tactics board
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: isPhoneLayout ? "nowrap" : "wrap", gap: 6, overflowX: isPhoneLayout ? "auto" : "visible", paddingBottom: isPhoneLayout ? 4 : 0 }}>
          {Object.keys(FORMATIONS).map(f => (
            <Pill key={f} active={current.formation === f} onClick={() => setCurrent({ ...current, formation: f })} color={C.electric}>{f}</Pill>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setDrawMode(!drawMode)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: drawMode ? `${C.danger}20` : C.navyCard, border: `1px solid ${drawMode ? C.danger : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: drawMode ? C.danger : C.textMid }}>
          {drawMode ? "Drawing On - Tap Pitch" : "Draw Tactics"}
        </button>
        {isCompactLayout && !fullscreen && (
          <button onClick={() => setIsDrawFullscreen(true)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: `${C.electric}15`, border: `1px solid ${C.electric}30`, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.electric }}>
            {isTabletLayout ? "Expand Pitch" : "Full Screen"}
          </button>
        )}
        {drawPaths.length > 0 && (
          <button onClick={() => { setDrawPaths(prev => prev.slice(0, -1)); }} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMid }}>Undo</button>
        )}
        {drawPaths.length > 0 && (
          <button onClick={() => setDrawPaths([])} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>Clear</button>
        )}
      </div>

      <div ref={pitchRef}
        onMouseDown={onDrawStart} onMouseMove={onDrawMove} onMouseUp={onDrawEnd} onMouseLeave={onDrawEnd}
        onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}
        style={{
          position: "relative",
          width: "100%",
          ...(fullscreen
            ? { aspectRatio: "100/140", maxHeight: isTabletLayout ? "calc(100vh - 210px)" : "calc(100vh - 220px)", minHeight: isTabletLayout ? 400 : 320 }
            : { paddingBottom: pitchAspectRatio }),
          background: "linear-gradient(180deg, #0a4a0a 0%, #0d5a0d 50%, #0a4a0a 100%)",
          borderRadius: 14,
          border: `2px solid ${drawMode ? C.danger : C.navyBorder}`,
          overflow: "hidden",
          cursor: drawMode ? "crosshair" : "default",
          userSelect: "none",
          touchAction: drawMode ? "none" : "auto",
          boxShadow: fullscreen || isCompactLayout ? "0 10px 30px rgba(0,0,0,0.22)" : "none",
        }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 140" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="140" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <rect x="25" y="0" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <rect x="35" y="0" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
          <rect x="25" y="120" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <rect x="35" y="130" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
          {drawPaths.map((path, pi) => {
            const arrow = getArrowShape(path);
            if (!arrow) return null;
            return (
              <g key={pi}>
                <polyline points={arrow.shaftPoints} fill="none" stroke={DRAW_STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points={arrow.headPoints} fill={DRAW_STROKE} />
              </g>
            );
          })}
          {activePath && (() => {
            const arrow = getArrowShape(activePath);
            if (!arrow) return null;
            return (
              <g>
                <polyline points={arrow.shaftPoints} fill="none" stroke={ACTIVE_DRAW_STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points={arrow.headPoints} fill={ACTIVE_DRAW_STROKE} />
              </g>
            );
          })()}
        </svg>
        {formation.positions.map((pos, idx) => (
          <div key={idx} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 1 }}>
            <div style={{
              width: fullscreen ? (isTabletLayout ? 44 : 40) : playerBadgeSize,
              height: fullscreen ? (isTabletLayout ? 44 : 40) : playerBadgeSize,
              borderRadius: "50%",
              margin: "0 auto 3px",
              background: current.players[idx]?.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : "rgba(0,0,0,0.52)",
              border: `2px solid ${current.players[idx]?.trim() ? C.gold : "rgba(255,255,255,0.55)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fullscreen ? (isTabletLayout ? 12 : 11) : playerRoleSize,
              fontFamily: FONT_HEAD,
              color: current.players[idx]?.trim() ? C.navy : "rgba(255,255,255,0.95)",
              letterSpacing: 0.5,
            }}>{pos.role}</div>
            <div style={{ fontSize: fullscreen ? (isTabletLayout ? 9.5 : 9) : playerNameSize, fontFamily: FONT_BODY, color: "rgba(255,255,255,0.7)", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)", maxWidth: fullscreen ? (isTabletLayout ? 68 : 52) : playerNameWidth, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {current.players[idx]?.trim() || ""}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 8, textAlign: "center" }}>
        {fullscreen ? "Draw with more room, then tap Close to return." : `${filled}/11 starters | ${subCount} subs`}
      </p>
    </div>
  );

  return (
    <section style={{ padding: isPhoneLayout ? "88px 16px 64px" : isTabletLayout ? "92px 20px 72px" : "100px 24px 80px", maxWidth: isTabletLayout ? 1120 : 1000, margin: "0 auto" }}>
      <SectionHeader icon="" title="LINEUP BUILDER" subtitle="Plan formations, assign positions, and save match lineups." accent={C.electric} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "-20px 0 20px", fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
        <span>Last updated {formatDateTime(lineupsMeta?.updatedAt)}</span>
        <span>Autosave draft {lineupDraftUpdatedAt ? `active · ${formatDateTime(lineupDraftUpdatedAt)}` : "inactive"}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <Pill active={viewMode === "builder"} onClick={() => setViewMode("builder")} color={C.electric}>Builder</Pill>
        <Pill active={viewMode === "saved"} onClick={() => setViewMode("saved")} color={C.electric}>Saved ({lineups.length})</Pill>
      </div>

      {viewMode === "builder" && (
        <div style={{ display: "grid", gridTemplateColumns: builderColumns, gap: builderGap, alignItems: "start" }}>
          {/* Left: Pitch */}
          {!(isCompactLayout && isDrawFullscreen) && (
          <div style={{ width: "100%", maxWidth: pitchMaxWidth, margin: isPhoneLayout ? "0 auto" : 0 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Formation</label>
              <div style={{ display: "flex", flexWrap: isPhoneLayout ? "nowrap" : "wrap", gap: 6, overflowX: isPhoneLayout ? "auto" : "visible", paddingBottom: isPhoneLayout ? 4 : 0 }}>
                {Object.keys(FORMATIONS).map(f => (
                  <Pill key={f} active={current.formation === f} onClick={() => setCurrent({ ...current, formation: f })} color={C.electric}>{f}</Pill>
                ))}
              </div>
            </div>

            {/* Draw mode controls */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => setDrawMode(!drawMode)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: drawMode ? `${C.danger}20` : C.navyCard, border: `1px solid ${drawMode ? C.danger : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: drawMode ? C.danger : C.textMid }}>
                {drawMode ? "Drawing Active" : "Draw Tactics"}
              </button>
              {isCompactLayout && (
                <button onClick={() => setIsDrawFullscreen(true)} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: `${C.electric}15`, border: `1px solid ${C.electric}30`, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.electric }}>
                  {isTabletLayout ? "Expand Pitch" : "Full Screen"}
                </button>
              )}
              {drawPaths.length > 0 && (
                <button onClick={() => { setDrawPaths(prev => prev.slice(0, -1)); }} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMid }}>Undo</button>
              )}
              {drawPaths.length > 0 && (
                <button onClick={() => setDrawPaths([])} style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>Clear</button>
              )}
            </div>

            {/* Pitch */}
            <div ref={pitchRef}
              onMouseDown={onDrawStart} onMouseMove={onDrawMove} onMouseUp={onDrawEnd} onMouseLeave={onDrawEnd}
              onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}
              style={{ position: "relative", width: "100%", paddingBottom: pitchAspectRatio, background: "linear-gradient(180deg, #0a4a0a 0%, #0d5a0d 50%, #0a4a0a 100%)", borderRadius: 14, border: `2px solid ${drawMode ? C.danger : C.navyBorder}`, overflow: "hidden", cursor: drawMode ? "crosshair" : "default", userSelect: "none", touchAction: drawMode ? "none" : "auto", boxShadow: isCompactLayout ? "0 10px 30px rgba(0,0,0,0.22)" : "none" }}>
              {/* Pitch markings + drawing layer */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 140" preserveAspectRatio="none">
                <rect x="0" y="0" width="100" height="140" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <rect x="25" y="0" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="0" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
                <rect x="25" y="120" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="130" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
                {/* Drawn tactical paths */}
                {drawPaths.map((path, pi) => {
                  const arrow = getArrowShape(path);
                  if (!arrow) return null;
                  return (
                    <g key={pi}>
                      <polyline points={arrow.shaftPoints} fill="none" stroke={DRAW_STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <polygon points={arrow.headPoints} fill={DRAW_STROKE} />
                    </g>
                  );
                })}
                {activePath && (() => {
                  const arrow = getArrowShape(activePath);
                  if (!arrow) return null;
                  return (
                    <g>
                      <polyline points={arrow.shaftPoints} fill="none" stroke={ACTIVE_DRAW_STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <polygon points={arrow.headPoints} fill={ACTIVE_DRAW_STROKE} />
                    </g>
                  );
                })()}
              </svg>
              {formation.positions.map((pos, idx) => (
                <div key={idx} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 1 }}>
                  <div style={{
                    width: playerBadgeSize, height: playerBadgeSize, borderRadius: "50%", margin: "0 auto 3px",
                    background: current.players[idx]?.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : "rgba(255,255,255,0.15)",
                    border: `2px solid ${current.players[idx]?.trim() ? C.gold : "rgba(255,255,255,0.3)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: playerRoleSize, fontFamily: FONT_HEAD, color: current.players[idx]?.trim() ? C.navy : "rgba(255,255,255,0.6)",
                    letterSpacing: 0.5,
                  }}>{pos.role}</div>
                  <div style={{ fontSize: playerNameSize, fontFamily: FONT_BODY, color: "rgba(255,255,255,0.7)", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)", maxWidth: playerNameWidth, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {current.players[idx]?.trim() || ""}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 8, textAlign: "center" }}>{filled}/11 starters · {subCount} subs</p>
          </div>
          )}

          {/* Right: Form */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: formColumns, gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Opponent</label><input value={current.opponent} onChange={e => setCurrent({ ...current, opponent: e.target.value })} placeholder="vs School Name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Date</label><input type="date" value={current.date} onChange={e => setCurrent({ ...current, date: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Competition</label><input value={current.competition} onChange={e => setCurrent({ ...current, competition: e.target.value })} placeholder="National Schools" style={inputStyle} /></div>
              <div><label style={labelStyle}>Venue</label><input value={current.venue} onChange={e => setCurrent({ ...current, venue: e.target.value })} placeholder="Home / Away" style={inputStyle} /></div>
            </div>

            <label style={labelStyle}>Starting 11</label>
            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              {formation.positions.map((pos, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.gold, width: 36, textAlign: "right", letterSpacing: 0.5 }}>{pos.role}</span>
                  <input value={current.players[idx] || ""} onChange={e => updatePlayer(idx, e.target.value)} placeholder={`${pos.role} name`} style={{ ...inputStyle, flex: 1 }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={labelStyle}>Substitutes</label>
              <button onClick={addSub} style={{ background: "none", border: `1px solid ${C.navyBorder}`, color: C.textMid, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: FONT_BODY }}>+ Add Sub</button>
            </div>
            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              {current.subs.map((sub, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={sub} onChange={e => updateSub(idx, e.target.value)} placeholder={`Sub ${idx + 1}`} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => removeSub(idx)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 16, opacity: 0.6 }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Coach's Notes</label>
              <textarea value={current.notes} onChange={e => setCurrent({ ...current, notes: e.target.value })} placeholder="Tactical instructions, key matchups..." style={{ ...inputStyle, height: 70, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 16, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
              Draft autosaves on this device. Updated {formatDateTime(lineupDraftUpdatedAt)}.
            </div>

            <GoldButton onClick={saveLineup} style={{ width: "100%" }}>
              {editingId ? "Update Lineup ✓" : "Save Lineup ✓"}
            </GoldButton>
          </div>
        </div>
      )}

      {viewMode === "builder" && isCompactLayout && isDrawFullscreen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: C.navy === "#000000" ? "rgba(5,15,30,0.98)" : `${C.navy}F9`, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 14px calc(env(safe-area-inset-bottom, 0px) + 80px)", overflowY: "auto" }}>
          <div style={{ width: "100%", maxWidth: isTabletLayout ? 920 : 620, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 1 }}>TACTICS BOARD</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>Draw with more room, then tap Close to return.</div>
              </div>
            </div>
            {renderPitchPanel(true)}
          </div>
        </div>
      )}
      {/* Persistent floating close — always reachable regardless of scroll position */}
      {viewMode === "builder" && isCompactLayout && isDrawFullscreen && (
        <button
          onClick={() => setIsDrawFullscreen(false)}
          style={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1400,
            padding: "12px 32px",
            borderRadius: 999,
            cursor: "pointer",
            background: C.textBright,
            border: "none",
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 700,
            color: C.navy,
            letterSpacing: "0.06em",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          ✕ Close
        </button>
      )}

      {viewMode === "saved" && (
        <>
          {lineups.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
              <p style={{ fontFamily: FONT_BODY, color: C.textDim }}>No lineups saved yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {lineups.slice().reverse().map(lineup => {
                const filled = lineup.players.filter(p => (p || "").trim()).length;
                const subCount = lineup.subs.filter(s => (s || "").trim()).length;
                return <LineupCard key={lineup.id} lineup={lineup} filled={filled} subCount={subCount} onEdit={() => loadLineup(lineup)} onDuplicate={() => duplicateLineup(lineup)} onDelete={() => deleteLineup(lineup.id)} />;
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  TEAM HUB sub-components
// ══════════════════════════════════════════════════
function PositionFinder() {
  const C = useTheme();
  const [answers, setAnswers] = useState({});
  const questions = [
    { id: "speed", q: "How would you describe your pace?", opts: ["Very fast", "Good pace", "Average", "Slow but strong"] },
    { id: "build", q: "What's your physical build?", opts: ["Tall and strong", "Small and agile", "Average build", "Big and powerful"] },
    { id: "role", q: "What do you enjoy most in a game?", opts: ["Scoring goals", "Creating chances", "Breaking up play", "Organising defence"] },
    { id: "foot", q: "Are you comfortable with both feet?", opts: ["Yes, both feet", "Mainly right foot", "Mainly left foot", "Working on it"] },
    { id: "shoot", q: "Do you prefer scoring or keeping clean sheets?", opts: ["I love scoring", "I prefer assists", "Winning the ball back", "I prefer keeping clean sheets"] },
  ];
  const allAnswered = questions.every(q => answers[q.id]);
  const getPosition = () => {
    if (!allAnswered) return null;
    if (answers.shoot === "I prefer keeping clean sheets") return { pos: "Goalkeeper", desc: "The last line of defence and the first line of attack.", icon: "🧤" };
    if (answers.role === "Organising defence" && answers.build === "Tall and strong") return { pos: "Centre Back", desc: "Dominance in the air, leadership at the back.", icon: "🏔️" };
    if (answers.speed === "Very fast" && answers.role !== "Organising defence") return { pos: "Wide Forward / Winger", desc: "Your pace is your weapon. Get behind defenders and create.", icon: "⚡" };
    if (answers.role === "Scoring goals" && answers.speed !== "Slow but strong") return { pos: "Striker", desc: "Live in the box. Movement, timing, and clinical finishing.", icon: "🎯" };
    if (answers.role === "Creating chances") return { pos: "Attacking Midfielder (CAM)", desc: "The conductor. Vision and creativity are your superpowers.", icon: "🎩" };
    if (answers.role === "Breaking up play") return { pos: "Defensive Midfielder (CDM)", desc: "The shield. Protect the defence and start attacks.", icon: "🛡️" };
    return { pos: "Central Midfielder (Box-to-Box)", desc: "All-rounders like Bellingham cover every blade of grass.", icon: "🔄" };
  };
  const result = getPosition();
  return (
    <div>
      <div style={{ display: "grid", gap: 14 }}>
        {questions.map(q => (
          <div key={q.id}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textBright, margin: "0 0 8px", fontWeight: 600 }}>{q.q}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {q.opts.map(opt => (
                <Pill key={opt} active={answers[q.id] === opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })} color={C.electric}>{opt}</Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
      {result && (
        <div style={{ marginTop: 20, padding: 20, borderRadius: 14, background: `${C.gold}08`, border: `1px solid ${C.gold}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>{result.icon}</span>
            <h4 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.gold, margin: 0, letterSpacing: 1 }}>{result.pos.toUpperCase()}</h4>
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginTop: 10, lineHeight: 1.5 }}>{result.desc}</p>
        </div>
      )}
    </div>
  );
}

function KitChecklist() {
  const C = useTheme();
  const [checked, setChecked] = usePersistedState(STORAGE_KEYS.checklist, {});
  const items = [
    { name: "Football boots (firm ground)", essential: true },
    { name: "Shin guards", essential: true },
    { name: "Training shorts & jersey", essential: true },
    { name: "Water bottle (1L minimum)", essential: true },
    { name: "Long socks (over shin guards)", essential: true },
    { name: "Towel & change of clothes", essential: false },
    { name: "Resistance band", essential: false },
    { name: "Foam roller (travel size)", essential: false },
  ];
  const toggle = (idx) => setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  const checkedCount = items.filter((_, i) => checked[i]).length;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>{checkedCount}/{items.length} packed</span>
        {checkedCount === items.length && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.success, fontWeight: 700 }}>✓ All packed!</span>}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {items.map((item, idx) => (
          <button key={idx} onClick={() => toggle(idx)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 8, cursor: "pointer", border: "none", textAlign: "left", width: "100%",
            background: checked[idx] ? `${C.success}08` : C.surfaceSubtle, transition: "all 0.2s",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              background: checked[idx] ? C.success : C.navyCard, border: checked[idx] ? "none" : `1px solid ${C.navyBorder}`,
              color: C.navy, fontSize: 12, flexShrink: 0,
            }}>{checked[idx] ? "✓" : ""}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: checked[idx] ? C.success : C.textMid, textDecoration: checked[idx] ? "line-through" : "none", opacity: checked[idx] ? 0.7 : 1 }}>{item.name}</span>
            {item.essential && <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${C.danger}08`, color: C.danger, fontFamily: FONT_BODY, fontWeight: 700, border: `1px solid ${C.danger}15` }}>ESSENTIAL</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecoveryZone() {
  const C = useTheme();
  const [activeStretch, setActiveStretch] = useState(null);
  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 6px", letterSpacing: 1 }}>POST-TRAINING STRETCHING</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 16px" }}>Tap each stretch for instructions. Hold — no bouncing!</p>
        <div style={{ display: "grid", gap: 6 }}>
          {RECOVERY_STRETCHES.map((s, idx) => (
            <div key={idx}>
              <button onClick={() => setActiveStretch(activeStretch === idx ? null : idx)} style={{
                width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                background: activeStretch === idx ? `${C.success}08` : C.surfaceSubtle,
                border: `1px solid ${activeStretch === idx ? C.success + "30" : C.navyBorder}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{s.muscle} · {s.duration}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.textDim, transform: activeStretch === idx ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▼</span>
              </button>
              {activeStretch === idx && (
                <div style={{ padding: "12px 16px 12px 52px", background: `${C.success}05`, borderRadius: "0 0 10px 10px", borderLeft: `3px solid ${C.success}30` }}>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.6 }}><strong>How:</strong> {s.how}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 6px", letterSpacing: 1 }}>SLEEP = SUPERPOWER</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 16px" }}>Cristiano Ronaldo sleeps 5 naps a day. You don't need that — but sleep matters more than you think.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {SLEEP_TIPS.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: C.surfaceSubtle, borderRadius: 10 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{tip.tip}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FootballIQQuiz() {
  const C = useTheme();
  const [quizState, setQuizState] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [bestScore, setBestScore] = usePersistedState(STORAGE_KEYS.quizScores, 0);

  const startQuiz = () => { setQuizState("playing"); setCurrentQ(0); setScore(0); setAnswers([]); setSelected(null); setShowAnswer(false); };

  const selectAnswer = (idx) => {
    if (showAnswer) return;
    setSelected(idx);
    setShowAnswer(true);
    if (idx === QUIZ_QUESTIONS[currentQ].correct) setScore(s => s + 1);
    setAnswers(a => [...a, { qIdx: currentQ, selected: idx, correct: idx === QUIZ_QUESTIONS[currentQ].correct }]);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= QUIZ_QUESTIONS.length) {
      const finalScore = answers.filter(a => a.correct).length + (selected === QUIZ_QUESTIONS[currentQ].correct ? 1 : 0);
      if (finalScore > bestScore) setBestScore(finalScore);
      setQuizState("results");
    } else {
      setCurrentQ(c => c + 1); setSelected(null); setShowAnswer(false);
    }
  };

  if (quizState === "intro") return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <h3 style={{ fontFamily: FONT_HEAD, fontSize: 32, color: C.textBright, margin: "0 0 8px", letterSpacing: 2 }}>FOOTBALL IQ QUIZ</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: "0 0 6px", lineHeight: 1.5 }}>{QUIZ_QUESTIONS.length} questions on tactics, rules, nutrition, and Singapore football history.</p>
      {bestScore > 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 700, margin: "0 0 16px" }}>Best score: {bestScore}/{QUIZ_QUESTIONS.length}</p>}
      <GoldButton onClick={startQuiz} style={{ marginTop: 24 }}>Start Quiz</GoldButton>
    </Card>
  );

  if (quizState === "results") {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const grade = pct >= 90 ? { label: "Elite Understanding", color: C.success } :
                  pct >= 70 ? { label: "Strong Understanding", color: C.electric } :
                  pct >= 50 ? { label: "Developing Understanding", color: C.orange } :
                              { label: "Review Required", color: C.danger };
    return (
      <Card style={{ textAlign: "center" }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textBright, margin: "0 0 8px", letterSpacing: 2 }}>ASSESSMENT COMPLETE</h3>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 56, color: grade.color, margin: "8px 0" }}>{score}/{QUIZ_QUESTIONS.length}</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: grade.color, fontWeight: 700, margin: "0 0 4px" }}>{grade.label}</p>
        <div style={{ textAlign: "left", margin: "24px 0", display: "grid", gap: 6, maxHeight: 300, overflowY: "auto" }}>
          {answers.map((a, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: a.correct ? `${C.success}06` : `${C.danger}06`, border: `1px solid ${a.correct ? C.success : C.danger}20` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textBright, fontWeight: 600, marginBottom: 2 }}>{a.correct ? "✓" : "✗"} Q{i+1}: {QUIZ_QUESTIONS[a.qIdx].q}</div>
              {!a.correct && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid }}>{QUIZ_QUESTIONS[a.qIdx].explain}</div>}
            </div>
          ))}
        </div>
        <GoldButton onClick={startQuiz}>Retake Assessment</GoldButton>
      </Card>
    );
  }

  const q = QUIZ_QUESTIONS[currentQ];
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Q {currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.success, fontWeight: 700 }}>Score: {score}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.navyBorder, marginBottom: 20 }}>
        <div style={{ height: "100%", borderRadius: 2, background: C.gold, width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <h3 style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textBright, margin: "0 0 18px", lineHeight: 1.5, fontWeight: 600 }}>{q.q}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {q.opts.map((opt, idx) => {
          let bg = C.surfaceSubtle, border = `1px solid ${C.navyBorder}`, color = C.textMid;
          if (showAnswer) {
            if (idx === q.correct) { bg = `${C.success}12`; border = `1px solid ${C.success}40`; color = C.success; }
            else if (idx === selected && idx !== q.correct) { bg = `${C.danger}08`; border = `1px solid ${C.danger}30`; color = C.danger; }
          } else if (idx === selected) { bg = `${C.electric}10`; border = `1px solid ${C.electric}40`; color = C.electric; }
          return (
            <button key={idx} onClick={() => selectAnswer(idx)} style={{ padding: "13px 18px", borderRadius: 10, cursor: showAnswer ? "default" : "pointer", background: bg, border, textAlign: "left", fontFamily: FONT_BODY, fontSize: 14, color, fontWeight: 500, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.navyBorder, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {showAnswer && (
        <div>
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: selected === q.correct ? `${C.success}06` : `${C.danger}06`, borderLeft: `3px solid ${selected === q.correct ? C.success : C.danger}` }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{selected === q.correct ? "Correct. " : "Review this. "}{q.explain}</p>
          </div>
          <GoldButton onClick={nextQuestion} style={{ marginTop: 14, width: "100%" }}>{currentQ + 1 >= QUIZ_QUESTIONS.length ? "View Results" : "Continue"}</GoldButton>
        </div>
      )}
    </Card>
  );
}

function GoalWall() {
  const C = useTheme();
  const [goals, setGoals] = usePersistedState(STORAGE_KEYS.goals, []);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("smart"); // "quick" | "smart"
  const exportRef = useRef(null);

  // Quick goal form
  const emptyQuick = { text: "", cat: "Technical", deadline: "" };
  const [quick, setQuick] = useState(emptyQuick);

  // SMART goal form
  const emptySmart = { cat: "Technical", specific: "", measurable: "", actionStep: "", deadline: "", checkIn: "" };
  const [smart, setSmart] = useState(emptySmart);
  const [smartStep, setSmartStep] = useState(0); // 0-4 guided steps

  const SMART_STEPS = [
    { key: "specific",    label: "Specific",    question: "What EXACTLY do you want to achieve?",           placeholder: "e.g. Score in every B Div match this term", hint: "Be as precise as possible. Vague goals don't get done." },
    { key: "measurable",  label: "Measurable",  question: "How will you KNOW when you've achieved it?",     placeholder: "e.g. Check match stats after each game", hint: "If you can't measure it, you can't track progress." },
    { key: "actionStep",  label: "Action step", question: "What's the FIRST concrete thing you'll do?",     placeholder: "e.g. Add 20 mins of finishing drills after every training", hint: "Start with one action. One is enough." },
    { key: "deadline",    label: "Deadline",    question: "When do you want to achieve this by?",           placeholder: "", hint: "A goal without a deadline is just a wish.", type: "date" },
    { key: "checkIn",     label: "Check-in",    question: "When will you review your progress mid-way?",    placeholder: "", hint: "Book a check-in with yourself. Put it in your calendar.", type: "date" },
  ];

  const toggleGoal = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  const deleteGoal = (id) => {
    if (!window.confirm("Delete this goal?")) return;
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addQuick = () => {
    if (!quick.text.trim()) return;
    setGoals(prev => [...prev, { ...quick, id: Date.now(), done: false, isSmart: false }]);
    setQuick(emptyQuick);
    setShowForm(false);
  };

  const addSmart = () => {
    if (!smart.specific.trim()) return;
    setGoals(prev => [...prev, { ...smart, id: Date.now(), done: false, isSmart: true }]);
    setSmart(emptySmart);
    setSmartStep(0);
    setShowForm(false);
  };

  const catColors = { Technical: C.electric, Physical: C.danger, Mental: C.gold, Teamwork: C.success };

  const active    = goals.filter(g => !g.done);
  const completed = goals.filter(g => g.done);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>GOALS</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, margin: 0 }}>{completed.length}/{goals.length} completed</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {goals.length > 0 && <ShareSaveBar targetRef={exportRef} filename="gameplan-goals.png" title="GamePlan Goals" />}
          <GoldButton onClick={() => { setShowForm(!showForm); setSmartStep(0); }} secondary={showForm}>{showForm ? "Cancel" : "Set Goal"}</GoldButton>
        </div>
      </div>

      {/* Goal form */}
      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[{ id: "smart", label: "SMART Goal", desc: "Guided 5-step framework" }, { id: "quick", label: "Quick Goal", desc: "One line, fast" }].map(m => (
              <button key={m.id} onClick={() => { setFormMode(m.id); setSmartStep(0); }} style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: formMode === m.id ? `${C.gold}15` : C.surfaceSubtle,
                border: `1px solid ${formMode === m.id ? C.gold + "50" : C.navyBorder}`,
                fontFamily: FONT_BODY, color: formMode === m.id ? C.gold : C.textDim,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Category (both modes) */}
          <div style={{ marginBottom: 16 }}>
            <label style={makeLabelStyle(C)}>Category</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {GOAL_CATEGORIES.map(c => (
                <button key={c.cat} onClick={() => formMode === "smart" ? setSmart(p => ({ ...p, cat: c.cat })) : setQuick(p => ({ ...p, cat: c.cat }))}
                  style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                    background: (formMode === "smart" ? smart : quick).cat === c.cat ? catColors[c.cat] : C.navyCard,
                    color: (formMode === "smart" ? smart : quick).cat === c.cat ? C.navyDeep : C.textMid,
                    border: `1px solid ${(formMode === "smart" ? smart : quick).cat === c.cat ? catColors[c.cat] : C.navyBorder}`,
                  }}>{c.icon} {c.cat}</button>
              ))}
            </div>
          </div>

          {/* QUICK mode */}
          {formMode === "quick" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={makeLabelStyle(C)}>Goal</label>
                <input value={quick.text} onChange={e => setQuick(p => ({ ...p, text: e.target.value }))} placeholder="e.g. Master the Cruyff turn" style={makeInputStyle(C)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={makeLabelStyle(C)}>Deadline (optional)</label>
                <input type="date" value={quick.deadline} onChange={e => setQuick(p => ({ ...p, deadline: e.target.value }))} style={makeInputStyle(C)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...makeLabelStyle(C), marginBottom: 8 }}>Examples</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {GOAL_CATEGORIES.find(c => c.cat === quick.cat)?.examples.map(ex => (
                    <button key={ex} onClick={() => setQuick(p => ({ ...p, text: ex }))} style={{ fontFamily: FONT_BODY, fontSize: 11, padding: "4px 10px", borderRadius: 6, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textMid, cursor: "pointer" }}>{ex}</button>
                  ))}
                </div>
              </div>
              <GoldButton onClick={addQuick} style={{ width: "100%" }}>Save Goal</GoldButton>
            </>
          )}

          {/* SMART mode — step-through */}
          {formMode === "smart" && (
            <>
              {/* Step indicator */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {SMART_STEPS.map((s, i) => (
                  <div key={i} onClick={() => i < smartStep + 1 && setSmartStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: i <= smartStep ? "pointer" : "default",
                    background: i < smartStep ? C.success : i === smartStep ? C.gold : C.navyBorder, transition: "background 0.3s" }} />
                ))}
              </div>

              {/* Current step */}
              {(() => {
                const step = SMART_STEPS[smartStep];
                return (
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.gold, background: `${C.gold}15`, padding: "3px 10px", borderRadius: 5, fontWeight: 700 }}>Step {smartStep + 1} of {SMART_STEPS.length} — {step.label.toUpperCase()}</span>
                    </div>
                    <p style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 0.5, marginBottom: 12 }}>{step.question}</p>
                    {step.type === "date"
                      ? <input type="date" value={smart[step.key]} onChange={e => setSmart(p => ({ ...p, [step.key]: e.target.value }))} style={makeInputStyle(C)} />
                      : <textarea value={smart[step.key]} onChange={e => setSmart(p => ({ ...p, [step.key]: e.target.value }))} placeholder={step.placeholder} style={{ ...makeInputStyle(C), height: 70, resize: "vertical" }} />
                    }
                    <p style={{ fontFamily: FONT_SERIF, fontSize: 12, color: C.textDim, fontStyle: "italic", marginTop: 8 }}>{step.hint}</p>

                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      {smartStep > 0 && (
                        <button onClick={() => setSmartStep(s => s - 1)} style={{ padding: "10px 18px", borderRadius: 10, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.textMid, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>Back</button>
                      )}
                      {smartStep < SMART_STEPS.length - 1
                        ? <GoldButton onClick={() => setSmartStep(s => s + 1)} style={{ flex: 1 }}>Continue</GoldButton>
                        : <GoldButton onClick={addSmart} style={{ flex: 1 }}>Save SMART Goal</GoldButton>
                      }
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </Card>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No goals set yet.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Tap "Set a Goal" and use the SMART framework — it takes 2 minutes and makes the goal 3× more likely to happen.</p>
        </div>
      )}

      {/* Goal list */}
      {goals.length > 0 && (
        <div ref={exportRef} style={{ background: C.navy, borderRadius: 12, padding: "4px 0" }}>
          {/* Active goals */}
          {active.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: completed.length > 0 ? 20 : 0 }}>
              {active.map(goal => (
                <div key={goal.id} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 14, overflow: "hidden", borderLeft: `4px solid ${catColors[goal.cat] || C.gold}` }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px" }}>
                    <button onClick={() => toggleGoal(goal.id)} style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `2px solid ${C.navyBorder}`, cursor: "pointer", marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, fontWeight: 600, lineHeight: 1.5 }}>
                        {goal.isSmart ? goal.specific : goal.text}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: catColors[goal.cat], fontWeight: 700 }}>{goal.cat}</span>
                        {goal.isSmart && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.gold, background: `${C.gold}15`, padding: "1px 7px", borderRadius: 4, fontWeight: 700 }}>SMART</span>}
                        {goal.deadline && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim }}>· Due {goal.deadline}</span>}
                        {goal.checkIn && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.electric }}>· Check-in {goal.checkIn}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4, flexShrink: 0 }}>✕</button>
                  </div>
                  {/* SMART details */}
                  {goal.isSmart && (goal.measurable || goal.actionStep) && (
                    <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {goal.measurable && (
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, background: C.surfaceSubtle, borderRadius: 8, padding: "8px 12px" }}>
                          <span style={{ color: C.electric, fontWeight: 700 }}>📏 Measure: </span>{goal.measurable}
                        </div>
                      )}
                      {goal.actionStep && (
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, background: C.surfaceSubtle, borderRadius: 8, padding: "8px 12px" }}>
                          <span style={{ color: C.success, fontWeight: 700 }}>First step: </span>{goal.actionStep}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed goals */}
          {completed.length > 0 && (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>✅ Completed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {completed.map(goal => (
                  <div key={goal.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: C.navyCard, border: `1px solid ${C.success}20`, borderRadius: 12, borderLeft: `3px solid ${C.success}`, opacity: 0.65 }}>
                    <button onClick={() => toggleGoal(goal.id)} style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.success, border: "none", color: C.navyDeep, fontSize: 13, cursor: "pointer", fontWeight: 900 }}>✓</button>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textDim, textDecoration: "line-through" }}>{goal.isSmart ? goal.specific : goal.text}</span>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HubOverview({ setHubTab }) {
  const C = useTheme();
  const cards = [
    { id: "schedule", title: "CCA Schedule", desc: "Training dates, match fixtures and important dates.", icon: "📅", color: C.electric },
    { id: "recovery", title: "Recovery Zone", desc: "Stretching, foam rolling, sleep tips.", icon: "🧊", color: C.success },
    { id: "quiz", title: "Football IQ Quiz", desc: `${QUIZ_QUESTIONS.length} questions on tactics, rules & SG football.`, icon: "🧠", color: C.gold },
    { id: "goals", title: "Goal Wall", desc: "Set personal goals. Track them. Crush them.", icon: "🎯", color: C.danger },
    { id: "attendance", title: "Cluster Attendance", desc: "Take attendance for all cluster schools. One tap per player.", icon: "📋", color: C.orange },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 32 }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => setHubTab(card.id)} style={{
            background: C.navyCard, border: `1px solid ${C.navyBorder}`,
            borderRadius: 14, padding: 22, textAlign: "left", cursor: "pointer",
            transition: "all 0.25s", borderTop: `3px solid ${card.color}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <span style={{ fontSize: 32, display: "block", marginBottom: 14 }}>{card.icon}</span>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, color: C.textBright, margin: "0 0 8px", letterSpacing: 0.5 }}>{card.title.toUpperCase()}</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
            <span style={{ display: "inline-block", marginTop: 14, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: card.color }}>Open →</span>
          </button>
        ))}
      </div>
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 6px", letterSpacing: 1 }}>🗺️ POSITION FINDER</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 18px" }}>Not sure where you fit best? Answer these questions:</p>
        <PositionFinder />
      </Card>
      <Card>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>🎒 KIT CHECKLIST</h3>
        <KitChecklist />
      </Card>
    </>
  );
}

function ScheduleCard() {
  const C = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "Training" | "Match" | "B Div" | "C Div"
  const [showEditUnlock, setShowEditUnlock] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [teacherEditUnlocked, setTeacherEditUnlocked] = useState(() => {
    try { return sessionStorage.getItem(ATTENDANCE_TEACHER_SESSION_KEY) === "true"; }
    catch { return false; }
  });

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScheduleEntries();
      setSessions(data);
      setLastFetched(new Date());
    } catch (e) {
      setError("Could not load schedule. Make sure the sheet is public and you're online.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const today = new Date().toISOString().split("T")[0];

  const typeColor = (type) => ({
    Training: C.success, Match: C.gold, Friendly: C.orange, Other: C.electric,
  }[type] || C.electric);

  const divColor = (div) => ({
    "B Div": C.gold, "C Div": C.success,
  }[div] || C.textDim);

  const isUpcoming = (date) => date >= today;
  const isToday    = (date) => date === today;

  const filtered = sessions.filter(s => {
    if (filter === "all") return true;
    if (filter === "Training" || filter === "Match") return s.type === filter;
    if (filter === "B Div" || filter === "C Div") return s.division === filter;
    return true;
  });

  // Split into upcoming and past
  const upcoming = filtered.filter(s => isUpcoming(s.date));
  const past     = filtered.filter(s => !isUpcoming(s.date)).slice(-5).reverse(); // last 5 past

  const unlockScheduleEdit = (e) => {
    e.preventDefault();
    if (editPassword === ATTENDANCE_TEACHER_PASSWORD) {
      try { sessionStorage.setItem(ATTENDANCE_TEACHER_SESSION_KEY, "true"); } catch {}
      setTeacherEditUnlocked(true);
      setShowEditUnlock(false);
      setEditPassword("");
      setEditError("");
      return;
    }
    setEditError("Incorrect password. Teacher access only.");
  };

  const relockScheduleEdit = () => {
    try { sessionStorage.removeItem(ATTENDANCE_TEACHER_SESSION_KEY); } catch {}
    setTeacherEditUnlocked(false);
    setShowEditUnlock(false);
    setEditPassword("");
    setEditError("");
  };

  const SessionCard = ({ s, dim = false }) => {
    const tc = typeColor(s.type);
    const todayFlag = isToday(s.date);
    return (
      <div style={{
        background: todayFlag ? `${C.gold}10` : C.navyCard,
        border: `1px solid ${todayFlag ? C.gold + "50" : C.navyBorder}`,
        borderLeft: `4px solid ${tc}`,
        borderRadius: 12, padding: "14px 18px",
        opacity: dim ? 0.55 : 1,
        transition: "all 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          {/* Date block */}
          <div style={{ textAlign: "center", minWidth: 44, flexShrink: 0 }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 22, color: todayFlag ? C.gold : C.textBright, lineHeight: 1 }}>
              {s.date ? new Date(s.date + "T00:00:00").getDate() : "—"}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>
              {s.date ? new Date(s.date + "T00:00:00").toLocaleString("en-SG", { month: "short" }) : ""}
            </div>
          </div>
          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              {todayFlag && <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today</span>}
              {s.type && <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: tc, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.type}</span>}
              {s.division && <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: divColor(s.division), letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.division}</span>}
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 0.5, marginBottom: 4, lineHeight: 1.3 }}>
              {s.title || "—"}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {s.time    && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Time {s.time}</span>}
              {s.teacher && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Staff {s.teacher}</span>}
              {s.venue   && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Venue {s.venue}</span>}
            </div>
            {s.notes && (
              <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, lineHeight: 1.55, borderTop: `1px solid ${C.navyBorder}`, paddingTop: 6 }}>
                {s.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 1 }}>SCHEDULE</div>
          {lastFetched && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!teacherEditUnlocked && (
            <button onClick={() => {
              setShowEditUnlock(v => !v);
              setEditError("");
            }} style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.gold, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
              Teacher Edit
            </button>
          )}
          <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noopener noreferrer"
            style={{ display: teacherEditUnlocked ? "inline-block" : "none", padding: "7px 14px", borderRadius: 999, background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.textDim, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Edit
          </a>
          {teacherEditUnlocked && (
            <button onClick={relockScheduleEdit} style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", background: `${C.gold}12`, border: `1px solid ${C.gold}33`, color: C.gold, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
              Lock Edit
            </button>
          )}
          <button onClick={fetchSchedule} disabled={loading} style={{ padding: "7px 14px", borderRadius: 999, cursor: loading ? "wait" : "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, color: C.textMid, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {showEditUnlock && !teacherEditUnlocked && (
        <form onSubmit={unlockScheduleEdit} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 20, padding: "12px 14px", borderRadius: 12, background: `${C.gold}08`, border: `1px solid ${C.gold}20` }}>
          <input
            type="password"
            value={editPassword}
            onChange={(e) => {
              setEditPassword(e.target.value);
              if (editError) setEditError("");
            }}
            placeholder="Teacher password"
            style={{ ...makeInputStyle(C), width: "min(240px, 100%)", padding: "9px 12px", fontSize: 13, WebkitTextFillColor: C.textBright, caretColor: C.textBright }}
          />
          <button type="submit" style={{ padding: "9px 14px", borderRadius: 999, border: "none", background: C.textBright, color: C.navy, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            Unlock Edit
          </button>
          {editError && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.danger, fontWeight: 700 }}>{editError}</span>}
        </form>
      )}

      {/* Coach tip */}
      <div style={{ display: teacherEditUnlocked ? "block" : "none", background: `${C.gold}08`, border: `1px solid ${C.gold}20`, borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
        💡 <strong style={{ color: C.gold }}>Coach:</strong> Add sessions to the <strong>Schedule</strong> tab in the Google Sheet. Players see updates after tapping Refresh.
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "Training", "Match", "B Div", "C Div"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
            background: filter === f ? C.electric : C.navyCard,
            color: filter === f ? C.navyDeep : C.textMid,
            border: `1px solid ${filter === f ? C.electric : C.navyBorder}`,
          }}>{f === "all" ? "All" : f}</button>
        ))}
      </div>

      {/* States */}
      {loading && <div style={{ textAlign: "center", padding: 40, color: C.textDim, fontFamily: FONT_BODY, fontSize: 13 }}>Fetching schedule…</div>}
{!loading && error && <div style={{ padding: "16px 20px", borderRadius: 12, background: `${C.danger}10`, border: `1px solid ${C.danger}25`, color: C.danger, fontFamily: FONT_BODY, fontSize: 13 }}>{error}</div>}

      {!loading && !error && sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>📭</span>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No sessions in the schedule yet.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6 }}>Check back later for training and match updates.</p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.electric, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Upcoming</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                {upcoming.map((s, i) => <SessionCard key={i} s={s} />)}
              </div>
            </>
          )}
          {/* Past */}
          {past.length > 0 && (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Recent (last 5)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {past.map((s, i) => <SessionCard key={i} s={s} dim />)}
              </div>
            </>
          )}
          {upcoming.length === 0 && past.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: C.textDim, fontFamily: FONT_BODY, fontSize: 13 }}>No sessions match this filter.</div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  CLUSTER ATTENDANCE
// ══════════════════════════════════════════════════

const SCHOOLS = ["NBSS", "Yishun Town Sec", "Chung Cheng High (Yishun)", "Northland Sec", "Other"];
const DIVISIONS = ["B Div", "C Div", ""];

// ── SEED ROSTER (other-school cluster players from 2026 spreadsheets) ──
const SEED_ROSTER = [
  // ── YTSS — B Div ──
  { id: "s01", name: "Hayyan Aaqil Bin Imman Farhan",      school: "Yishun Town Sec",           div: "B Div", year: "", jersey: "", position: "" },
  { id: "s02", name: "Gabriel Goh Xuan Le",                school: "Yishun Town Sec",           div: "B Div", year: "", jersey: "", position: "" },
  { id: "s03", name: "Muhammad Akeem Bin Mohammad Hamza",  school: "Yishun Town Sec",           div: "B Div", year: "", jersey: "", position: "" },
  { id: "s04", name: "Brian Tan Xin Ye",                   school: "Yishun Town Sec",           div: "B Div", year: "", jersey: "", position: "" },
  // ── CCHY — B Div ──
  { id: "s05", name: "Alvern Lee Zheng Yang",              school: "Chung Cheng High (Yishun)", div: "B Div", year: "", jersey: "", position: "" },
  { id: "s06", name: "Muhammad Rifa'ie Anaqi Bin Azmie",  school: "Chung Cheng High (Yishun)", div: "B Div", year: "", jersey: "", position: "" },
  { id: "s07", name: "Joven Ang",                          school: "Chung Cheng High (Yishun)", div: "B Div", year: "", jersey: "", position: "" },
  // ── NSS — B Div ──
  { id: "s08", name: "Muhd Rifat Erdayyan Bin Erzan Eusope", school: "Northland Sec",          div: "B Div", year: "", jersey: "", position: "" },
  { id: "s09", name: "Toh Jia He",                         school: "Northland Sec",             div: "B Div", year: "", jersey: "", position: "" },
  { id: "s10", name: "Renz",                               school: "Northland Sec",             div: "B Div", year: "", jersey: "", position: "" },
  // ── YTSS — C Div ──
  { id: "s11", name: "Kamalagouni Sudeep Krishna",              school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s12", name: "Nikraj Singh Khera",                      school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s22", name: "Firas Ziqri Bin Ahmad Rifa'i",            school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s23", name: "Alex Joshua Iniyan",                      school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s24", name: "Naili Luthfi Bin Muhammad Dafir",         school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s25", name: "Bastinraj Chris Antony",                  school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  // ── CCHY — C Div ──
  { id: "s13", name: "Chaziel Chan",                            school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s14", name: "Tok Jun Heng Kyden",                      school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s15", name: "Zavier Lee Zhen Hao",                     school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s16", name: "Nyeden Lim Zhi Xuan",                     school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s17", name: "Goh Zhuo Hung Jairus",                    school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s26", name: "Frank Chia Wei Cheng",                    school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  // ── NSS — C Div ──
  { id: "s18", name: "Muhammad Ainuddin Bin Azzri",             school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s19", name: "Muhammad Shafiy Ukail Bin Ollie Hykel",   school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s20", name: "Sivaneswaran S/O K Kaliswaran",           school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s21", name: "Lee Jia Le Ceejay",                       school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s27", name: "Ilyas Mahdi Bin Syafwan Farrell",         school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s28", name: "Rajit Roy S/O Sivan Raja",                school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s29", name: "Rifal Elhan Bin Muhammad Rizal",          school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s30", name: "Na'Im Bin Surahim",                       school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s31", name: "Muhammad Aaryan Farrel Bin Rosly",        school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
];

function ClusterAttendance() {
  const C = useTheme();
  const labelStyle = makeLabelStyle(C);
  const inputStyle = makeInputStyle(C);
  const [roster, setRoster] = usePersistedState(STORAGE_KEYS.roster, []);
  const [attendanceLog, setAttendanceLog] = usePersistedState(STORAGE_KEYS.attendance, {});
  const [view, setView] = useState("take"); // "take" | "roster" | "summary"
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState(""); // "" | "B Div" | "C Div"
  const sessionKey = sessionDate;
  // presentIds: plain object { [playerId]: true } — avoids Set-in-state React issues
  const [presentIds, setPresentIds] = useState({});

  // Roster edit state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: "", school: SCHOOLS[0], div: "B Div", year: "", jersey: "", position: "" });
  const [editId, setEditId] = useState(null);

  // Walk-in state
  const [walkInName, setWalkInName] = useState("");
  const [walkInSchool, setWalkInSchool] = useState(SCHOOLS[0]);

  // Inline copy feedback
  const [copyToast, setCopyToast] = useState(null);
  const showCopyToast = (msg, type = "success") => {
    setCopyToast({ msg, type });
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Merge-seed: add any seed players whose ID is not already in the roster
  useEffect(() => {
    const existingIds = new Set(roster.map(p => p.id));
    const missing = SEED_ROSTER.filter(p => !existingIds.has(p.id));
    if (missing.length > 0) setRoster(prev => [...prev, ...missing]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const savedIds = attendanceLog[sessionKey] || [];
    setPresentIds(savedIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {}));
  }, [attendanceLog, sessionKey]);

  // Persist present set whenever it changes
  const savePresent = (nextObj) => {
    setAttendanceLog(prev => ({ ...prev, [sessionKey]: Object.keys(nextObj) }));
    setPresentIds(nextObj);
  };

  const togglePresent = (id) => {
    const next = { ...presentIds };
    if (next[id]) delete next[id]; else next[id] = true;
    savePresent(next);
  };

  const markAllSchool = (school, present) => {
    const next = { ...presentIds };
    roster.filter(p => p.school === school).forEach(p => { if (present) next[p.id] = true; else delete next[p.id]; });
    savePresent(next);
  };

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    const id = `walkin-${Date.now()}`;
    const player = { id, name: walkInName.trim(), school: walkInSchool, year: "", jersey: "", position: "", walkIn: true };
    setRoster(prev => [...prev, player]);
    const next = { ...presentIds, [id]: true };
    savePresent(next);
    setWalkInName("");
  };

  const addPlayer = () => {
    if (!newPlayer.name.trim()) return;
    if (editId) {
      setRoster(prev => prev.map(p => p.id === editId ? { ...p, ...newPlayer } : p));
      setEditId(null);
    } else {
      setRoster(prev => [...prev, { ...newPlayer, id: `p-${Date.now()}`, name: newPlayer.name.trim() }]);
    }
    setNewPlayer({ name: "", school: SCHOOLS[0], div: "B Div", year: "", jersey: "", position: "" });
    setShowAddForm(false);
  };

  const deletePlayer = (id) => {
    setRoster(prev => prev.filter(p => p.id !== id));
    const next = { ...presentIds };
    delete next[id];
    savePresent(next);
  };

  const startEdit = (player) => {
    setNewPlayer({ name: player.name, school: player.school, div: player.div || "B Div", year: player.year || "", jersey: player.jersey || "", position: player.position || "" });
    setEditId(player.id);
    setShowAddForm(true);
  };

  const activeRoster = divFilter ? roster.filter(p => p.div === divFilter) : roster;
  const schools = SCHOOLS.filter(s => activeRoster.some(p => p.school === s));
  const filtered = activeRoster.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.school.toLowerCase().includes(search.toLowerCase()) || (p.jersey && p.jersey.toString().includes(search)));
  const presentList = activeRoster.filter(p => !!presentIds[p.id]);
  const absentList = activeRoster.filter(p => !presentIds[p.id]);

  const inputSt = { ...inputStyle, padding: "10px 12px", fontSize: 14, flex: 1 };
  const selectSt = { ...inputSt, cursor: "pointer" };
  const labelSt = { fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, display: "block", marginBottom: 4 };

  const summaryText = () => {
    const d = new Date(sessionDate).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    let out = `NBSS CLUSTER FOOTBALL — ATTENDANCE\n${d}\nTotal present: ${presentList.length}/${roster.length}\n\n`;
    SCHOOLS.forEach(school => {
      const present = presentList.filter(p => p.school === school);
      if (present.length === 0) return;
      out += `${school} (${present.length})\n`;
      present.forEach((p, i) => { out += `  ${i + 1}. ${p.name}${p.jersey ? ` (#${p.jersey})` : ""}${p.year ? ` — Yr ${p.year}` : ""}\n`; });
      out += "\n";
    });
    const absent = absentList;
    if (absent.length > 0) {
      out += `ABSENT (${absent.length})\n`;
      absent.forEach((p, i) => { out += `  ${i + 1}. ${p.name} [${p.school}]\n`; });
    }
    return out;
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); showCopyToast("Copied! Paste into SCMobile or WhatsApp."); }
    catch { showCopyToast("Copy failed — please select and copy manually.", "error"); }
  };

  const btnPrimary = (color = C.gold) => ({
    fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, padding: "10px 18px",
    borderRadius: 999, border: "none", cursor: "pointer",
    background: color, color: color === C.gold ? C.navy : C.textBright, transition: "opacity 0.15s ease",
  });
  const btnGhost = (color = C.electric) => ({
    fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, padding: "8px 14px",
    borderRadius: 999, border: `1px solid ${color}`, cursor: "pointer",
    background: "transparent", color, transition: "opacity 0.15s ease",
  });

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {[{ id: "take", label: "Attendance" }, { id: "roster", label: "Roster" }, { id: "summary", label: "Summary" }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            ...btnGhost(view === v.id ? C.gold : C.textMid),
            borderColor: view === v.id ? C.gold : C.navyBorder,
            color: view === v.id ? C.gold : C.textMid,
            background: view === v.id ? C.goldGlow : "transparent",
          }}>{v.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Session:</span>
          <input type="date" value={sessionDate} onChange={e => {
            setSessionDate(e.target.value);
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.attendance) || "{}");
            setPresentIds((saved[e.target.value] || []).reduce((acc, id) => { acc[id] = true; return acc; }, {}));
          }} style={{ ...inputStyle, padding: "7px 10px", fontSize: 13, width: "auto" }} />
        </div>
      </div>

      {/* ── TAKE ATTENDANCE VIEW ── */}
      {view === "take" && (
        <div>
          {/* Division filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[{ val: "", label: "All Divisions" }, { val: "B Div", label: "B Division" }, { val: "C Div", label: "C Division" }].map(opt => (
              <button key={opt.val} onClick={() => setDivFilter(opt.val)} style={{
                ...btnGhost(divFilter === opt.val ? C.gold : C.textDim),
                borderColor: divFilter === opt.val ? C.gold : C.navyBorder,
                color: divFilter === opt.val ? C.gold : C.textMid,
                background: divFilter === opt.val ? C.goldGlow : "transparent",
                fontSize: 12, padding: "7px 14px",
              }}>{opt.label}</button>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            {[
              { label: "Present", val: Object.keys(presentIds).length, color: C.success },
              { label: "Absent", val: roster.length - Object.keys(presentIds).length, color: C.danger },
              { label: "Total", val: roster.length, color: C.electric },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 90, background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 28, color: s.color, letterSpacing: 1 }}>{s.val}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textMid, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input placeholder="Search by name, school or jersey #" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", padding: "11px 14px", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />

          {roster.length === 0 && (
            <Card style={{ textAlign: "center", padding: 32 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid }}>No players in roster yet.</p>
              <button onClick={() => setView("roster")} style={{ ...btnPrimary(), marginTop: 12 }}>Build Roster First</button>
            </Card>
          )}

          {/* Players grouped by school */}
          {schools.map(school => {
            const schoolPlayers = filtered.filter(p => p.school === school);
            if (schoolPlayers.length === 0) return null;
            const schoolPresent = schoolPlayers.filter(p => !!presentIds[p.id]).length;
            return (
              <div key={school} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 15, color: C.gold, letterSpacing: 1 }}>{school}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid }}>
                      {schoolPresent}/{schoolPlayers.length} present
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => markAllSchool(school, true)} style={{ ...btnGhost(C.success), fontSize: 11, padding: "5px 10px" }}>All In</button>
                    <button onClick={() => markAllSchool(school, false)} style={{ ...btnGhost(C.danger), fontSize: 11, padding: "5px 10px" }}>Clear</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                  {schoolPlayers.map(player => {
                    const isPresent = !!presentIds[player.id];
                    return (
                      <button key={player.id} onClick={() => togglePresent(player.id)} style={{
                        background: isPresent ? "rgba(34,211,165,0.12)" : C.navyCard,
                        border: `2px solid ${isPresent ? C.success : C.navyBorder}`,
                        borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                        textAlign: "left", transition: "all 0.18s",
                        transform: isPresent ? "scale(1.02)" : "scale(1)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16 }}>{isPresent ? "✅" : "⬜"}</span>
                          {player.jersey && (
                            <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: isPresent ? C.success : C.textDim, letterSpacing: 1 }}>#{player.jersey}</span>
                          )}
                          {player.div && <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: player.div === "B Div" ? C.electric : C.gold, background: player.div === "B Div" ? C.electricGlow : C.goldGlow, borderRadius: 4, padding: "1px 6px" }}>{player.div}</span>}
                          {player.walkIn && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.orange, background: "rgba(251,146,60,0.15)", borderRadius: 4, padding: "1px 5px" }}>WALK-IN</span>}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: isPresent ? C.textBright : C.textMid, lineHeight: 1.3 }}>{player.name}</div>
                        {player.position && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>{player.position}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Walk-in */}
          <Card style={{ marginTop: 16 }}>
            <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.orange, margin: "0 0 12px", letterSpacing: 1 }}>WALK-IN / VISITOR</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Player name" value={walkInName} onChange={e => setWalkInName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addWalkIn()}
                style={{ ...inputSt, minWidth: 140 }} />
              <select value={walkInSchool} onChange={e => setWalkInSchool(e.target.value)} style={{ ...selectSt, flex: "0 0 auto", minWidth: 130 }}>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={addWalkIn} style={{ ...btnPrimary(C.orange) }}>Add & Mark Present</button>
            </div>
          </Card>

          {/* Quick summary CTA */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setView("summary")} style={{ ...btnPrimary(C.electric) }}>
              View Summary for SCMobile →
            </button>
          </div>
        </div>
      )}

      {/* ── ROSTER MANAGEMENT VIEW ── */}
      {view === "roster" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid }}>{roster.length} players registered across {schools.length} school{schools.length !== 1 ? "s" : ""}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => {
                const existingIds = new Set(roster.map(p => p.id));
                const missing = SEED_ROSTER.filter(p => !existingIds.has(p.id));
                if (missing.length === 0) {
                  showCopyToast("Roster is already up to date.", "success");
                } else {
                  setRoster(prev => [...prev, ...missing]);
                  showCopyToast(`Added ${missing.length} new player${missing.length === 1 ? "" : "s"} from master list.`, "success");
                }
              }} style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 999, border: `1px solid ${C.electric}40`, background: `${C.electric}10`, color: C.electric, cursor: "pointer" }}>
                Sync Master List
              </button>
              <button onClick={() => { setShowAddForm(true); setEditId(null); setNewPlayer({ name: "", school: SCHOOLS[0], div: "B Div", year: "", jersey: "", position: "" }); }} style={{ ...btnPrimary() }}>
                Add Player
              </button>
            </div>
          </div>

          {showAddForm && (
            <Card style={{ marginBottom: 20, borderColor: C.gold }}>
              <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.gold, margin: "0 0 16px", letterSpacing: 1 }}>
                {editId ? "EDIT PLAYER" : "NEW PLAYER"}
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Full Name *</label>
                  <input value={newPlayer.name} onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Ahmad Faris" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>School *</label>
                  <select value={newPlayer.school} onChange={e => setNewPlayer(p => ({ ...p, school: e.target.value }))} style={selectSt}>
                    {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Division</label>
                  <select value={newPlayer.div} onChange={e => setNewPlayer(p => ({ ...p, div: e.target.value }))} style={selectSt}>
                    <option value="">—</option>
                    {["B Div", "C Div"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Year / Level</label>
                  <select value={newPlayer.year} onChange={e => setNewPlayer(p => ({ ...p, year: e.target.value }))} style={selectSt}>
                    <option value="">—</option>
                    {["Sec 1", "Sec 2", "Sec 3", "Sec 4", "Sec 5"].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Jersey #</label>
                  <input type="number" min="1" max="99" value={newPlayer.jersey} onChange={e => setNewPlayer(p => ({ ...p, jersey: e.target.value }))}
                    placeholder="e.g. 10" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Position</label>
                  <select value={newPlayer.position} onChange={e => setNewPlayer(p => ({ ...p, position: e.target.value }))} style={selectSt}>
                    <option value="">—</option>
                    {["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addPlayer} style={{ ...btnPrimary() }}>{editId ? "Save Changes" : "Add to Roster"}</button>
                <button onClick={() => { setShowAddForm(false); setEditId(null); }} style={{ ...btnGhost(C.textMid) }}>Cancel</button>
              </div>
            </Card>
          )}

          {SCHOOLS.map(school => {
            const sp = roster.filter(p => p.school === school);
            if (sp.length === 0) return null;
            return (
              <div key={school} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 15, color: C.gold, letterSpacing: 1, marginBottom: 8 }}>
                  {school} — {sp.length} player{sp.length !== 1 ? "s" : ""}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {sp.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 9, padding: "10px 14px" }}>
                      {p.jersey && <span style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.electric, minWidth: 28, letterSpacing: 1 }}>#{p.jersey}</span>}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.textBright }}>{p.name}</span>
                          {p.div && <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: p.div === "B Div" ? C.electric : C.gold, background: p.div === "B Div" ? C.electricGlow : C.goldGlow, borderRadius: 4, padding: "1px 6px" }}>{p.div}</span>}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>
                          {[p.year, p.position].filter(Boolean).join(" · ")}
                          {p.walkIn && <span style={{ marginLeft: 6, color: C.orange }}>(walk-in)</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(p)} style={{ ...btnGhost(C.electric), fontSize: 11, padding: "5px 9px" }}>Edit</button>
                        <button onClick={() => { if (window.confirm(`Remove ${p.name}?`)) deletePlayer(p.id); }} style={{ ...btnGhost(C.danger), fontSize: 11, padding: "5px 9px" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {roster.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textMid, marginBottom: 8 }}>No players yet. Start by adding your cluster roster.</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>Tip: Add all regular players once — they'll be available for every session.</p>
            </Card>
          )}
        </div>
      )}

      {/* ── SUMMARY VIEW ── */}
      {view === "summary" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: copyToast ? 10 : 16 }}>
              <div>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>ATTENDANCE SUMMARY</h3>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0 }}>
                  {new Date(sessionDate).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => copyToClipboard(summaryText())} style={{ ...btnPrimary(C.electric) }}>
                Copy for SCMobile / WhatsApp
              </button>
            </div>
            {copyToast && (
              <div style={{
                marginBottom: 14, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontFamily: FONT_BODY,
                background: copyToast.type === "error" ? "rgba(248,113,113,0.12)" : "rgba(34,211,165,0.12)",
                border: `1px solid ${copyToast.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(34,211,165,0.3)"}`,
                color: copyToast.type === "error" ? C.danger : C.success,
                animation: "slideIn 0.2s ease",
              }}>{copyToast.msg}</div>
            )}

            {/* Present */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.success, letterSpacing: 1, marginBottom: 10 }}>
                PRESENT — {presentList.length}
              </div>
              {SCHOOLS.map(school => {
                const sp = presentList.filter(p => p.school === school);
                if (sp.length === 0) return null;
                return (
                  <div key={school} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 6 }}>{school} ({sp.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {sp.map(p => (
                        <div key={p.id} style={{ fontFamily: FONT_BODY, fontSize: 13, background: "rgba(34,211,165,0.1)", border: "1px solid rgba(34,211,165,0.25)", borderRadius: 7, padding: "5px 11px", color: C.textBright }}>
                          {p.jersey ? `#${p.jersey} ` : ""}{p.name}
                          {p.year ? <span style={{ color: C.textDim, marginLeft: 4 }}>({p.year})</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {presentList.length === 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>No one marked present yet.</p>}
            </div>

            {/* Absent */}
            {absentList.length > 0 && (
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.danger, letterSpacing: 1, marginBottom: 10 }}>
                  ABSENT — {absentList.length}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {absentList.map(p => (
                    <div key={p.id} style={{ fontFamily: FONT_BODY, fontSize: 13, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 7, padding: "5px 11px", color: C.textMid }}>
                      {p.name} <span style={{ color: C.textDim }}>({p.school})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Historical log */}
          <Card>
            <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, margin: "0 0 12px", letterSpacing: 1 }}>PREVIOUS SESSIONS</h4>
            {Object.keys(attendanceLog).sort().reverse().slice(0, 10).map(date => {
              const ids = attendanceLog[date] || [];
              return (
                <div key={date} onClick={() => { setSessionDate(date); setPresentIds((ids || []).reduce((acc, id) => { acc[id] = true; return acc; }, {})); setView("take"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.navyBorder}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid }}>
                    {new Date(date).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.success, letterSpacing: 1 }}>{ids.length} present</span>
                </div>
              );
            })}
            {Object.keys(attendanceLog).length === 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>No sessions recorded yet.</p>}
          </Card>
        </div>
      )}
    </div>
  );
}

function TeacherAttendanceGate({ children }) {
  const C = useTheme();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [granted, setGranted] = useState(() => {
    try { return sessionStorage.getItem(ATTENDANCE_TEACHER_SESSION_KEY) === "true"; }
    catch { return false; }
  });

  const unlockAttendance = (e) => {
    e.preventDefault();
    if (password === ATTENDANCE_TEACHER_PASSWORD) {
      try { sessionStorage.setItem(ATTENDANCE_TEACHER_SESSION_KEY, "true"); } catch {}
      setGranted(true);
      setPassword("");
      setError("");
      return;
    }
    setError("Incorrect password. Teacher access only.");
  };

  const relockAttendance = () => {
    try { sessionStorage.removeItem(ATTENDANCE_TEACHER_SESSION_KEY); } catch {}
    setGranted(false);
    setPassword("");
    setError("");
  };

  if (granted) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          flexWrap: "wrap", padding: "14px 16px", borderRadius: 14,
          background: "rgba(34,211,165,0.08)", border: `1px solid ${C.success}33`,
        }}>
          <div>
            <div style={{ fontFamily: FONT_HEAD, color: C.textBright, fontSize: 16 }}>Teacher Access Enabled</div>
            <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13 }}>
              Attendance is unlocked for this browser tab.
            </div>
          </div>
          <button onClick={relockAttendance} style={{
            padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.gold}44`,
            background: "rgba(240,180,41,0.12)", color: C.goldLight,
            fontFamily: FONT_BODY, fontWeight: 800, cursor: "pointer",
          }}>
            Lock Attendance
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.navyCard}, ${C.navyDeep})`,
      border: `1px solid ${C.navyBorder}`, borderRadius: 24, padding: 24,
      boxShadow: "0 24px 50px rgba(0,0,0,0.28)",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16,
        padding: "8px 12px", borderRadius: 999, background: "rgba(56,189,248,0.1)",
        border: "1px solid rgba(56,189,248,0.2)", color: C.electric,
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Teacher Only
      </div>
      <h3 style={{ margin: "0 0 8px", fontFamily: FONT_HEAD, color: C.textBright, fontSize: 28 }}>
        Attendance Tab Locked
      </h3>
      <p style={{ margin: "0 0 20px", fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>
        Enter the teacher password to view and manage cluster attendance. Access stays unlocked only for this tab.
      </p>
      <form onSubmit={unlockAttendance} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
        <div>
          <label style={makeLabelStyle(C)}>Teacher Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter password"
            style={{
              ...makeInputStyle(C),
              WebkitTextFillColor: C.textBright,
              caretColor: C.textBright,
            }}
          />
        </div>
        {error && (
          <div style={{
            padding: "10px 12px", borderRadius: 10, fontFamily: FONT_BODY, fontSize: 13,
            color: "#fecaca", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
          }}>
            {error}
          </div>
        )}
        <button type="submit" style={{
          width: "fit-content", padding: "12px 18px", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, color: C.navyDeep,
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 900, cursor: "pointer",
        }}>
          Unlock Attendance
        </button>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  ANNOUNCEMENT BOARD
// ══════════════════════════════════════════════════
const SHEET_ID = "1yhLcwaYA7CuWgJ5VmQq8ia4KHB8Iwc3BGNEqVDevELI";
// Target specific tabs by name — works without knowing gid numbers
const SCHEDULE_CSV_URL     = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Schedule`;

// April 2026 schedule seeded from the shared calendar screenshot.
// Keep this in sync with the Google Sheet until the sheet becomes the sole source again.
const SEEDED_SCHEDULE_EVENTS = [
  { date: "2026-04-02", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Herwanto", venue: "", notes: "" },
  { date: "2026-04-06", title: "B Div Training", type: "Training", division: "B Div", time: "3pm to 5:30pm", teacher: "Mr Lua", venue: "", notes: "" },
  { date: "2026-04-07", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Chandra", venue: "", notes: "" },
  { date: "2026-04-09", title: "C Div Friendly (Canberra Sec)", type: "Friendly", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Kadir", venue: "", notes: "" },
  { date: "2026-04-10", title: "NSG B Div Game (N2 vs Greenridge Sec)", type: "Match", division: "B Div", time: "Kick off 845am", teacher: "", venue: "", notes: "" },
  { date: "2026-04-13", title: "B Div Training", type: "Training", division: "B Div", time: "3pm to 5:30pm", teacher: "Ms Kellie", venue: "", notes: "" },
  { date: "2026-04-14", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Valavan", venue: "", notes: "" },
  { date: "2026-04-16", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Yusman", venue: "", notes: "" },
  { date: "2026-04-20", title: "B Div Training", type: "Training", division: "B Div", time: "3pm to 5:30pm", teacher: "Mr Harizan", venue: "", notes: "" },
  { date: "2026-04-21", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Herwanto", venue: "", notes: "" },
  { date: "2026-04-23", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Chandra", venue: "", notes: "" },
  { date: "2026-04-27", title: "B Div Training", type: "Training", division: "B Div", time: "3pm to 5:30pm", teacher: "Mr Harizan", venue: "", notes: "" },
  { date: "2026-04-28", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Valavan", venue: "", notes: "" },
  { date: "2026-04-30", title: "C Div Training", type: "Training", division: "C Div", time: "3pm to 5:30pm", teacher: "Mr Kadir", venue: "", notes: "" },
];

function inferScheduleType(title = "") {
  const text = title.toLowerCase();
  if (text.includes("friendly")) return "Friendly";
  if (text.includes("match") || text.includes("game")) return "Match";
  if (text.includes("training")) return "Training";
  return "Other";
}

function inferScheduleDivision(title = "") {
  if (title.includes("B Div")) return "B Div";
  if (title.includes("C Div")) return "C Div";
  return "";
}

function normalizeScheduleEntry(entry) {
  const title = entry.title || entry.event || entry.name || "";
  return {
    date: entry.date || "",
    title,
    type: entry.type || inferScheduleType(title),
    division: entry.division || entry.div || inferScheduleDivision(title),
    time: entry.time || "",
    teacher: entry.teacher || entry.coach || "",
    venue: entry.venue || "",
    notes: entry.notes || "",
  };
}

function scheduleEntryKey(entry) {
  return `${entry.date}::${entry.division || ""}::${entry.type || ""}`;
}

function mergeScheduleEntries(rows) {
  const merged = new Map();
  rows.map(normalizeScheduleEntry).forEach((entry) => {
    if (entry.date) merged.set(scheduleEntryKey(entry), entry);
  });
  SEEDED_SCHEDULE_EVENTS.forEach((entry) => {
    merged.set(scheduleEntryKey(entry), entry);
  });
  return [...merged.values()].sort((a, b) => (a.date > b.date ? 1 : -1));
}

async function fetchScheduleEntries() {
  const res = await fetch(SCHEDULE_CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return mergeScheduleEntries(parseCSV(text));
}

function getNextScheduledEvent(events, today = new Date().toISOString().slice(0, 10)) {
  return events.find((event) => event.date >= today) || null;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(field.trim());
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += ch;
  }

  if (field.length || row.length) {
    row.push(field.trim());
    if (row.some(value => value !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(vals => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  }).filter(r => r.date || r.title); // skip truly empty rows
}

function AnnouncementBoard() {
  const C = useTheme();
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const eventColor = (type) => ({
    Training: C.success,
    Match: C.gold,
    Friendly: C.orange,
    Other: C.electric,
  }[type] || C.electric);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScheduleEntries();
      setNextEvent(getNextScheduledEvent(data));
      setLastFetched(new Date());
    } catch (e) {
      setError("Could not load the next event. Make sure the schedule sheet is public and you're online.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const accent = nextEvent ? eventColor(nextEvent.type) : C.electric;
  const formattedDate = nextEvent?.date
    ? new Date(nextEvent.date).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 1 }}>ANNOUNCEMENTS</div>
          {lastFetched && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 2 }}>
              Last updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
        <button onClick={fetchAnnouncements} disabled={loading} style={{
          padding: "7px 14px", borderRadius: 4, cursor: loading ? "wait" : "pointer",
          background: "transparent", border: `1px solid ${C.navyBorder}`,
          color: C.textMid, fontFamily: FONT_SERIF, fontSize: 10, fontWeight: 400,
          letterSpacing: "0.08em", textTransform: "uppercase",
          transition: "border-color 0.15s ease",
        }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* States */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.textDim, fontFamily: FONT_BODY, fontSize: 13 }}>
          Fetching next event…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "16px 20px", borderRadius: 12, background: `${C.danger}10`, border: `1px solid ${C.danger}25`, color: C.danger, fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {!loading && !error && !nextEvent && (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No upcoming events right now.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6 }}>Check back later for the next training or match.</p>
        </div>
      )}

      {!loading && !error && nextEvent && (
        <div style={{
          background: C.navyCard,
          border: `1px solid ${C.navyBorder}`,
          borderLeft: `3px solid ${accent}`,
          borderRadius: 12,
          padding: "22px 24px",
        }}>
          {/* Eyebrow row — Space Mono ALL CAPS, no colored badge backgrounds */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Next event
            </span>
            {nextEvent.type && (
              <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {nextEvent.type}
              </span>
            )}
            {nextEvent.division && (
              <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {nextEvent.division}
              </span>
            )}
            <span style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, marginLeft: "auto", letterSpacing: "0.06em" }}>
              {formattedDate}
            </span>
          </div>

          {/* Title — Doto display, one hero moment */}
          <div style={{ fontFamily: FONT_HEAD, fontSize: "clamp(24px, 4vw, 36px)", color: C.textBright, letterSpacing: "0.02em", lineHeight: 1.05, marginBottom: 16 }}>
            {nextEvent.title}
          </div>

          {/* Detail row — flat data pairs, no chip backgrounds */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: nextEvent.notes ? 14 : 0, borderTop: `1px solid ${C.navyBorder}`, paddingTop: 12 }}>
            {nextEvent.time && (
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Time</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid }}>{nextEvent.time}</div>
              </div>
            )}
            {nextEvent.teacher && (
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Coach</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid }}>{nextEvent.teacher}</div>
              </div>
            )}
            {nextEvent.venue && (
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Venue</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid }}>{nextEvent.venue}</div>
              </div>
            )}
          </div>

          {nextEvent.notes && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, lineHeight: 1.7, margin: 0, marginTop: nextEvent.time || nextEvent.teacher || nextEvent.venue ? 14 : 0 }}>
              {nextEvent.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  TEAM HUB
// ══════════════════════════════════════════════════
function TeamHubSection() {
  const C = useTheme();
  const [hubTab, setHubTab] = useState("announce");
  const tabs = [
    { id: "announce",   label: "Announcements", icon: "" },
    { id: "overview",   label: "Overview",      icon: "" },
    { id: "schedule",   label: "Schedule",      icon: "" },
    { id: "recovery",   label: "Recovery",      icon: "" },
    { id: "culture",    label: "Legends",       icon: "" },
    { id: "quiz",       label: "Football IQ",   icon: "" },
    { id: "goals",      label: "Goals",         icon: "" },
    { id: "attendance", label: "Attendance",    icon: "" },
  ];
  return (
    <section style={{ padding: "100px 24px 88px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="" title="TEAM OPERATIONS" subtitle="Shared team tools, scheduling, recovery support, and communication." accent={C.electric} />
      <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <Pill key={t.id} active={hubTab === t.id} onClick={() => setHubTab(t.id)} color={C.electric}>
            {t.label}
          </Pill>
        ))}
      </div>
      {hubTab === "announce"   && <AnnouncementBoard />}
      {hubTab === "overview"   && <HubOverview setHubTab={setHubTab} />}
      {hubTab === "schedule"   && <ScheduleCard />}
      {hubTab === "recovery"   && <RecoveryZone />}
      {hubTab === "culture"    && <LegendsSection />}
      {hubTab === "quiz"       && <FootballIQQuiz />}
      {hubTab === "goals"      && <GoalWall />}
      {hubTab === "attendance" && (
        <TeacherAttendanceGate>
          <ClusterAttendance />
        </TeacherAttendanceGate>
      )}
    </section>
  );
}

function PlayerDashboardPage({ setActive, profile, sessions }) {
  const C = useTheme();
  const isMobile = useIsMobile(768);
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "", photo: "" });
  const [wellnessLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const [nextEvent, setNextEvent] = useState(null);
  const sorted = [...(sessions || [])].filter(s => s?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);
  const last = recent[0] || null;
  const streak = (() => {
    if (!sorted.length) return 0;
    let count = 0;
    let cur = new Date();
    cur.setHours(0, 0, 0, 0);
    for (const s of sorted) {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      if (Math.round((cur - d) / 86400000) <= 1) { count++; cur = d; } else break; // contiguous training streak
    }
    return count;
  })();
  const daysSinceLast = last ? Math.round((new Date() - new Date(last.date)) / 86400000) : null;
  const avgRating = sessions?.length ? sessions.reduce((sum, s) => sum + (Number(s.rating) || 0), 0) / sessions.length : null;
  const recentAvg = recent.length ? recent.reduce((sum, s) => sum + (Number(s.rating) || 0), 0) / recent.length : null;
  const latestReady = sorted.find(s => s.readinessScore != null)?.readinessScore ?? null;
  const latestSleep = (() => { const s = sorted.find(x => x.sleep != null); return s ? Number(s.sleep) : null; })();
  const latestEnergy = (() => { const s = sorted.find(x => x.energy != null); return s ? Number(s.energy) : null; })();
  const completeRecentEntries = recent.filter(s => s.duration && s.rpe && s.sleep && s.energy && s.soreness).length;
  const compliance = recent.length ? Math.round((completeRecentEntries / recent.length) * 100) : 0;
  const acwrData = computeACWR(sessions || []);
  const latestLoad = acwrData.length ? acwrData[acwrData.length - 1] : null;
  const latestACWR = latestLoad?.acwr ?? null;
  const readinessTrend = sorted
    .filter(s => s.readinessScore != null)
    .slice(0, 6)
    .reverse()
    .map(s => ({ date: s.date.slice(5), readiness: Number(s.readinessScore) }));
  const loadTrend = acwrData.slice(-6).map(s => ({ date: s.date.slice(5), acute: s.acute, chronic: s.chronic, acwr: s.acwr }));
  const { xp } = computeXpAndBadges(sessions || [], growthEntries || []);
  const level = getLevel(xp);
  const name = squad.name?.trim() || profile?.name?.trim() || "Player";
  const position = squad.position?.trim() || profile?.position?.trim() || "Midfielder";
  const activeIssues = (wellnessLogs || []).filter(log => !log.resolved);
  const availability = activeIssues.some(log => Number(log.severity) >= 3)
    ? { label: "Unavailable", color: C.danger, note: "High-severity issue on record." }
    : activeIssues.some(log => Number(log.severity) === 2)
      ? { label: "Modified", color: C.orange, note: "Load should be adjusted." }
      : activeIssues.length > 0
        ? { label: "Available", color: C.gold, note: "Minor issue logged." }
        : { label: "Available", color: C.success, note: "No active injury constraints." };
  const currentFocus = last?.goals?.trim() || profile?.firstGoal?.trim() || "Set your next performance objective.";
  const recommendation = latestReady !== null && latestReady < 60
    ? "Reduce intensity. Prioritise recovery and keep the next session controlled."
    : latestACWR !== null && latestACWR > 1.3
      ? "Load is rising. Protect sleep and avoid unnecessary volume."
      : daysSinceLast !== null && daysSinceLast >= 3
        ? "Rebuild momentum with a technical session before chasing intensity."
        : "You are in a workable zone. Execute the next session with intent.";
  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };

  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then(events => { if (active) setNextEvent(getNextScheduledEvent(events)); })
      .catch(() => { if (active) setNextEvent(getNextScheduledEvent(SEEDED_SCHEDULE_EVENTS)); });
    return () => { active = false; };
  }, []);

  const metricCards = [
    { label: "Readiness", value: latestReady !== null ? `${latestReady}%` : "-", note: getReadinessDirective(latestReady), tone: latestReady !== null && latestReady < 60 ? C.danger : C.success },
    { label: "Acute load", value: latestLoad ? latestLoad.acute : "-", note: getLoadDirective(latestACWR), tone: C.orange },
    { label: "Chronic load", value: latestLoad ? latestLoad.chronic : "-", note: latestLoad ? "Use chronic load as the anchor before increasing intensity." : "28-day load unlocks after more complete logging.", tone: C.electric },
    { label: "Availability", value: availability.label, note: getAvailabilityDirective(activeIssues), tone: availability.color },
  ];

  return (
    <section style={{ minHeight: "100vh", padding: "96px 24px 88px", background: C.navy, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(135deg, transparent 0%, transparent 48%, ${C.gold} 49%, transparent 50%)`, backgroundSize: "140px 140px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── FC NBSS Club identity strip ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: "0.08em" }}>FC NBSS</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Naval Base Secondary School · Football CCA</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.7fr) minmax(320px, 0.95fr)", gap: 20 }}>
          <div style={{ borderRadius: 24, padding: 30, background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navyCard} 58%, ${C.navy} 100%)`, border: `1px solid ${C.gold}24`, boxShadow: "0 18px 60px rgba(0,0,0,0.32)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1.7, textTransform: "uppercase" }}>Player command centre</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>Last updated {formatDate(last?.date)}</div>
            </div>

            {/* ── Player photo + name row ── */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
              {squad.photo ? (
                <div style={{
                  width: isMobile ? 64 : 80, height: isMobile ? 64 : 80,
                  borderRadius: 12, flexShrink: 0, overflow: "hidden",
                  border: `2px solid ${C.orange}`,
                }}>
                  <img src={squad.photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : null}
              <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(52px, 8vw, 88px)", color: C.textBright, margin: 0, lineHeight: 0.9, letterSpacing: 2 }}>{name.toUpperCase()}</h1>
            </div>

            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textMid, lineHeight: 1.7, margin: "16px 0 0" }}>{position} · Level {level.level} {level.title}. Readiness, load control, availability, and next actions are prioritised first.</p>

            {/* ── Vital signs: dot-matrix panels ── */}
            {(latestReady !== null || latestACWR !== null) && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                {latestReady !== null && (
                  <DotMatrixPanel
                    label="Readiness"
                    value={latestReady}
                    displayValue={`${latestReady}%`}
                    max={100} segments={10}
                    zones={[
                      { from: 0,  to: 60,  color: C.danger  },
                      { from: 60, to: 75,  color: C.orange  },
                      { from: 75, to: 100, color: C.success },
                    ]}
                    tone={latestReady < 60 ? C.danger : latestReady < 75 ? C.orange : C.success}
                    compact style={{ flex: "1 1 160px" }}
                  />
                )}
                {latestACWR !== null && (
                  <DotMatrixPanel
                    label="ACWR"
                    value={Math.min(latestACWR / 2, 1) * 100}
                    displayValue={latestACWR.toFixed(2)}
                    max={100} segments={10}
                    zones={[
                      { from: 0,  to: 40,  color: C.electric },
                      { from: 40, to: 65,  color: C.success  },
                      { from: 65, to: 75,  color: C.orange   },
                      { from: 75, to: 100, color: C.danger   },
                    ]}
                    tone={latestACWR < 0.8 ? C.electric : latestACWR <= 1.3 ? C.success : latestACWR <= 1.5 ? C.orange : C.danger}
                    compact style={{ flex: "1 1 160px" }}
                  />
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 24 }}>
              {metricCards.map((item, idx) => <MetricPanel key={idx} label={item.label} value={item.value} note={item.note} tone={item.tone} compact />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              <GoldButton onClick={() => setActive("performance")} style={{ minWidth: 150 }}>Performance</GoldButton>
              <GoldButton onClick={() => setActive("match")} secondary style={{ minWidth: 150 }}>Match</GoldButton>
            </div>
          </div>

          <Card style={{ borderRadius: 24, padding: 28, boxShadow: "0 18px 60px rgba(0,0,0,0.22)" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Decision support</div>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Today&apos;s guidance</h2>
            <div style={{ padding: "16px 16px 14px", borderRadius: 16, background: `${C.gold}08`, border: `1px solid ${C.gold}20`, marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>Recommendation</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textBright, lineHeight: 1.65 }}>{recommendation}</div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <MetricPanel label="Next session" value={nextEvent ? nextEvent.title : "No schedule"} note={nextEvent ? `${nextEvent.date}${nextEvent.time ? ` · ${nextEvent.time}` : ""}` : "Schedule feed unavailable"} tone={C.gold} compact />
              <MetricPanel label="Current focus" value={currentFocus} note="Primary objective carried into the next session" tone={C.textBright} compact />
              <MetricPanel label="Compliance" value={`${compliance}%`} note={getComplianceDirective(compliance)} tone={compliance >= 75 ? C.success : compliance >= 50 ? C.gold : C.danger} compact />
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
          {[
            { label: "Sessions", value: sessions?.length ?? 0, sub: "Total logged", color: C.gold },
            { label: "Average rating", value: avgRating !== null ? avgRating.toFixed(1) : "-", sub: "Across all sessions", color: C.electric },
            { label: "Streak", value: streak || "-", sub: "Current run", color: C.success },
            { label: "Days since last", value: daysSinceLast !== null ? daysSinceLast : "-", sub: "Training recency", color: C.goldLight },
            { label: "Sleep", value: latestSleep !== null ? latestSleep : "-", sub: "Latest self-report", color: C.orange },
            { label: "Energy", value: latestEnergy !== null ? latestEnergy : "-", sub: "Latest self-report", color: C.success },
          ].map((card, idx) => (
            <div key={idx} style={{ padding: "18px 16px", borderRadius: 16, background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 34, color: card.color, letterSpacing: 1 }}>{card.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 20 }}>
          <Card style={{ borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>Load trend</h3>
              <button onClick={() => setActive("performance")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>Open performance</button>
            </div>
            {loadTrend.length < 2 ? (
              <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>Add at least two sessions with duration and RPE to unlock load trend analysis.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={loadTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <YAxis tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 10, fontFamily: FONT_BODY, fontSize: 12 }} />
                  <Line type="monotone" dataKey="acute" stroke={C.orange} strokeWidth={2.4} dot={{ fill: C.orange, r: 3 }} name="Acute" />
                  <Line type="monotone" dataKey="chronic" stroke={C.electric} strokeWidth={2.4} dot={{ fill: C.electric, r: 3 }} name="Chronic" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card style={{ borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>Recovery trend</h3>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Trend vs recent baseline</div>
            </div>
            {readinessTrend.length < 2 ? (
              <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>Track sleep, energy, and soreness to unlock recovery trend analysis.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={readinessTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <ReferenceArea y1={0}  y2={60}  fill={C.danger}  fillOpacity={0.07} />
                  <ReferenceArea y1={60} y2={75}  fill={C.orange}  fillOpacity={0.06} />
                  <ReferenceArea y1={75} y2={100} fill={C.success} fillOpacity={0.05} />
                  <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 10, fontFamily: FONT_BODY, fontSize: 12 }} />
                  <ReferenceLine y={75} stroke={C.success} strokeDasharray="4 2" strokeOpacity={0.7} />
                  <ReferenceLine y={60} stroke={C.danger}  strokeDasharray="4 2" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="readiness" stroke={C.success} strokeWidth={2.4} dot={{ fill: C.success, r: 3 }} name="Readiness" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* ── ACWR Sparkline — zone bands ── */}
          <Card style={{ borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>ACWR</h3>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ label: "< 0.8 Under", c: C.electric }, { label: "0.8–1.3 Optimal", c: C.success }, { label: "1.3–1.5 Caution", c: C.orange }, { label: "> 1.5 Risk", c: C.danger }].map(z => (
                  <span key={z.label} style={{ fontFamily: FONT_BODY, fontSize: 10, color: z.c, letterSpacing: 0.3 }}>{z.label}</span>
                ))}
              </div>
            </div>
            {loadTrend.length < 2 ? (
              <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>Log at least two sessions with RPE and duration to unlock ACWR tracking.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={loadTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <ReferenceArea y1={0}   y2={0.8} fill={C.electric} fillOpacity={0.07} />
                  <ReferenceArea y1={0.8} y2={1.3} fill={C.success}  fillOpacity={0.06} />
                  <ReferenceArea y1={1.3} y2={1.5} fill={C.orange}   fillOpacity={0.07} />
                  <ReferenceArea y1={1.5} y2={2.5} fill={C.danger}   fillOpacity={0.07} />
                  <CartesianGrid strokeDasharray="3 3" stroke={C.navyBorder} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <YAxis domain={[0, 2.5]} tick={{ fontFamily: FONT_BODY, fontSize: 10, fill: C.textDim }} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 10, fontFamily: FONT_BODY, fontSize: 12 }} />
                  <ReferenceLine y={0.8} stroke={C.electric} strokeDasharray="3 2" strokeOpacity={0.5} />
                  <ReferenceLine y={1.3} stroke={C.orange}   strokeDasharray="3 2" strokeOpacity={0.5} />
                  <ReferenceLine y={1.5} stroke={C.danger}   strokeDasharray="3 2" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="acwr" stroke={C.gold} strokeWidth={2.4} dot={{ fill: C.gold, r: 3 }} name="ACWR" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 20 }}>
          <Card style={{ borderRadius: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>Recent sessions</h3>
              <button onClick={() => setActive("performance")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>Open full log</button>
            </div>
            {recent.length === 0 ? <div style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14, lineHeight: 1.7 }}>No performance data yet. Log your first session and this page will start working for you.</div> : <div style={{ display: "grid", gap: 10 }}>{recent.map((entry) => (<div key={entry.id} style={{ padding: "14px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textBright, fontWeight: 700 }}>{(entry.type || "session").toUpperCase()}</div><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>{formatDate(entry.date)}</div></div><div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: FONT_BODY, fontSize: 12, color: C.textMid }}><span>Rating: {Number(entry.rating || 0).toFixed(1)}</span><span>Load: {entry.load || "-"}</span><span>Readiness: {entry.readinessScore != null ? `${entry.readinessScore}%` : "-"}</span></div></div>))}</div>}
          </Card>

          <Card style={{ borderRadius: 20 }}>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Performance alerts</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                {
                  tone: activeIssues.some(l => Number(l.severity) >= 3) ? C.danger : activeIssues.some(l => Number(l.severity) === 2) ? C.orange : activeIssues.length ? C.gold : C.success,
                  label: "Availability",
                  text: `${availability.label}. ${getAvailabilityDirective(activeIssues)}`,
                },
                {
                  tone: daysSinceLast === null ? C.textDim : daysSinceLast === 0 ? C.success : daysSinceLast >= 3 ? C.orange : C.gold,
                  label: "Training recency",
                  text: daysSinceLast === null
                    ? "No sessions logged yet. Start building your record."
                    : daysSinceLast === 0
                      ? "Session logged today. Recover well and prepare the next block."
                      : `Last session was ${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago. ${daysSinceLast >= 3 ? "Re-establish rhythm before chasing intensity." : "Keep the momentum going."}`,
                },
                {
                  tone: latestACWR === null ? C.textDim : latestACWR > 1.5 ? C.danger : latestACWR > 1.3 ? C.orange : latestACWR < 0.8 ? C.electric : C.success,
                  label: "Load status",
                  text: latestACWR !== null ? `ACWR ${latestACWR.toFixed(2)}. ${getLoadDirective(latestACWR)}` : "Log sessions with duration and RPE to unlock load guidance.",
                },
                {
                  tone: compliance >= 75 ? C.success : compliance >= 50 ? C.gold : C.danger,
                  label: "Data quality",
                  text: `${compliance}% compliance on recent entries. ${getComplianceDirective(compliance)}`,
                },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "14px 16px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: item.tone, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PlayerPerformancePage() {
  const C = useTheme();
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "", photo: "" });
  const [wellnessLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const [profile] = usePersistedState(STORAGE_KEYS.profile, { name: "", position: "Midfielder", firstGoal: "" });

  const sorted = [...(sessions || [])].filter((entry) => entry?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);
  const last = recent[0] || null;
  const latestReady = sorted.find((entry) => entry.readinessScore != null)?.readinessScore ?? null;
  const acwrData = computeACWR(sessions || []);
  const latestLoad = acwrData.length ? acwrData[acwrData.length - 1] : null;
  const activeIssues = (wellnessLogs || []).filter((log) => !log.resolved);
  const { xp } = computeXpAndBadges(sessions || [], growthEntries || []);
  const level = getLevel(xp);
  const avgRating = sessions?.length ? (sessions.reduce((sum, entry) => sum + (Number(entry.rating) || 0), 0) / sessions.length).toFixed(1) : "-";
  const compliance = recent.length ? Math.round((recent.filter((entry) => entry.duration && entry.rpe && entry.sleep && entry.energy && entry.soreness).length / recent.length) * 100) : 0;
  const readinessTrend = sorted.filter((entry) => entry.readinessScore != null).slice(0, 6).reverse().map((entry) => ({ date: entry.date.slice(5), readiness: Number(entry.readinessScore) }));
  const loadTrend = acwrData.slice(-6).map((entry) => ({ date: entry.date.slice(5), acute: entry.acute, chronic: entry.chronic }));
  const availability = activeIssues.some((log) => Number(log.severity) >= 3)
    ? { label: "Unavailable", note: "High-severity issue on record.", tone: C.danger }
    : activeIssues.some((log) => Number(log.severity) === 2)
      ? { label: "Modified", note: "Load should be reduced or adjusted.", tone: C.orange }
      : activeIssues.length
        ? { label: "Available", note: "Minor issue still needs monitoring.", tone: C.gold }
        : { label: "Available", note: "No active availability constraints.", tone: C.success };
  const currentFocus = last?.goals?.trim() || profile?.firstGoal?.trim() || "Set the next performance objective.";
  const recommendation = latestReady !== null && latestReady < 60
    ? "Reduce intensity and prioritise recovery work before pushing volume."
    : latestLoad?.acwr > 1.3
      ? "Load is climbing. Protect sleep quality and control unnecessary volume."
      : "You are in a workable zone. Execute the next block with intent and clean data capture.";
  const playerTrustItems = [
    { key: STORAGE_KEYS.sessions, label: "Sessions", fallback: [], tone: C.gold },
    { key: STORAGE_KEYS.wellnessLog, label: "Availability", fallback: [], tone: C.orange },
    { key: STORAGE_KEYS.matchHistory, label: "Match records", fallback: [], tone: C.electric },
    { key: STORAGE_KEYS.growthJournal, label: "Development", fallback: [], tone: C.success },
    { key: STORAGE_KEYS.goals, label: "Goals", fallback: [], tone: C.goldLight },
    { key: STORAGE_KEYS.profile, label: "Profile", fallback: {}, tone: C.textBright },
  ];
  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };

  return (
    <PlayerPerformanceSurface
      theme={C}
      fonts={{ head: FONT_HEAD, body: FONT_BODY }}
      summary={{
        title: "PERFORMANCE",
        subtitle: `${squad.position?.trim() || profile?.position?.trim() || "Midfielder"} · Level ${level.level} ${level.title}. Training quality, recovery signals, and performance direction are prioritised first.`,
        lastUpdated: formatDate(last?.date),
        metrics: [
          { label: "Readiness", value: latestReady != null ? `${latestReady}%` : "-", note: getReadinessDirective(latestReady), tone: latestReady != null && latestReady < 60 ? C.danger : C.success },
          { label: "Acute load", value: latestLoad ? latestLoad.acute : "-", note: getLoadDirective(latestLoad?.acwr ?? null), tone: C.orange },
          { label: "Chronic load", value: latestLoad ? latestLoad.chronic : "-", note: latestLoad ? "Use chronic load as the stability anchor before adding spikes." : "28-day trend unlocks after more session logging.", tone: C.electric },
          { label: "Availability", value: availability.label, note: getAvailabilityDirective(activeIssues), tone: availability.tone },
          { label: "Compliance", value: `${compliance}%`, note: getComplianceDirective(compliance), tone: compliance >= 75 ? C.success : compliance >= 50 ? C.gold : C.danger },
          { label: "Session volume", value: sessions.length, note: "Total sessions logged", tone: C.gold },
          { label: "Average rating", value: avgRating, note: "Across all sessions", tone: C.electric },
          { label: "Current level", value: level.level, note: level.title, tone: C.goldLight },
        ],
        guidance: [
          { label: "Recommendation", value: recommendation, note: "Generated from readiness, load, and training recency.", bg: `${C.gold}08`, border: `${C.gold}20`, labelTone: C.gold },
          { label: "Recovery action", value: getReadinessDirective(latestReady), note: "Use this before deciding session intensity." },
          { label: "Current focus", value: currentFocus, note: "This should carry into the next session block." },
          { label: "Data quality", value: getComplianceDirective(compliance), note: "Better inputs improve the coaching guidance." },
        ],
        loadTrend,
        readinessTrend,
        recentEntries: recent.map((entry) => ({
          id: entry.id,
          title: (entry.type || "Session").toUpperCase(),
          date: formatDate(entry.date),
          metrics: [`Rating ${Number(entry.rating || 0).toFixed(1)}`, `Load ${entry.load || "-"}`, `Readiness ${entry.readinessScore != null ? `${entry.readinessScore}%` : "-"}`],
          note: entry.notes || "",
          emphasis: entry.goals || "",
          emphasisTone: C.electric,
        })),
        alerts: buildPlayerAlerts({ C, availability, activeIssues, latestLoad, latestReady, readinessTrend, sessions, currentFocus, acwrData }),
      }}
      renderSessions={() => <TrackerSection />}
      renderRecovery={() => (<><WellnessSection /><NutritionSection /></>)}
      renderDevelopment={() => (<><TrainingSection /><WarmUpSection /><FitnessSection /><MindsetSection /></>)}
      renderProfile={() => (
        <>
          <SquadSection />
          <LocalTrustPanel
            theme={C}
            fonts={{ head: FONT_HEAD, body: FONT_BODY }}
            title="Local Data Integrity"
            description="This device stores your performance records locally. Export backups regularly and import them when moving to a new device."
            storageItems={playerTrustItems}
          />
        </>
      )}
    />
  );
}

function PlayerMatchPage() {
  const C = useTheme();
  const [matches] = usePersistedState(STORAGE_KEYS.matchHistory, []);
  const [nextEvent, setNextEvent] = useState(null);
  const sorted = [...(matches || [])].filter((match) => match?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentMatches = sorted.slice(0, 5);
  const lastMatch = recentMatches[0] || null;
  const totalGoals = matches.reduce((sum, match) => sum + (Number(match.goalsScored) || 0), 0);
  const totalAssists = matches.reduce((sum, match) => sum + (Number(match.assists) || 0), 0);
  const totalMinutes = matches.reduce((sum, match) => sum + (Number(match.minutesPlayed) || 0), 0);
  const avgRating = matches.length ? (matches.reduce((sum, match) => sum + (Number(match.rating) || 0), 0) / matches.length).toFixed(1) : "-";
  const ratingTrend = sorted.slice(0, 6).reverse().map((match) => ({ date: match.date.slice(5), rating: Number(match.rating) || 0 }));
  const resultLabel = (match) => {
    const scored = Number(match?.scoreFor);
    const conceded = Number(match?.scoreAgainst);
    if (Number.isNaN(scored) || Number.isNaN(conceded)) return "No score";
    if (scored > conceded) return "Win";
    if (scored < conceded) return "Loss";
    return "Draw";
  };
  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };

  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then((events) => {
        const matchEvents = events.filter((event) => event.type === "Match" || event.type === "Friendly");
        if (active) setNextEvent(getNextScheduledEvent(matchEvents.length ? matchEvents : events));
      })
      .catch(() => {
        const matchEvents = SEEDED_SCHEDULE_EVENTS.filter((event) => event.type === "Match" || event.type === "Friendly");
        if (active) setNextEvent(getNextScheduledEvent(matchEvents.length ? matchEvents : SEEDED_SCHEDULE_EVENTS));
      });
    return () => { active = false; };
  }, []);

  const recommendation = nextEvent
    ? `Preparation window is open for ${nextEvent.title}. Lock in your checklist and intention before match day.`
    : lastMatch?.review?.q2
      ? `Carry the latest review point forward: ${lastMatch.review.q2}`
      : "Use the preparation routine and match log together so output becomes coaching, not memory.";
  const outputDirective = lastMatch?.review?.q2
    ? `Next improvement priority: ${lastMatch.review.q2}`
    : lastMatch
      ? "Review the last match honestly and carry one clear improvement into the next fixture."
      : "Log matches and complete the review so your output becomes actionable coaching.";

  return (
    <PlayerMatchSurface
      theme={C}
      fonts={{ head: FONT_HEAD, body: FONT_BODY }}
      summary={{
        title: "MATCH",
        subtitle: "Preparation, execution review, and match output are organised into one serious workflow.",
        lastUpdated: formatDate(lastMatch?.date),
        metrics: [
          { label: "Next fixture", value: nextEvent ? nextEvent.title : "No fixture", note: nextEvent ? `${nextEvent.date}${nextEvent.time ? ` · ${nextEvent.time}` : ""}. Lock your checklist and intention now.` : "Schedule feed unavailable", tone: C.gold },
          { label: "Appearances", value: matches.length, note: "Matches logged", tone: C.electric },
          { label: "Goals", value: totalGoals, note: matches.length ? "Use goals with rating and review quality, not in isolation." : "Total output", tone: C.gold },
          { label: "Assists", value: totalAssists, note: matches.length ? "Support actions should align with your role and game plan." : "Total support actions", tone: C.success },
          { label: "Minutes", value: totalMinutes, note: matches.length ? "Availability and trust on match day show up here." : "Total time on pitch", tone: C.orange },
          { label: "Average rating", value: avgRating, note: outputDirective, tone: C.electric },
        ],
        guidance: [
          { label: "Recommendation", value: recommendation, note: "Driven by upcoming fixtures and latest review notes.", bg: `${C.gold}08`, border: `${C.gold}20`, labelTone: C.gold },
          { label: "Latest result", value: lastMatch ? `${resultLabel(lastMatch)} vs ${lastMatch.opponent}` : "No match record yet.", note: lastMatch ? `${lastMatch.scoreFor || "-"}-${lastMatch.scoreAgainst || "-"} · ${formatDate(lastMatch.date)}` : "Log the first match to start the review cycle." },
          { label: "Output coaching", value: outputDirective, note: "Every match log should produce one clear next action." },
          { label: "Latest focus", value: lastMatch?.review?.q5 || "Set a match focus before the next fixture.", note: "Keep the focus narrow enough to carry into the first phase of the match." },
        ],
        ratingTrend,
        recentMatches: recentMatches.map((match) => ({
          id: match.id,
          title: `vs ${match.opponent}`,
          date: formatDate(match.date),
          metrics: [`${resultLabel(match)} ${match.scoreFor !== "" && match.scoreAgainst !== "" ? `${match.scoreFor}-${match.scoreAgainst}` : ""}`.trim(), `Rating ${Number(match.rating || 0).toFixed(1)}`, `Minutes ${match.minutesPlayed || 0}`],
          note: match.review?.q1 || match.notes || "",
          emphasis: match.review?.q2 || "",
          emphasisTone: C.orange,
        })),
      }}
      renderPreparation={() => <PreMatchSection />}
      renderHistory={() => <MatchHistorySection />}
      renderLineups={() => <LineupBuilderSection />}
      renderNutrition={() => <NutritionSection />}
    />
  );
}

function CoachDashboardPage({ setActive }) {
  const C = useTheme();
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [roster] = usePersistedState(STORAGE_KEYS.roster, []);
  const [wellnessLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const [matches] = usePersistedState(STORAGE_KEYS.matchHistory, []);
  const [nextEvent, setNextEvent] = useState(null);
  const activeIssues = (wellnessLogs || []).filter(log => !log.resolved);
  const availabilityCount = Math.max((roster || []).length - activeIssues.length, 0);
  const acwrData = computeACWR(sessions || []);
  const latestLoad = acwrData.length ? acwrData[acwrData.length - 1] : null;
  const recentSessions = [...(sessions || [])].filter(s => s?.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const lastUpdated = recentSessions[0]?.date || null;

  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then(events => { if (active) setNextEvent(getNextScheduledEvent(events)); })
      .catch(() => { if (active) setNextEvent(getNextScheduledEvent(SEEDED_SCHEDULE_EVENTS)); });
    return () => { active = false; };
  }, []);

  const squadDirective = activeIssues.length ? getAvailabilityDirective(activeIssues) : "Squad availability is clear enough to plan the next block aggressively.";
  const loadDirective = getLoadDirective(latestLoad?.acwr ?? null);

  const clubBadge = (
    <div>
      <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: "0.08em" }}>FC NBSS</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 10, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Naval Base Secondary School · Football CCA</div>
    </div>
  );

  return (
    <CoachDashboardSurface
      theme={C}
      fonts={{ head: FONT_HEAD, body: FONT_BODY }}
      clubBadge={clubBadge}
      summary={{
        title: "SQUAD BOARD",
        subtitle: "Operations, athlete availability, and workload direction are prioritised before everything else.",
        lastUpdated: lastUpdated || "-",
        metrics: [
          { label: "Roster", value: (roster || []).length, note: "Players in system", tone: C.gold },
          { label: "Available", value: availabilityCount, note: "Without active issues", tone: C.success },
          { label: "Active issues", value: activeIssues.length, note: "Need intervention", tone: activeIssues.length ? C.orange : C.success },
          { label: "Acute load", value: latestLoad ? latestLoad.acute : "-", note: "Latest 7-day average", tone: C.electric },
          { label: "Match records", value: matches.length, note: "Stored outputs", tone: C.orange },
          { label: "Current ACWR", value: latestLoad ? latestLoad.acwr.toFixed(2) : "-", note: "Latest load ratio", tone: latestLoad?.acwr > 1.3 ? C.orange : C.success },
        ],
        guidance: [
          { label: "Next session", value: nextEvent ? nextEvent.title : "No schedule", note: nextEvent ? `${nextEvent.date}${nextEvent.time ? ` · ${nextEvent.time}` : ""}` : "Schedule feed unavailable", bg: `${C.gold}08`, border: `${C.gold}20`, labelTone: C.gold },
          { label: "Recommendation", value: squadDirective, note: "This recommendation updates from current availability constraints." },
          { label: "Load coaching", value: loadDirective, note: latestLoad ? `Current ACWR ${latestLoad.acwr.toFixed(2)}.` : "Use consistent load capture to unlock this view." },
        ],
        watchlist: activeIssues.map((log) => ({
          id: log.id,
          title: log.location,
          date: log.date || "-",
          metrics: [log.rtp ? `Estimated return ${log.rtp}` : "Return date not set"],
          note: log.notes || "Availability issue logged.",
          emphasis: `Severity ${log.severity || "-"}`,
          emphasisTone: Number(log.severity) >= 3 ? C.danger : C.orange,
        })),
        loadTrend: acwrData.slice(-6).map((entry) => ({ date: entry.date.slice(5), acute: entry.acute, chronic: entry.chronic })),
      }}
      renderActions={() => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <GoldButton onClick={() => setActive("squad")} style={{ minWidth: 150 }}>Squad</GoldButton>
          <GoldButton onClick={() => setActive("operations")} secondary style={{ minWidth: 150 }}>Operations</GoldButton>
        </div>
      )}
    />
  );
}

function CoachSquadPage() {
  const C = useTheme();
  const [roster] = usePersistedState(STORAGE_KEYS.roster, []);
  const [wellnessLogs] = usePersistedState(STORAGE_KEYS.wellnessLog, []);
  const activeIssues = (wellnessLogs || []).filter(log => !log.resolved);
  return (
    <CoachSquadSurface
      theme={C}
      fonts={{ head: FONT_HEAD, body: FONT_BODY }}
      summary={{
        title: "SQUAD",
        subtitle: "Availability, roster status, and attendance access are organised into one surface.",
        lastUpdated: activeIssues[0]?.date || "-",
        metrics: [
          { label: "Roster size", value: (roster || []).length, note: "Players currently stored", tone: C.gold },
          { label: "Active issues", value: activeIssues.length, note: "Availability constraints", tone: activeIssues.length ? C.orange : C.success },
          { label: "Available", value: Math.max((roster || []).length - activeIssues.length, 0), note: "Estimated available athletes", tone: C.success },
        ],
        guidance: [
          { label: "Recommendation", value: getAvailabilityDirective(activeIssues), note: "Use the attendance view to lock the operational picture.", bg: `${C.gold}08`, border: `${C.gold}20`, labelTone: C.gold },
        ],
        watchlist: activeIssues.map((log) => ({
          id: log.id,
          title: log.location,
          date: log.date || "-",
          metrics: [log.rtp ? `Estimated return ${log.rtp}` : "Return date not set"],
          note: log.notes || "Availability issue logged.",
        })),
      }}
      renderAttendance={() => (
        <TeacherAttendanceGate>
          <ClusterAttendance />
        </TeacherAttendanceGate>
      )}
    />
  );
}

function CoachOperationsPage() {
  const C = useTheme();
  const [lineups] = usePersistedState(STORAGE_KEYS.lineups, []);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    let active = true;
    fetchScheduleEntries()
      .then((events) => {
        if (!active) return;
        setScheduleEvents(events);
        setNextEvent(getNextScheduledEvent(events));
        setLastFetched(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {
        if (!active) return;
        setScheduleEvents(SEEDED_SCHEDULE_EVENTS);
        setNextEvent(getNextScheduledEvent(SEEDED_SCHEDULE_EVENTS));
        setLastFetched(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      });
    return () => { active = false; };
  }, []);

  return (
    <CoachOperationsSurface
      theme={C}
      fonts={{ head: FONT_HEAD, body: FONT_BODY }}
      summary={{
        title: "OPERATIONS",
        subtitle: "Schedule control, lineups, and outbound communication stay inside one operational surface.",
        lastUpdated: lastFetched || "-",
        metrics: [
          { label: "Next event", value: nextEvent ? nextEvent.title : "No schedule", note: nextEvent ? `${nextEvent.date}${nextEvent.time ? ` · ${nextEvent.time}` : ""}. Confirm staff, venue, and comms.` : "Schedule feed unavailable", tone: C.gold },
          { label: "Schedule items", value: scheduleEvents.length, note: "Current loaded events", tone: C.electric },
          { label: "Saved lineups", value: lineups.length, note: lineups.length ? "Stored tactical plans ready for selection review." : "Stored tactical plans", tone: C.orange },
        ],
        guidance: [
          { label: "Recommendation", value: nextEvent ? `Prepare operations for ${nextEvent.title} next.` : "Load the schedule and confirm the next operational milestone.", note: "Use schedule, lineups, and announcements together for cleaner execution.", bg: `${C.gold}08`, border: `${C.gold}20`, labelTone: C.gold },
          { label: "Selection readiness", value: lineups.length ? `${lineups.length} lineup plans are saved and available for review.` : "No lineup plan is saved yet.", note: "A saved plan should exist before the next match block." },
        ],
        scheduleHighlights: [
          { label: "Schedule status", value: nextEvent ? `${nextEvent.title} is the next priority.` : "No upcoming event is available in the current feed.", note: nextEvent ? `${nextEvent.date}${nextEvent.time ? ` · ${nextEvent.time}` : ""}` : "Refresh the schedule feed if needed." },
          { label: "Lineup readiness", value: lineups.length ? `${lineups.length} saved lineup plans are available.` : "No lineup plan is saved yet.", note: "Store at least one live lineup plan before the next match block." },
        ],
        recentOutputs: lineups.slice(-3).reverse().map((lineup) => ({
          id: lineup.id,
          title: lineup.opponent || "Lineup",
          date: lineup.date || "-",
          metrics: [lineup.formation || "Formation not set", `${(lineup.players || []).filter((player) => (player || "").trim()).length}/11 starters`],
          note: lineup.notes || "",
        })),
      }}
      renderSchedule={() => <ScheduleCard />}
      renderLineups={() => <LineupBuilderSection />}
      renderAnnouncements={() => (
        <>
          <AnnouncementBoard />
          <LocalTrustPanel
            theme={C}
            fonts={{ head: FONT_HEAD, body: FONT_BODY }}
            title="Operations Backup"
            description="Operational records are stored on this device. Export backups before device changes and import them to restore coach-side data."
            storageItems={coachTrustItems}
          />
        </>
      )}
    />
  );
}

// ══════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [profile, setProfile] = usePersistedState(STORAGE_KEYS.profile, { name: "", position: "Midfielder", level: "beginner", firstGoal: "", onboarded: false });
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("nbss-theme") !== "light"; } catch { return true; }
  });
  const [viewAsPlayer, setViewAsPlayer] = useState(false);
  const theme = isDark ? DARK_C : LIGHT_C;

  const toggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      try { localStorage.setItem("nbss-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  // Force re-onboarding whenever PROFILE_VERSION is bumped.
  // Preserves existing data but resets the onboarded flag so the user sees the new flow.
  useEffect(() => {
    if (profile.version !== PROFILE_VERSION) {
      setProfile(prev => ({ ...prev, onboarded: false, version: PROFILE_VERSION }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [active]);

  const isCoach = profile?.role === "coach";
  // Coaches can preview the app as a player — viewAsPlayer toggles this
  const effectiveIsCoach = isCoach && !viewAsPlayer;
  const navItems = effectiveIsCoach ? COACH_PRIMARY_NAV : PLAYER_PRIMARY_NAV;

  // Compute streak + daysSinceLast for global ticker
  const _sessionsSorted = [...(sessions || [])].filter(s => s?.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  const _tickerStreak = (() => {
    if (!_sessionsSorted.length) return 0;
    let count = 0; let cur = new Date(); cur.setHours(0, 0, 0, 0);
    for (const s of _sessionsSorted) {
      const d = new Date(s.date); d.setHours(0, 0, 0, 0);
      if (Math.round((cur - d) / 86400000) <= 1) { count++; cur = d; } else break;
    }
    return count;
  })();
  const _lastSession = _sessionsSorted[0] || null;
  const _daysSinceLast = _lastSession ? Math.round((new Date() - new Date(_lastSession.date)) / 86400000) : null;
  const validRouteIds = navItems.map(item => item.id);

  useEffect(() => {
    if (!validRouteIds.includes(active)) setActive("dashboard");
  }, [active, validRouteIds]);

  const handleOnboardingComplete = (data) => {
    setProfile({ ...data, version: PROFILE_VERSION });
  };

  return (
    <ThemeContext.Provider value={theme}>
      {!profile?.onboarded && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: ${theme.navy};
          color: ${theme.textBright};
          font-family: ${FONT_BODY};
          -webkit-font-smoothing: antialiased;
          transition: background 0.3s ease, color 0.3s ease;
          padding-top: 36px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${theme.navyCard}; }
        ::-webkit-scrollbar-thumb { background: ${theme.navyBorder}; border-radius: 2px; }

        input, select, textarea { color-scheme: ${isDark ? "dark" : "light"}; }
        input:focus, select:focus, textarea:focus { border-color: ${theme.textMid} !important; }
        input::placeholder, textarea::placeholder { color: ${theme.textDim}; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .mob-btn { display: block !important; }
          .nav-l {
            display: none !important;
            position: absolute; top: 64px; left: 0; right: 0;
            background: ${isDark ? "rgba(5,15,30,0.98)" : "rgba(240,244,248,0.98)"};
            backdrop-filter: blur(20px);
            flex-direction: column; padding: 16px;
            border-bottom: 1px solid ${theme.navyBorder};
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          .nav-l.nav-open { display: flex !important; }
        }
      `}</style>

      <Navbar
        active={active} setActive={setActive} isDark={isDark} onToggleTheme={toggleTheme}
        navItems={navItems} roleLabel={effectiveIsCoach ? "Coach" : "Player"}
        isCoach={isCoach} viewAsPlayer={viewAsPlayer}
        onToggleView={(asPlayer) => { setViewAsPlayer(asPlayer); setActive("dashboard"); }}
      />

      {/* ── GLOBAL PERSISTENT TICKER — always visible on every page ── */}
      <HeroTicker profile={profile} sessions={sessions} streak={_tickerStreak} daysSinceLast={_daysSinceLast} />


      {!effectiveIsCoach && active === "dashboard" && <PlayerDashboardPage setActive={setActive} profile={profile} sessions={sessions} />}
      {!effectiveIsCoach && active === "performance" && <PlayerPerformancePage />}
      {!effectiveIsCoach && active === "match" && <PlayerMatchPage />}
      {!effectiveIsCoach && active === "hub" && <TeamHubSection />}

      {effectiveIsCoach && active === "dashboard" && <CoachDashboardPage setActive={setActive} />}
      {effectiveIsCoach && active === "squad" && <CoachSquadPage />}
      {effectiveIsCoach && active === "operations" && <CoachOperationsPage />}
      {effectiveIsCoach && active === "hub" && <TeamHubSection />}

      <footer style={{ textAlign: "center", padding: "48px 24px", borderTop: `1px solid ${theme.navyBorder}`, background: theme.navyDeep, transition: "background 0.3s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: theme.navyCard, border: `1px solid ${theme.navyBorder}`, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: theme.textDim }}>Powered by</span>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: theme.gold, letterSpacing: 1 }}>GamePlan</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: theme.textDim }}>· Performance and Development Platform</span>
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: theme.textDim, margin: "16px 0 0" }}>Created by: <span style={{ color: theme.gold, fontWeight: 700 }}>Muhammad Herwanto</span></p>
      </footer>
    </ThemeContext.Provider>
  );
}
