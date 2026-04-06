import { getSecretValidation, normalizeAnnouncement } from "./lib/announcements.js";
import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { announcementKey, getAnnouncementsStore } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    if (!body.id) return json(400, { error: "Missing announcement id." });

    const store = getAnnouncementsStore(event);
    const key = announcementKey(body.id);
    const existing = await store.get(key, { type: "json" });
    if (!existing) return json(404, { error: "Announcement not found." });

    const announcement = normalizeAnnouncement(body, existing);
    await store.setJSON(key, announcement);

    return json(200, { ok: true, announcement });
  } catch (error) {
    return json(500, { error: error.message || "Could not update announcement." });
  }
}
