import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getScheduleSecretValidation, normalizeSchedule } from "./lib/schedule.js";
import { getScheduleStore, scheduleKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getScheduleSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    if (!body.id) return json(400, { error: "Missing schedule id." });

    const store = getScheduleStore(event);
    const key = scheduleKey(body.id);
    const existing = await store.get(key, { type: "json" });
    if (!existing) return json(404, { error: "Schedule entry not found." });

    const schedule = normalizeSchedule(body, existing);
    await store.setJSON(key, schedule);

    return json(200, { ok: true, schedule });
  } catch (error) {
    return json(500, { error: error.message || "Could not update schedule entry." });
  }
}
