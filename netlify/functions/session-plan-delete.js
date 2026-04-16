import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSessionPlanSecretValidation } from "./lib/session-plans.js";
import { getSessionPlansStore, sessionPlanKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getSessionPlanSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    if (!body.id) return json(400, { error: "Missing session plan id." });

    const store = getSessionPlansStore(event);
    await store.delete(sessionPlanKey(body.id));

    return json(200, { ok: true, id: body.id });
  } catch (error) {
    return json(500, { error: error.message || "Could not delete session plan." });
  }
}
