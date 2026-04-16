import crypto from "node:crypto";

function normalizeDateKey(value) {
  const match = String(value || "").trim().match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}

function normalizeStableKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function normalizeAvailability(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "available";
  if (["available", "fit", "full", "green"].includes(text)) return "available";
  if (["modified", "limited", "managed", "amber"].includes(text)) return "modified";
  if (["unavailable", "injured", "sick", "red", "rest"].includes(text)) return "unavailable";
  return text;
}

function normalizeFocusAreas(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 8);
}

function normalizeNumber(value, { min = null, max = null } = {}) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (min != null && num < min) return null;
  if (max != null && num > max) return null;
  return Math.round(num * 100) / 100;
}

function computeReadiness({ sleep, energy, soreness, mood }) {
  const components = [sleep, energy, mood]
    .filter((value) => value != null)
    .map((value) => value / 5);

  if (soreness != null) components.push((6 - soreness) / 5);
  if (!components.length) return null;

  return Math.round((components.reduce((sum, value) => sum + value, 0) / components.length) * 100);
}

function compareRecordDate(a, b) {
  const aTime = new Date(`${a.date || ""}T00:00:00`).getTime() || 0;
  const bTime = new Date(`${b.date || ""}T00:00:00`).getTime() || 0;
  if (bTime !== aTime) return bTime - aTime;
  return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
}

export function normalizePlayerInput(body, previous = null) {
  const now = new Date();
  const playerId = String(body.playerId ?? previous?.playerId ?? "").trim();
  const playerName = String(body.playerName ?? body.name ?? previous?.playerName ?? "").trim();
  const date = normalizeDateKey(body.date ?? previous?.date ?? now.toISOString().slice(0, 10));
  const submittedByFallback = playerName || playerId;
  const stableKey = normalizeStableKey(playerId || playerName);

  if (!date) throw new Error("Submission date is required.");
  if (!playerId && !playerName) throw new Error("playerId or playerName is required.");

  const sleep = normalizeScore(body.sleep ?? previous?.sleep);
  const energy = normalizeScore(body.energy ?? previous?.energy);
  const soreness = normalizeScore(body.soreness ?? previous?.soreness);
  const mood = normalizeScore(body.mood ?? previous?.mood);
  const readiness = body.readiness != null
    ? Math.max(0, Math.min(100, Math.round(Number(body.readiness) || 0)))
    : computeReadiness({ sleep, energy, soreness, mood });

  return {
    id: body.id || previous?.id || (stableKey ? `player-input-${stableKey}-${date}` : crypto.randomUUID()),
    playerId,
    playerName,
    squad: String(body.squad ?? previous?.squad ?? "").trim(),
    team: String(body.team ?? previous?.team ?? "").trim(),
    date,
    sleep,
    energy,
    soreness,
    mood,
    readiness,
    availability: normalizeAvailability(body.availability ?? previous?.availability),
    focusAreas: normalizeFocusAreas(body.focusAreas ?? previous?.focusAreas),
    note: String(body.note ?? body.notes ?? previous?.note ?? "").trim(),
    submittedBy: String(body.submittedBy ?? previous?.submittedBy ?? submittedByFallback).trim(),
    sessionCount: normalizeNumber(body.sessionCount ?? previous?.sessionCount, { min: 0 }),
    latestSessionDate: normalizeDateKey(body.latestSessionDate ?? previous?.latestSessionDate ?? ""),
    sessionType: String(body.sessionType ?? previous?.sessionType ?? "").trim(),
    sessionLoad: normalizeNumber(body.sessionLoad ?? previous?.sessionLoad, { min: 0 }),
    sessionRating: normalizeNumber(body.sessionRating ?? previous?.sessionRating, { min: 0, max: 5 }),
    activeIssueCount: normalizeNumber(body.activeIssueCount ?? previous?.activeIssueCount, { min: 0 }),
    activeIssueSeverity: normalizeNumber(body.activeIssueSeverity ?? previous?.activeIssueSeverity, { min: 0, max: 3 }),
    source: "netlify",
    createdAt: previous?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function summarizePlayerInputs(records = []) {
  const latestByPlayer = new Map();

  records
    .filter(Boolean)
    .sort(compareRecordDate)
    .forEach((record) => {
      const key = String(record.playerId || record.playerName || record.id || "").toLowerCase();
      if (key && !latestByPlayer.has(key)) latestByPlayer.set(key, record);
    });

  const latestRecords = [...latestByPlayer.values()].sort(compareRecordDate);
  const focusCounts = new Map();
  let readinessTotal = 0;
  let readinessCount = 0;

  latestRecords.forEach((record) => {
    if (record.readiness != null) {
      readinessTotal += Number(record.readiness) || 0;
      readinessCount += 1;
    }

    (record.focusAreas || []).forEach((focus) => {
      focusCounts.set(focus, (focusCounts.get(focus) || 0) + 1);
    });
  });

  const availability = latestRecords.reduce((acc, record) => {
    const key = normalizeAvailability(record.availability);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { available: 0, modified: 0, unavailable: 0 });

  const flaggedPlayers = latestRecords
    .filter((record) => record.availability !== "available" || (record.readiness != null && record.readiness < 60))
    .slice(0, 12)
    .map((record) => ({
      id: record.id,
      playerId: record.playerId,
      playerName: record.playerName,
      date: record.date,
      availability: record.availability,
      readiness: record.readiness,
      note: record.note,
      focusAreas: record.focusAreas || [],
      sessionType: record.sessionType || "",
      sessionLoad: record.sessionLoad,
      sessionRating: record.sessionRating,
      latestSessionDate: record.latestSessionDate || "",
      activeIssueCount: record.activeIssueCount || 0,
      activeIssueSeverity: record.activeIssueSeverity,
    }));

  return {
    totalSubmissions: records.length,
    uniquePlayers: latestRecords.length,
    averageReadiness: readinessCount ? Math.round(readinessTotal / readinessCount) : null,
    availability,
    topFocusAreas: [...focusCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([label, count]) => ({ label, count })),
    flaggedPlayers,
  };
}

export function getPlayerInputsQuery(event) {
  const date = normalizeDateKey(event.queryStringParameters?.date || "");
  return { date };
}
