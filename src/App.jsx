import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

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

async function captureAndDownload(el, filename = "nbss-export.png", opts = {}) {
  const h2c = await loadHtml2Canvas();
  const canvas = await h2c(el, {
    backgroundColor: "#050f1e",
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

async function captureAndShare(el, title = "NBSS Football CCA", opts = {}) {
  const h2c = await loadHtml2Canvas();
  const canvas = await h2c(el, {
    backgroundColor: "#050f1e",
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
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "nbss-share.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ title, files: [file] }); return; } catch {}
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      alert("📋 Copied to clipboard! Paste into WhatsApp, Telegram or anywhere.");
    } catch {
      captureAndDownload(el, "nbss-share.png", opts);
    }
  });
}

// Reusable Share+Save action bar
function ShareSaveBar({ targetRef, filename, title, style: s = {} }) {
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleSave = async () => {
    if (!targetRef.current) return;
    setSaving(true);
    try { await captureAndDownload(targetRef.current, filename || "nbss-export.png"); }
    catch (e) { alert("Screenshot failed. Try again."); }
    setSaving(false);
  };

  const handleShare = async () => {
    if (!targetRef.current) return;
    setSharing(true);
    try { await captureAndShare(targetRef.current, title || "NBSS Football CCA"); }
    catch (e) { alert("Share failed. Try the Save Photo option instead."); }
    setSharing(false);
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", ...s }}>
      <button onClick={handleShare} disabled={sharing} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
        background: sharing ? "#1a2d45" : "rgba(56,189,248,0.1)",
        border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8",
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, cursor: sharing ? "wait" : "pointer",
        transition: "all 0.2s",
      }}>
        {sharing ? "⏳ Sharing…" : "↗ Share"}
      </button>
      <button onClick={handleSave} disabled={saving} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
        background: saving ? "#1a2d45" : "rgba(240,180,41,0.1)",
        border: "1px solid rgba(240,180,41,0.25)", color: "#f0b429",
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, cursor: saving ? "wait" : "pointer",
        transition: "all 0.2s",
      }}>
        {saving ? "⏳ Saving…" : "📸 Save Photo"}
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  NBSS FOOTBALL CCA — PREMIUM EDITION
//  Naval Base Secondary School · GamePlan Platform
// ═══════════════════════════════════════════════════════════════

// ── DESIGN SYSTEM ──
const C = {
  // Core palette
  navy: "#050f1e",
  navyDeep: "#020810",
  navyCard: "#0c1a2e",
  navyBorder: "#1a2d45",
  navyHover: "#142338",

  // Accent
  gold: "#f0b429",
  goldLight: "#ffd166",
  goldDim: "#b8861e",
  goldGlow: "rgba(240,180,41,0.15)",

  // Secondary accent
  electric: "#38bdf8",
  electricDim: "#0284c7",
  electricGlow: "rgba(56,189,248,0.12)",

  // Semantic
  success: "#22d3a5",
  danger: "#f87171",
  orange: "#fb923c",

  // Text
  textBright: "#f8fafc",
  textMid: "#94a3b8",
  textDim: "#475569",

  // Surfaces
  surface: "#0a1628",
  surfaceRaised: "#0e1f35",
  surfaceBorder: "#1e3050",
  surfaceSubtle: "rgba(255,255,255,0.04)",
};

const FONT_HEAD = "'Bebas Neue', sans-serif";
const FONT_BODY = "'DM Sans', sans-serif";
const FONT_SERIF = "'Playfair Display', serif";

// ── SHARED STYLES ──
const labelStyle = {
  fontFamily: FONT_BODY, fontSize: 10, color: C.textDim,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px",
  display: "block", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  background: C.navyCard, border: `1px solid ${C.navyBorder}`,
  color: C.textBright, fontFamily: FONT_BODY, fontSize: 14, outline: "none",
  boxSizing: "border-box", transition: "border-color 0.2s",
};

// ── STORAGE ──
const STORAGE_KEYS = {
  sessions: "nbss-sessions", squad: "nbss-squad", checklist: "nbss-checklist",
  growthJournal: "nbss-growth-journal", goals: "nbss-goals",
  quizScores: "nbss-quiz-scores", lineups: "nbss-lineups",
  fitnessResults: "nbss-fitness-results", profile: "nbss-profile",
  roster: "nbss-cluster-roster", attendance: "nbss-attendance-log",
};

function usePersistedState(key, defaultVal) {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultVal; }
    catch { return defaultVal; }
  });
  const setPersisted = useCallback((valOrFn) => {
    setState(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  }, [key]);
  return [state, setPersisted, true];
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
  { name: "Virgil van Dijk", shortName: "van Dijk", era: "2011–present", recipe: "Resilience", lesson: "Virgil van Dijk's path to becoming the world's best central defender is not a story of instant recognition or early success. It is a story of doors closing, of people saying not good enough, and of a man who refused to accept that verdict. As a teenager, he was released from his club's youth academy. Coaches looked at him and decided he wasn't ready — too raw, not quite there. He dropped into lower levels, kept working, kept growing, and made his way back up through Groningen, Celtic, and Southampton before Liverpool paid a world-record fee for a centre-back. He was 26 years old when that move happened. What followed was nothing short of extraordinary. He anchored Liverpool's defence through a Champions League-winning season, a Premier League title, and consistently formed one of the most formidable defensive partnerships the game has seen. But the chapter of his story that speaks loudest about Resilience is what happened after his ACL injury in 2020 — an injury so severe that it robbed him of almost an entire season. Many wondered if he would ever return as the same player. He came back better. Resilience isn't dramatic or loud. It's the quiet decision to turn up, do the work, and let the results follow. Van Dijk is the definition of that.", badge: "🏔️", stat: "UCL + PL winner · World-record fee for a defender" },
  { name: "Mohamed Salah", shortName: "Salah", era: "2010–present", recipe: "Resilience", lesson: "When Mohamed Salah left Egypt as a young man with a dream, nobody could have predicted what would follow. He was signed by Chelsea — one of the world's biggest clubs — but was given almost no opportunity to play. He sat on the bench, watched weeks pass, and when chances finally came, they didn't stick. Chelsea loaned him, then sold him on. To many observers, it looked like the end of a story that had barely started. Salah chose to see it as a beginning. He moved to Fiorentina, then Roma, and it was there that the world finally began to see the full scope of what this man could do. His pace, his directness, his ability to score from angles that seemed impossible — it was all being built, refined, tested. When Liverpool came calling, the rest is history. In his first season at Anfield, he broke the Premier League's single-season scoring record. He won the Champions League, the Premier League, multiple Golden Boots. He became the most feared attacker in the world. But the detail that elevates him further is how he has quietly given back to his home village in Egypt — building hospitals, improving infrastructure, transforming lives long before it was fashionable. His career teaches Resilience in its truest form: that one rejection, or five, means nothing if you refuse to stop.", badge: "👑", stat: "PL Golden Boot × 4 · Champions League winner" },
  { name: "Lamine Yamal", shortName: "Yamal", era: "2023–present", recipe: "Excellence", lesson: "There is no gentle way to say this: Lamine Yamal is doing things in football that have never been done before. At 16 years old, he became the youngest goalscorer in the history of the UEFA European Championship — scoring a bending, brilliant goal in the semi-final against France that left the entire stadium open-mouthed. He went on to win the tournament with Spain, collecting the Young Player award as a 16-year-old competing against men who had been professionals for a decade. He had already broken records at Barcelona — youngest to appear for the club, youngest to score — erasing numbers that had stood for generations. What makes Yamal extraordinary is not just the talent, which is obvious to anyone watching. It is the composure and the joy. He plays with a freedom that is rare at any age, let alone at 16. There is no hesitation, no fear, no shrinking from the moment. When the ball comes to him in a big game, he takes on defenders and creates chances as if the pressure simply doesn't register. This is Excellence pursued with absolute Passion — football played with complete joy and complete commitment. For every young player at NBSS who wonders whether their generation can produce something special, Lamine Yamal is the answer. He is your generation. He is 16 and already changing the game. What are you building right now?", badge: "🌟", stat: "Euro 2024 champion at 16 · Youngest ever Euros goalscorer" },
  { name: "Kylian Mbappé", shortName: "Mbappé", era: "2015–present", recipe: "Excellence", lesson: "Kylian Mbappé grew up in Bondy, a suburb of Paris, where football was everything and the dreams were as large as the city felt distant. From the moment he emerged as a teenager at Monaco, it was clear this was not an ordinary talent. His pace was frightening. His finishing was clinical. His composure in the biggest moments — the kind that makes senior professionals nervous — was somehow already fully formed at 18 and 19. At 19, he was a World Cup winner with France, scoring in the final and becoming only the second teenager in history to score in a World Cup final, after Pelé. What has followed has only confirmed what those early glimpses suggested: one of the most gifted attackers the sport has ever produced. But the detail that elevates him beyond his statistics is this: Mbappé donates every euro he earns from the French national team — every match fee — to a charity he founded for underprivileged children. He has done this quietly, consistently, without fanfare. He has also spoken publicly about using his platform to stand against racism and for social justice, understanding that the biggest stage carries the biggest responsibility. This is Excellence with Care — not just pursuing greatness on the pitch, but caring about the world you are part of. Mbappé is fast, yes. But the most important speed is how quickly he chooses to give back.", badge: "⚡", stat: "World Cup winner at 19 · Donates all national team earnings to charity" },
  { name: "Manuel Neuer", shortName: "Neuer", era: "2004–present", recipe: "Excellence", lesson: "Manuel Neuer did not just become a great goalkeeper. He changed what the position means. Before Neuer, the goalkeeper's job was largely defined by what happened in an 18-yard box — stop the shots, command the area, stay between the sticks. Neuer tore that definition up. He became the sweeper-keeper — a goalkeeper who operates like an additional outfield player, sweeping behind the defensive line, reading the game, distributing with the precision of a midfielder. He extended his team's defensive line by 20 or 30 metres. He won duels in areas no goalkeeper had any business being in. And he did all of it with a composure that made the previously unthinkable look routine. To pull on the German national shirt and the Bayern Munich jersey for as long as he did, to lift the World Cup, to collect Bundesliga titles at a rate that defied belief — this is Excellence at its highest. But the chapter of Neuer's story that speaks most directly to Resilience is what happened across 2017 and 2023, when serious injuries threatened to end his career. Each time, he came back. Methodically, professionally, with the same quiet determination that has defined every part of his career. At 37, he was still performing at the highest level in Europe. Resilience isn't loud. Manuel Neuer's career is the proof.", badge: "🧤", stat: "World Cup winner · 10× Bundesliga · Revolutionised modern goalkeeping" },
  { name: "Pelé", shortName: "Pelé", era: "1956–1977", recipe: "Passion", flag: "br", lesson: "Before we understood what football could be — before the global game, before the Champions League, before the billions — there was Pelé. And even measured against everything that has come since, the story of Edson Arantes do Nascimento remains one of the most remarkable in the history of sport. He grew up in such poverty in Brazil that his family could not afford a football. He played with a sock stuffed with newspapers, or with grapefruits, or with anything round enough to kick. He shined shoes to contribute to the household income. Football was not a hobby — it was an escape, a dream, and a way of seeing what the world might hold for a boy with nothing but talent and an absolute, unconditional love for the game. He turned professional at 15. He played in his first World Cup at 17, scoring in the final to help Brazil lift the trophy, and he wept on the pitch — a child, overcome with joy. He would go on to win two more World Cups. He became synonymous with football itself in a way that no player before or since can quite claim. Pelé's lesson is about Passion in its most essential form: a love for the game so complete, so unconditional, that no obstacle — not poverty, not circumstance, not anything — could prevent him from giving everything he had. When you step onto the NBSS pitch, you carry more than most who came before you ever did. Play like you mean it.", badge: "🇧🇷", stat: "3× World Cup winner · Only player to win three World Cups" },
  { name: "Ronaldo Nazário", shortName: "Ronaldo", era: "1993–2011", recipe: "Resilience", lesson: "Ask any footballer of the 1990s and early 2000s who the best player in the world was, and the answer would almost always be the same: Ronaldo. Not Cristiano. El Fenómeno. The original. Ronaldo Nazário arrived in European football like a force of nature — a centre forward with the first touch of a magician, the pace of a sprinter, and a finishing ability so complete that goalkeepers across Europe ran out of answers. He scored extraordinary goals with disturbing regularity. He scored in finals. He delivered under the biggest pressure the sport could generate, and made it look inevitable. At his peak, those who saw him play will tell you with total certainty: he was the most complete forward the game has ever seen. And then the injuries came. His knee, in 2000 — a rupture so severe that rehabilitation alone took the better part of two years. He came back. Then it happened again. And again. At one point, many in football wondered if they would ever see the real Ronaldo again. They did. In 2002, he led Brazil's World Cup campaign, won the Golden Boot, and scored twice in the final — returning from total devastation to the highest stage in football, delivering at the defining moment. This is Resilience in its most powerful form: being knocked down harder than anyone should have to be, and getting back up anyway. His story is proof that what defines you is not the injury. It is the comeback.", badge: "🔥", stat: "2× World Cup winner · 2× Ballon d'Or · El Fenómeno" },
];

const LEGENDS_SG = [
  { name: "Fandi Ahmad", shortName: "Fandi Ahmad", era: "1978–1997", recipe: "Excellence", lesson: "There is a simple reason why, decades after he last played, Fandi Ahmad's name still stops a room. He is widely accepted as the greatest footballer Singapore has ever produced — and no one who has come since has come close to changing that verdict. Fandi didn't just dominate Southeast Asia; at 17, he was already scoring against Pelé's Santos, announcing himself on a stage most Singaporeans could barely imagine. He then made the journey to Europe, signing for Dutch club FC Groningen and famously scoring against Inter Milan — a moment that proved, beyond any doubt, that this was a player of genuine global quality. He returned to Singapore as its all-time top scorer, a record that still stands. But the numbers only tell part of the story. What Fandi gave Singapore was something far bigger than goals — he gave an entire generation the belief that a Singaporean could compete at the very highest level of world football. Not just participate. Compete. His talent was extraordinary. His courage was greater. And his love for the game, for his country, and for the players who came after him has never wavered. When young players in Singapore dream of making it, they are walking a path that Fandi Ahmad blazed before any of them were born.", badge: "⭐", stat: "Singapore's greatest player ever · Scored vs Inter Milan" },
  { name: "Ikhsan Fandi", shortName: "Ikhsan Fandi", era: "2018–present", recipe: "Integrity", lesson: "Growing up as the son of Singapore's greatest ever footballer could easily become a burden — a name too large to carry, an expectation impossible to meet. Ikhsan Fandi chose to see it differently. He used his father's story not as a shadow to hide from, but as a standard to chase. And he has chased it fearlessly. Ikhsan became the first Singaporean to play in the Norwegian top flight, earning professional contracts in Europe on his own merit and proving that the Fandi legacy is not nostalgia — it is a living, breathing force in Singapore football right now. On the pitch, he plays with courage and directness, never backing down from a challenge, always demanding the ball and making things happen. He carries the Lions badge with pride every time he pulls it on, and he understands the weight of what that badge means. But what makes Ikhsan truly special as a figure for young players is this: he didn't get to where he is because of his father's name. He got there because he outworked the doubts, embraced the pressure, and refused to let the size of the legacy stop him from writing his own. Integrity means doing things the right way even when the easy path is available. Your background is not your ceiling. Ikhsan Fandi is proof of that.", badge: "🚀", stat: "First SG player in Norwegian top flight" },
  { name: "Nazri Nasir", shortName: "Nazri Nasir", era: "1993–2012", recipe: "Resilience", lesson: "The story begins before the football. Born the youngest of ten children, Nazri was diagnosed with asthma at eight years old — a moment that could have ended any dream of sport before it started. It didn't. His passion and determination were so clear that his selection for Singapore's Under-16 Asian Youth team in 1986 convinced his parents that football was his path. From that point on, he never looked back. Nazri became a midfield general in every sense — a dynamo who covered every blade of grass, won every tackle he could reach, and gave absolutely everything every single time he crossed the white line. He was the kind of player who never shied away, never hid, and never complained — even when asked to play striker, he delivered without a word of protest. He could score from distance too, with some truly spectacular efforts that left goalkeepers with no chance. At club level, he was part of the historic Malaysia League and Malaysia Cup double-winning side in 1994. But it was as captain of the Singapore National Team from 1998 to 2003 that he sealed his legacy — leading the Lions to Tiger Cup glory in 1998 and becoming the first Singapore captain ever to lift an international trophy. From a child told his asthma might stop him playing, to the man who raised Singapore's first international silverware. That is Nazri Nasir.", badge: "⚡", stat: "First SG captain to lift international trophy · Tiger Cup 1998" },
  { name: "Aleksandar Đurić", shortName: "Aleksandar Đurić", era: "1996–2013", recipe: "Resilience", lesson: "There are footballers, and then there is Aleksandar Đurić — a man whose story reads like it was written for the screen. He arrived in Singapore with little, could not speak the language, and had no guarantee of anything. What he had was a relentless drive, a warrior's mentality, and a penalty box presence that defenders simply could not handle. He went on to become the S.League's all-time top scorer — a record that speaks to years of consistency, professionalism, and sheer refusal to stop. What made Đurić truly remarkable was that he was still scoring crucial goals well into his 40s, at an age when most professionals are long retired. He became a naturalised Singaporean, wore the Lions badge with immense pride, and gave everything for his adopted nation. His message to every young player is simple and powerful: it doesn't matter where you start, where you come from, or what others expect of you. What matters is the hunger you carry, the work you put in every single day, and the courage to keep going when it gets hard. Đurić lived that. Every single day.", badge: "🦁", stat: "S.League all-time top scorer" },
  { name: "Shahril Ishak", shortName: "Shahril Ishak", era: "2002–2019", recipe: "Respect", lesson: "Not every leader fills a room with noise. Some fill it with something quieter, and rarer — a calm authority that everyone around them instinctively trusts. That was Shahril Ishak. The 'Wizard' captained the Singapore national team not through speeches or chest-beating, but through the sheer quality of his football and the unshakeable composure he brought to every situation. His vision was immaculate. He could see passes that others couldn't even imagine, picking out teammates in pockets of space with a weight and accuracy that looked effortless — though nothing that precise ever is. Defenders tried to press him, rush him, knock him off his rhythm. It rarely worked. Shahril processed the game at his own pace, always one step ahead. His leadership style reflected his playing style — he didn't demand attention, he earned it. Quietly, consistently, and completely. When Singapore needed someone to step up in a big game, the ball would find Shahril. And Shahril would find the right answer. He carried the Lions badge with dignity across nearly two decades of service, winning the AFF Cup and cementing himself as one of the finest technicians Singaporean football has ever seen. Respect is earned, never demanded. A true Wizard — and a true captain.", badge: "🎩", stat: "National team captain · AFF Cup winner" },
  { name: "Indra Sahdan", shortName: "Indra Sahdan", era: "1997–2016", recipe: "Passion", lesson: "Every great team needs a striker who makes opponents genuinely nervous. Someone who, the moment the ball plays in behind, the defence knows it's a race they might not win. Indra Sahdan was exactly that player. He was a pure predator — explosive movement in behind the defensive line, a poacher's instinct for being in the right place at exactly the right moment, and a composure in front of goal that was almost unsettling in its coldness. He didn't panic. He didn't snatch. He finished. His greatest individual moment came against Manchester United, one of the most famous football clubs on the planet, when Indra scored against them — a goal that resonated far beyond Singapore and announced to a wider audience that this nation had a striker worth watching. Over nearly two decades in the game, he terrorised defences across Southeast Asia and became one of the most reliable and feared forwards the Lions have ever had. He is proof that clinical finishing is a skill — one built on Passion, relentless practice, intelligent movement, and the mental strength to stay calm when the goal is right in front of you. He loved this game completely. It showed in every shot he took.", badge: "🎯", stat: "Scored vs Manchester United · Nearly two decades serving the Lions" },];

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
  const accentColor = accent || C.gold;
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <span style={{
          width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, background: `${accentColor}15`, border: `1px solid ${accentColor}30`, flexShrink: 0,
        }}>{icon}</span>
        <h2 style={{
          fontFamily: FONT_HEAD, fontSize: "clamp(32px, 5vw, 52px)",
          color: C.textBright, margin: 0, letterSpacing: 2, lineHeight: 1,
        }}>{title}</h2>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: "0 0 0 58px", lineHeight: 1.5 }}>{subtitle}</p>
      <div style={{ height: 1, background: `linear-gradient(90deg, ${accentColor}40, transparent)`, marginTop: 20 }} />
    </div>
  );
}

function Pill({ children, active, onClick, color = C.gold }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 24, cursor: "pointer",
      background: active ? color : C.navyCard,
      color: active ? C.navy : C.textMid,
      border: active ? "none" : `1px solid ${C.navyBorder}`,
      fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
      transition: "all 0.2s ease",
      boxShadow: active ? `0 4px 16px ${color}30` : "none",
    }}>{children}</button>
  );
}

function GoldButton({ children, onClick, style: s = {}, secondary }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 24px", borderRadius: 10, cursor: "pointer",
      background: secondary ? C.navyCard : `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
      color: secondary ? C.textMid : C.navy,
      border: secondary ? `1px solid ${C.navyBorder}` : "none",
      fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
      boxShadow: secondary ? "none" : `0 4px 20px ${C.gold}30`,
      transition: "all 0.2s ease",
      ...s,
    }}>{children}</button>
  );
}

function Card({ children, style: s = {}, glow }) {
  return (
    <div style={{
      background: C.navyCard, border: `1px solid ${C.navyBorder}`,
      borderRadius: 16, padding: 24,
      boxShadow: glow ? `0 0 0 1px ${C.navyBorder}, 0 8px 32px rgba(0,0,0,0.3)` : "none",
      ...s,
    }}>{children}</div>
  );
}

// ══════════════════════════════════════════════════
//  ONBOARDING MODAL
// ══════════════════════════════════════════════════
function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("Midfielder");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

  const handleComplete = () => {
    onComplete({ name: name.trim() || "Player", position, level, firstGoal: goal, onboarded: true });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,15,30,0.97)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 10px", boxShadow: `0 8px 24px ${C.gold}40` }}>⚽</div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 2 }}>NBSS FOOTBALL</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>GamePlan Platform</div>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
          {[1,2,3].map(s => <div key={s} style={{ height: 4, flex: 1, maxWidth: 80, borderRadius: 2, background: step >= s ? C.gold : C.navyBorder, transition: "background 0.3s" }} />)}
        </div>
        <Card glow>
          {step === 1 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>WHAT'S YOUR NAME?</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 20 }}>We'll personalise your experience from day one.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aryan" style={inputStyle} autoFocus onKeyDown={e => e.key === "Enter" && setStep(2)} />
              </div>
              <div>
                <label style={labelStyle}>Your position</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {positions.map(p => <Pill key={p} active={position === p} onClick={() => setPosition(p)} color={C.gold}>{p}</Pill>)}
                </div>
              </div>
              <GoldButton onClick={() => setStep(2)} style={{ marginTop: 24, width: "100%" }}>Next →</GoldButton>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>WHAT'S YOUR LEVEL?</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 20 }}>We'll set up your training program accordingly.</p>
              {Object.entries(TRAINING_DATA).map(([key, val]) => (
                <div key={key} onClick={() => setLevel(key)} style={{ padding: "14px 18px", borderRadius: 12, cursor: "pointer", marginBottom: 8, background: level === key ? `${val.color}15` : C.navyCard, border: `1px solid ${level === key ? val.color + "40" : C.navyBorder}`, transition: "all 0.2s" }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: level === key ? val.color : C.textBright, letterSpacing: 0.5 }}>{val.title.toUpperCase()}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, marginTop: 2 }}>{val.subtitle}</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <GoldButton onClick={() => setStep(1)} secondary style={{ flex: 1 }}>← Back</GoldButton>
                <GoldButton onClick={() => setStep(3)} style={{ flex: 2 }}>Next →</GoldButton>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, letterSpacing: 1, marginBottom: 4 }}>SET YOUR FIRST GOAL</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 16 }}>What do you want to achieve this term?</p>
              <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Run 2.4km under 12 minutes" style={{ ...inputStyle, marginBottom: 12 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {["Master the Cruyff turn", "Run 2.4km under 12 min", "Complete 20 juggles", "Score in a match", "Improve beep test by 1 level"].map(ex => (
                  <button key={ex} onClick={() => setGoal(ex)} style={{ padding: "5px 12px", borderRadius: 20, cursor: "pointer", background: goal === ex ? `${C.electric}20` : C.navyCard, border: `1px solid ${goal === ex ? C.electric : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: goal === ex ? C.electric : C.textMid }}>{ex}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <GoldButton onClick={() => setStep(2)} secondary style={{ flex: 1 }}>← Back</GoldButton>
                <GoldButton onClick={handleComplete} style={{ flex: 2 }}>Let's Go 🔥</GoldButton>
              </div>
            </>
          )}
        </Card>
        {step === 3 && (
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
  return (
    <div style={{ position: "sticky", top: 64, zIndex: 900, background: "rgba(5,15,30,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${C.navyBorder}`, padding: "10px 24px", display: "flex", gap: 6, overflowX: "auto" }}>
      {items.map(t => <Pill key={t.id} active={active === t.id} onClick={() => setActive(t.id)} color={color}>{t.label}</Pill>)}
    </div>
  );
}

function TrainGroup() {
  const [sub, setSub] = useState("training");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.success} active={sub} setActive={setSub} items={[
        { id: "training", label: "🏃 Training Lab" },
        { id: "fitness",  label: "💪 Fitness Tests" },
        { id: "mindset",  label: "🧠 Mindset" },
      ]} />
      {sub === "training" && <TrainingSection />}
      {sub === "fitness"  && <FitnessSection />}
      {sub === "mindset"  && <MindsetSection />}
    </div>
  );
}

function MatchGroup() {
  const [sub, setSub] = useState("lineup");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.electric} active={sub} setActive={setSub} items={[
        { id: "lineup",    label: "📋 Lineup Builder" },
        { id: "nutrition", label: "⛽ Nutrition" },
      ]} />
      {sub === "lineup"    && <LineupBuilderSection />}
      {sub === "nutrition" && <NutritionSection />}
    </div>
  );
}

function ProgressGroup() {
  const [sub, setSub] = useState("tracker");
  return (
    <div style={{ paddingTop: 64 }}>
      <SubNav color={C.electric} active={sub} setActive={setSub} items={[
        { id: "tracker", label: "📊 Tracker" },
        { id: "squad",   label: "🎮 Squad" },
      ]} />
      {sub === "tracker" && <TrackerSection />}
      {sub === "squad"   && <SquadSection />}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════════
function Navbar({ active, setActive }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? "rgba(5,15,30,0.96)" : "rgba(5,15,30,0.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${scrolled ? C.navyBorder : "transparent"}`,
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setActive("home")}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            boxShadow: `0 4px 16px ${C.gold}40`,
          }}>⚽</div>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 17, color: C.textBright, letterSpacing: 2, lineHeight: 1 }}>NBSS FOOTBALL</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 9, color: C.textDim, letterSpacing: 3, textTransform: "uppercase" }}>GamePlan Platform</div>
          </div>
        </div>

        {/* Desktop Nav */}
        <button className="mob-btn" onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: `1px solid ${C.navyBorder}`, color: C.textBright, fontSize: 18, cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
          {open ? "✕" : "☰"}
        </button>

        <div className={`nav-l ${open ? "nav-open" : ""}`} style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {NAV_GROUPS.map(g => (
            <button key={g.id} onClick={() => { setActive(g.id); setOpen(false); }} style={{
              background: active === g.id ? `${C.gold}15` : "transparent",
              color: active === g.id ? C.gold : C.textMid,
              border: active === g.id ? `1px solid ${C.gold}30` : "1px solid transparent",
              padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600,
              transition: "all 0.2s", letterSpacing: 0.3,
            }}
              onMouseEnter={e => { if (active !== g.id) { e.target.style.color = C.textBright; e.target.style.borderColor = C.navyBorder; } }}
              onMouseLeave={e => { if (active !== g.id) { e.target.style.color = C.textMid; e.target.style.borderColor = "transparent"; } }}
            >{g.label}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════
//  HERO
// ══════════════════════════════════════════════════
function HeroSection({ setActive, profile, sessions }) {
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

  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", textAlign: "center",
      padding: "90px 24px 60px", position: "relative", overflow: "hidden",
      background: C.navy,
    }}>
      <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}08 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.electric}06 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 80px, ${C.gold} 80px, ${C.gold} 81px)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, width: "100%" }}>
        {/* Eyebrow / personalised greeting */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 24, border: `1px solid ${C.gold}30`, background: `${C.gold}08`, marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
            {isPersonalised ? `Welcome back, ${profile.name}` : "Naval Base Secondary School"}
          </span>
        </div>

        {/* Streak / nudge chips */}
        {isPersonalised && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
            {streak > 0 && <div style={{ padding: "5px 14px", borderRadius: 20, background: `${C.danger}15`, border: `1px solid ${C.danger}30` }}><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.danger, fontWeight: 700 }}>🔥 {streak} session streak</span></div>}
            {daysSinceLast !== null && <div style={{ padding: "5px 14px", borderRadius: 20, background: daysSinceLast > 3 ? `${C.orange}15` : `${C.success}15`, border: `1px solid ${daysSinceLast > 3 ? C.orange : C.success}30` }}><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: daysSinceLast > 3 ? C.orange : C.success, fontWeight: 700 }}>{daysSinceLast === 0 ? "✅ Trained today" : daysSinceLast > 3 ? `⚠️ ${daysSinceLast} days since last session` : `⏱️ Last session ${daysSinceLast}d ago`}</span></div>}
          </div>
        )}

        <h1 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(56px, 10vw, 104px)", color: C.textBright, margin: 0, lineHeight: 0.95, letterSpacing: 3 }}>
          FOOTBALL{" "}<span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CCA</span>
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: "clamp(14px, 2vw, 17px)", color: C.textMid, marginTop: 16, letterSpacing: 2, textTransform: "uppercase" }}>Train · Grow · Compete · Together</p>

        {/* Quote carousel */}
        <div style={{ marginTop: 44, padding: "28px 36px", background: C.navyCard, borderRadius: 20, border: `1px solid ${C.navyBorder}`, opacity: fade ? 1 : 0, transition: "opacity 0.35s ease", minHeight: 120, boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{q.emoji}</span>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 17, color: C.textBright, fontStyle: "italic", margin: "0 0 10px", lineHeight: 1.6 }}>"{q.text}"</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>— {q.author}</p>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 36 }}>
          {[
            { s: "train",    label: "Start Training", icon: "🏃", primary: true },
            { s: "progress", label: "Track Progress",  icon: "📊" },
            { s: "match",    label: "Match Day",       icon: "⚽" },
            { s: "culture",  label: "Legends",         icon: "🌟" },
          ].map(b => (
            <button key={b.s} onClick={() => setActive(b.s)} style={{
              background: b.primary ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.navyCard,
              color: b.primary ? C.navy : C.textMid, border: b.primary ? "none" : `1px solid ${C.navyBorder}`,
              padding: "14px 28px", borderRadius: 12, cursor: "pointer",
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: b.primary ? `0 8px 32px ${C.gold}35` : "none", transition: "all 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            ><span>{b.icon}</span> {b.label}</button>
          ))}
        </div>

        {/* Daily IQ Question */}
        <div style={{ marginTop: 48, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: `${C.electric}15`, border: `1px solid ${C.electric}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</span>
            <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: C.electric, letterSpacing: 2 }}>TODAY'S FOOTBALL IQ</span>
          </div>
          <div style={{ padding: "20px 24px", background: C.navyCard, borderRadius: 16, border: `1px solid ${C.navyBorder}` }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textBright, fontWeight: 600, margin: "0 0 16px", lineHeight: 1.5 }}>{todayQ.q}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {todayQ.opts.map((opt, i) => (
                <button key={i} onClick={() => setIqRevealed(true)} style={{
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: iqRevealed ? (i === todayQ.correct ? `${C.success}20` : `${C.navyBorder}40`) : C.navyCard,
                  border: `1px solid ${iqRevealed ? (i === todayQ.correct ? C.success : C.navyBorder) : C.navyBorder}`,
                  fontFamily: FONT_BODY, fontSize: 13,
                  color: iqRevealed ? (i === todayQ.correct ? C.success : C.textDim) : C.textMid,
                  fontWeight: iqRevealed && i === todayQ.correct ? 700 : 400, transition: "all 0.2s",
                }}>{opt}</button>
              ))}
            </div>
            {iqRevealed
              ? <div style={{ padding: "10px 14px", borderRadius: 8, background: `${C.success}10`, border: `1px solid ${C.success}20` }}><p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.success, margin: 0, lineHeight: 1.5 }}>✅ {todayQ.explain}</p></div>
              : <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, margin: 0, textAlign: "center" }}>Tap any answer to reveal — one per day 🎯</p>
            }
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 56, flexWrap: "wrap" }}>
          {[{ val: "5", label: "Sections" }, { val: "3", label: "Training Levels" }, { val: "20+", label: "Food Items" }, { val: "20", label: "IQ Questions" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 36, color: C.gold, letterSpacing: 1 }}>{s.val}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════
//  TRAINING
// ══════════════════════════════════════════════════
function TrainingSection() {
  const [level, setLevel] = useState("beginner");
  const [openWeek, setOpenWeek] = useState(0);
  const data = TRAINING_DATA[level];

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🏃" title="TRAINING LAB" subtitle="Progressive drills from foundation to elite — tap 🎬 to see how it's done" accent={C.success} />

      {/* Level selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {Object.entries(TRAINING_DATA).map(([key, val]) => (
          <button key={key} onClick={() => { setLevel(key); setOpenWeek(0); }} style={{
            padding: "10px 22px", borderRadius: 10, cursor: "pointer",
            background: level === key ? val.color : C.navyCard,
            color: level === key ? (key === "beginner" ? C.navy : C.textBright) : C.textMid,
            border: level === key ? "none" : `1px solid ${C.navyBorder}`,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
            boxShadow: level === key ? `0 4px 20px ${val.color}30` : "none",
            transition: "all 0.2s",
          }}>
            {val.title}
            <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 1, opacity: 0.8 }}>{val.subtitle.split("·")[0].trim()}</span>
          </button>
        ))}
      </div>

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
                      background: `${C.danger}10`, border: `1px solid ${C.danger}20`,
                      textDecoration: "none", fontFamily: FONT_BODY, fontSize: 11,
                      color: C.danger, fontWeight: 700, flexShrink: 0,
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
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timing, setTiming] = useState("pre");
  const [selectedFood, setSelectedFood] = useState(null);

  const timingLabels = { pre: "Pre-Training", post: "Post-Training", match: "Match Day" };
  const ratingColors = { green: C.success, amber: C.orange, red: C.danger };
  const ratingLabels = { green: "Great choice", amber: "Okay, not ideal", red: "Avoid this" };
  const filteredFoods = searchTerm.trim().length > 0 ? FOOD_DB.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())) : FOOD_DB;

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🍽️" title="FUEL STATION" subtitle="What to eat, when to eat it — simplified for student athletes" accent={C.success} />

      {/* Food Checker */}
      <button onClick={() => setCheckerOpen(!checkerOpen)} style={{
        width: "100%", padding: 16, borderRadius: 14, cursor: "pointer", marginBottom: 24,
        background: checkerOpen ? C.navyCard : `linear-gradient(135deg, ${C.navy}, ${C.navyCard})`,
        color: checkerOpen ? C.danger : C.gold,
        border: checkerOpen ? `1px solid ${C.danger}30` : `1px solid ${C.gold}30`,
        fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        {checkerOpen ? "✕ Close Food Checker" : "🔍 Food Checker — Is your meal match-ready?"}
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
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🧠" title="MINDSET ZONE" subtitle="The mental game separates good players from great ones" accent={C.electric} />

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
//  FITNESS
// ══════════════════════════════════════════════════
function FitnessSection() {
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
    setResults(prev => ({ ...prev, [testName]: { ...prev[testName], entries: prev[testName].entries.filter(e => e.id !== id) } }));
  };

  const setTarget = (testName, val) => {
    setResults(prev => ({ ...prev, [testName]: { ...(prev[testName] || { entries: [] }), target: val } }));
  };

  const getChartData = (testName) => ((results[testName]?.entries || [])).map(e => ({ date: e.date.slice(5), value: parseFloat(e.value) || 0 }));

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="💪" title="FITNESS BENCHMARKS" subtitle="Track your results, see your progress, set your targets" accent={C.danger} />
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
                  padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "none",
                  background: showLog === test.name ? `${C.danger}15` : C.gold,
                  color: showLog === test.name ? C.danger : C.navy,
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                }}>
                  {showLog === test.name ? "Cancel" : `+ Log Result (${entries.length})`}
                </button>
                {entries.length >= 2 && (
                  <button onClick={() => { setShowChart(showChart === test.name ? null : test.name); setShowLog(null); }} style={{
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer",
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
  const [sessions, setSessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊", duration: "", rpe: 5, sleep: 3, energy: 3, soreness: 3 });
  const [year, setYear] = useState("Sec 1");
  const [quickType, setQuickType] = useState("training");
  const [quickRating, setQuickRating] = useState(3);
  const exportRef = useRef(null);

  const moods = ["😤", "😔", "😐", "😊", "🔥"];

  const addEntry = () => {
    if (!form.date) return;
    const load = (parseInt(form.rpe) || 0) * (parseInt(form.duration) || 0);
    const readinessScore = Math.round(((+form.sleep + +form.energy + (6 - +form.soreness)) / 15) * 100);
    setSessions(prev => [...prev, { ...form, id: Date.now(), year, load, readinessScore }]);
    setForm({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊", duration: "", rpe: 5, sleep: 3, energy: 3, soreness: 3 });
    setShowForm(false);
  };

  const quickLog = () => {
    const today = new Date().toISOString().split("T")[0];
    setSessions(prev => [...prev, { date: today, type: quickType, rating: quickRating, notes: "", goals: "", mood: "😊", id: Date.now(), year, load: 0, readinessScore: null }]);
  };

  const deleteEntry = (id) => setSessions(prev => prev.filter(e => e.id !== id));

  const yearSessions = sessions.filter(s => s.year === year);
  const avgRating = yearSessions.length ? (yearSessions.reduce((s, e) => s + e.rating, 0) / yearSessions.length).toFixed(1) : "–";

  const typeColors = { training: C.electric, match: C.gold, fitness: C.success, recovery: C.orange };

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="📊" title="PROGRESS TRACKER" subtitle="Log sessions, track your load and growth from Sec 1 to Sec 4" accent={C.electric} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Sessions", value: sessions.length, icon: "📝", color: C.electric },
          { label: `${year} Sessions`, value: yearSessions.length, icon: "📅", color: C.gold },
          { label: "Avg Rating", value: avgRating, icon: "⭐", color: C.success },
          { label: "Current Year", value: year, icon: "🎓", color: C.orange },
        ].map((s, i) => (
          <div key={i} style={{ background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 14, padding: "18px 14px", textAlign: "center", borderTop: `3px solid ${s.color}` }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
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
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, letterSpacing: 1 }}>⚡ TRAINING LOAD — ACWR</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 22, color: acwrColor }}>{last.acwr.toFixed(2)}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, padding: "3px 10px", borderRadius: 6, background: `${acwrColor}15`, color: acwrColor, fontWeight: 700 }}>
                  {last.acwr > 1.5 ? "⚠️ HIGH RISK" : last.acwr > 1.3 ? "🔶 CAUTION" : last.acwr < 0.8 ? "📉 UNDERTRAINING" : "✅ OPTIMAL"}
                </span>
              </div>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>Acute:Chronic Workload Ratio (7-day vs 28-day). Target: 0.8 – 1.3 ✅</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={acwrData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
          </Card>
        );
      })()}

      {/* Year filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["Sec 1","Sec 2","Sec 3","Sec 4"].map(y => <Pill key={y} active={year === y} onClick={() => setYear(y)} color={C.gold}>{y}</Pill>)}
      </div>

      {/* Quick Log */}
      <Card style={{ marginBottom: 16, border: `1px solid ${C.electric}25` }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.electric, letterSpacing: 1, marginBottom: 8 }}>⚡ QUICK LOG</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, marginBottom: 12 }}>Log today in 2 taps — no form needed.</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {[{type:"training",label:"🏃 Training",color:C.electric},{type:"match",label:"⚽ Match",color:C.gold},{type:"fitness",label:"💪 Fitness",color:C.success},{type:"recovery",label:"🧊 Recovery",color:C.orange}].map(t => (
            <button key={t.type} onClick={() => setQuickType(t.type)} style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", background: quickType === t.type ? `${t.color}20` : C.navyCard, border: `1px solid ${quickType === t.type ? t.color : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 12, color: quickType === t.type ? t.color : C.textMid, fontWeight: quickType === t.type ? 700 : 400 }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim }}>Quality:</span>
          {[1,2,3,4,5].map(r => (
            <button key={r} onClick={() => setQuickRating(r)} style={{ width: 36, height: 36, borderRadius: 8, cursor: "pointer", background: quickRating >= r ? C.gold : C.navyCard, border: quickRating >= r ? "none" : `1px solid ${C.navyBorder}`, color: quickRating >= r ? C.navy : C.textDim, fontSize: 14, fontWeight: 700 }}>{r}</button>
          ))}
        </div>
        <GoldButton onClick={quickLog} style={{ width: "100%" }}>Log {quickType.charAt(0).toUpperCase()+quickType.slice(1)} Session ✓</GoldButton>
      </Card>

      <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm} style={{ width: "100%", marginBottom: 20 }}>
        {showForm ? "✕ Cancel" : "+ Log Detailed Session"}
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
            <label style={labelStyle}>Mood After Session</label>
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
          <GoldButton onClick={addEntry} style={{ marginTop: 18, width: "100%" }}>Save Entry ✓</GoldButton>
        </Card>
      )}

      {yearSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
          <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>📋</span>
          <p style={{ fontFamily: FONT_BODY, color: C.textMid, fontSize: 15, fontWeight: 600 }}>No sessions logged for {year} yet.</p>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>Use the Quick Log above to start — takes 5 seconds. Your first log earns you the <strong style={{ color: C.gold }}>First Touch 🏅</strong> badge.</p>
          <p style={{ fontFamily: FONT_SERIF, color: C.textDim, fontSize: 13, fontStyle: "italic", marginTop: 12 }}>"What gets measured, gets improved."</p>
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
                  {entry.notes && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMid, marginTop: 2 }}>{entry.notes}</div>}
                  {entry.goals && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.electric, marginTop: 2 }}>🎯 {entry.goals}</div>}
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
          <ShareSaveBar targetRef={exportRef} filename="nbss-tracker.png" title="My NBSS Training Progress" />
        </div>
      )}
    </section>
  );
}
// ══════════════════════════════════════════════════
function SquadSection() {
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad, setSquad] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "" });
  const [editing, setEditing] = useState(false);
  const [tempSquad, setTempSquad] = useState({ name: "", position: "", number: "" });
  const exportRef = useRef(null);

  const { xp, earned } = computeXpAndBadges(sessions, growthEntries);
  const lvl = getLevel(xp);
  const hasProfile = squad.name?.trim().length > 0;

  const saveProfile = () => { setSquad(tempSquad); setEditing(false); };
  const startEdit = () => { setTempSquad({ ...squad }); setEditing(true); };

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="🎮" title="SQUAD MODE" subtitle="Your football career card — earn XP, unlock badges, climb the ranks" accent={C.gold} />

      {/* Player Card */}
      {!hasProfile || editing ? (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 20, color: C.textBright, margin: "0 0 18px", letterSpacing: 1 }}>CREATE YOUR PLAYER CARD</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Name</label><input value={tempSquad.name} onChange={e => setTempSquad({ ...tempSquad, name: e.target.value })} placeholder="Your name" style={inputStyle} /></div>
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
                <div style={{
                  width: 80, height: 80, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)`, border: `2px solid ${C.gold}40`,
                  fontFamily: FONT_HEAD, fontSize: 38, color: C.gold,
                }}>{squad.number || "?"}</div>
                <div>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 34, color: C.textBright, letterSpacing: 2 }}>{squad.name.toUpperCase()}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>{squad.position || "No position"} · NBSS FC</div>
                </div>
              </div>
              <button onClick={startEdit} style={{ background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textMid, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Edit ✎</button>
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
          <ShareSaveBar targetRef={exportRef} filename="nbss-player-card.png" title={`${squad.name} — NBSS Football Player Card`} />
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  LEGENDS
// ══════════════════════════════════════════════════
function BadgeIcon({ legend, size = 28 }) {
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

function LegendsSection() {
  const [tab, setTab] = useState("global");
  const [active, setActive] = useState(0);
  const legends = tab === "global" ? LEGENDS_GLOBAL : LEGENDS_SG;

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🌟" title="LEGENDS" subtitle="Lessons from the greatest — from the Lion City to the world stage" accent={C.gold} />

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <Pill active={tab === "global"} onClick={() => { setTab("global"); setActive(0); }} color={C.gold}>🌍 Global Icons</Pill>
        <Pill active={tab === "sg"} onClick={() => { setTab("sg"); setActive(0); }} color={C.gold}>🇸🇬 Singapore Legends</Pill>
      </div>

      {/* Legend selector grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 24 }}>
        {legends.map((l, idx) => (
          <button key={idx} onClick={() => setActive(idx)} style={{
            background: active === idx ? `${C.gold}15` : C.navyCard,
            border: active === idx ? `1px solid ${C.gold}50` : `1px solid ${C.navyBorder}`,
            borderRadius: 12, padding: "14px 8px", cursor: "pointer", textAlign: "center",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><BadgeIcon legend={l} size={28} /></span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: active === idx ? C.gold : C.textDim, marginTop: 5, display: "block", lineHeight: 1.3 }}>
              {l.shortName}
            </span>
          </button>
        ))}
      </div>

      {/* Active legend card */}
      <Card glow style={{ borderLeft: `4px solid ${C.gold}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 52, width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold}10`, borderRadius: 18, border: `1px solid ${C.gold}20` }}>
            <BadgeIcon legend={legends[active]} size={52} />
          </span>
          <div>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: "clamp(24px, 5vw, 34px)", color: C.textBright, margin: 0, letterSpacing: 2 }}>{legends[active].name.toUpperCase()}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
              {tab !== "sg" && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.navyBorder}` }}>{legends[active].era}</span>}
              {legends[active].recipe && (() => {
                const recipeColors = { Respect: C.electric, Resilience: "#f97316", Care: C.success, Integrity: "#a855f7", Passion: C.danger, Excellence: C.gold };
                const rc = recipeColors[legends[active].recipe] || C.gold;
                return <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: rc, background: `${rc}15`, padding: "3px 10px", borderRadius: 6, border: `1px solid ${rc}30`, textTransform: "uppercase", letterSpacing: 1 }}>RECIPE · {legends[active].recipe}</span>;
              })()}
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, background: `${C.gold}10`, padding: "3px 10px", borderRadius: 6, fontWeight: 700, border: `1px solid ${C.gold}20` }}>{legends[active].stat}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 20px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textBright, lineHeight: 1.85, margin: 0 }}>
            {legends[active].lesson}
          </p>
        </div>
      </Card>

      <div style={{ marginTop: 20, padding: "14px 20px", borderRadius: 10, background: C.navyCard, border: `1px solid ${C.navyBorder}`, textAlign: "center" }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, margin: 0 }}>Every legend started as someone who just loved kicking a ball around. Your story is still being written. ✍️</p>
      </div>
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
              <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 2, lineHeight: 1 }}>NBSS FOOTBALL</div>
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
            NBSS FC <span style={{ color: C.gold }}>vs</span> {lineup.opponent || "TBD"}
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
          <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.gold, letterSpacing: 2 }}>NBSS FC</span>
          <span style={{ color: C.navyBorder, fontSize: 12 }}>·</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, letterSpacing: 1 }}>GamePlan</span>
        </div>
      </div>
    </div>
  );
}

function LineupCard({ lineup, filled, subCount, onEdit, onDuplicate, onDelete }) {
  const storyRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const activeSubs = lineup.subs?.filter(s => (s || "").trim()) || [];

  const storyOpts = { width: EX.W, height: EX.H };

  const handleSaveStory = async () => {
    if (!storyRef.current || saving) return;
    setSaving(true);
    try {
      await captureAndDownload(
        storyRef.current,
        `nbss-lineup-${(lineup.opponent || "lineup").replace(/\s+/g, "-").toLowerCase()}.png`,
        storyOpts
      );
    } catch { alert("Screenshot failed. Try again."); }
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
    } catch { alert("Share failed. Try Save Story instead."); }
    setSharing(false);
  };

  return (
    <Card glow>
      {/* ── Visible summary card (in-page preview) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: 0, letterSpacing: 1 }}>
              NBSS FC <span style={{ color: C.gold }}>vs</span> {lineup.opponent || "TBD"}
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
        <button onClick={onDelete} style={{ padding: "8px 16px", borderRadius: 8, background: `${C.danger}10`, color: C.danger, border: `1px solid ${C.danger}20`, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleShareStory} disabled={sharing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: sharing ? "#1a2d45" : "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: sharing ? "wait" : "pointer" }}>
            {sharing ? "⏳" : "↗"} Share
          </button>
          <button onClick={handleSaveStory} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: saving ? "#1a2d45" : "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.25)", color: "#f0b429", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "⏳" : "📸"} Save Story
          </button>
        </div>
      </div>

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
//  LINEUP BUILDER
// ══════════════════════════════════════════════════
function LineupBuilderSection() {
  const [lineups, setLineups] = usePersistedState(STORAGE_KEYS.lineups, []);
  const [current, setCurrent] = useState({ ...EMPTY_MATCH });
  const [viewMode, setViewMode] = useState("builder");
  const [editingId, setEditingId] = useState(null);

  const formation = FORMATIONS[current.formation];

  const updatePlayer = (idx, name) => { const p = [...current.players]; p[idx] = name; setCurrent({ ...current, players: p }); };
  const updateSub = (idx, name) => { const s = [...current.subs]; s[idx] = name; setCurrent({ ...current, subs: s }); };
  const addSub = () => { if (current.subs.length >= 9) return; setCurrent({ ...current, subs: [...current.subs, ""] }); };
  const removeSub = (idx) => { const s = [...current.subs]; s.splice(idx, 1); setCurrent({ ...current, subs: s }); };

  const saveLineup = () => {
    if (!current.opponent && !current.date) return;
    if (editingId) {
      setLineups(prev => prev.map(l => l.id === editingId ? { ...current, id: editingId } : l));
      setEditingId(null);
    } else {
      setLineups(prev => [...prev, { ...current, id: Date.now() }]);
    }
    setCurrent({ ...EMPTY_MATCH });
    setViewMode("saved");
  };

  const loadLineup = (lineup) => { setCurrent({ ...lineup }); setEditingId(lineup.id); setViewMode("builder"); };
  const deleteLineup = (id) => setLineups(prev => prev.filter(l => l.id !== id));
  const duplicateLineup = (lineup) => { setLineups(prev => [...prev, { ...lineup, id: Date.now(), date: "", opponent: lineup.opponent + " (copy)" }]); };

  const filled = current.players.filter(p => p?.trim()).length;
  const subCount = current.subs.filter(s => s?.trim()).length;

  // Drawing layer state
  const [drawMode, setDrawMode] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const pitchRef = useRef(null);

  const getXY = (e) => {
    const rect = pitchRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 140 };
  };
  const onDrawStart = (e) => { if (!drawMode) return; e.preventDefault(); setActivePath([getXY(e)]); };
  const onDrawMove = (e) => { if (!drawMode || !activePath) return; e.preventDefault(); setActivePath(prev => [...prev, getXY(e)]); };
  const onDrawEnd = () => { if (activePath && activePath.length > 1) setDrawPaths(prev => [...prev, activePath]); setActivePath(null); };

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 1000, margin: "0 auto" }}>
      <SectionHeader icon="📋" title="LINEUP BUILDER" subtitle="Plan formations, assign positions, save match lineups" accent={C.electric} />

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <Pill active={viewMode === "builder"} onClick={() => setViewMode("builder")} color={C.electric}>⚙️ Builder</Pill>
        <Pill active={viewMode === "saved"} onClick={() => setViewMode("saved")} color={C.electric}>📁 Saved ({lineups.length})</Pill>
      </div>

      {viewMode === "builder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Pitch */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Formation</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(FORMATIONS).map(f => (
                  <Pill key={f} active={current.formation === f} onClick={() => setCurrent({ ...current, formation: f })} color={C.electric}>{f}</Pill>
                ))}
              </div>
            </div>

            {/* Draw mode controls */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <button onClick={() => setDrawMode(!drawMode)} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: drawMode ? `${C.danger}20` : C.navyCard, border: `1px solid ${drawMode ? C.danger : C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: drawMode ? C.danger : C.textMid }}>
                {drawMode ? "✏️ Drawing On — Tap Pitch" : "✏️ Draw Tactics"}
              </button>
              {drawPaths.length > 0 && (
                <button onClick={() => { setDrawPaths(prev => prev.slice(0, -1)); }} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMid }}>↩ Undo</button>
              )}
              {drawPaths.length > 0 && (
                <button onClick={() => setDrawPaths([])} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: C.navyCard, border: `1px solid ${C.navyBorder}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>🗑 Clear</button>
              )}
            </div>

            {/* Pitch */}
            <div ref={pitchRef}
              onMouseDown={onDrawStart} onMouseMove={onDrawMove} onMouseUp={onDrawEnd} onMouseLeave={onDrawEnd}
              onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}
              style={{ position: "relative", width: "100%", paddingBottom: "140%", background: "linear-gradient(180deg, #0a4a0a 0%, #0d5a0d 50%, #0a4a0a 100%)", borderRadius: 12, border: `2px solid ${drawMode ? C.danger : C.navyBorder}`, overflow: "hidden", cursor: drawMode ? "crosshair" : "default", userSelect: "none", touchAction: drawMode ? "none" : "auto" }}>
              {/* Pitch markings + drawing layer */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 140" preserveAspectRatio="none">
                <defs>
                  <marker id="arrowhead" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 5 2, 0 4" fill="rgba(255,80,80,0.95)" />
                  </marker>
                </defs>
                <rect x="0" y="0" width="100" height="140" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <rect x="25" y="0" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="0" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
                <rect x="25" y="120" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="130" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
                {/* Drawn tactical paths */}
                {drawPaths.map((path, pi) => (
                  <polyline key={pi} points={path.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(255,90,90,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrowhead)" />
                ))}
                {activePath && (
                  <polyline points={activePath.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(255,160,50,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              {formation.positions.map((pos, idx) => (
                <div key={idx} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", margin: "0 auto 3px",
                    background: current.players[idx]?.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : "rgba(255,255,255,0.15)",
                    border: `2px solid ${current.players[idx]?.trim() ? C.gold : "rgba(255,255,255,0.3)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontFamily: FONT_HEAD, color: current.players[idx]?.trim() ? C.navy : "rgba(255,255,255,0.6)",
                    letterSpacing: 0.5,
                  }}>{pos.role}</div>
                  <div style={{ fontSize: 8, fontFamily: FONT_BODY, color: "rgba(255,255,255,0.7)", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.8)", maxWidth: 36, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {current.players[idx]?.trim() || ""}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, marginTop: 8, textAlign: "center" }}>{filled}/11 starters · {subCount} subs</p>
          </div>

          {/* Right: Form */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
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

            <GoldButton onClick={saveLineup} style={{ width: "100%" }}>
              {editingId ? "Update Lineup ✓" : "Save Lineup ✓"}
            </GoldButton>
          </div>
        </div>
      )}

      {viewMode === "saved" && (
        <>
          {lineups.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: C.navyCard, borderRadius: 16, border: `1px dashed ${C.navyBorder}` }}>
              <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>📋</span>
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
      <span style={{ fontSize: 56, display: "block", marginBottom: 16 }}>🧠</span>
      <h3 style={{ fontFamily: FONT_HEAD, fontSize: 32, color: C.textBright, margin: "0 0 8px", letterSpacing: 2 }}>FOOTBALL IQ QUIZ</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: "0 0 6px", lineHeight: 1.5 }}>{QUIZ_QUESTIONS.length} questions on tactics, rules, nutrition, and Singapore football history.</p>
      {bestScore > 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.gold, fontWeight: 700, margin: "0 0 16px" }}>🏆 Best: {bestScore}/{QUIZ_QUESTIONS.length}</p>}
      <GoldButton onClick={startQuiz} style={{ marginTop: 24 }}>Start Quiz ⚡</GoldButton>
    </Card>
  );

  if (quizState === "results") {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const grade = pct >= 90 ? { label: "Football Genius!", emoji: "🐐", color: C.success } :
                  pct >= 70 ? { label: "Sharp Player", emoji: "⚡", color: C.electric } :
                  pct >= 50 ? { label: "Getting There", emoji: "📈", color: C.orange } :
                              { label: "Keep Learning!", emoji: "📚", color: C.danger };
    return (
      <Card style={{ textAlign: "center" }}>
        <span style={{ fontSize: 56, display: "block", marginBottom: 12 }}>{grade.emoji}</span>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 28, color: C.textBright, margin: "0 0 8px", letterSpacing: 2 }}>QUIZ COMPLETE!</h3>
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
        <GoldButton onClick={startQuiz}>Try Again 🔄</GoldButton>
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
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{selected === q.correct ? "✓ Correct! " : "✗ Not quite. "}{q.explain}</p>
          </div>
          <GoldButton onClick={nextQuestion} style={{ marginTop: 14, width: "100%" }}>{currentQ + 1 >= QUIZ_QUESTIONS.length ? "See Results 🏆" : "Next →"}</GoldButton>
        </div>
      )}
    </Card>
  );
}

function GoalWall() {
  const [goals, setGoals] = usePersistedState(STORAGE_KEYS.goals, []);
  const [form, setForm] = useState({ text: "", cat: "Technical", deadline: "" });
  const [showForm, setShowForm] = useState(false);
  const exportRef = useRef(null);

  const addGoal = () => {
    if (!form.text.trim()) return;
    setGoals(prev => [...prev, { ...form, id: Date.now(), done: false }]);
    setForm({ text: "", cat: "Technical", deadline: "" });
    setShowForm(false);
  };

  const toggleGoal = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  const catColors = { Technical: C.electric, Physical: C.danger, Mental: C.gold, Teamwork: C.success };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>GOAL WALL</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, margin: 0 }}>{goals.filter(g => g.done).length}/{goals.length} completed</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {goals.length > 0 && <ShareSaveBar targetRef={exportRef} filename="nbss-goals.png" title="My NBSS Goal Wall" />}
          <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm}>{showForm ? "Cancel" : "+ Add Goal"}</GoldButton>
        </div>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Category</label>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={inputStyle}>
                {GOAL_CATEGORIES.map(c => <option key={c.cat} value={c.cat}>{c.icon} {c.cat}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Goal</label>
            <input value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="e.g. Master the Cruyff turn" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Examples</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {GOAL_CATEGORIES.find(c => c.cat === form.cat)?.examples.map(ex => (
                <button key={ex} onClick={() => setForm({ ...form, text: ex })} style={{ fontFamily: FONT_BODY, fontSize: 11, padding: "4px 10px", borderRadius: 6, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}`, color: C.textMid, cursor: "pointer" }}>{ex}</button>
              ))}
            </div>
          </div>
          <GoldButton onClick={addGoal} style={{ width: "100%" }}>Add Goal ✓</GoldButton>
        </Card>
      )}

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: C.navyCard, borderRadius: 14, border: `1px dashed ${C.navyBorder}` }}>
          <span style={{ fontSize: 44, display: "block", marginBottom: 10 }}>🎯</span>
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14 }}>No goals set yet. Add your first goal!</p>
        </div>
      ) : (
        <div ref={exportRef} style={{ background: C.navy, borderRadius: 12, padding: "4px 0" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {goals.map(goal => (
              <div key={goal.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: C.navyCard, border: `1px solid ${goal.done ? C.success + "30" : C.navyBorder}`, borderRadius: 12, borderLeft: `3px solid ${catColors[goal.cat] || C.gold}` }}>
                <button onClick={() => toggleGoal(goal.id)} style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: goal.done ? C.success : C.navyCard, border: goal.done ? "none" : `1px solid ${C.navyBorder}`, color: C.navy, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>{goal.done ? "✓" : ""}</button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: goal.done ? C.textDim : C.textBright, textDecoration: goal.done ? "line-through" : "none" }}>{goal.text}</span>
                  <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: catColors[goal.cat], fontWeight: 700 }}>{goal.cat}</span>
                    {goal.deadline && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim }}>· Due {goal.deadline}</span>}
                  </div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HubOverview({ setHubTab }) {
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
  const SCHEDULE_URL = "https://docs.google.com/spreadsheets/d/1L5FGME5itmc3vknwL0xSsIrz4qJ3n6z1YfxffgeB3nU/edit?usp=drivesdk";
  return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <span style={{ fontSize: 52, display: "block", marginBottom: 16 }}>📅</span>
      <h3 style={{ fontFamily: FONT_HEAD, fontSize: 26, color: C.textBright, margin: "0 0 10px", letterSpacing: 2 }}>CCA SCHEDULE</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid, margin: "0 0 28px", lineHeight: 1.6, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
        Training dates, match fixtures, and teachers on duty — all maintained in one Google Sheet.
      </p>
      <a href={SCHEDULE_URL} target="_blank" rel="noopener noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 32px",
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
        color: C.navy, borderRadius: 12, textDecoration: "none",
        fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700,
        boxShadow: `0 4px 20px ${C.gold}30`,
      }}>📊 Open Schedule ↗</a>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 16 }}>Opens in a new tab. Bookmark it!</p>
    </Card>
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
  { id: "s11", name: "Kamalagouni Sudeep Krishna",         school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  { id: "s12", name: "Nikraj Singh Khera",                 school: "Yishun Town Sec",           div: "C Div", year: "", jersey: "", position: "" },
  // ── CCHY — C Div ──
  { id: "s13", name: "Chaziel Chan",                       school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s14", name: "Tok Jun Heng Kyden",                 school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s15", name: "Zavier Lee Zhen Hao",               school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s16", name: "Nyeden Lim Zhi Xuan",               school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  { id: "s17", name: "Jairus Goh Zhuo Hung",              school: "Chung Cheng High (Yishun)", div: "C Div", year: "", jersey: "", position: "" },
  // ── NSS — C Div ──
  { id: "s18", name: "Muhammad Ainuddin Bin Azzri",        school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s19", name: "Muhammad Shafiy Ukail Bin Ollie Hykel", school: "Northland Sec",         div: "C Div", year: "", jersey: "", position: "" },
  { id: "s20", name: "Sivaneswaran S/O K Kaliswaran",     school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
  { id: "s21", name: "Lee Jia Le Ceejay",                 school: "Northland Sec",             div: "C Div", year: "", jersey: "", position: "" },
];

function ClusterAttendance() {
  const [roster, setRoster] = usePersistedState(STORAGE_KEYS.roster, []);

  // Auto-seed roster on first load if empty
  useEffect(() => {
    if (roster.length === 0) setRoster(SEED_ROSTER);
  }, []); // eslint-disable-line
  const [attendanceLog, setAttendanceLog] = usePersistedState(STORAGE_KEYS.attendance, {});
  const [view, setView] = useState("take"); // "take" | "roster" | "summary"
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState(""); // "" | "B Div" | "C Div"
  const [presentIds, setPresentIds] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.attendance) || "{}");
      return new Set(saved[today] || []);
    } catch { return new Set(); }
  });

  // Roster edit state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: "", school: SCHOOLS[0], div: "B Div", year: "", jersey: "", position: "" });
  const [editId, setEditId] = useState(null);

  // Walk-in state
  const [walkInName, setWalkInName] = useState("");
  const [walkInSchool, setWalkInSchool] = useState(SCHOOLS[0]);

  const sessionKey = sessionDate;

  // Persist present set whenever it changes
  const savePresent = (nextSet) => {
    setAttendanceLog(prev => ({ ...prev, [sessionKey]: [...nextSet] }));
    setPresentIds(new Set(nextSet));
  };

  const togglePresent = (id) => {
    const next = new Set(presentIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    savePresent(next);
  };

  const markAllSchool = (school, present) => {
    const next = new Set(presentIds);
    roster.filter(p => p.school === school).forEach(p => present ? next.add(p.id) : next.delete(p.id));
    savePresent(next);
  };

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    const id = `walkin-${Date.now()}`;
    const player = { id, name: walkInName.trim(), school: walkInSchool, year: "", jersey: "", position: "", walkIn: true };
    setRoster(prev => [...prev, player]);
    const next = new Set(presentIds);
    next.add(id);
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
    setNewPlayer({ name: "", school: SCHOOLS[0], year: "", jersey: "", position: "" });
    setShowAddForm(false);
  };

  const deletePlayer = (id) => {
    setRoster(prev => prev.filter(p => p.id !== id));
    const next = new Set(presentIds);
    next.delete(id);
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
  const presentList = activeRoster.filter(p => presentIds.has(p.id));
  const absentList = activeRoster.filter(p => !presentIds.has(p.id));

  const inputSt = { ...INPUT_STYLE, padding: "10px 12px", fontSize: 14, flex: 1 };
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
    try { await navigator.clipboard.writeText(text); alert("✅ Copied! Paste into SCMobile or WhatsApp."); }
    catch { alert("Copy failed — please select and copy manually."); }
  };

  const btnPrimary = (color = C.gold) => ({
    fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, padding: "10px 18px",
    borderRadius: 8, border: "none", cursor: "pointer",
    background: color, color: color === C.gold ? C.navy : C.textBright, transition: "opacity 0.2s",
  });
  const btnGhost = (color = C.electric) => ({
    fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, padding: "8px 14px",
    borderRadius: 7, border: `1px solid ${color}`, cursor: "pointer",
    background: "transparent", color, transition: "all 0.2s",
  });

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "take", label: "📋 Take Attendance" }, { id: "roster", label: "👥 Manage Roster" }, { id: "summary", label: "📊 Summary" }].map(v => (
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
            setPresentIds(new Set(saved[e.target.value] || []));
          }} style={{ ...INPUT_STYLE, padding: "7px 10px", fontSize: 13, width: "auto" }} />
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
              { label: "Present", val: presentIds.size, color: C.success },
              { label: "Absent", val: roster.length - presentIds.size, color: C.danger },
              { label: "Total", val: roster.length, color: C.electric },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 90, background: C.navyCard, border: `1px solid ${C.navyBorder}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 28, color: s.color, letterSpacing: 1 }}>{s.val}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textMid, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input placeholder="🔍  Search by name, school or jersey #" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...INPUT_STYLE, width: "100%", padding: "11px 14px", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />

          {roster.length === 0 && (
            <Card style={{ textAlign: "center", padding: 32 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMid }}>No players in roster yet.</p>
              <button onClick={() => setView("roster")} style={{ ...btnPrimary(), marginTop: 12 }}>➕ Build Roster First</button>
            </Card>
          )}

          {/* Players grouped by school */}
          {schools.map(school => {
            const schoolPlayers = filtered.filter(p => p.school === school);
            if (schoolPlayers.length === 0) return null;
            const schoolPresent = schoolPlayers.filter(p => presentIds.has(p.id)).length;
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
                    const isPresent = presentIds.has(player.id);
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
            <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.orange, margin: "0 0 12px", letterSpacing: 1 }}>➕ WALK-IN / VISITOR</h4>
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
            <button onClick={() => { setShowAddForm(true); setEditId(null); setNewPlayer({ name: "", school: SCHOOLS[0], div: "B Div", year: "", jersey: "", position: "" }); }} style={{ ...btnPrimary() }}>
              ➕ Add Player
            </button>
          </div>

          {showAddForm && (
            <Card style={{ marginBottom: 20, borderColor: C.gold }}>
              <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.gold, margin: "0 0 16px", letterSpacing: 1 }}>
                {editId ? "✏️ EDIT PLAYER" : "➕ NEW PLAYER"}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 4px", letterSpacing: 1 }}>ATTENDANCE SUMMARY</h3>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: 0 }}>
                  {new Date(sessionDate).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => copyToClipboard(summaryText())} style={{ ...btnPrimary(C.electric) }}>
                📋 Copy for SCMobile / WhatsApp
              </button>
            </div>

            {/* Present */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.success, letterSpacing: 1, marginBottom: 10 }}>
                ✅ PRESENT — {presentList.length}
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
                  ❌ ABSENT — {absentList.length}
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
            <h4 style={{ fontFamily: FONT_HEAD, fontSize: 16, color: C.textBright, margin: "0 0 12px", letterSpacing: 1 }}>📅 PREVIOUS SESSIONS</h4>
            {Object.keys(attendanceLog).sort().reverse().slice(0, 10).map(date => {
              const ids = attendanceLog[date] || [];
              return (
                <div key={date} onClick={() => { setSessionDate(date); setPresentIds(new Set(ids)); setView("take"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.navyBorder}`, cursor: "pointer" }}>
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

// ══════════════════════════════════════════════════
//  TEAM HUB
// ══════════════════════════════════════════════════
function TeamHubSection() {
  const [hubTab, setHubTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "schedule", label: "Schedule", icon: "📅" },
    { id: "recovery", label: "Recovery", icon: "🧊" },
    { id: "quiz", label: "Football IQ", icon: "🧠" },
    { id: "goals", label: "Goal Wall", icon: "🎯" },
    { id: "attendance", label: "Attendance", icon: "📋" },
  ];
  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader icon="🏟️" title="TEAM HUB" subtitle="Everything your CCA team needs in one place" accent={C.electric} />
      <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <Pill key={t.id} active={hubTab === t.id} onClick={() => setHubTab(t.id)} color={C.electric}>
            {t.icon} {t.label}
          </Pill>
        ))}
      </div>
      {hubTab === "overview" && <HubOverview setHubTab={setHubTab} />}
      {hubTab === "schedule" && <ScheduleCard />}
      {hubTab === "recovery" && <RecoveryZone />}
      {hubTab === "quiz" && <FootballIQQuiz />}
      {hubTab === "goals" && <GoalWall />}
      {hubTab === "attendance" && <ClusterAttendance />}
    </section>
  );
}

// ══════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════
export default function App() {
  const [active, setActive] = useState("home");
  const [profile, setProfile] = usePersistedState(STORAGE_KEYS.profile, { name: "", position: "Midfielder", level: "beginner", firstGoal: "", onboarded: false });
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [active]);

  const handleOnboardingComplete = (data) => {
    setProfile(data);
  };

  return (
    <>
      {!profile?.onboarded && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: ${C.navy};
          color: ${C.textBright};
          font-family: ${FONT_BODY};
          -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.navyCard}; }
        ::-webkit-scrollbar-thumb { background: ${C.navyBorder}; border-radius: 2px; }

        input, select, textarea { color-scheme: dark; }
        input:focus, select:focus, textarea:focus { border-color: ${C.gold} !important; }
        input::placeholder, textarea::placeholder { color: ${C.textDim}; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .mob-btn { display: block !important; }
          .nav-l {
            display: none !important;
            position: absolute; top: 64px; left: 0; right: 0;
            background: rgba(5,15,30,0.98);
            backdrop-filter: blur(20px);
            flex-direction: column; padding: 16px;
            border-bottom: 1px solid ${C.navyBorder};
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          }
          .nav-l.nav-open { display: flex !important; }
        }
      `}</style>

      <Navbar active={active} setActive={setActive} />

      {active === "home"     && <HeroSection setActive={setActive} profile={profile} sessions={sessions} />}
      {active === "train"    && <TrainGroup />}
      {active === "match"    && <MatchGroup />}
      {active === "progress" && <ProgressGroup />}
      {active === "culture"  && <LegendsSection />}
      {active === "hub"      && <TeamHubSection />}

      <footer style={{ textAlign: "center", padding: "48px 24px", borderTop: `1px solid ${C.navyBorder}`, background: C.navyDeep }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 18, color: C.textBright, letterSpacing: 3, marginBottom: 6 }}>NBSS FOOTBALL CCA</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "0 0 6px" }}>Naval Base Secondary School · Building Character Through Football</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, margin: "0 0 20px" }}>Created by <span style={{ color: C.gold, fontWeight: 700 }}>Mr Muhammad Herwanto</span></p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: C.navyCard, border: `1px solid ${C.navyBorder}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>Powered by</span>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 14, color: C.gold, letterSpacing: 1 }}>GamePlan</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>· All-in-One Platform for School Sports CCAs</span>
        </div>
      </footer>
    </>
  );
}
