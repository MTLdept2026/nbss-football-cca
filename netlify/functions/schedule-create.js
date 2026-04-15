import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getScheduleSecretValidation, normalizeSchedule } from "./lib/schedule.js";
import { getScheduleStore, scheduleKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getScheduleSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const schedule = normalizeSchedule(parseJSONBody(event));
    const store = getScheduleStore(event);

    await store.setJSON(scheduleKey(schedule.id), schedule);

    return json(200, { ok: true, schedule });
  } catch (error) {
    return json(500, { error: error.message || "Could not create schedule entry." });
  }
}
