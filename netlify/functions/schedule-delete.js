import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getScheduleSecretValidation } from "./lib/schedule.js";
import { getScheduleStore, scheduleKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getScheduleSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    if (!body.id) return json(400, { error: "Missing schedule id." });

    const store = getScheduleStore(event);
    await store.delete(scheduleKey(body.id));

    return json(200, { ok: true, id: body.id });
  } catch (error) {
    return json(500, { error: error.message || "Could not delete schedule entry." });
  }
}
