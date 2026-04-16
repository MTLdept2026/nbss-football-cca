import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSessionPlanSecretValidation, normalizeSessionPlan } from "./lib/session-plans.js";
import { getSessionPlansStore, sessionPlanKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getSessionPlanSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const plan = normalizeSessionPlan(parseJSONBody(event));
    const store = getSessionPlansStore(event);

    await store.setJSON(sessionPlanKey(plan.id), plan);

    return json(200, { ok: true, sessionPlan: plan });
  } catch (error) {
    return json(500, { error: error.message || "Could not create session plan." });
  }
}
