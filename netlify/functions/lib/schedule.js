import crypto from "node:crypto";

function normalizeDateKey(value) {
  const match = String(value || "").trim().match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}

function inferScheduleType(title = "") {
  const text = String(title || "").toLowerCase();
  if (text.includes("friendly")) return "Friendly";
  if (text.includes("match") || text.includes("game") || text.includes("semi final") || text.includes("final")) return "Match";
  if (text.includes("training")) return "Training";
  return "Other";
}

function inferScheduleDivision(title = "") {
  if (String(title || "").includes("B Div")) return "B Div";
  if (String(title || "").includes("C Div")) return "C Div";
  return "";
}

export function normalizeSchedule(body, previous = null) {
  const now = new Date();
  const title = String(body.title ?? previous?.title ?? "").trim();
  const date = normalizeDateKey(body.date ?? previous?.date ?? "");

  if (!date) throw new Error("Schedule date is required.");
  if (!title) throw new Error("Schedule title is required.");

  return {
    id: body.id || previous?.id || crypto.randomUUID(),
    date,
    title,
    type: String(body.type ?? previous?.type ?? inferScheduleType(title)).trim() || inferScheduleType(title),
    division: String(body.division ?? previous?.division ?? inferScheduleDivision(title)).trim(),
    time: String(body.time ?? previous?.time ?? "").trim(),
    teacher: String(body.teacher ?? body.coach ?? previous?.teacher ?? "").trim(),
    venue: String(body.venue ?? previous?.venue ?? "").trim(),
    notes: String(body.notes ?? previous?.notes ?? "").trim(),
    source: "netlify",
    createdAt: previous?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function getScheduleSecretValidation(event) {
  const expected = process.env.SCHEDULE_ADMIN_SECRET || process.env.ANNOUNCEMENT_ADMIN_SECRET;
  if (!expected) {
    return { ok: false, statusCode: 503, message: "Missing schedule admin secret." };
  }

  const provided = event.headers["x-schedule-secret"]
    || event.headers["X-Schedule-Secret"]
    || event.headers["x-announcement-secret"]
    || event.headers["X-Announcement-Secret"];

  if (provided !== expected) {
    return { ok: false, statusCode: 401, message: "Unauthorized." };
  }

  return { ok: true };
}
