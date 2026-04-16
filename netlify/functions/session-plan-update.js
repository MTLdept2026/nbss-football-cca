import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSessionPlanSecretValidation, normalizeSessionPlan } from "./lib/session-plans.js";
import { getSessionPlansStore, sessionPlanKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getSessionPlanSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    if (!body.id) return json(400, { error: "Missing session plan id." });

    const store = getSessionPlansStore(event);
    const key = sessionPlanKey(body.id);
    const existing = await store.get(key, { type: "json" });
    if (!existing) return json(404, { error: "Session plan not found." });

    const plan = normalizeSessionPlan(body, existing);
    await store.setJSON(key, plan);

    return json(200, { ok: true, sessionPlan: plan });
  } catch (error) {
    return json(500, { error: error.message || "Could not update session plan." });
  }
}
