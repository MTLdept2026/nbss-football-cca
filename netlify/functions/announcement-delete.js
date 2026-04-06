import { getSecretValidation } from "./lib/announcements.js";
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
    await store.delete(announcementKey(body.id));

    return json(200, { ok: true, id: body.id });
  } catch (error) {
    return json(500, { error: error.message || "Could not delete announcement." });
  }
}
