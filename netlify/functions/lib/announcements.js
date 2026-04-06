import crypto from "node:crypto";

export function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

export function normalizeAnnouncement(body, previous = null) {
  const now = new Date();
  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();

  if (!title && !text) throw new Error("Announcement title or body is required.");

  return {
    id: body.id || previous?.id || crypto.randomUUID(),
    title,
    body: text,
    category: String(body.category || previous?.category || "General").trim() || "General",
    date: String(body.date || previous?.date || now.toISOString().slice(0, 10)),
    pinned: parseBoolean(body.pinned ?? previous?.pinned),
    source: "netlify",
    createdAt: previous?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function getSecretValidation(event) {
  const expected = process.env.ANNOUNCEMENT_ADMIN_SECRET;
  if (!expected) {
    return { ok: false, statusCode: 503, message: "Missing ANNOUNCEMENT_ADMIN_SECRET." };
  }

  const provided = event.headers["x-announcement-secret"] || event.headers["X-Announcement-Secret"];
  if (provided !== expected) {
    return { ok: false, statusCode: 401, message: "Unauthorized." };
  }

  return { ok: true };
}
