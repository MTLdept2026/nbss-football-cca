import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════
//  NBSS FOOTBALL CCA — COMPLETE APP
// ═══════════════════════════════════════════

// ── COLOUR SYSTEM (School Colours) ──
const C = {
  navy: "#0a1e3d", navyLight: "#122d5c", navyMid: "#163a6e",
  yellow: "#f5c518", yellowLight: "#ffd84d", yellowDim: "#c9a200",
  sky: "#4da6e8", skyLight: "#7ec4f5", skyDim: "#2d7ab8",
  white: "#ffffff", offWhite: "#f0f4f8", cream: "#e8ecf2",
  bg: "#fafcff", cardBg: "#ffffff", textDark: "#0a1e3d", textMid: "#3d5a80", textLight: "#7a8da6",
  success: "#22c55e", danger: "#ef4444", orange: "#f59e0b",
};

// ── STORAGE HELPERS ──
const STORAGE_KEYS = {
  sessions: "nbss-sessions",
  squad: "nbss-squad",
  checklist: "nbss-checklist",
  growthJournal: "nbss-growth-journal",
  goals: "nbss-goals",
  quizScores: "nbss-quiz-scores",
  lineups: "nbss-lineups",
  fitnessResults: "nbss-fitness-results",
};

function usePersistedState(key, defaultVal) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  });
  const [loaded] = useState(true);

  const setPersisted = useCallback((valOrFn) => {
    setState(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) { console.error("Storage error:", e); }
      return next;
    });
  }, [key]);

  return [state, setPersisted, loaded];
}

// ── SECTIONS ──
const SECTIONS = ["home","training","nutrition","mindset","fitness","tracker","squad","legends","lineup","team"];

// ── QUOTES ──
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

// ── TRAINING DATA ──
const TRAINING_DATA = {
  beginner: {
    title: "Foundation Builder", subtitle: "Sec 1–2 · Building Your Base",
    weeks: [
      { name: "Ball Mastery", drills: [
        { text: "Toe taps (2×30s)", video: "https://www.youtube.com/results?search_query=toe+taps+football+drill+tutorial" },
        { text: "Inside-outside rolls (2×20)", video: "https://www.youtube.com/results?search_query=inside+outside+rolls+football+drill" },
        { text: "Figure-8 dribbling (3×1min)", video: "https://www.youtube.com/results?search_query=figure+8+dribbling+drill+football" },
        { text: "Sole rolls forward/back (2×20)", video: "https://www.youtube.com/results?search_query=sole+rolls+football+drill+tutorial" },
      ], focus: "Get comfortable with the ball at your feet. Do these barefoot at home to build feel.", icon: "🎯" },
      { name: "First Touch", drills: [
        { text: "Wall passes — inside foot (3×20)", video: "https://www.youtube.com/results?search_query=wall+pass+inside+foot+drill" },
        { text: "Cushion control — thigh (2×15)", video: "https://www.youtube.com/results?search_query=thigh+cushion+control+football" },
        { text: "Chest-and-volley (2×10)", video: "https://www.youtube.com/results?search_query=chest+and+volley+football+drill" },
        { text: "Turn on first touch (3×10)", video: "https://www.youtube.com/results?search_query=turn+on+first+touch+football+drill" },
      ], focus: "A great first touch separates good players from average ones. Fandi Ahmad's first touch was legendary.", icon: "🦶" },
      { name: "Passing Accuracy", drills: [
        { text: "5m target passing (3×15)", video: "https://www.youtube.com/results?search_query=target+passing+drill+football" },
        { text: "One-touch passing pairs (5min)", video: "https://www.youtube.com/results?search_query=one+touch+passing+pairs+football" },
        { text: "Triangle passing (3×2min)", video: "https://www.youtube.com/results?search_query=triangle+passing+drill+football" },
        { text: "Long ball to zone (2×10)", video: "https://www.youtube.com/results?search_query=long+ball+passing+drill+football" },
      ], focus: "Pass to where your teammate WILL be, not where they are now.", icon: "📐" },
      { name: "Shooting Basics", drills: [
        { text: "Laces drive — standing ball (3×10)", video: "https://www.youtube.com/results?search_query=laces+drive+shooting+technique+football" },
        { text: "Side-foot placement (3×10)", video: "https://www.youtube.com/results?search_query=side+foot+placement+shot+football" },
        { text: "One-touch finish (2×10)", video: "https://www.youtube.com/results?search_query=one+touch+finish+football+drill" },
        { text: "Volleys from cross (2×8)", video: "https://www.youtube.com/results?search_query=volley+from+cross+football+drill" },
      ], focus: "Power comes from technique, not just strength. Lock that ankle!", icon: "💥" },
    ],
  },
  intermediate: {
    title: "Game Sharpener", subtitle: "Sec 2–3 · Levelling Up",
    weeks: [
      { name: "1v1 Skills", drills: [
        { text: "Stepover + accelerate (3×8)", video: "https://www.youtube.com/results?search_query=stepover+skill+tutorial+football" },
        { text: "Body feint both sides (3×8)", video: "https://www.youtube.com/results?search_query=body+feint+football+skill+tutorial" },
        { text: "Cruyff turn (2×10)", video: "https://www.youtube.com/results?search_query=cruyff+turn+tutorial+football" },
        { text: "Elastico (2×10)", video: "https://www.youtube.com/results?search_query=elastico+skill+tutorial+football" },
      ], focus: "Messi says: 'The ball never comes at the speed you want.' Adapt and react.", icon: "⚔️" },
      { name: "Positional Play", drills: [
        { text: "Rondo 4v2 (3×3min)", video: "https://www.youtube.com/results?search_query=rondo+4v2+football+drill" },
        { text: "Positional rotations (15min)", video: "https://www.youtube.com/results?search_query=positional+rotation+football+drill" },
        { text: "Half-space receiving (3×10)", video: "https://www.youtube.com/results?search_query=half+space+receiving+football+tactical" },
        { text: "Scanning before receiving (constant)", video: "https://www.youtube.com/results?search_query=scanning+before+receiving+football" },
      ], focus: "Xavi checked his shoulder 843 times per game. Awareness is everything.", icon: "♟️" },
      { name: "Defensive Shape", drills: [
        { text: "Mirror shadowing (3×2min)", video: "https://www.youtube.com/results?search_query=mirror+shadowing+defending+drill" },
        { text: "Jockey and delay (3×1min)", video: "https://www.youtube.com/results?search_query=jockey+delay+defending+football" },
        { text: "Recovery runs (2×6)", video: "https://www.youtube.com/results?search_query=recovery+run+defending+drill+football" },
        { text: "1v1 defending channel (3×3min)", video: "https://www.youtube.com/results?search_query=1v1+defending+channel+drill+football" },
      ], focus: "Defending is about patience. Don't dive in — make them make the mistake.", icon: "🛡️" },
      { name: "Set Pieces", drills: [
        { text: "Corner delivery to zones (2×10)", video: "https://www.youtube.com/results?search_query=corner+kick+delivery+zones+football" },
        { text: "Free kick wall + curl (3×8)", video: "https://www.youtube.com/results?search_query=free+kick+curl+technique+tutorial" },
        { text: "Throw-in routines (2×5)", video: "https://www.youtube.com/results?search_query=throw+in+routines+football" },
        { text: "Penalty technique (2×5)", video: "https://www.youtube.com/results?search_query=penalty+kick+technique+tutorial" },
      ], focus: "30% of goals come from set pieces. Free goals if you practise them.", icon: "📌" },
    ],
  },
  advanced: {
    title: "Elite Pathway", subtitle: "Sec 3–4 · Competing at the Top",
    weeks: [
      { name: "Press Triggers", drills: [
        { text: "Team press on back-pass (5×2min)", video: "https://www.youtube.com/results?search_query=team+press+back+pass+trigger+football" },
        { text: "Counter-press 5s rule (3×3min)", video: "https://www.youtube.com/results?search_query=gegenpressing+counter+press+drill" },
        { text: "Press traps wide areas (3×3min)", video: "https://www.youtube.com/results?search_query=press+trap+wide+areas+football+tactical" },
        { text: "Transition sprints (2×6)", video: "https://www.youtube.com/results?search_query=transition+sprint+football+drill" },
      ], focus: "Klopp's gegenpressing: Win the ball back within 5 seconds of losing it.", icon: "🔥" },
      { name: "Build-Up Play", drills: [
        { text: "GK to striker in 5 passes (3×3min)", video: "https://www.youtube.com/results?search_query=build+up+play+goalkeeper+to+striker+drill" },
        { text: "Playing through pressure (4v3, 10min)", video: "https://www.youtube.com/results?search_query=playing+through+pressure+football+drill" },
        { text: "Switch of play drills (3×8)", video: "https://www.youtube.com/results?search_query=switch+of+play+football+drill" },
        { text: "Third-man runs (3×3min)", video: "https://www.youtube.com/results?search_query=third+man+run+football+tactical" },
      ], focus: "Pep Guardiola: 'Take the ball, pass the ball.' Simplicity under pressure.", icon: "🏗️" },
      { name: "Match Intelligence", drills: [
        { text: "Game film review (20min)", video: "https://www.youtube.com/results?search_query=football+match+analysis+for+players" },
        { text: "Decision-making rondos (3×4min)", video: "https://www.youtube.com/results?search_query=decision+making+rondo+football" },
        { text: "Tactical scenarios walk-through", video: "https://www.youtube.com/results?search_query=football+tactical+scenarios+training" },
        { text: "Communication drills (10min)", video: "https://www.youtube.com/results?search_query=communication+drills+football+team" },
      ], focus: "The best players see the game 2 seconds ahead of everyone else.", icon: "🧩" },
      { name: "Peak Performance", drills: [
        { text: "High-intensity match simulation", video: "https://www.youtube.com/results?search_query=high+intensity+match+simulation+football" },
        { text: "Fatigue decision-making drills", video: "https://www.youtube.com/results?search_query=fatigue+decision+making+football+drill" },
        { text: "Leadership under pressure", video: "https://www.youtube.com/results?search_query=leadership+under+pressure+sports+training" },
        { text: "Pre-match routine practice", video: "https://www.youtube.com/results?search_query=pre+match+routine+football+player" },
      ], focus: "Champions don't do extraordinary things — they do ordinary things extraordinarily well.", icon: "🏆" },
    ],
  },
};

// ── NUTRITION DATA ──
const NUTRITION_DATA = [
  { meal: "Pre-Training", time: "1.5–2hrs before", options: ["Chicken rice (smaller portion)","Peanut butter banana toast","Overnight oats with berries","Mee goreng with egg"], tip: "Carbs are your fuel. Don't train on empty — and don't train on full.", icon: "⛽", color: C.success },
  { meal: "During Training", time: "Every 15–20 mins", options: ["Water (most important!)","Isotonic drink for 90min+ sessions","Small banana at half-time","Avoid sugary drinks"], tip: "Even 2% dehydration drops performance by 10–20%. Drink before you're thirsty.", icon: "💧", color: C.sky },
  { meal: "Post-Training", time: "Within 30–45 mins", options: ["Chocolate milk (seriously, it works!)","Chicken breast with rice","Tuna sandwich","Protein smoothie with banana"], tip: "The 'golden window' — your muscles absorb nutrients best right after training.", icon: "🔄", color: C.yellow },
  { meal: "Match Day", time: "3hrs before kickoff", options: ["Pasta with light sauce","Rice with grilled chicken","Porridge with honey","Hydrate all morning"], tip: "Ronaldo eats fish, salad, and rice before every game. Keep it simple and clean.", icon: "⚽", color: C.danger },
];

// ── MINDSET / GROWTH MINDSET DATA ──
const MINDSET_CARDS = [
  { title: "Pre-Game Nerves", content: "Butterflies are NORMAL. Even Messi gets nervous. Try box breathing: breathe in 4s, hold 4s, out 4s, hold 4s. Do 5 rounds before kick-off.", technique: "Box Breathing", icon: "🫁" },
  { title: "After a Mistake", content: "Flush it in 5 seconds. Clap your hands, reset your stance, focus on the next action. The best players have short memories for errors.", technique: "5-Second Reset", icon: "🔄" },
  { title: "Confidence Dip", content: "Write 3 things you did well after every session. Your brain remembers what you tell it to. Build your own highlight reel.", technique: "Success Journal", icon: "📓" },
  { title: "Team Conflict", content: "Talk it out, not online. Face-to-face conversations beat WhatsApp arguments. Use 'I feel...' instead of 'You always...' Great teams argue — but they resolve fast.", technique: "Direct Communication", icon: "🤝" },
  { title: "Comparison Trap", content: "Don't compare your Chapter 1 to someone's Chapter 10. Track YOUR progress, not theirs. Mbappé was once a beginner too.", technique: "Growth Mindset", icon: "📈" },
  { title: "Burnout Signs", content: "If you dread training, feel tired all the time, or get injured often — talk to your coach. Rest is part of training, not the opposite of it.", technique: "Active Recovery", icon: "🔋" },
];

const GROWTH_MINDSET_FRAMEWORK = [
  { fixed: "I'm not good at this.", growth: "I'm not good at this YET.", key: "yet", icon: "🌱" },
  { fixed: "I made a mistake — I'm terrible.", growth: "Mistakes help me learn and improve.", key: "mistakes", icon: "🔬" },
  { fixed: "He's so talented, I'll never be that good.", growth: "His success shows me what's possible with effort.", key: "effort", icon: "🪜" },
  { fixed: "This drill is too hard.", growth: "This drill is challenging — that means I'm growing.", key: "challenge", icon: "💪" },
  { fixed: "I give up.", growth: "Let me try a different strategy.", key: "strategy", icon: "♟️" },
  { fixed: "Feedback is criticism.", growth: "Feedback is a gift that helps me get better.", key: "feedback", icon: "🎁" },
];

// ── FITNESS TESTS ──
const FITNESS_TESTS = [
  { name: "2.4km Run", unit: "min:sec", levels: { beginner: "14:00", intermediate: "12:00", advanced: "10:30", elite: "9:30" }, tip: "Pace yourself. Negative splits (faster second half) = smart running." },
  { name: "Shuttle Run (Beep Test)", unit: "level", levels: { beginner: "6.0", intermediate: "8.0", advanced: "10.0", elite: "12.0" }, tip: "This tests your ability to recover between sprints — crucial in football." },
  { name: "Standing Broad Jump", unit: "cm", levels: { beginner: "170", intermediate: "200", advanced: "220", elite: "240" }, tip: "Explosive power. Use your arms to generate momentum." },
  { name: "Sit-Ups (1 min)", unit: "reps", levels: { beginner: "30", intermediate: "38", advanced: "45", elite: "50+" }, tip: "Core strength affects everything: shooting power, balance, heading." },
  { name: "Push-Ups (1 min)", unit: "reps", levels: { beginner: "20", intermediate: "30", advanced: "40", elite: "50+" }, tip: "Upper body strength helps you hold off defenders and win aerial duels." },
  { name: "Sprint 50m", unit: "seconds", levels: { beginner: "8.5", intermediate: "7.5", advanced: "7.0", elite: "6.5" }, tip: "First 5m acceleration matters most. Explosive starts win races to the ball." },
];

// ── LEGENDS (Global + Singapore) ──
const LEGENDS_GLOBAL = [
  { name: "Virgil van Dijk", era: "2011–present", lesson: "Rejected by multiple clubs as a teenager. Didn't make it big until age 26 at Liverpool. Late bloomers exist — patience and persistence pay off.", badge: "🏔️", stat: "UCL + PL winner" },
  { name: "Mohamed Salah", era: "2010–present", lesson: "Left Egypt with a dream and was told he wasn't good enough at Chelsea. Moved to Roma, rebuilt himself, then became Liverpool's king. Never let one setback define you.", badge: "👑", stat: "PL Golden Boot × 3" },
  { name: "Lamine Yamal", era: "2023–present", lesson: "Youngest ever Euros goalscorer at 16. Proof that your generation can make history right NOW. Age is not a barrier to greatness.", badge: "🌟", stat: "Euro 2024 champion at 16" },
  { name: "Kylian Mbappé", era: "2015–present", lesson: "World Cup winner at 19. Donates all his international match fees to charity. Excellence with humility — speed on the pitch, grace off it.", badge: "⚡", stat: "World Cup winner at 19" },
  { name: "Manuel Neuer", era: "2004–present", lesson: "Revolutionised goalkeeping — a sweeper-keeper who plays like an outfield player. Came back from a broken leg at 36. Resilience redefined.", badge: "🧤", stat: "World Cup + 10× Bundesliga" },
  { name: "Pelé", era: "1956–1977", lesson: "Learned to play with a sock stuffed with newspapers because he couldn't afford a ball. Became the greatest of his era through pure love of the game.", badge: "🇧🇷", stat: "3× World Cup winner" },
  { name: "Ronaldo Nazário", era: "1993–2011", lesson: "El Fenómeno — the original Ronaldo. Overcame devastating knee injuries that would have ended most careers. At his peak, he was unstoppable. True talent combined with true courage.", badge: "🔥", stat: "2× World Cup + 2× Ballon d'Or" },
];

const LEGENDS_SG = [
  { name: "Fandi Ahmad", era: "1978–1997", lesson: "Singapore's greatest ever player. Scored against Pelé's Santos at 17. Proved that a boy from Kampong Glam can take on the world's best and win.", badge: "🇸🇬", stat: "Singapore's all-time top scorer" },
  { name: "Ikhsan Fandi", era: "2018–present", lesson: "Following in his father's footsteps — playing professionally in Europe and representing Singapore abroad. The next generation carrying the flag.", badge: "🌏", stat: "First SG player in Norwegian league" },
  { name: "Nazri Nasir", era: "1993–2012", lesson: "One of the most consistent and reliable defenders in Singapore football. Led by example — calm under pressure, composed in the big moments. Proof that defenders win titles too.", badge: "🛡️", stat: "SEA Games gold medallist" },
  { name: "Aleksandar Đurić", era: "1996–2013", lesson: "Arrived in Singapore with nothing and became a legend. Scored crucial goals well into his 40s. Age is just a number when your heart is bigger than your doubts.", badge: "🦁", stat: "S.League all-time top scorer" },
  { name: "Shahril Ishak", era: "2002–2019", lesson: "The 'Wizard' — known for his vision, creativity, and clutch performances in big games. Showed that flair and intelligence beat raw size every time.", badge: "🎩", stat: "AFF Suzuki Cup winner" },
  { name: "Indra Sahdan", era: "1997–2016", lesson: "Speed demon on the wing. His pace and directness terrorised defences across Southeast Asia. A reminder that natural gifts, when combined with hard work, create something special.", badge: "💨", stat: "AFF Championship winner" },
];

// ── SQUAD / FANTASY DATA ──
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

// ── RECOVERY DATA ──
const RECOVERY_STRETCHES = [
  { name: "Hamstring Stretch", duration: "30s each leg", how: "Sit on the ground, extend one leg, reach for your toes. Don't bounce — hold steady.", when: "Post-training", icon: "🦵", muscle: "Hamstrings" },
  { name: "Quad Stretch (Standing)", duration: "30s each leg", how: "Stand on one foot, pull the other heel to your glute. Keep knees together, stand tall.", when: "Post-training", icon: "🦿", muscle: "Quadriceps" },
  { name: "Hip Flexor Lunge", duration: "30s each side", how: "Kneel on one knee, push hips forward gently. You'll feel it in the front of your hip.", when: "Post-training", icon: "🏋️", muscle: "Hip Flexors" },
  { name: "Calf Raises & Stretch", duration: "20 reps + 30s hold", how: "Stand on a step edge, raise up on toes, then lower heels below step level and hold.", when: "Daily", icon: "🦶", muscle: "Calves" },
  { name: "Glute Bridge", duration: "3×15 reps", how: "Lie on your back, feet flat, push hips up. Squeeze at the top. Great for injury prevention.", when: "Pre-training / Daily", icon: "🍑", muscle: "Glutes" },
  { name: "Foam Roll — IT Band", duration: "60s each side", how: "Lie on your side on the roller, roll from hip to just above knee. Slow and controlled.", when: "Post-training", icon: "🧊", muscle: "IT Band (outer thigh)" },
  { name: "Child's Pose", duration: "60s", how: "Kneel, sit back on heels, stretch arms forward on the ground. Breathe deeply. Great for your back and shoulders.", when: "Post-training / Before bed", icon: "🧘", muscle: "Lower back, shoulders" },
  { name: "Neck & Shoulder Rolls", duration: "10 each direction", how: "Slow circles with your neck, then roll shoulders forward and back. Release the tension from heading practice.", when: "Anytime", icon: "🔄", muscle: "Neck, Traps" },
];

const SLEEP_TIPS = [
  { tip: "Aim for 8–10 hours per night. Teenage athletes need MORE sleep than adults, not less.", icon: "😴" },
  { tip: "Stop screens 30 mins before bed. Blue light tricks your brain into thinking it's daytime.", icon: "📵" },
  { tip: "Keep a consistent sleep schedule — even on weekends. Your body clock matters.", icon: "⏰" },
  { tip: "Cool room, dark room. 18–20°C is ideal for deep sleep.", icon: "❄️" },
  { tip: "If you have a match tomorrow, the sleep TWO nights before matters more than the night before.", icon: "📅" },
];

// ── FOOTBALL IQ QUIZ DATA ──
const QUIZ_QUESTIONS = [
  { q: "How long is a standard football match (excluding extra time)?", opts: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"], correct: 1, explain: "A standard match is 90 minutes — two halves of 45 minutes each, plus stoppage time." },
  { q: "What does 'offside' mean?", opts: ["The ball goes out of play", "A player is ahead of the second-last defender when the ball is played to them", "A player fouls from behind", "The goalkeeper leaves the box"], correct: 1, explain: "You're offside if you're closer to the goal line than the second-last defender (usually the last outfield player) when the ball is played to you." },
  { q: "In a 4-3-3 formation, how many midfielders are there?", opts: ["2", "3", "4", "5"], correct: 1, explain: "4-3-3 = 4 defenders, 3 midfielders, 3 forwards. Simple!" },
  { q: "What is a 'rondo' in training?", opts: ["A shooting drill", "A fitness test", "A possession game (e.g. 4v2 keep-ball)", "A defensive shape exercise"], correct: 2, explain: "Rondos are possession circles — players on the outside keep the ball from the players in the middle. Barcelona made this famous." },
  { q: "What does 'gegenpressing' mean?", opts: ["Defending deep in your own half", "Immediately pressing to win the ball back after losing it", "Playing long balls forward", "Man-marking every opponent"], correct: 1, explain: "Gegenpressing (counter-pressing) means winning the ball back within seconds of losing it, usually in the opponent's half. Made famous by Jürgen Klopp." },
  { q: "Which Singapore footballer scored against Pelé's Santos at age 17?", opts: ["Shahril Ishak", "Noh Alam Shah", "Fandi Ahmad", "V. Sundramoorthy"], correct: 2, explain: "Fandi Ahmad scored against Santos in 1977 as a 17-year-old — one of Singapore football's greatest ever moments." },
  { q: "What is a 'false 9'?", opts: ["A goalkeeper who plays as a striker", "A centre-forward who drops deep to create space", "A winger who plays in goal", "A defender who scores own goals"], correct: 1, explain: "A false 9 is a striker who drops into midfield to confuse defenders and create space. Messi made this role famous at Barcelona." },
  { q: "How many players must a team have to continue a match?", opts: ["9", "7", "8", "6"], correct: 1, explain: "If a team drops below 7 players (through red cards or injuries), the match is abandoned." },
  { q: "What is the 'D' on the edge of the penalty box for?", opts: ["Decorative purposes", "Where free kicks are taken", "Ensures all players are 10 yards from the penalty spot during a penalty kick", "Where the goalkeeper must stand"], correct: 2, explain: "The 'D' marks the area where all players must stay 10 yards (9.15m) from the penalty spot during a penalty kick." },
  { q: "In a 'negative split' 2.4km run, what happens?", opts: ["You run the first half faster", "You run the second half faster than the first", "You sprint the whole way", "You walk the last 400m"], correct: 1, explain: "A negative split means running the second half faster than the first. It's the smartest pacing strategy — it means you didn't burn out early." },
  { q: "What's the 'golden window' in nutrition?", opts: ["The best time to eat breakfast", "The 30–45 minutes after training when your body absorbs nutrients best", "Eating only golden-coloured food", "Fasting before a match"], correct: 1, explain: "The 30–45 minutes after training is when your muscles are primed to absorb protein and carbs for recovery." },
  { q: "What formation did Singapore use to win the 2012 AFF Suzuki Cup?", opts: ["4-4-2", "3-5-2", "4-2-3-1", "Singapore hasn't won it"], correct: 3, explain: "Singapore won the AFF Suzuki Cup in 2004, 2007, and 2012 — a proud part of Singapore football history!" },
];

// ── GOAL WALL PRESETS ──
const GOAL_CATEGORIES = [
  { cat: "Technical", icon: "⚽", examples: ["Master the Cruyff turn", "Complete 20 consecutive juggles", "Score from a free kick in training"] },
  { cat: "Physical", icon: "💪", examples: ["Run 2.4km under 12 minutes", "Do 40 push-ups in 1 minute", "Improve beep test by 1 level"] },
  { cat: "Mental", icon: "🧠", examples: ["Use box breathing before every match", "Write in Growth Journal 3x this week", "Give 1 positive call-out per training"] },
  { cat: "Teamwork", icon: "🤝", examples: ["Help a junior with a drill", "Communicate 5+ times per match", "Encourage a teammate after a mistake"] },
];

// ═════════════════════════════════
//        COMPONENTS
// ═════════════════════════════════

const fontHead = "'Bebas Neue', sans-serif";
const fontBody = "'DM Sans', sans-serif";

const labelStyle = { fontFamily: fontBody, fontSize: 11, color: C.textMid, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, background: C.offWhite, border: `1.5px solid ${C.cream}`, color: C.textDark, fontFamily: fontBody, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <h2 style={{ fontFamily: fontHead, fontSize: "clamp(32px, 5vw, 48px)", color: C.navy, margin: 0, letterSpacing: 1, lineHeight: 1 }}>{title}</h2>
      </div>
      <p style={{ fontFamily: fontBody, fontSize: 15, color: C.textLight, marginLeft: 44, marginTop: 0 }}>{subtitle}</p>
    </div>
  );
}

function Pill({ children, active, onClick, color = C.navy }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 24, cursor: "pointer", border: "none",
      background: active ? color : C.offWhite,
      color: active ? C.white : C.textMid,
      fontFamily: fontBody, fontSize: 13, fontWeight: 600,
      transition: "all 0.25s ease", boxShadow: active ? `0 4px 14px ${color}30` : "none",
    }}>
      {children}
    </button>
  );
}

// ── NAVBAR ──
function Navbar({ active, setActive }) {
  const [open, setOpen] = useState(false);
  const labels = { home: "Home", training: "Training", nutrition: "Fuel", mindset: "Mindset", fitness: "Fitness", tracker: "Tracker", squad: "Squad", legends: "Legends", lineup: "Lineup", team: "Hub" };
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${C.cream}`,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setActive("home")}>
          <span style={{ fontSize: 24 }}>⚽</span>
          <div>
            <div style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, letterSpacing: 1.5, lineHeight: 1 }}>NBSS FOOTBALL</div>
            <div style={{ fontFamily: fontBody, fontSize: 9, color: C.textLight, letterSpacing: 2, textTransform: "uppercase" }}>Naval Base Secondary</div>
          </div>
        </div>
        <button className="mob-btn" onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", color: C.navy, fontSize: 24, cursor: "pointer" }}>
          {open ? "✕" : "☰"}
        </button>
        <div className={`nav-l ${open ? "nav-open" : ""}`} style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => { setActive(s); setOpen(false); }} style={{
              background: active === s ? C.navy : "transparent",
              color: active === s ? C.yellow : C.textMid,
              border: "none", padding: "7px 13px", borderRadius: 8, cursor: "pointer",
              fontFamily: fontBody, fontSize: 12.5, fontWeight: 600, transition: "all 0.2s",
              letterSpacing: 0.3,
            }}
              onMouseEnter={e => { if (active !== s) { e.target.style.background = C.offWhite; e.target.style.color = C.navy; } }}
              onMouseLeave={e => { if (active !== s) { e.target.style.background = "transparent"; e.target.style.color = C.textMid; } }}
            >
              {labels[s]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ── HOME / HERO ──
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
      minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      textAlign: "center", padding: "80px 20px 60px", position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyLight} 40%, ${C.navyMid} 100%)`,
    }}>
      {/* Geometric background */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, ${C.yellow} 40px, ${C.yellow} 41px)` }} />
      <div style={{ position: "absolute", top: "15%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.sky}15, transparent 70%)` }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${C.yellow}10, transparent 70%)` }} />

      <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 56, marginBottom: 16, animation: "floatBall 3s ease-in-out infinite" }}>⚽</div>
        <div style={{ fontFamily: fontBody, fontSize: 12, letterSpacing: 4, color: C.skyLight, textTransform: "uppercase", marginBottom: 8 }}>Naval Base Secondary School</div>
        <h1 style={{ fontFamily: fontHead, fontSize: "clamp(44px, 8vw, 80px)", color: C.white, margin: 0, lineHeight: 1.05, letterSpacing: 2 }}>
          FOOTBALL <span style={{ color: C.yellow }}>CCA</span>
        </h1>
        <p style={{ fontFamily: fontBody, fontSize: "clamp(13px, 2vw, 17px)", color: C.skyLight, marginTop: 10, letterSpacing: 1 }}>
          Train · Grow · Compete · Together
        </p>

        {/* Quote carousel */}
        <div style={{
          marginTop: 44, padding: "24px 32px", background: "rgba(255,255,255,0.06)", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)", maxWidth: 540, margin: "44px auto 0",
          opacity: fade ? 1 : 0, transition: "opacity 0.35s ease", minHeight: 120,
        }}>
          <span style={{ fontSize: 28 }}>{q.emoji}</span>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "rgba(255,255,255,0.9)", fontStyle: "italic", margin: "10px 0 8px", lineHeight: 1.55 }}>"{q.text}"</p>
          <p style={{ fontFamily: fontBody, fontSize: 12, color: C.yellow, fontWeight: 700, letterSpacing: 1 }}>— {q.author}</p>
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
              background: b.primary ? C.yellow : "rgba(255,255,255,0.08)",
              color: b.primary ? C.navy : C.white,
              border: b.primary ? "none" : "1px solid rgba(255,255,255,0.12)",
              padding: "13px 26px", borderRadius: 12, cursor: "pointer",
              fontFamily: fontBody, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${b.primary ? C.yellow + "40" : "rgba(0,0,0,0.3)"}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <span>{b.icon}</span> {b.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TRAINING ──
function TrainingSection() {
  const [level, setLevel] = useState("beginner");
  const [openWeek, setOpenWeek] = useState(0);
  const data = TRAINING_DATA[level];
  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🏃" title="TRAINING LAB" subtitle="Progressive drills from foundation to elite level — tap 🎬 to see how it's done" />
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {Object.entries(TRAINING_DATA).map(([key, val]) => (
          <Pill key={key} active={level === key} onClick={() => { setLevel(key); setOpenWeek(0); }} color={C.navy}>{val.title}</Pill>
        ))}
      </div>
      <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textLight, marginBottom: 20, background: C.offWhite, padding: "10px 16px", borderRadius: 10 }}>{data.subtitle}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.weeks.map((week, idx) => (
          <div key={idx} style={{ background: C.cardBg, border: `1.5px solid ${openWeek === idx ? C.sky + "60" : C.cream}`, borderRadius: 14, overflow: "hidden", transition: "all 0.3s", boxShadow: openWeek === idx ? `0 4px 20px ${C.sky}15` : "none" }}>
            <button onClick={() => setOpenWeek(openWeek === idx ? -1 : idx)} style={{
              width: "100%", background: "none", border: "none", padding: "18px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26 }}>{week.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: fontHead, fontSize: 18, color: openWeek === idx ? C.navy : C.textDark, letterSpacing: 0.5 }}>WEEK {idx + 1}: {week.name.toUpperCase()}</div>
                  <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>{week.drills.length} drills · tap 🎬 for video demos</div>
                </div>
              </div>
              <span style={{ color: C.textLight, fontSize: 14, transform: openWeek === idx ? "rotate(180deg)" : "", transition: "transform 0.3s" }}>▼</span>
            </button>
            {openWeek === idx && (
              <div style={{ padding: "0 22px 22px", animation: "slideIn 0.25s ease" }}>
                <div style={{ background: `${C.yellow}12`, border: `1px solid ${C.yellow}25`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontFamily: fontBody, fontSize: 13, color: C.yellowDim, lineHeight: 1.5, fontStyle: "italic" }}>
                  💡 {week.focus}
                </div>
                {week.drills.map((drill, di) => {
                  const drillText = typeof drill === "string" ? drill : drill.text;
                  const drillVideo = typeof drill === "string" ? null : drill.video;
                  return (
                    <div key={di} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: di % 2 === 0 ? C.offWhite : "transparent", borderRadius: 8, marginBottom: 2 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy, color: C.yellow, fontSize: 12, fontWeight: 700, fontFamily: fontBody, flexShrink: 0 }}>{di + 1}</span>
                      <span style={{ fontFamily: fontBody, fontSize: 14, color: C.textDark, flex: 1 }}>{drillText}</span>
                      {drillVideo && (
                        <a href={drillVideo} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6,
                          background: `${C.danger}08`, border: `1px solid ${C.danger}15`, textDecoration: "none",
                          fontFamily: fontBody, fontSize: 11, color: C.danger, fontWeight: 700, flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${C.danger}15`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${C.danger}08`; }}
                        >
                          🎬 Video
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── FOOD DATABASE FOR CHECKER ──
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
  { name: "Fried chicken", cal: 500, carb: "low", protein: "high", fat: "high", pre: "red", post: "amber", match: "red", note: "Too heavy and greasy before training. Grilled chicken is a better swap." },
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

// ── NUTRITION ──
function NutritionSection() {
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timing, setTiming] = useState("pre");
  const [selectedFood, setSelectedFood] = useState(null);

  const timingLabels = { pre: "Pre-Training", post: "Post-Training", match: "Match Day" };
  const ratingColors = { green: C.success, amber: C.orange, red: C.danger };
  const ratingLabels = { green: "Great choice!", amber: "Okay, not ideal", red: "Avoid this" };
  const ratingEmoji = { green: "✅", amber: "⚠️", red: "🚫" };

  const filteredFoods = searchTerm.trim().length > 0
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : FOOD_DB;

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🍽️" title="FUEL STATION" subtitle="What to eat, when to eat it — simplified for student athletes" />

      {/* Food Checker Toggle */}
      <button onClick={() => setCheckerOpen(!checkerOpen)} style={{
        width: "100%", padding: 14, borderRadius: 12, cursor: "pointer", marginBottom: 20,
        background: checkerOpen ? `${C.danger}10` : `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
        color: checkerOpen ? C.danger : C.yellow,
        border: checkerOpen ? `1px solid ${C.danger}20` : "none",
        fontFamily: fontBody, fontSize: 14, fontWeight: 700,
        boxShadow: checkerOpen ? "none" : `0 4px 16px ${C.navy}20`,
      }}>
        {checkerOpen ? "Close Food Checker" : "🔍 Food Checker — Check if your meal is match-ready"}
      </button>

      {/* Food Checker */}
      {checkerOpen && (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.sky}20`, borderRadius: 16, padding: 22, marginBottom: 24, animation: "slideIn 0.25s ease" }}>
          <h3 style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, margin: "0 0 4px", letterSpacing: 0.5 }}>🔍 FOOD CHECKER</h3>
          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: "0 0 14px" }}>Search for a food, select when you're eating it, and get instant feedback.</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedFood(null); }} placeholder="Search: chicken rice, banana, bubble tea..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
            <div style={{ display: "flex", gap: 4 }}>
              {Object.entries(timingLabels).map(([key, label]) => (
                <Pill key={key} active={timing === key} onClick={() => setTiming(key)} color={C.sky}>{label}</Pill>
              ))}
            </div>
          </div>

          {/* Results */}
          {searchTerm.trim().length > 0 && (
            <div style={{ display: "grid", gap: 6, maxHeight: 300, overflowY: "auto" }}>
              {filteredFoods.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", fontFamily: fontBody, fontSize: 13, color: C.textLight }}>
                  No match found. Try searching for common foods like "chicken rice" or "banana".
                </div>
              ) : (
                filteredFoods.map((food, i) => {
                  const rating = food[timing];
                  const isSelected = (selectedFood && selectedFood.name) === food.name;
                  return (
                    <div key={i}>
                      <div role="button" tabIndex={0} onClick={() => setSelectedFood(isSelected ? null : food)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                          padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                          background: isSelected ? `${ratingColors[rating]}08` : C.offWhite,
                          border: isSelected ? `1.5px solid ${ratingColors[rating]}30` : "1.5px solid transparent",
                          transition: "all 0.2s",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{ratingEmoji[rating]}</span>
                          <span style={{ fontFamily: fontBody, fontSize: 14, color: C.textDark, fontWeight: 600 }}>{food.name}</span>
                        </div>
                        <span style={{
                          fontFamily: fontBody, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                          background: `${ratingColors[rating]}12`, color: ratingColors[rating],
                        }}>{ratingLabels[rating]}</span>
                      </div>
                      {isSelected && (
                        <div style={{ padding: "12px 16px 12px 48px", animation: "slideIn 0.2s ease" }}>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                            <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>~{food.cal} cal</span>
                            <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>Carbs: {food.carb}</span>
                            <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>Protein: {food.protein}</span>
                            <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>Fat: {food.fat}</span>
                          </div>
                          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>💡 {food.note}</p>
                          {/* Show all timing ratings */}
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            {Object.entries(timingLabels).map(([key, label]) => (
                              <span key={key} style={{
                                fontFamily: fontBody, fontSize: 10, padding: "2px 8px", borderRadius: 4,
                                background: `${ratingColors[food[key]]}10`, color: ratingColors[food[key]], fontWeight: 600,
                                border: timing === key ? `1px solid ${ratingColors[food[key]]}40` : "1px solid transparent",
                              }}>{label}: {ratingEmoji[food[key]]}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {searchTerm.trim().length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Chicken rice", "Banana", "Bubble tea", "Pasta", "Water", "Nasi lemak"].map(q => (
                <button key={q} onClick={() => setSearchTerm(q)} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.cream}`, background: C.white,
                  fontFamily: fontBody, fontSize: 12, color: C.textMid, cursor: "pointer",
                }}>Try: {q}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing meal timing cards */}
      <div style={{ display: "grid", gap: 14 }}>
        {NUTRITION_DATA.map((item, idx) => (
          <div key={idx} style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 22, display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: `${item.color}12`, fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: 0, letterSpacing: 0.5 }}>{item.meal.toUpperCase()}</h3>
                <span style={{ fontFamily: fontBody, fontSize: 11, color: item.color, background: `${item.color}12`, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{item.time}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {item.options.map((opt, oi) => (
                  <span key={oi} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 13, fontFamily: fontBody, color: C.textDark, background: C.offWhite }}>{opt}</span>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: `${C.sky}08`, borderLeft: `3px solid ${C.sky}40`, fontFamily: fontBody, fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                💡 {item.tip}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: `${C.danger}06`, border: `1px solid ${C.danger}15` }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 18, color: C.danger, margin: "0 0 10px", letterSpacing: 0.5 }}>🚫 AVOID THESE</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Sugary drinks before training","Heavy fried food pre-game","Skipping breakfast","Energy drinks (you don't need them)","Eating too close to kickoff"].map((item, i) => (
            <span key={i} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 13, fontFamily: fontBody, color: C.danger, background: `${C.danger}08` }}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── MINDSET + GROWTH MINDSET ──
function MindsetSection() {
  const [growthEntries, setGrowthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [journalText, setJournalText] = useState("");
  const [showFlip, setShowFlip] = useState(null);

  const addGrowthEntry = () => {
    if (!journalText.trim()) return;
    const entry = { id: Date.now(), text: journalText, date: new Date().toLocaleDateString("en-SG"), type: "reflection" };
    setGrowthEntries(prev => [entry, ...prev]);
    setJournalText("");
  };

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🧠" title="MENTAL GAME" subtitle="Your mind is your strongest muscle — here's how to train it" />

      {/* Growth Mindset Framework */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>🌱</span>
          <h3 style={{ fontFamily: fontHead, fontSize: 24, color: C.navy, margin: 0, letterSpacing: 0.5 }}>GROWTH MINDSET</h3>
        </div>
        <p style={{ fontFamily: fontBody, fontSize: 14, color: C.textMid, marginBottom: 16, lineHeight: 1.6 }}>
          In NBSS, we believe that abilities can be developed through dedication and hard work. Tap each card to flip between a fixed mindset thought and its growth mindset alternative.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {GROWTH_MINDSET_FRAMEWORK.map((item, idx) => {
            const isFlipped = showFlip === idx;
            return (
              <div key={idx} role="button" tabIndex={0}
                onClick={() => setShowFlip(prev => prev === idx ? null : idx)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowFlip(prev => prev === idx ? null : idx); } }}
                style={{
                  padding: 20, borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: isFlipped ? `linear-gradient(135deg, ${C.navy}, ${C.navyLight})` : C.cardBg,
                  boxShadow: isFlipped ? `0 6px 24px ${C.navy}20` : `0 1px 4px rgba(0,0,0,0.06)`,
                  transition: "all 0.35s ease", transform: isFlipped ? "scale(1.02)" : "scale(1)",
                  border: isFlipped ? `1.5px solid ${C.sky}40` : `1.5px solid ${C.cream}`,
                  minHeight: 120, userSelect: "none", WebkitTapHighlightColor: "transparent",
                  outline: "none",
                }}>
                <div style={{ fontSize: 24, marginBottom: 8, pointerEvents: "none" }}>{item.icon}</div>
                <div style={{ fontFamily: fontBody, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: isFlipped ? C.yellow : C.danger, marginBottom: 6, pointerEvents: "none" }}>
                  {isFlipped ? "✓ GROWTH MINDSET" : "✗ FIXED MINDSET"}
                </div>
                <p style={{ fontFamily: fontBody, fontSize: 14, color: isFlipped ? C.white : C.textDark, margin: 0, lineHeight: 1.5, fontWeight: isFlipped ? 600 : 400, pointerEvents: "none" }}>
                  {isFlipped ? item.growth : item.fixed}
                </p>
                <div style={{ fontFamily: fontBody, fontSize: 11, color: isFlipped ? C.skyLight : C.textLight, marginTop: 8, pointerEvents: "none" }}>
                  {isFlipped ? "Tap to flip back ←" : "Tap to flip →"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mental Skills Cards */}
      <div style={{ marginBottom: 36 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 22, color: C.navy, margin: "0 0 16px", letterSpacing: 0.5 }}>MENTAL SKILLS TOOLKIT</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
          {MINDSET_CARDS.map((card, idx) => (
            <div key={idx} style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 14, padding: 20, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{card.icon}</span>
                <h4 style={{ fontFamily: fontHead, fontSize: 16, color: C.navy, margin: 0, letterSpacing: 0.5 }}>{card.title.toUpperCase()}</h4>
              </div>
              <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, lineHeight: 1.6, margin: "0 0 10px" }}>{card.content}</p>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontFamily: fontBody, fontWeight: 700, background: `${C.sky}15`, color: C.sky }}>
                Try: {card.technique}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Breathing Exercise */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 28, marginBottom: 36 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 16px", letterSpacing: 0.5 }}>📱 BOX BREATHING EXERCISE</h3>
        <BreathingWidget />
      </div>

      {/* Growth Journal */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}06, ${C.sky}08)`, border: `1.5px solid ${C.sky}20`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>📓 GROWTH JOURNAL</h3>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: "0 0 16px", lineHeight: 1.5 }}>
          Reflect on your sessions. What did you learn? What will you try differently? Writing it down helps your brain grow. Earns you the Growth Thinker badge!
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Today I learned that... / I struggled with... but I'll try... / I'm proud that..." style={{ ...inputStyle, flex: 1, height: 60, resize: "none", borderColor: `${C.sky}30` }} />
          <button onClick={addGrowthEntry} style={{ padding: "0 20px", borderRadius: 10, background: C.navy, color: C.yellow, border: "none", fontFamily: fontBody, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Save ✓</button>
        </div>
        {growthEntries.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {growthEntries.slice(0, 8).map(entry => (
              <div key={entry.id} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.7)", fontFamily: fontBody, fontSize: 13, color: C.textDark, lineHeight: 1.5 }}>
                <span style={{ fontSize: 11, color: C.textLight, fontWeight: 600 }}>{entry.date}</span>
                <br />{entry.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BreathingWidget() {
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState("Ready");
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);
  const phaseRef = useRef(0);
  const stepRef = useRef(0);

  const stop = () => { setBreathing(false); setPhase("Ready"); setCount(0); if (timerRef.current) clearInterval(timerRef.current); };

  const start = () => {
    setBreathing(true);
    const phases = ["Breathe In...", "Hold...", "Breathe Out...", "Hold..."];
    phaseRef.current = 0; stepRef.current = 0;
    let c = 4;
    setPhase(phases[0]); setCount(4);
    timerRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        stepRef.current++;
        if (stepRef.current >= 16) { stop(); setPhase("Done! Great job 🎉"); return; }
        phaseRef.current = (phaseRef.current + 1) % 4;
        setPhase(phases[phaseRef.current]);
        c = 4;
      }
      setCount(c);
    }, 1000);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 130, height: 130, borderRadius: "50%", margin: "0 auto 20px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: breathing ? (phase.includes("In") ? `${C.sky}20` : phase.includes("Out") ? `${C.navy}15` : `${C.yellow}15`) : C.offWhite,
        border: `3px solid ${breathing ? (phase.includes("In") ? C.sky : phase.includes("Out") ? C.navy : C.yellow) : C.cream}`,
        transition: "all 0.8s ease",
        transform: breathing && phase.includes("In") ? "scale(1.15)" : breathing && phase.includes("Out") ? "scale(0.88)" : "scale(1)",
      }}>
        <span style={{ fontFamily: fontHead, fontSize: 32, color: C.navy }}>{count || "🫁"}</span>
        <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textMid, marginTop: 2 }}>{phase}</span>
      </div>
      <button onClick={breathing ? stop : start} style={{
        background: breathing ? `${C.danger}15` : C.navy,
        color: breathing ? C.danger : C.yellow,
        border: breathing ? `1px solid ${C.danger}30` : "none",
        padding: "11px 28px", borderRadius: 10, cursor: "pointer",
        fontFamily: fontBody, fontSize: 13, fontWeight: 700,
      }}>
        {breathing ? "Stop" : "Start Box Breathing (4 rounds)"}
      </button>
    </div>
  );
}

// ── FITNESS ──
function FitnessSection() {
  const levelColors = { beginner: C.textLight, intermediate: C.orange, advanced: C.sky, elite: C.yellow };
  const [results, setResults] = usePersistedState(STORAGE_KEYS.fitnessResults, {});
  const [showLog, setShowLog] = useState(null);
  const [logForm, setLogForm] = useState({ date: "", value: "" });
  const [showChart, setShowChart] = useState(null);
  const [targets, setTargets] = useState({});

  // Load targets from results
  useEffect(() => {
    const t = {};
    Object.keys(results).forEach(k => { if ((results[k] && results[k].target)) t[k] = results[k].target; });
    setTargets(t);
  }, [results]);

  const addResult = (testName) => {
    if (!logForm.date || !logForm.value) return;
    const existing = ((results[testName] && results[testName].entries) || []);
    const newEntry = { date: logForm.date, value: logForm.value, id: Date.now() };
    setResults(prev => ({ ...prev, [testName]: { ...prev[testName], entries: [...existing, newEntry].sort((a, b) => a.date.localeCompare(b.date)) } }));
    setLogForm({ date: "", value: "" });
    setShowLog(null);
  };

  const deleteResult = (testName, id) => {
    const entries = (((results[testName] && results[testName].entries) || [])).filter(e => e.id !== id);
    setResults(prev => ({ ...prev, [testName]: { ...prev[testName], entries } }));
  };

  const setTarget = (testName, target) => {
    setResults(prev => ({ ...prev, [testName]: { ...prev[testName], target } }));
    setTargets(prev => ({ ...prev, [testName]: target }));
  };

  const getChartData = (testName) => {
    return (((results[testName] && results[testName].entries) || [])).map(e => ({
      date: e.date.slice(5),
      value: parseFloat(e.value) || 0,
      label: e.value,
    }));
  };

  const getEntryCount = (testName) => (((results[testName] && results[testName].entries) || [])).length;

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="💪" title="FITNESS BENCHMARKS" subtitle="Track your results, see your progress, set your targets" />
      <div style={{ display: "grid", gap: 14 }}>
        {FITNESS_TESTS.map((test, idx) => {
          const entries = ((results[test.name] && results[test.name].entries) || []);
          const target = ((results[test.name] && results[test.name].target) || "");
          const chartData = getChartData(test.name);
          const latest = entries.length > 0 ? entries[entries.length - 1].value : null;

          return (
            <div key={idx} style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: 0, letterSpacing: 0.5 }}>{test.name.toUpperCase()}</h3>
                  <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, background: C.offWhite, padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>{test.unit}</span>
                </div>
                {latest && (
                  <span style={{ fontFamily: fontHead, fontSize: 16, color: C.sky, background: `${C.sky}10`, padding: "4px 12px", borderRadius: 8 }}>
                    Latest: {latest}
                  </span>
                )}
              </div>

              {/* Level benchmarks */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                {Object.entries(test.levels).map(([lvl, val]) => (
                  <div key={lvl} style={{ padding: "12px 6px", borderRadius: 10, textAlign: "center", background: `${levelColors[lvl]}08`, border: `1px solid ${levelColors[lvl]}20` }}>
                    <div style={{ fontFamily: fontBody, fontSize: 10, color: levelColors[lvl], textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>{lvl}</div>
                    <div style={{ fontFamily: fontHead, fontSize: 22, color: levelColors[lvl], marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textLight, margin: "0 0 14px", borderTop: `1px solid ${C.cream}`, paddingTop: 10 }}>💡 {test.tip}</p>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: entries.length > 0 ? 14 : 0 }}>
                <button onClick={() => { setShowLog(showLog === test.name ? null : test.name); setShowChart(null); }} style={{
                  padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "none",
                  background: showLog === test.name ? `${C.danger}10` : C.navy, color: showLog === test.name ? C.danger : C.yellow,
                  fontFamily: fontBody, fontSize: 12, fontWeight: 700,
                }}>
                  {showLog === test.name ? "Cancel" : `+ Log Result (${getEntryCount(test.name)})`}
                </button>
                {entries.length >= 2 && (
                  <button onClick={() => { setShowChart(showChart === test.name ? null : test.name); setShowLog(null); }} style={{
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                    background: showChart === test.name ? `${C.sky}15` : C.offWhite,
                    border: showChart === test.name ? `1px solid ${C.sky}30` : `1px solid ${C.cream}`,
                    color: showChart === test.name ? C.sky : C.textMid,
                    fontFamily: fontBody, fontSize: 12, fontWeight: 700,
                  }}>
                    {showChart === test.name ? "Hide Chart" : "📈 View Progress"}
                  </button>
                )}
              </div>

              {/* Log form */}
              {showLog === test.name && (
                <div style={{ padding: 16, background: C.offWhite, borderRadius: 12, marginTop: 10, animation: "slideIn 0.25s ease" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div>
                      <label style={labelStyle}>Date</label>
                      <input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} style={{ ...inputStyle, width: 160 }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Result ({test.unit})</label>
                      <input value={logForm.value} onChange={e => setLogForm({...logForm, value: e.target.value})} placeholder={`e.g. ${test.levels.intermediate}`} style={{ ...inputStyle, width: 140 }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Target ({test.unit})</label>
                      <input value={targets[test.name] || ""} onChange={e => setTarget(test.name, e.target.value)} placeholder={`e.g. ${test.levels.advanced}`} style={{ ...inputStyle, width: 140 }} />
                    </div>
                    <button onClick={() => addResult(test.name)} style={{
                      padding: "10px 20px", borderRadius: 8, background: C.navy, color: C.yellow,
                      border: "none", fontFamily: fontBody, fontSize: 12, fontWeight: 700, cursor: "pointer", height: 40,
                    }}>Save</button>
                  </div>

                  {/* Recent entries */}
                  {entries.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Recent Results</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {entries.slice(-8).reverse().map(e => (
                          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: C.white, border: `1px solid ${C.cream}` }}>
                            <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>{e.date}</span>
                            <span style={{ fontFamily: fontBody, fontSize: 12, color: C.navy, fontWeight: 700 }}>{e.value}</span>
                            <button onClick={() => deleteResult(test.name, e.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, opacity: 0.4, padding: "0 2px" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chart */}
              {showChart === test.name && chartData.length >= 2 && (
                <div style={{ marginTop: 14, padding: 16, background: C.offWhite, borderRadius: 12, animation: "slideIn 0.25s ease" }}>
                  <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                    Progress Over Time {target ? `· Target: ${target}` : ""}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.cream} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textLight }} />
                      <YAxis tick={{ fontSize: 10, fill: C.textLight }} />
                      <Tooltip
                        contentStyle={{ background: C.white, border: `1px solid ${C.cream}`, borderRadius: 8, fontFamily: fontBody, fontSize: 12 }}
                        labelStyle={{ color: C.textLight }}
                      />
                      <Line type="monotone" dataKey="value" stroke={C.sky} strokeWidth={2.5} dot={{ fill: C.navy, r: 4 }} activeDot={{ r: 6, fill: C.sky }} />
                      {target && <ReferenceLine y={parseFloat(target)} stroke={C.success} strokeDasharray="5 5" label={{ value: "Target", fill: C.success, fontSize: 10 }} />}
                    </LineChart>
                  </ResponsiveContainer>
                  {entries.length >= 2 && (
                    <div style={{ fontFamily: fontBody, fontSize: 12, color: C.textMid, marginTop: 8, textAlign: "center" }}>
                      {(() => {
                        const first = parseFloat(entries[0].value);
                        const last = parseFloat(entries[entries.length - 1].value);
                        const diff = last - first;
                        const improved = test.name.includes("Run") || test.name.includes("Sprint") ? diff < 0 : diff > 0;
                        return improved
                          ? `📈 Improved by ${Math.abs(diff).toFixed(1)} since your first entry!`
                          : diff === 0 ? "Consistent — keep pushing for improvement!" : "Keep working at it — progress isn't always linear. 💪";
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── TRACKER (Persisted) ──
function TrackerSection() {
  const [sessions, setSessions, sessionsLoaded] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊" });
  const [year, setYear] = useState("Sec 1");

  const moods = ["😤", "😔", "😐", "😊", "🔥"];

  const addEntry = () => {
    if (!form.date) return;
    setSessions(prev => [...prev, { ...form, id: Date.now(), year }]);
    setForm({ date: "", type: "training", rating: 3, notes: "", goals: "", mood: "😊" });
    setShowForm(false);
  };

  const deleteEntry = (id) => { setSessions(prev => prev.filter(e => e.id !== id)); };

  const yearSessions = sessions.filter(s => s.year === year);
  const avgRating = yearSessions.length ? (yearSessions.reduce((s, e) => s + e.rating, 0) / yearSessions.length).toFixed(1) : "–";

  if (!sessionsLoaded) return (<section style={{ padding: "120px 20px", textAlign: "center" }}><p style={{ fontFamily: fontBody, color: C.textLight }}>Loading your data...</p></section>);

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="📊" title="PROGRESS TRACKER" subtitle="Log sessions, track your growth from Sec 1 to Sec 4 — data saves automatically" />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Sessions", value: sessions.length, icon: "📝" },
          { label: `${year} Sessions`, value: yearSessions.length, icon: "📅" },
          { label: "Avg Rating", value: avgRating, icon: "⭐" },
          { label: "Current Year", value: year, icon: "🎓" },
        ].map((s, i) => (
          <div key={i} style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ fontFamily: fontHead, fontSize: 26, color: C.navy, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Year filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {["Sec 1","Sec 2","Sec 3","Sec 4"].map(y => <Pill key={y} active={year === y} onClick={() => setYear(y)} color={C.navy}>{y}</Pill>)}
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(!showForm)} style={{
        width: "100%", padding: 14, borderRadius: 12, cursor: "pointer", marginBottom: 18,
        background: showForm ? `${C.danger}10` : C.navy,
        color: showForm ? C.danger : C.yellow,
        border: showForm ? `1px solid ${C.danger}20` : "none",
        fontFamily: fontBody, fontSize: 14, fontWeight: 700,
      }}>
        {showForm ? "Cancel" : "+ Log New Session"}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.sky}25`, borderRadius: 16, padding: 22, marginBottom: 22, animation: "slideIn 0.25s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                <option value="training">Training</option><option value="match">Match</option><option value="fitness">Fitness Test</option><option value="recovery">Recovery</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Performance Rating</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => setForm({...form, rating: r})} style={{
                  width: 42, height: 42, borderRadius: 10, cursor: "pointer",
                  background: form.rating >= r ? C.navy : C.offWhite,
                  border: form.rating >= r ? "none" : `1.5px solid ${C.cream}`,
                  color: form.rating >= r ? C.yellow : C.textLight,
                  fontSize: 16, fontFamily: fontBody, fontWeight: 700,
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Mood After Session</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {moods.map(m => (
                <button key={m} onClick={() => setForm({...form, mood: m})} style={{
                  width: 42, height: 42, borderRadius: 10, cursor: "pointer", fontSize: 20,
                  background: form.mood === m ? `${C.sky}15` : C.offWhite,
                  border: form.mood === m ? `2px solid ${C.sky}` : `1.5px solid ${C.cream}`,
                }}>{m}</button>
              ))}
            </div>
          </div>
          {/* Growth mindset prompt */}
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: `${C.yellow}08`, border: `1px solid ${C.yellow}20` }}>
            <p style={{ fontFamily: fontBody, fontSize: 12, color: C.yellowDim, margin: 0, fontWeight: 600 }}>🌱 Growth Mindset Prompt: What's one thing you found challenging today? How will you approach it next time?</p>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Reflections (what went well / what to improve)</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. My first touch was sharp today but passing under pressure needs work..." style={{ ...inputStyle, height: 70, resize: "vertical" }} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Goals for next session</label>
            <input value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} placeholder="e.g. Complete 5 successful dribbles past a defender" style={inputStyle} />
          </div>
          <button onClick={addEntry} style={{ marginTop: 18, width: "100%", padding: 13, borderRadius: 10, background: C.navy, color: C.yellow, border: "none", cursor: "pointer", fontFamily: fontBody, fontSize: 14, fontWeight: 700 }}>
            Save Entry ✓
          </button>
        </div>
      )}

      {/* Entries */}
      {yearSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 44, background: C.offWhite, borderRadius: 16, border: `1.5px dashed ${C.cream}` }}>
          <span style={{ fontSize: 44, display: "block", marginBottom: 10 }}>📋</span>
          <p style={{ fontFamily: fontBody, color: C.textLight, fontSize: 14 }}>No sessions logged for {year} yet.</p>
          <p style={{ fontFamily: "'Playfair Display', serif", color: C.textMid, fontSize: 14, fontStyle: "italic", marginTop: 6 }}>"What gets measured, gets improved."</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {yearSessions.slice().reverse().map(entry => (
            <div key={entry.id} style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{entry.mood}</span>
                <div>
                  <div style={{ fontFamily: fontHead, fontSize: 14, color: C.navy, letterSpacing: 0.3 }}>{entry.type.toUpperCase()} — {entry.date}</div>
                  {entry.notes && <div style={{ fontFamily: fontBody, fontSize: 12, color: C.textMid, marginTop: 2 }}>{entry.notes}</div>}
                  {entry.goals && <div style={{ fontFamily: fontBody, fontSize: 12, color: C.sky, marginTop: 2 }}>🎯 {entry.goals}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>{[1,2,3,4,5].map(r => <span key={r} style={{ color: entry.rating >= r ? C.yellow : C.cream, fontSize: 14 }}>★</span>)}</div>
                <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── SQUAD MODE (Fantasy) ──
function SquadSection() {
  const [sessions] = usePersistedState(STORAGE_KEYS.sessions, []);
  const [growthEntries] = usePersistedState(STORAGE_KEYS.growthJournal, []);
  const [squad, setSquad, squadLoaded] = usePersistedState(STORAGE_KEYS.squad, { name: "", position: "", number: "" });
  const [editing, setEditing] = useState(false);
  const [tempSquad, setTempSquad] = useState({ name: "", position: "", number: "" });

  const { xp, earned } = computeXpAndBadges(sessions, growthEntries);
  const lvl = getLevel(xp);

  const saveProfile = () => {
    setSquad(tempSquad);
    setEditing(false);
  };

  const startEdit = () => {
    setTempSquad({ ...squad });
    setEditing(true);
  };

  if (!squadLoaded) return (<section style={{ padding: "120px 20px", textAlign: "center" }}><p style={{ fontFamily: fontBody, color: C.textLight }}>Loading...</p></section>);

  const hasProfile = squad.name && squad.name.trim().length > 0;

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🎮" title="SQUAD MODE" subtitle="Your football career card — earn XP, unlock badges, climb the ranks" />

      {/* Profile Card */}
      {!hasProfile || editing ? (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.sky}25`, borderRadius: 16, padding: 24, marginBottom: 24, animation: "slideIn 0.25s ease" }}>
          <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 16px", letterSpacing: 0.5 }}>CREATE YOUR PLAYER CARD</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Name</label><input value={tempSquad.name} onChange={e => setTempSquad({...tempSquad, name: e.target.value})} placeholder="Your name" style={inputStyle} /></div>
            <div><label style={labelStyle}>Position</label>
              <select value={tempSquad.position} onChange={e => setTempSquad({...tempSquad, position: e.target.value})} style={inputStyle}>
                <option value="">Select</option><option value="GK">Goalkeeper</option><option value="CB">Centre Back</option><option value="LB">Left Back</option><option value="RB">Right Back</option><option value="CDM">Defensive Mid</option><option value="CM">Central Mid</option><option value="CAM">Attacking Mid</option><option value="LW">Left Wing</option><option value="RW">Right Wing</option><option value="ST">Striker</option>
              </select>
            </div>
            <div><label style={labelStyle}>Number</label><input type="number" min="1" max="99" value={tempSquad.number} onChange={e => setTempSquad({...tempSquad, number: e.target.value})} placeholder="#" style={inputStyle} /></div>
          </div>
          <button onClick={saveProfile} style={{ marginTop: 16, padding: "12px 32px", borderRadius: 10, background: C.navy, color: C.yellow, border: "none", fontFamily: fontBody, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Save Player Card</button>
        </div>
      ) : (
        <div style={{
          background: `linear-gradient(145deg, ${C.navy}, ${C.navyMid})`, borderRadius: 20, padding: 28,
          marginBottom: 24, position: "relative", overflow: "hidden",
          boxShadow: `0 8px 32px ${C.navy}30`,
        }}>
          {/* Card decoration */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 160, height: 160, borderRadius: "50%", background: `${C.yellow}10` }} />
          <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: `${C.sky}08` }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${C.yellow}20`, border: `2px solid ${C.yellow}50`,
                  fontFamily: fontHead, fontSize: 32, color: C.yellow,
                }}>
                  {squad.number || "?"}
                </div>
                <div>
                  <div style={{ fontFamily: fontHead, fontSize: 28, color: C.white, letterSpacing: 1 }}>{squad.name.toUpperCase()}</div>
                  <div style={{ fontFamily: fontBody, fontSize: 13, color: C.skyLight }}>{squad.position || "No position"} · NBSS FC</div>
                </div>
              </div>
              <button onClick={startEdit} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: C.white, padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontFamily: fontBody, fontSize: 12, fontWeight: 600 }}>Edit ✎</button>
            </div>

            {/* XP Bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontFamily: fontHead, fontSize: 18, color: C.yellow, letterSpacing: 0.5 }}>LVL {lvl.level} · {lvl.title.toUpperCase()}</span>
                <span style={{ fontFamily: fontBody, fontSize: 12, color: C.skyLight }}>{xp} XP{lvl.next ? ` / ${lvl.next}` : " (MAX)"}</span>
              </div>
              {(() => {
                const xpPct = lvl.next ? Math.min((xp / lvl.next) * 100, 100) : 100;
                return (
                  <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 5,
                      background: `linear-gradient(90deg, ${C.yellow}, ${C.sky})`,
                      width: `${xpPct}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                );
              })()}
            </div>

            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18 }}>
              {(() => {
                const avgRat = sessions.length > 0 ? (sessions.reduce((a, b) => a + b.rating, 0) / sessions.length).toFixed(1) : "–";
                return [
                  { label: "Sessions", val: sessions.length },
                  { label: "Avg Rating", val: avgRat },
                  { label: "Badges", val: earned.length },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "10px 0", background: "rgba(255,255,255,0.05)", borderRadius: 10 }}>
                    <div style={{ fontFamily: fontHead, fontSize: 22, color: C.white }}>{s.val}</div>
                    <div style={{ fontFamily: fontBody, fontSize: 10, color: C.skyLight, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <h3 style={{ fontFamily: fontHead, fontSize: 22, color: C.navy, margin: "0 0 14px", letterSpacing: 0.5 }}>🏅 BADGES</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 24 }}>
        {BADGES.map(badge => {
          const unlocked = earned.includes(badge.id);
          return (
            <div key={badge.id} style={{
              background: unlocked ? C.cardBg : C.offWhite, border: `1.5px solid ${unlocked ? C.yellow + "40" : C.cream}`,
              borderRadius: 12, padding: "14px 16px", opacity: unlocked ? 1 : 0.5,
              boxShadow: unlocked ? `0 2px 12px ${C.yellow}15` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>{badge.icon}</span>
                <span style={{ fontFamily: fontHead, fontSize: 14, color: C.navy, letterSpacing: 0.3 }}>{badge.name.toUpperCase()}</span>
              </div>
              <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textMid, margin: 0 }}>{badge.desc}</p>
              <div style={{ fontFamily: fontBody, fontSize: 11, color: unlocked ? C.success : C.textLight, fontWeight: 700, marginTop: 4 }}>
                {unlocked ? `✓ Earned · +${badge.xp} XP` : `Locked · ${badge.xp} XP`}
              </div>
            </div>
          );
        })}
      </div>

      {/* How to earn XP */}
      <div style={{ background: C.offWhite, borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontFamily: fontHead, fontSize: 16, color: C.navy, margin: "0 0 10px", letterSpacing: 0.5 }}>HOW TO EARN XP</h4>
        <div style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, lineHeight: 1.8 }}>
          <div>📝 <strong>+30 XP</strong> per session logged</div>
          <div>🏅 <strong>+50–500 XP</strong> per badge unlocked</div>
          <div>🌱 <strong>+60 XP</strong> for your first Growth Journal entry</div>
          <div>⭐ <strong>+75 XP</strong> for a perfect 5/5 rated session</div>
          <div style={{ marginTop: 8, fontStyle: "italic", color: C.textLight }}>Tip: Log consistently, reflect honestly, and try different session types to unlock all badges.</div>
        </div>
      </div>
    </section>
  );
}

// ── LEGENDS ──
function LegendsSection() {
  const [tab, setTab] = useState("global");
  const [active, setActive] = useState(0);
  const legends = tab === "global" ? LEGENDS_GLOBAL : LEGENDS_SG;

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🌟" title="HALL OF LEGENDS" subtitle="Lessons from the greatest — from their lowest moments to their highest" />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Pill active={tab === "global"} onClick={() => { setTab("global"); setActive(0); }} color={C.navy}>🌍 Global Icons</Pill>
        <Pill active={tab === "sg"} onClick={() => { setTab("sg"); setActive(0); }} color={C.navy}>🇸🇬 Singapore Legends</Pill>
      </div>

      {/* Legend selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 20 }}>
        {legends.map((l, idx) => (
          <button key={idx} onClick={() => setActive(idx)} style={{
            background: active === idx ? C.navy : C.cardBg,
            border: active === idx ? "none" : `1.5px solid ${C.cream}`,
            borderRadius: 12, padding: "12px 6px", cursor: "pointer", textAlign: "center",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 26, display: "block" }}>{l.badge}</span>
            <span style={{ fontFamily: fontBody, fontSize: 10, fontWeight: 600, color: active === idx ? C.yellow : C.textMid, marginTop: 4, display: "block" }}>
              {l.name.split(" ").pop()}
            </span>
          </button>
        ))}
      </div>

      {/* Active Legend Card */}
      <div style={{
        background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 20, padding: 28,
        boxShadow: `0 4px 24px rgba(0,0,0,0.06)`, transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: 44, width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.navy}08`, borderRadius: 16 }}>
            {legends[active].badge}
          </span>
          <div>
            <h2 style={{ fontFamily: fontHead, fontSize: 30, color: C.navy, margin: 0, letterSpacing: 1 }}>{legends[active].name.toUpperCase()}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, background: C.offWhite, padding: "3px 10px", borderRadius: 6 }}>{legends[active].era}</span>
              <span style={{ fontFamily: fontBody, fontSize: 11, color: C.navy, background: `${C.yellow}20`, padding: "3px 10px", borderRadius: 6, fontWeight: 700 }}>{legends[active].stat}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "18px 22px", borderRadius: 14, background: `${C.sky}06`, borderLeft: `4px solid ${C.sky}50` }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textDark, lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>
            {legends[active].lesson}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 10, background: C.offWhite, textAlign: "center" }}>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textLight, margin: 0 }}>Every legend started as someone who just loved kicking a ball around. Your story is still being written. ✍️</p>
      </div>
    </section>
  );
}

// ── TEAM HUB ──
function TeamHubSection() {
  const [hubTab, setHubTab] = useState("overview");
  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 860, margin: "0 auto" }}>
      <SectionHeader icon="🏟️" title="TEAM HUB" subtitle="Everything your CCA team needs in one place" />

      {/* Hub navigation */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Overview", icon: "🏠" },
          { id: "schedule", label: "Schedule", icon: "📅" },
          { id: "recovery", label: "Recovery Zone", icon: "🧊" },
          { id: "quiz", label: "Football IQ", icon: "🧠" },
          { id: "goals", label: "Goal Wall", icon: "🎯" },
        ].map(t => (
          <Pill key={t.id} active={hubTab === t.id} onClick={() => setHubTab(t.id)} color={C.navy}>
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

function HubOverview({ setHubTab }) {
  const cards = [
    { id: "schedule", title: "CCA Schedule", desc: "Training days, match fixtures, and important dates — linked to team calendar.", icon: "📅", color: C.sky },
    { id: "recovery", title: "Recovery Zone", desc: "Stretching routines, foam rolling, and sleep tips for growing athletes.", icon: "🧊", color: C.success },
    { id: "quiz", title: "Football IQ Quiz", desc: "12 questions on tactics, rules, nutrition and SG football history.", icon: "🧠", color: C.yellow },
    { id: "goals", title: "Goal Wall", desc: "Set personal goals for the term. Track them. Crush them.", icon: "🎯", color: C.danger },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginBottom: 28 }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => setHubTab(card.id)} style={{
            background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 14, padding: 22,
            textAlign: "left", cursor: "pointer", transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = card.color + "50"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${card.color}12`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cream; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>{card.icon}</span>
            <h3 style={{ fontFamily: fontHead, fontSize: 16, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>{card.title.toUpperCase()}</h3>
            <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
            <span style={{ display: "inline-block", marginTop: 10, fontFamily: fontBody, fontSize: 12, fontWeight: 700, color: card.color }}>Open →</span>
          </button>
        ))}
      </div>

      {/* Position Finder */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>🗺️ POSITION FINDER</h3>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: "0 0 16px" }}>Not sure where you fit best? Answer these questions:</p>
        <PositionFinder />
      </div>

      {/* Kit Checklist */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 14px", letterSpacing: 0.5 }}>🎒 KIT CHECKLIST</h3>
        <KitChecklist />
      </div>
    </>
  );
}

// ── SCHEDULE CARD ──
function ScheduleCard() {
  const SCHEDULE_URL = "https://docs.google.com/spreadsheets/d/1L5FGME5itmc3vknwL0xSsIrz4qJ3n6z1YfxffgeB3nU/edit?usp=drivesdk";

  return (
    <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
      <span style={{ fontSize: 48, display: "block", marginBottom: 14 }}>📅</span>
      <h3 style={{ fontFamily: fontHead, fontSize: 24, color: C.navy, margin: "0 0 8px", letterSpacing: 0.5 }}>CCA SCHEDULE</h3>
      <p style={{ fontFamily: fontBody, fontSize: 14, color: C.textMid, margin: "0 0 24px", lineHeight: 1.6 }}>
        Training dates, match fixtures, and teachers on duty — all maintained in one Google Sheet.
      </p>

      <a href={SCHEDULE_URL} target="_blank" rel="noopener noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 32px",
        background: C.navy, color: C.yellow, borderRadius: 14, textDecoration: "none",
        fontFamily: fontBody, fontSize: 15, fontWeight: 700, transition: "all 0.2s",
        boxShadow: `0 4px 16px ${C.navy}20`,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${C.navy}35`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 16px ${C.navy}20`; }}
      >
        📊 Open Schedule in Google Sheets ↗
      </a>

      <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textLight, marginTop: 16, lineHeight: 1.5 }}>
        Opens in a new tab. Bookmark it on your phone for quick access!
      </p>
    </div>
  );
}

// ── RECOVERY ZONE ──
function RecoveryZone() {
  const [activeStretch, setActiveStretch] = useState(null);
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 24, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>🧊 RECOVERY ZONE</h3>
        <p style={{ fontFamily: fontBody, fontSize: 14, color: C.textMid, margin: "0 0 4px", lineHeight: 1.5 }}>
          Recovery isn't lazy — it's smart. Your body gets stronger during rest, not during training.
        </p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.sky, fontStyle: "italic" }}>
          "Rest days are not a sign of weakness. They're a sign of intelligence." — Every elite athlete ever
        </p>
      </div>

      {/* Stretching Routine */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h4 style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, margin: "0 0 14px", letterSpacing: 0.5 }}>🦵 POST-TRAINING STRETCHING ROUTINE</h4>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: "0 0 14px" }}>Tap each stretch for instructions. Hold each stretch — no bouncing!</p>
        <div style={{ display: "grid", gap: 6 }}>
          {RECOVERY_STRETCHES.map((s, idx) => (
            <div key={idx}>
              <button onClick={() => setActiveStretch(activeStretch === idx ? null : idx)} style={{
                width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                background: activeStretch === idx ? `${C.success}06` : C.offWhite,
                border: activeStretch === idx ? `1.5px solid ${C.success}25` : `1px solid transparent`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: fontBody, fontSize: 14, color: C.textDark, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>{s.muscle} · {s.duration}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontFamily: fontBody, fontWeight: 600, background: `${C.sky}10`, color: C.sky }}>{s.when}</span>
                  <span style={{ color: C.textLight, fontSize: 12, transform: activeStretch === idx ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▼</span>
                </div>
              </button>
              {activeStretch === idx && (
                <div style={{
                  padding: "12px 16px 12px 48px", background: `${C.success}04`, borderRadius: "0 0 10px 10px",
                  borderLeft: `3px solid ${C.success}30`, animation: "slideIn 0.2s ease",
                }}>
                  <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.6 }}>
                    <strong>How:</strong> {s.how}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sleep Tips */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}06, ${C.navyMid}08)`, border: `1.5px solid ${C.navy}12`, borderRadius: 16, padding: 24 }}>
        <h4 style={{ fontFamily: fontHead, fontSize: 18, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>😴 SLEEP = SUPERPOWER</h4>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: "0 0 14px" }}>
          Cristiano Ronaldo sleeps 5 naps a day for 90 minutes each. You don't need to go that far — but sleep matters more than most players think.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {SLEEP_TIPS.map((tip, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px",
              background: "rgba(255,255,255,0.6)", borderRadius: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
              <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textDark, margin: 0, lineHeight: 1.5 }}>{tip.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FOOTBALL IQ QUIZ ──
function FootballIQQuiz() {
  const [quizState, setQuizState] = useState("intro"); // intro, playing, results
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
    const correct = idx === QUIZ_QUESTIONS[currentQ].correct;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, { qIdx: currentQ, selected: idx, correct }]);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= QUIZ_QUESTIONS.length) {
      const finalScore = score;
      if (finalScore > bestScore) setBestScore(finalScore);
      setQuizState("results");
    } else {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowAnswer(false);
    }
  };

  if (quizState === "intro") {
    return (
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
        <span style={{ fontSize: 56, display: "block", marginBottom: 16 }}>🧠</span>
        <h3 style={{ fontFamily: fontHead, fontSize: 28, color: C.navy, margin: "0 0 8px", letterSpacing: 0.5 }}>FOOTBALL IQ QUIZ</h3>
        <p style={{ fontFamily: fontBody, fontSize: 14, color: C.textMid, margin: "0 0 6px", lineHeight: 1.5 }}>
          {QUIZ_QUESTIONS.length} questions on tactics, rules, nutrition, and Singapore football history.
        </p>
        {bestScore > 0 && (
          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.success, fontWeight: 700, margin: "0 0 8px" }}>
            🏆 Your best score: {bestScore}/{QUIZ_QUESTIONS.length}
          </p>
        )}
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.sky, fontStyle: "italic", margin: "0 0 24px" }}>
          "Football is played with the head. Your feet are just the tools." — Andrea Pirlo
        </p>
        <button onClick={startQuiz} style={{
          padding: "14px 36px", borderRadius: 12, background: C.navy, color: C.yellow,
          border: "none", fontFamily: fontBody, fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>
          Start Quiz ⚡
        </button>
      </div>
    );
  }

  if (quizState === "results") {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    const grade = pct >= 90 ? { label: "Football Genius!", emoji: "🐐", color: C.success } :
                  pct >= 70 ? { label: "Sharp Player", emoji: "⚡", color: C.sky } :
                  pct >= 50 ? { label: "Getting There", emoji: "📈", color: C.orange } :
                              { label: "Keep Learning!", emoji: "📚", color: C.danger };
    return (
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
        <span style={{ fontSize: 56, display: "block", marginBottom: 12 }}>{grade.emoji}</span>
        <h3 style={{ fontFamily: fontHead, fontSize: 28, color: C.navy, margin: "0 0 8px" }}>QUIZ COMPLETE!</h3>
        <div style={{ fontFamily: fontHead, fontSize: 48, color: grade.color, margin: "8px 0" }}>{score}/{QUIZ_QUESTIONS.length}</div>
        <p style={{ fontFamily: fontBody, fontSize: 16, color: grade.color, fontWeight: 700, margin: "0 0 4px" }}>{grade.label}</p>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textLight, margin: "0 0 20px" }}>{pct}% correct</p>

        {/* Answer review */}
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <h4 style={{ fontFamily: fontHead, fontSize: 16, color: C.navy, margin: "0 0 10px" }}>REVIEW YOUR ANSWERS</h4>
          <div style={{ display: "grid", gap: 6, maxHeight: 300, overflowY: "auto" }}>
            {answers.map((a, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 8,
                background: a.correct ? `${C.success}06` : `${C.danger}06`,
                border: `1px solid ${a.correct ? C.success : C.danger}15`,
              }}>
                <div style={{ fontFamily: fontBody, fontSize: 13, color: C.textDark, fontWeight: 600, marginBottom: 4 }}>
                  {a.correct ? "✓" : "✗"} Q{i+1}: {QUIZ_QUESTIONS[a.qIdx].q}
                </div>
                {!a.correct && (
                  <div style={{ fontFamily: fontBody, fontSize: 12, color: C.textMid }}>
                    {QUIZ_QUESTIONS[a.qIdx].explain}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={startQuiz} style={{
          padding: "12px 28px", borderRadius: 10, background: C.navy, color: C.yellow,
          border: "none", fontFamily: fontBody, fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          Try Again 🔄
        </button>
      </div>
    );
  }

  // Playing state
  const q = QUIZ_QUESTIONS[currentQ];
  return (
    <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 28 }}>
      {/* Progress bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: fontBody, fontSize: 12, color: C.textLight, fontWeight: 600 }}>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
        <span style={{ fontFamily: fontBody, fontSize: 12, color: C.success, fontWeight: 700 }}>Score: {score}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.offWhite, marginBottom: 20 }}>
        {(() => {
          const quizPct = ((currentQ + 1) / QUIZ_QUESTIONS.length) * 100;
          return <div style={{ height: "100%", borderRadius: 2, background: C.sky, width: `${quizPct}%`, transition: "width 0.3s ease" }} />;
        })()}
      </div>

      <h3 style={{ fontFamily: fontBody, fontSize: 17, color: C.textDark, margin: "0 0 18px", lineHeight: 1.5, fontWeight: 600 }}>
        {q.q}
      </h3>

      <div style={{ display: "grid", gap: 8 }}>
        {q.opts.map((opt, idx) => {
          let bg = C.offWhite, border = `1.5px solid ${C.cream}`, color = C.textDark;
          if (showAnswer) {
            if (idx === q.correct) { bg = `${C.success}12`; border = `1.5px solid ${C.success}40`; color = C.success; }
            else if (idx === selected && idx !== q.correct) { bg = `${C.danger}08`; border = `1.5px solid ${C.danger}30`; color = C.danger; }
            else { bg = C.offWhite; color = C.textLight; }
          } else if (idx === selected) {
            bg = `${C.sky}10`; border = `1.5px solid ${C.sky}40`;
          }
          return (
            <button key={idx} onClick={() => selectAnswer(idx)} style={{
              padding: "14px 18px", borderRadius: 10, cursor: showAnswer ? "default" : "pointer",
              background: bg, border, textAlign: "left",
              fontFamily: fontBody, fontSize: 14, color, fontWeight: 500,
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: showAnswer && idx === q.correct ? C.success : showAnswer && idx === selected ? C.danger : C.navy + "15",
                color: showAnswer && (idx === q.correct || idx === selected) ? C.white : C.textMid,
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {showAnswer && idx === q.correct ? "✓" : showAnswer && idx === selected && idx !== q.correct ? "✗" : String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div style={{ animation: "slideIn 0.25s ease" }}>
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 10,
            background: selected === q.correct ? `${C.success}06` : `${C.danger}06`,
            borderLeft: `3px solid ${selected === q.correct ? C.success : C.danger}40`,
          }}>
            <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              {selected === q.correct ? "✓ Correct! " : "✗ Not quite. "}{q.explain}
            </p>
          </div>
          <button onClick={nextQuestion} style={{
            marginTop: 14, width: "100%", padding: 13, borderRadius: 10,
            background: C.navy, color: C.yellow, border: "none", cursor: "pointer",
            fontFamily: fontBody, fontSize: 14, fontWeight: 700,
          }}>
            {currentQ + 1 >= QUIZ_QUESTIONS.length ? "See Results 🏆" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── GOAL WALL ──
function GoalWall() {
  const [goals, setGoals, goalsLoaded] = usePersistedState(STORAGE_KEYS.goals, []);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ text: "", category: "Technical", deadline: "" });

  const addGoal = () => {
    if (!newGoal.text.trim()) return;
    setGoals(prev => [...prev, { ...newGoal, id: Date.now(), done: false, createdAt: new Date().toLocaleDateString("en-SG") }]);
    setNewGoal({ text: "", category: "Technical", deadline: "" });
    setShowForm(false);
  };

  const toggleGoal = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const doneCount = goals.filter(g => g.done).length;
  const activeCount = goals.filter(g => !g.done).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: fontHead, fontSize: 24, color: C.navy, margin: "0 0 6px", letterSpacing: 0.5 }}>🎯 GOAL WALL</h3>
        <p style={{ fontFamily: fontBody, fontSize: 14, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
          Set your goals, track your progress, and hold yourself accountable. Goals are saved automatically.
        </p>
      </div>

      {/* Stats */}
      {goals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
          <div style={{ background: C.offWhite, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: fontHead, fontSize: 24, color: C.navy }}>{goals.length}</div>
            <div style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight, textTransform: "uppercase", fontWeight: 600 }}>Total Goals</div>
          </div>
          <div style={{ background: `${C.success}06`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: fontHead, fontSize: 24, color: C.success }}>{doneCount}</div>
            <div style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight, textTransform: "uppercase", fontWeight: 600 }}>Completed</div>
          </div>
          <div style={{ background: `${C.sky}06`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: fontHead, fontSize: 24, color: C.sky }}>{activeCount}</div>
            <div style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight, textTransform: "uppercase", fontWeight: 600 }}>In Progress</div>
          </div>
        </div>
      )}

      {/* Add Goal */}
      <button onClick={() => setShowForm(!showForm)} style={{
        width: "100%", padding: 13, borderRadius: 10, cursor: "pointer", marginBottom: 16,
        background: showForm ? `${C.danger}10` : C.navy,
        color: showForm ? C.danger : C.yellow,
        border: showForm ? `1px solid ${C.danger}20` : "none",
        fontFamily: fontBody, fontSize: 14, fontWeight: 700,
      }}>
        {showForm ? "Cancel" : "+ Set a New Goal"}
      </button>

      {showForm && (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.sky}20`, borderRadius: 14, padding: 22, marginBottom: 18, animation: "slideIn 0.25s ease" }}>
          {/* Category Suggestions */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {GOAL_CATEGORIES.map(c => (
                <Pill key={c.cat} active={newGoal.category === c.cat} onClick={() => setNewGoal({...newGoal, category: c.cat})} color={C.sky}>
                  {c.icon} {c.cat}
                </Pill>
              ))}
            </div>
            {/* Show examples for selected category */}
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: `${C.sky}06` }}>
              <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, fontWeight: 600 }}>IDEAS: </span>
              <span style={{ fontFamily: fontBody, fontSize: 12, color: C.textMid }}>
                {(GOAL_CATEGORIES.find(c => c.cat === newGoal.category) || {examples:[]}).examples.join(" · ")}
              </span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Your Goal</label>
            <input value={newGoal.text} onChange={e => setNewGoal({...newGoal, text: e.target.value})} placeholder="What do you want to achieve?" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Target Date (optional)</label>
            <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} style={inputStyle} />
          </div>
          <button onClick={addGoal} style={{
            width: "100%", padding: 12, borderRadius: 10, background: C.navy, color: C.yellow,
            border: "none", fontFamily: fontBody, fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            Add Goal ✓
          </button>
        </div>
      )}

      {/* Goal List */}
      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: C.offWhite, borderRadius: 14, border: `1.5px dashed ${C.cream}` }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>🎯</span>
          <p style={{ fontFamily: fontBody, color: C.textLight, fontSize: 14 }}>No goals set yet. Start by setting your first goal!</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.textMid, fontStyle: "italic", marginTop: 6 }}>
            "A goal without a plan is just a wish."
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {/* Active goals first, then completed */}
          {[...goals.filter(g => !g.done), ...goals.filter(g => g.done)].map(goal => {
            const catData = GOAL_CATEGORIES.find(c => c.cat === goal.category) || GOAL_CATEGORIES[0];
            return (
              <div key={goal.id} style={{
                background: goal.done ? `${C.success}04` : C.cardBg,
                border: `1.5px solid ${goal.done ? C.success + "20" : C.cream}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
                opacity: goal.done ? 0.75 : 1,
              }}>
                <button onClick={() => toggleGoal(goal.id)} style={{
                  width: 26, height: 26, borderRadius: 8, cursor: "pointer", flexShrink: 0,
                  background: goal.done ? C.success : C.offWhite,
                  border: goal.done ? "none" : `1.5px solid ${C.cream}`,
                  color: C.white, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {goal.done ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: fontBody, fontSize: 14, color: goal.done ? C.success : C.textDark, fontWeight: 600,
                    textDecoration: goal.done ? "line-through" : "none",
                  }}>{goal.text}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontFamily: fontBody, fontWeight: 600, background: `${C.sky}10`, color: C.sky }}>{catData.icon} {goal.category}</span>
                    {goal.deadline && <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>Due: {goal.deadline}</span>}
                    <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight }}>Set: {goal.createdAt}</span>
                  </div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, opacity: 0.4 }} title="Delete">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Growth mindset connection */}
      <div style={{
        marginTop: 20, padding: "16px 20px", borderRadius: 12,
        background: `${C.yellow}06`, border: `1px solid ${C.yellow}15`,
      }}>
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5 }}>
          🌱 <strong>Growth Mindset Tip:</strong> When setting goals, focus on the <em>process</em> not just the outcome. Instead of "Score 10 goals this season," try "Practise shooting 20 minutes every session." You control the effort — the results will follow.
        </p>
      </div>
    </div>
  );
}

function PositionFinder() {
  const [answers, setAnswers] = useState({});
  const questions = [
    { id: "pace", q: "Are you one of the fastest in your team?", opts: ["Yes, very fast","Average speed","I'm more of a thinker"] },
    { id: "defend", q: "Do you enjoy tackling and defending?", opts: ["Love it!","It's okay","Not really"] },
    { id: "shoot", q: "Do you love scoring goals?", opts: ["It's the best feeling","I prefer assisting","I prefer keeping clean sheets"] },
    { id: "vision", q: "Can you see passes others can't?", opts: ["Yes, always","Sometimes","I focus on other things"] },
  ];
  const getPosition = () => {
    if (!answers.pace || !answers.defend || !answers.shoot || !answers.vision) return null;
    if (answers.shoot === "It's the best feeling" && answers.pace === "Yes, very fast") return { pos: "Striker / Winger", desc: "Your speed and goal-scoring instinct make you a natural attacker. Think Mbappé or Ikhsan Fandi.", icon: "⚡" };
    if (answers.vision === "Yes, always" && answers.shoot === "I prefer assisting") return { pos: "Attacking Midfielder", desc: "You see the game differently. Creative passers like Shahril Ishak control matches from the middle.", icon: "🎩" };
    if (answers.defend === "Love it!" && answers.pace === "Yes, very fast") return { pos: "Full-Back / Wing-Back", desc: "Fast and love defending? Modern full-backs like Trent Alexander-Arnold are game-changers.", icon: "🛡️" };
    if (answers.defend === "Love it!") return { pos: "Centre-Back / Defensive Mid", desc: "You're the wall. Players like Van Dijk and Rodri are the backbone of every great team.", icon: "🏔️" };
    if (answers.shoot === "I prefer keeping clean sheets") return { pos: "Goalkeeper", desc: "The last line of defence and the first line of attack. Great GKs win titles.", icon: "🧤" };
    return { pos: "Central Midfielder (Box-to-Box)", desc: "You can do everything. All-rounders like Bellingham cover every blade of grass.", icon: "🔄" };
  };
  const result = getPosition();
  return (
    <div>
      <div style={{ display: "grid", gap: 12 }}>
        {questions.map(q => (
          <div key={q.id}>
            <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textDark, margin: "0 0 6px", fontWeight: 600 }}>{q.q}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {q.opts.map(opt => (
                <Pill key={opt} active={answers[q.id] === opt} onClick={() => setAnswers({...answers, [q.id]: opt})} color={C.sky}>{opt}</Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
      {result && (
        <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: `${C.navy}06`, border: `1.5px solid ${C.navy}15`, animation: "slideIn 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{result.icon}</span>
            <h4 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: 0, letterSpacing: 0.5 }}>{result.pos.toUpperCase()}</h4>
          </div>
          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, marginTop: 8, lineHeight: 1.5 }}>{result.desc}</p>
        </div>
      )}
    </div>
  );
}

function KitChecklist() {
  const [checked, setChecked, loaded] = usePersistedState(STORAGE_KEYS.checklist, {});
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
  const toggle = (idx) => { setChecked(prev => ({ ...prev, [idx]: !prev[idx] })); };
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {items.map((item, idx) => (
        <button key={idx} onClick={() => toggle(idx)} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
          borderRadius: 8, cursor: "pointer", border: "none", textAlign: "left", width: "100%",
          background: checked[idx] ? `${C.success}06` : "transparent", transition: "all 0.2s",
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            background: checked[idx] ? C.navy : C.offWhite, border: checked[idx] ? "none" : `1.5px solid ${C.cream}`,
            color: C.yellow, fontSize: 12, flexShrink: 0,
          }}>{checked[idx] ? "✓" : ""}</span>
          <span style={{ fontFamily: fontBody, fontSize: 13, color: checked[idx] ? C.success : C.textDark, textDecoration: checked[idx] ? "line-through" : "none", opacity: checked[idx] ? 0.7 : 1 }}>{item.name}</span>
          {item.essential && <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${C.danger}08`, color: C.danger, fontFamily: fontBody, fontWeight: 700 }}>ESSENTIAL</span>}
        </button>
      ))}
    </div>
  );
}

// ── FORMATION DATA ──
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
  formation: "4-3-3",
  date: "",
  time: "",
  opponent: "",
  competition: "",
  venue: "",
  players: Array(11).fill(""),
  subs: ["", "", "", "", ""],
  notes: "",
};

// ── LINEUP BUILDER ──
function LineupBuilderSection() {
  const [lineups, setLineups, loaded] = usePersistedState(STORAGE_KEYS.lineups, []);
  const [current, setCurrent] = useState({ ...EMPTY_MATCH });
  const [view, setView] = useState("builder"); // builder, saved
  const [editingId, setEditingId] = useState(null);

  const formation = FORMATIONS[current.formation];

  const updatePlayer = (idx, name) => {
    const p = [...current.players];
    p[idx] = name;
    setCurrent({ ...current, players: p });
  };

  const updateSub = (idx, name) => {
    const s = [...current.subs];
    s[idx] = name;
    setCurrent({ ...current, subs: s });
  };

  const addSub = () => {
    if (current.subs.length >= 9) return;
    setCurrent({ ...current, subs: [...current.subs, ""] });
  };

  const removeSub = (idx) => {
    const s = [...current.subs];
    s.splice(idx, 1);
    setCurrent({ ...current, subs: s });
  };

  const changeFormation = (f) => {
    setCurrent({ ...current, formation: f });
  };

  const saveLineup = () => {
    if (!current.opponent && !current.date) return;
    if (editingId) {
      setLineups(prev => prev.map(l => l.id === editingId ? { ...current, id: editingId } : l));
      setEditingId(null);
    } else {
      setLineups(prev => [...prev, { ...current, id: Date.now() }]);
    }
    setCurrent({ ...EMPTY_MATCH });
    setView("saved");
  };

  const loadLineup = (lineup) => {
    setCurrent({ ...lineup });
    setEditingId(lineup.id);
    setView("builder");
  };

  const deleteLineup = (id) => {
    setLineups(prev => prev.filter(l => l.id !== id));
  };

  const duplicateLineup = (lineup) => {
    const dup = { ...lineup, id: undefined, date: "", opponent: "", competition: lineup.competition, notes: "" };
    setCurrent(dup);
    setEditingId(null);
    setView("builder");
  };

  const clearForm = () => {
    setCurrent({ ...EMPTY_MATCH });
    setEditingId(null);
  };

  const filledCount = current.players.filter(p => p.trim()).length;

  if (!loaded) return (<section style={{ padding: "120px 20px", textAlign: "center" }}><p style={{ fontFamily: fontBody, color: C.textLight }}>Loading...</p></section>);

  return (
    <section style={{ padding: "90px 20px 60px", maxWidth: 960, margin: "0 auto" }}>
      <SectionHeader icon="📋" title="LINEUP BUILDER" subtitle="Select formation, set your starting XI and subs — for coach use" />

      {/* Toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        <Pill active={view === "builder"} onClick={() => setView("builder")} color={C.navy}>📝 {editingId ? "Editing Lineup" : "New Lineup"}</Pill>
        <Pill active={view === "saved"} onClick={() => setView("saved")} color={C.navy}>📂 Saved ({lineups.length})</Pill>
      </div>

      {view === "builder" ? (
        <>
          {/* ── MATCH DETAILS ── */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 16px", letterSpacing: 0.5 }}>⚽ MATCH DETAILS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              <div><label style={labelStyle}>Date</label><input type="date" value={current.date} onChange={e => setCurrent({...current, date: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Kick-off Time</label><input type="time" value={current.time} onChange={e => setCurrent({...current, time: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Opponent</label><input value={current.opponent} onChange={e => setCurrent({...current, opponent: e.target.value})} placeholder="e.g. Woodlands Secondary" style={inputStyle} /></div>
              <div><label style={labelStyle}>Competition</label><input value={current.competition} onChange={e => setCurrent({...current, competition: e.target.value})} placeholder="e.g. NSG B Division" style={inputStyle} /></div>
              <div><label style={labelStyle}>Venue</label><input value={current.venue} onChange={e => setCurrent({...current, venue: e.target.value})} placeholder="e.g. NBSS Field / Yishun Stadium" style={inputStyle} /></div>
            </div>
          </div>

          {/* ── FORMATION SELECTOR ── */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 14px", letterSpacing: 0.5 }}>🗂️ FORMATION</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.keys(FORMATIONS).map(f => (
                <Pill key={f} active={current.formation === f} onClick={() => changeFormation(f)} color={C.navy}>{f}</Pill>
              ))}
            </div>
          </div>

          {/* ── PITCH VISUALISATION ── */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: 0, letterSpacing: 0.5 }}>🏟️ STARTING XI — {current.formation}</h3>
              <span style={{ fontFamily: fontBody, fontSize: 12, color: filledCount === 11 ? C.success : C.textLight, fontWeight: 700 }}>
                {filledCount}/11 players filled
              </span>
            </div>

            {/* Pitch */}
            <div style={{
              position: "relative", width: "100%", maxWidth: 500, margin: "0 auto", aspectRatio: "3/4",
              background: `linear-gradient(to bottom, ${C.success}18, ${C.success}10)`,
              borderRadius: 16, border: `2px solid ${C.success}30`, overflow: "hidden",
            }}>
              {/* Pitch markings */}
              <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: 1, background: `${C.white}40` }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 60, height: 60, borderRadius: "50%", border: `1px solid ${C.white}35` }} />
              <div style={{ position: "absolute", bottom: 0, left: "25%", right: "25%", height: "18%", border: `1px solid ${C.white}30`, borderBottom: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: "35%", right: "35%", height: "8%", border: `1px solid ${C.white}25`, borderBottom: "none" }} />
              <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: "12%", border: `1px solid ${C.white}20`, borderTop: "none" }} />

              {/* NBSS label */}
              <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontFamily: fontHead, fontSize: 14, color: `${C.white}50`, letterSpacing: 2 }}>NBSS FC</div>

              {/* Player dots */}
              {formation.positions.map((pos, idx) => (
                <div key={idx} style={{
                  position: "absolute",
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  zIndex: 5,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: (current.players[idx] || "").trim() ? C.navy : "rgba(255,255,255,0.5)",
                    border: (current.players[idx] || "").trim() ? `2px solid ${C.yellow}` : `2px dashed ${C.white}60`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: fontHead, fontSize: 11, color: (current.players[idx] || "").trim() ? C.yellow : C.textLight,
                    letterSpacing: 0.5, boxShadow: (current.players[idx] || "").trim() ? `0 2px 8px ${C.navy}60` : "none",
                  }}>
                    {pos.role}
                  </div>
                  <div style={{
                    fontFamily: fontBody, fontSize: 9, fontWeight: 700, color: C.white,
                    background: (current.players[idx] || "").trim() ? `${C.navy}cc` : `${C.navy}50`,
                    padding: "1px 6px", borderRadius: 4, maxWidth: 70, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
                  }}>
                    {(current.players[idx] || "").trim() || "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Player name inputs */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontFamily: fontHead, fontSize: 14, color: C.navy, margin: "0 0 10px", letterSpacing: 0.5 }}>PLAYER NAMES</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {formation.positions.map((pos, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 40, fontFamily: fontHead, fontSize: 12, color: C.navy,
                      background: C.offWhite, padding: "6px 4px", borderRadius: 6, textAlign: "center",
                      flexShrink: 0, letterSpacing: 0.5,
                    }}>{pos.role}</span>
                    <input
                      value={current.players[idx] || ""}
                      onChange={e => updatePlayer(idx, e.target.value)}
                      placeholder={`Player name`}
                      style={{ ...inputStyle, padding: "8px 12px", fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SUBSTITUTES ── */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: 0, letterSpacing: 0.5 }}>🔄 SUBSTITUTES</h3>
              <button onClick={addSub} disabled={current.subs.length >= 9} style={{
                background: current.subs.length >= 9 ? C.offWhite : `${C.sky}10`,
                border: `1px solid ${current.subs.length >= 9 ? C.cream : C.sky + "30"}`,
                color: current.subs.length >= 9 ? C.textLight : C.sky,
                padding: "6px 14px", borderRadius: 8, cursor: current.subs.length >= 9 ? "default" : "pointer",
                fontFamily: fontBody, fontSize: 12, fontWeight: 700,
              }}>
                + Add Sub
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {current.subs.map((sub, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 32, fontFamily: fontHead, fontSize: 11, color: C.textLight,
                    background: C.offWhite, padding: "6px 2px", borderRadius: 6, textAlign: "center", flexShrink: 0,
                  }}>S{idx + 1}</span>
                  <input
                    value={sub}
                    onChange={e => updateSub(idx, e.target.value)}
                    placeholder={`Sub ${idx + 1}`}
                    style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, flex: 1 }}
                  />
                  <button onClick={() => removeSub(idx)} style={{
                    background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 16, opacity: 0.5,
                    flexShrink: 0, padding: "4px",
                  }} title="Remove">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── COACH NOTES ── */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontFamily: fontHead, fontSize: 20, color: C.navy, margin: "0 0 12px", letterSpacing: 0.5 }}>📝 COACH'S NOTES</h3>
            <textarea
              value={current.notes}
              onChange={e => setCurrent({...current, notes: e.target.value})}
              placeholder="Tactical notes, player instructions, set piece assignments, specific roles..."
              style={{ ...inputStyle, height: 90, resize: "vertical" }}
            />
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveLineup} style={{
              flex: 1, minWidth: 160, padding: 14, borderRadius: 12, cursor: "pointer",
              background: C.navy, color: C.yellow, border: "none",
              fontFamily: fontBody, fontSize: 15, fontWeight: 700,
              boxShadow: `0 4px 16px ${C.navy}25`,
            }}>
              {editingId ? "Update Lineup ✓" : "Save Lineup ✓"}
            </button>
            <button onClick={clearForm} style={{
              padding: "14px 24px", borderRadius: 12, cursor: "pointer",
              background: C.offWhite, color: C.textMid, border: `1.5px solid ${C.cream}`,
              fontFamily: fontBody, fontSize: 14, fontWeight: 600,
            }}>
              Clear
            </button>
          </div>
        </>
      ) : (
        /* ── SAVED LINEUPS ── */
        <>
          {lineups.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: C.offWhite, borderRadius: 16, border: `1.5px dashed ${C.cream}` }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 10 }}>📋</span>
              <p style={{ fontFamily: fontBody, color: C.textLight, fontSize: 14 }}>No lineups saved yet.</p>
              <button onClick={() => setView("builder")} style={{
                marginTop: 12, padding: "10px 24px", borderRadius: 10, background: C.navy, color: C.yellow,
                border: "none", fontFamily: fontBody, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Create Your First Lineup</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {lineups.slice().reverse().map(lineup => {
                const fm = FORMATIONS[lineup.formation];
                const filled = lineup.players.filter(p => (p || "").trim()).length;
                const subCount = lineup.subs.filter(s => (s || "").trim()).length;
                return (
                  <div key={lineup.id} style={{
                    background: C.cardBg, border: `1.5px solid ${C.cream}`, borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                    {/* Header banner */}
                    <div style={{
                      background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
                      padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: 8,
                    }}>
                      <div>
                        <div style={{ fontFamily: fontHead, fontSize: 22, color: C.white, letterSpacing: 1 }}>
                          NBSS <span style={{ color: C.yellow }}>vs</span> {lineup.opponent || "TBC"}
                        </div>
                        <div style={{ fontFamily: fontBody, fontSize: 12, color: C.skyLight, marginTop: 2 }}>
                          {[lineup.competition, lineup.date, lineup.time, lineup.venue].filter(Boolean).join(" · ") || "No details"}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: fontHead, fontSize: 18, color: C.yellow,
                        background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 8,
                      }}>{lineup.formation}</span>
                    </div>

                    {/* Mini pitch + details */}
                    <div style={{ padding: 22 }}>
                      {/* Mini pitch */}
                      <div style={{
                        position: "relative", width: "100%", maxWidth: 360, margin: "0 auto 16px",
                        aspectRatio: "3/4", background: `linear-gradient(to bottom, ${C.success}12, ${C.success}06)`,
                        borderRadius: 12, border: `1px solid ${C.success}20`,
                      }}>
                        <div style={{ position: "absolute", top: "50%", left: "8%", right: "8%", height: 1, background: `${C.white}30` }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.white}25` }} />
                        {fm.positions.map((pos, idx) => (
                          <div key={idx} style={{
                            position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`,
                            transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: "50%",
                              background: (lineup.players[idx] || "").trim() ? C.navy : "rgba(200,200,200,0.5)",
                              border: (lineup.players[idx] || "").trim() ? `1.5px solid ${C.yellow}` : "1px dashed rgba(200,200,200,0.5)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: fontHead, fontSize: 8, color: (lineup.players[idx] || "").trim() ? C.yellow : C.textLight,
                            }}>{pos.role}</div>
                            <div style={{
                              fontFamily: fontBody, fontSize: 7, fontWeight: 700, color: C.white,
                              background: `${C.navy}aa`, padding: "0 4px", borderRadius: 2,
                              maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{(lineup.players[idx] || "").trim() || ""}</div>
                          </div>
                        ))}
                      </div>

                      {/* Player list */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 12 }}>
                        {fm.positions.map((pos, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center", padding: "3px 0" }}>
                            <span style={{ fontFamily: fontHead, fontSize: 10, color: C.sky, width: 30, flexShrink: 0 }}>{pos.role}</span>
                            <span style={{ fontFamily: fontBody, fontSize: 12, color: (lineup.players[idx] || "").trim() ? C.textDark : C.textLight, fontWeight: (lineup.players[idx] || "").trim() ? 600 : 400 }}>
                              {(lineup.players[idx] || "").trim() || "—"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Subs */}
                      {subCount > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontFamily: fontHead, fontSize: 12, color: C.textLight, letterSpacing: 0.5, marginBottom: 4 }}>SUBSTITUTES</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {lineup.subs.filter(s => (s || "").trim()).map((s, i) => (
                              <span key={i} style={{ fontFamily: fontBody, fontSize: 12, padding: "3px 10px", borderRadius: 6, background: C.offWhite, color: C.textDark }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {lineup.note(s || "").trim() && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: `${C.yellow}06`, borderLeft: `3px solid ${C.yellow}30`, marginBottom: 12 }}>
                          <div style={{ fontFamily: fontBody, fontSize: 10, fontWeight: 700, color: C.yellowDim, marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Coach's Notes</div>
                          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{lineup.notes}</p>
                        </div>
                      )}

                      {/* Summary */}
                      <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, marginBottom: 14 }}>
                        {filled}/11 starting · {subCount} subs
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => loadLineup(lineup)} style={{
                          padding: "8px 16px", borderRadius: 8, background: C.navy, color: C.yellow,
                          border: "none", fontFamily: fontBody, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>Edit ✎</button>
                        <button onClick={() => duplicateLineup(lineup)} style={{
                          padding: "8px 16px", borderRadius: 8, background: `${C.sky}10`, color: C.sky,
                          border: `1px solid ${C.sky}25`, fontFamily: fontBody, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>Duplicate</button>
                        <button onClick={() => deleteLineup(lineup.id)} style={{
                          padding: "8px 16px", borderRadius: 8, background: `${C.danger}08`, color: C.danger,
                          border: `1px solid ${C.danger}15`, fontFamily: fontBody, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ═══════════════════════════════
//          MAIN APP
// ═══════════════════════════════
export default function App() {
  const [active, setActive] = useState("home");

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [active]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; color: ${C.textDark}; font-family: 'DM Sans', sans-serif; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.offWhite}; }
        ::-webkit-scrollbar-thumb { background: ${C.navy}30; border-radius: 3px; }

        @keyframes floatBall {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .mob-btn { display: block !important; }
          .nav-l {
            display: none !important;
            position: absolute; top: 60px; left: 0; right: 0;
            background: rgba(255,255,255,0.97);
            backdrop-filter: blur(12px);
            flex-direction: column; padding: 12px;
            border-bottom: 1px solid ${C.cream};
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .nav-l.nav-open { display: flex !important; }
        }

        select option { background: ${C.white}; color: ${C.textDark}; }
      `}</style>

      <Navbar active={active} setActive={setActive} />

      {active === "home" && <HeroSection setActive={setActive} />}
      {active === "training" && <TrainingSection />}
      {active === "nutrition" && <NutritionSection />}
      {active === "mindset" && <MindsetSection />}
      {active === "fitness" && <FitnessSection />}
      {active === "tracker" && <TrackerSection />}
      {active === "squad" && <SquadSection />}
      {active === "legends" && <LegendsSection />}
      {active === "lineup" && <LineupBuilderSection />}
      {active === "team" && <TeamHubSection />}

      <footer style={{
        textAlign: "center", padding: "36px 20px", borderTop: `1px solid ${C.cream}`, background: C.white,
      }}>
        <div style={{ fontFamily: fontHead, fontSize: 16, color: C.navy, letterSpacing: 1.5, marginBottom: 4 }}>NBSS FOOTBALL CCA</div>
        <p style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, margin: "0 0 8px" }}>Naval Base Secondary School · Building Character Through Football</p>
        <p style={{ fontFamily: fontBody, fontSize: 11, color: C.textLight, margin: "0 0 12px" }}>Created by <span style={{ color: C.navy, fontWeight: 700 }}>Mr Muhammad Herwanto</span></p>
        <div style={{ borderTop: `1px solid ${C.cream}`, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight }}>Powered by</span>
          <span style={{ fontFamily: fontHead, fontSize: 13, color: "#0a1e3d", letterSpacing: 0.5 }}>GamePlan</span>
          <span style={{ fontFamily: fontBody, fontSize: 10, color: C.textLight }}>· The All-in-One Digital Platform for School Sports CCAs</span>
        </div>
      </footer>
    </>
  );
}
