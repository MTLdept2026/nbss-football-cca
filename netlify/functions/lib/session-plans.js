import crypto from "node:crypto";

function normalizeDateKey(value) {
  const match = String(value || "").trim().match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}

function normalizeStringArray(value, limit = 8) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, limit);
}

function normalizeBlocks(value, previous = []) {
  const base = Array.isArray(value) ? value : previous;
  if (!Array.isArray(base)) return [];

  return base
    .map((block) => ({
      title: String(block?.title || "").trim(),
      duration: String(block?.duration || "").trim(),
      focus: String(block?.focus || "").trim(),
      notes: String(block?.notes || "").trim(),
    }))
    .filter((block) => block.title || block.duration || block.focus || block.notes)
    .slice(0, 12);
}

export function normalizeSessionPlan(body, previous = null) {
  const now = new Date();
  const date = normalizeDateKey(body.date ?? previous?.date ?? "");
  const title = String(body.title ?? previous?.title ?? "").trim();

  if (!date) throw new Error("Session date is required.");
  if (!title) throw new Error("Session title is required.");

  const summarySnapshot = body.summarySnapshot && typeof body.summarySnapshot === "object"
    ? {
        responses: Number(body.summarySnapshot.responses) || 0,
        averageReadiness: body.summarySnapshot.averageReadiness == null ? null : Number(body.summarySnapshot.averageReadiness) || 0,
        unavailableCount: Number(body.summarySnapshot.unavailableCount) || 0,
      }
    : previous?.summarySnapshot || null;

  return {
    id: body.id || previous?.id || crypto.randomUUID(),
    date,
    title,
    squad: String(body.squad ?? previous?.squad ?? "").trim(),
    coach: String(body.coach ?? body.teacher ?? previous?.coach ?? previous?.teacher ?? "").trim(),
    objective: String(body.objective ?? previous?.objective ?? "").trim(),
    plannedLoad: String(body.plannedLoad ?? previous?.plannedLoad ?? "").trim(),
    focusAreas: normalizeStringArray(body.focusAreas ?? previous?.focusAreas),
    constraints: normalizeStringArray(body.constraints ?? previous?.constraints),
    basedOnDate: normalizeDateKey(body.basedOnDate ?? previous?.basedOnDate ?? date) || date,
    summarySnapshot,
    blocks: normalizeBlocks(body.blocks, previous?.blocks),
    notes: String(body.notes ?? previous?.notes ?? "").trim(),
    source: "netlify",
    createdAt: previous?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function getSessionPlanSecretValidation(event) {
  const expected = process.env.COACH_BACKEND_SECRET || process.env.SESSION_PLAN_ADMIN_SECRET || process.env.SCHEDULE_ADMIN_SECRET || process.env.ANNOUNCEMENT_ADMIN_SECRET;
  if (!expected) {
    return { ok: false, statusCode: 503, message: "Missing coach backend secret." };
  }

  const provided = event.headers["x-coach-secret"]
    || event.headers["X-Coach-Secret"]
    || event.headers["x-session-plan-secret"]
    || event.headers["X-Session-Plan-Secret"]
    || event.headers["x-schedule-secret"]
    || event.headers["X-Schedule-Secret"];

  if (provided !== expected) {
    return { ok: false, statusCode: 401, message: "Unauthorized." };
  }

  return { ok: true };
}
