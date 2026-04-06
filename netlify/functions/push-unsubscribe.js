import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSubscriptionsStore, subscriptionKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const body = parseJSONBody(event);
    const endpoint = body?.endpoint || body?.subscription?.endpoint;

    if (!endpoint) return json(400, { error: "Missing subscription endpoint." });

    const store = getSubscriptionsStore(event);
    await store.delete(subscriptionKey(endpoint));

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: error.message || "Could not remove subscription." });
  }
}
