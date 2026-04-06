import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSubscriptionsStore, subscriptionKey } from "./lib/store.js";

function isValidSubscription(subscription) {
  return Boolean(
    subscription?.endpoint
    && subscription?.keys?.auth
    && subscription?.keys?.p256dh
  );
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const body = parseJSONBody(event);
    const subscription = body.subscription;

    if (!isValidSubscription(subscription)) {
      return json(400, { error: "Invalid push subscription." });
    }

    const store = getSubscriptionsStore(event);
    await store.setJSON(subscriptionKey(subscription.endpoint), {
      subscription,
      updatedAt: new Date().toISOString(),
    });

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: error.message || "Could not save subscription." });
  }
}
