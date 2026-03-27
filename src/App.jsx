import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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
  fitnessResults: "nbss-fitness-results",
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

// ── SECTIONS ──
const SECTIONS = ["home","training","nutrition","mindset","fitness","tracker","squad","legends","lineup","team"];
const NAV_LABELS = {
  home: "Home", training: "Training", nutrition: "Fuel", mindset: "Mindset",
  fitness: "Fitness", tracker: "Tracker", squad: "Squad", legends: "Legends",
  lineup: "Lineup", team: "Hub",
};

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
  { fixed: "I'm not good at this.", growth: "I'm not good at this YET.", icon: "🌱" },
  { fixed: "I made a mistake — I'm terrible.", growth: "Mistakes help me learn and improve.", icon: "🔬" },
  { fixed: "He's so talented, I'll never be that good.", growth: "His success shows me what's possible with effort.", icon: "🪜" },
  { fixed: "This drill is too hard.", growth: "This drill is challenging — that means I'm growing.", icon: "💪" },
  { fixed: "I give up.", growth: "Let me try a different strategy.", icon: "♟️" },
  { fixed: "Feedback is criticism.", growth: "Feedback is a gift that helps me get better.", icon: "🎁" },
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
  { name: "Virgil van Dijk", shortName: "van Dijk", era: "2011–present", lesson: "Rejected by multiple clubs as a teenager. Didn't make it big until age 26 at Liverpool. Late bloomers exist — patience and persistence pay off.", badge: "🏔️", stat: "UCL + PL winner" },
  { name: "Mohamed Salah", shortName: "Salah", era: "2010–present", lesson: "Left Egypt with a dream and was told he wasn't good enough at Chelsea. Moved to Roma, rebuilt himself, then became Liverpool's king. Never let one setback define you.", badge: "👑", stat: "PL Golden Boot × 3" },
  { name: "Lamine Yamal", shortName: "Yamal", era: "2023–present", lesson: "Youngest ever Euros goalscorer at 16. Proof that your generation can make history right NOW. Age is not a barrier to greatness.", badge: "🌟", stat: "Euro 2024 champion at 16" },
  { name: "Kylian Mbappé", shortName: "Mbappé", era: "2015–present", lesson: "World Cup winner at 19. Donates all his international match fees to charity. Excellence with humility — speed on the pitch, grace off it.", badge: "⚡", stat: "World Cup winner at 19" },
  { name: "Manuel Neuer", shortName: "Neuer", era: "2004–present", lesson: "Revolutionised goalkeeping — a sweeper-keeper who plays like an outfield player. Came back from a broken leg at 36. Resilience redefined.", badge: "🧤", stat: "World Cup + 10× Bundesliga" },
  { name: "Pelé", shortName: "Pelé", era: "1956–1977", lesson: "Learned to play with a sock stuffed with newspapers because he couldn't afford a ball. Became the greatest of his era through pure love of the game.", badge: "🇧🇷", stat: "3× World Cup winner" },
  { name: "Ronaldo Nazário", shortName: "Ronaldo", era: "1993–2011", lesson: "El Fenómeno — the original Ronaldo. Overcame devastating knee injuries that would have ended most careers. At his peak, he was unstoppable.", badge: "🔥", stat: "2× World Cup + 2× Ballon d'Or" },
];

const LEGENDS_SG = [
  { name: "Fandi Ahmad", shortName: "Fandi Ahmad", era: "1978–1997", lesson: "Widely accepted as the greatest footballer Singapore has ever produced — a title that still stands decades after he hung up his boots. Fandi didn't just dominate Southeast Asia; he took his game to Europe, playing for Dutch club FC Groningen and famously scoring against Inter Milan. He is Singapore's all-time top scorer and a player whose talent, courage, and love for the game set a standard that no one has yet eclipsed. His legacy is not just what he achieved on the pitch — it's that he showed an entire nation that a Singaporean could compete at the very highest level.", badge: "🇸🇬", stat: "Singapore's greatest player ever" },
  { name: "Ikhsan Fandi", shortName: "Ikhsan Fandi", era: "2018–present", lesson: "Son of a legend, but forging his own path. Ikhsan became the first Singaporean to play in the Norwegian top flight, proving that the Fandi name is not just history — it is the present and future of Singapore football. He plays without fear, carries the Lions badge with pride, and reminds every young player that where you come from is never a ceiling on where you can go.", badge: "🌏", stat: "First SG player in Norwegian league" },
  { name: "Nazri Nasir", shortName: "Nazri Nasir", era: "1993–2012", lesson: "Nazri Nasir was a midfield general in every sense — a dynamo who covered every blade of grass, won every tackle he could reach, and gave absolutely everything every single time he crossed that white line. He was the kind of player who never shied away from a challenge, never hid, and never complained. Put him anywhere — he even played striker when the team needed it, and he delivered without a word of protest. Add to that a stunning ability to score from distance, and you had a complete, irreplaceable footballer. His engine, his courage, and his commitment to the team over himself made him one of the most respected Lions of his generation.", badge: "⚡", stat: "SEA Games gold medallist" },
  { name: "Aleksandar Đurić", shortName: "Đurić", era: "1996–2013", lesson: "Arrived in Singapore with nothing and became a legend. Scored crucial goals well into his 40s. Age is just a number when your heart is bigger than your doubts.", badge: "🦁", stat: "S.League all-time top scorer" },
  { name: "Shahril Ishak", shortName: "Shahril Ishak", era: "2002–2019", lesson: "The 'Wizard' — and captain of the Singapore national team. Shahril led not with speeches but with the ball at his feet and an unshakeable calm that the whole team drew from. His vision and passing were immaculate; he could see angles others simply couldn't, unlocking defences with one perfectly weighted ball. He was never the loudest voice in the room, but his leadership shone through in the moments that mattered most. A quiet, dignified captain who carried the Lions badge with grace and delivered when it counted. A true statesman of Singapore football.", badge: "🎩", stat: "National team captain · AFF Cup winner" },
  { name: "Indra Sahdan", shortName: "Indra Sahdan", era: "1997–2016", lesson: "A true predator. Indra Sahdan was a striker built for the big occasion — razor-sharp movement in behind the defence, ice-cold composure in front of goal, and a finishing ability that made him one of the most feared forwards in the region. He famously scored against every EPL club that faced the Singapore national team, a feat that speaks for itself. He didn't just play against big opposition — he scored against them. Clinical, relentless, and always a threat, Indra showed that Singapore could produce forwards of genuine quality who thrived under pressure.", badge: "🎯", stat: "Scored vs every EPL team to face Singapore" },];

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
          {SECTIONS.map(s => (
            <button key={s} onClick={() => { setActive(s); setOpen(false); }} style={{
              background: active === s ? `${C.gold}15` : "transparent",
              color: active === s ? C.gold : C.textMid,
              border: active === s ? `1px solid ${C.gold}30` : "1px solid transparent",
              padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600,
              transition: "all 0.2s", letterSpacing: 0.3,
            }}
              onMouseEnter={e => { if (active !== s) { e.target.style.color = C.textBright; e.target.style.borderColor = C.navyBorder; } }}
              onMouseLeave={e => { if (active !== s) { e.target.style.color = C.textMid; e.target.style.borderColor = "transparent"; } }}
            >{NAV_LABELS[s]}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════
//  HERO
// ══════════════════════════════════════════════════
function HeroSection({ setActive }) {
  const [qi, setQi] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setQi(i => (i + 1) % QUOTES.length); setFade(true); }, 350);
    }, 5500);
    return () => clearInterval(iv);
  }, []);

  const q = QUOTES[qi];

  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", textAlign: "center",
      padding: "90px 24px 60px", position: "relative", overflow: "hidden",
      background: C.navy,
    }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}08 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.electric}06 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Pitch lines texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 80px, ${C.gold} 80px, ${C.gold} 81px)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780 }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 24, border: `1px solid ${C.gold}30`,
          background: `${C.gold}08`, marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.gold, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
            Naval Base Secondary School
          </span>
        </div>

        {/* Main heading */}
        <h1 style={{
          fontFamily: FONT_HEAD, fontSize: "clamp(56px, 10vw, 104px)",
          color: C.textBright, margin: 0, lineHeight: 0.95, letterSpacing: 3,
        }}>
          FOOTBALL{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>CCA</span>
        </h1>

        <p style={{ fontFamily: FONT_BODY, fontSize: "clamp(14px, 2vw, 17px)", color: C.textMid, marginTop: 16, letterSpacing: 2, textTransform: "uppercase" }}>
          Train · Grow · Compete · Together
        </p>

        {/* Quote carousel */}
        <div style={{
          marginTop: 48, padding: "28px 36px",
          background: C.navyCard, borderRadius: 20,
          border: `1px solid ${C.navyBorder}`,
          opacity: fade ? 1 : 0, transition: "opacity 0.35s ease",
          minHeight: 120, boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{q.emoji}</span>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 17, color: C.textBright, fontStyle: "italic", margin: "0 0 10px", lineHeight: 1.6 }}>
            "{q.text}"
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>— {q.author}</p>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 40 }}>
          {[
            { s: "training", label: "Start Training", icon: "🏃", primary: true },
            { s: "tracker", label: "Track Progress", icon: "📊" },
            { s: "squad", label: "Squad Mode", icon: "🎮" },
            { s: "legends", label: "Legends", icon: "🌟" },
          ].map(b => (
            <button key={b.s} onClick={() => setActive(b.s)} style={{
              background: b.primary ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.navyCard,
              color: b.primary ? C.navy : C.textMid,
              border: b.primary ? "none" : `1px solid ${C.navyBorder}`,
              padding: "14px 28px", borderRadius: 12, cursor: "pointer",
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: b.primary ? `0 8px 32px ${C.gold}35` : "none",
              transition: "all 0.25s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            >
              <span>{b.icon}</span> {b.label}
            </button>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 56, flexWrap: "wrap" }}>
          {[
            { val: "10", label: "Sections" },
            { val: "3", label: "Training Levels" },
            { val: "20+", label: "Food Items" },
            { val: "12", label: "IQ Questions" },
          ].map((s, i) => (
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
//  MINDSET
// ══════════════════════════════════════════════════
function MindsetSection() {
  const [activeCard, setActiveCard] = useState(null);
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

      {/* Growth Mindset Framework */}
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 22, color: C.textBright, margin: "0 0 6px", letterSpacing: 1 }}>FIXED vs GROWTH MINDSET</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMid, margin: "0 0 20px" }}>Spot the fixed mindset. Flip it to growth.</p>
        <div style={{ display: "grid", gap: 10 }}>
          {GROWTH_MINDSET_FRAMEWORK.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", padding: "12px 16px", background: C.surfaceSubtle, borderRadius: 10 }}>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: `${C.danger}08`, border: `1px solid ${C.danger}15` }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.danger, margin: 0 }}>{item.fixed}</p>
              </div>
              <span style={{ fontSize: 18, textAlign: "center" }}>{item.icon}</span>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: `${C.success}08`, border: `1px solid ${C.success}15` }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.success, margin: 0 }}>{item.growth}</p>
              </div>
            </div>
          ))}
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
function TrackerSection() {
  const [sessions, setSessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊" });
  const [year, setYear] = useState("Sec 1");
  const exportRef = useRef(null);

  const moods = ["😤", "😔", "😐", "😊", "🔥"];

  const addEntry = () => {
    if (!form.date) return;
    setSessions(prev => [...prev, { ...form, id: Date.now(), year }]);
    setForm({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊" });
    setShowForm(false);
  };

  const deleteEntry = (id) => setSessions(prev => prev.filter(e => e.id !== id));

  const yearSessions = sessions.filter(s => s.year === year);
  const avgRating = yearSessions.length ? (yearSessions.reduce((s, e) => s + e.rating, 0) / yearSessions.length).toFixed(1) : "–";

  const typeColors = { training: C.electric, match: C.gold, fitness: C.success, recovery: C.orange };

  return (
    <section style={{ padding: "100px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <div ref={exportRef} style={{ background: C.navy, paddingBottom: 8 }}>
      <SectionHeader icon="📊" title="PROGRESS TRACKER" subtitle="Log sessions, track your growth from Sec 1 to Sec 4" accent={C.electric} />

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

      {/* Year filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["Sec 1","Sec 2","Sec 3","Sec 4"].map(y => <Pill key={y} active={year === y} onClick={() => setYear(y)} color={C.gold}>{y}</Pill>)}
      </div>

      <GoldButton onClick={() => setShowForm(!showForm)} secondary={showForm} style={{ width: "100%", marginBottom: 20 }}>
        {showForm ? "✕ Cancel" : "+ Log New Session"}
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
          <p style={{ fontFamily: FONT_BODY, color: C.textDim, fontSize: 14 }}>No sessions logged for {year} yet.</p>
          <p style={{ fontFamily: FONT_SERIF, color: C.textMid, fontSize: 14, fontStyle: "italic", marginTop: 6 }}>"What gets measured, gets improved."</p>
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
            <span style={{ fontSize: 28, display: "block" }}>{l.badge}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: active === idx ? C.gold : C.textDim, marginTop: 5, display: "block", lineHeight: 1.3 }}>
              {l.shortName}
            </span>
          </button>
        ))}
      </div>

      {/* Active legend card */}
      <Card glow style={{ borderLeft: `4px solid ${C.gold}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 52, width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold}10`, borderRadius: 18, border: `1px solid ${C.gold}20` }}>
            {legends[active].badge}
          </span>
          <div>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 34, color: C.textBright, margin: 0, letterSpacing: 2 }}>{legends[active].name.toUpperCase()}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, background: C.surfaceSubtle, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.navyBorder}` }}>{legends[active].era}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.gold, background: `${C.gold}10`, padding: "3px 10px", borderRadius: 6, fontWeight: 700, border: `1px solid ${C.gold}20` }}>{legends[active].stat}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 24px", borderRadius: 14, background: C.surfaceSubtle, border: `1px solid ${C.navyBorder}` }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 17, color: C.textBright, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
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

            {/* Pitch */}
            <div style={{ position: "relative", width: "100%", paddingBottom: "140%", background: "linear-gradient(180deg, #0a4a0a 0%, #0d5a0d 50%, #0a4a0a 100%)", borderRadius: 12, border: `2px solid ${C.navyBorder}`, overflow: "hidden" }}>
              {/* Pitch markings */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 140" preserveAspectRatio="none">
                <rect x="0" y="0" width="100" height="140" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <rect x="25" y="0" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="0" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
                <rect x="25" y="120" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <rect x="35" y="130" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.4" />
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
    { id: "quiz", title: "Football IQ Quiz", desc: "12 questions on tactics, rules & SG football.", icon: "🧠", color: C.gold },
    { id: "goals", title: "Goal Wall", desc: "Set personal goals. Track them. Crush them.", icon: "🎯", color: C.danger },
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
    </section>
  );
}

// ══════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════
export default function App() {
  const [active, setActive] = useState("home");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [active]);

  return (
    <>
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

      {active === "home"     && <HeroSection setActive={setActive} />}
      {active === "training" && <TrainingSection />}
      {active === "nutrition"&& <NutritionSection />}
      {active === "mindset"  && <MindsetSection />}
      {active === "fitness"  && <FitnessSection />}
      {active === "tracker"  && <TrackerSection />}
      {active === "squad"    && <SquadSection />}
      {active === "legends"  && <LegendsSection />}
      {active === "lineup"   && <LineupBuilderSection />}
      {active === "team"     && <TeamHubSection />}

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
