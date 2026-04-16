function normalizeDateKey(value) {
  const match = String(value || "").trim().match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function formatLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizePlayerKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitFocusAreas(value = "") {
  return String(value || "")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getLatestSession(sessions = []) {
  return [...(sessions || [])]
    .filter((entry) => entry?.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
}

function getActiveIssues(wellnessLogs = []) {
  return (wellnessLogs || []).filter((log) => !log?.resolved);
}

function getAvailabilityState(wellnessLogs = []) {
  const activeIssues = getActiveIssues(wellnessLogs);
  const maxSeverity = activeIssues.reduce((highest, log) => Math.max(highest, Number(log?.severity) || 0), 0);

  if (maxSeverity >= 3) {
    return { availability: "unavailable", activeIssues, maxSeverity };
  }

  if (maxSeverity === 2) {
    return { availability: "modified", activeIssues, maxSeverity };
  }

  return { availability: "available", activeIssues, maxSeverity };
}

export function generatePlayerId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `nbss-${crypto.randomUUID()}`;
  }

  return `nbss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildPlayerInputPayload({ profile, squad, sessions, wellnessLogs, date }) {
  const playerName = String(squad?.name || profile?.name || "").trim();
  const playerId = String(profile?.playerId || "").trim();
  const latestSession = getLatestSession(sessions);
  const { availability, activeIssues, maxSeverity } = getAvailabilityState(wellnessLogs);
  const payloadDate = normalizeDateKey(date) || formatLocalDateKey();
  const stableKey = sanitizePlayerKey(playerId || playerName);

  if (!stableKey || !playerName) return null;

  const focusAreas = [
    ...splitFocusAreas(latestSession?.goals),
    ...splitFocusAreas(profile?.firstGoal),
  ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 8);

  const issueSummary = activeIssues.length
    ? `Active issues: ${activeIssues.map((issue) => `${issue.location} (${issue.severity || "-"})`).join(", ")}`
    : "";

  const note = [latestSession?.notes, issueSummary].filter(Boolean).join(" | ").slice(0, 500);

  return {
    id: `player-input-${stableKey}-${payloadDate}`,
    playerId,
    playerName,
    squad: String(squad?.seasonStats?.seasonLabel || "").trim(),
    team: String(profile?.position || "").trim(),
    date: payloadDate,
    sleep: latestSession?.sleep ?? null,
    energy: latestSession?.energy ?? null,
    soreness: latestSession?.soreness ?? null,
    mood: latestSession?.mood ?? null,
    readiness: latestSession?.readinessScore ?? null,
    availability,
    focusAreas,
    note,
    submittedBy: playerName,
    sessionCount: Array.isArray(sessions) ? sessions.length : 0,
    latestSessionDate: latestSession?.date || "",
    sessionType: String(latestSession?.type || "").trim(),
    sessionLoad: latestSession?.load ?? null,
    sessionRating: latestSession?.rating ?? null,
    activeIssueCount: activeIssues.length,
    activeIssueSeverity: maxSeverity || null,
  };
}

export function buildCoachPlayerDataset(playerInputs = []) {
  const latestByPlayer = new Map();

  const sortedInputs = [...(playerInputs || [])]
    .filter(Boolean)
    .sort((a, b) => {
      const dateDiff = new Date(`${b.date || ""}T00:00:00`).getTime() - new Date(`${a.date || ""}T00:00:00`).getTime();
      if (dateDiff) return dateDiff;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });

  sortedInputs.forEach((record) => {
    const key = sanitizePlayerKey(record.playerId || record.playerName || record.id || "");
    if (key && !latestByPlayer.has(key)) latestByPlayer.set(key, record);
  });

  const latestRecords = [...latestByPlayer.values()].sort((a, b) => {
    const severityRank = { unavailable: 3, modified: 2, available: 1 };
    const severityDiff = (severityRank[b.availability] || 0) - (severityRank[a.availability] || 0);
    if (severityDiff) return severityDiff;

    const readinessA = a.readiness == null ? 101 : Number(a.readiness);
    const readinessB = b.readiness == null ? 101 : Number(b.readiness);
    if (readinessA !== readinessB) return readinessA - readinessB;

    return String(a.playerName || "").localeCompare(String(b.playerName || ""));
  });

  const readinessByDate = new Map();
  sortedInputs.forEach((record) => {
    if (record.readiness == null || !record.date) return;
    const current = readinessByDate.get(record.date) || { total: 0, count: 0 };
    current.total += Number(record.readiness) || 0;
    current.count += 1;
    readinessByDate.set(record.date, current);
  });

  const readinessTrend = [...readinessByDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, stats]) => ({
      date: date.slice(5),
      readiness: stats.count ? Math.round(stats.total / stats.count) : null,
    }));

  return {
    latestRecords,
    readinessTrend,
    lastUpdated: sortedInputs[0]?.updatedAt || sortedInputs[0]?.date || null,
  };
}
