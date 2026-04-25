import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSubscriptionsStore, subscriptionKey } from "./lib/store.js";

function isValidSubscription(subscription) {
  return Boolean(
    subscription?.endpoint
    && subscription?.keys?.auth
    && subscription?.keys?.p256dh
  );
}

function sanitizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeAudience(body = {}) {
  const audience = body.audience || {};
  const playerId = String(audience.playerId || "").trim();
  const playerName = String(audience.playerName || "").trim();

  // audienceKey is whatever the client sends (usually playerId-based slug).
  // Also store playerIdKey and playerNameKey as explicit fallbacks so the
  // backend can match subscriptions regardless of which format was used at subscribe time.
  const audienceKey = sanitizeKey(audience.audienceKey || playerId || playerName);
  const playerIdKey = sanitizeKey(playerId);
  const playerNameKey = sanitizeKey(playerName);

  return {
    audienceKey,
    playerIdKey,
    playerNameKey,
    playerId,
    playerName,
    role: String(audience.role || "").trim(),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const body = parseJSONBody(event);
    const subscription = body.subscription;
    const audience = normalizeAudience(body);

    if (!isValidSubscription(subscription)) {
      return json(400, { error: "Invalid push subscription." });
    }

    const store = getSubscriptionsStore(event);
    await store.setJSON(subscriptionKey(subscription.endpoint), {
      subscription,
      audience,
      updatedAt: new Date().toISOString(),
    });

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: error.message || "Could not save subscription." });
  }
}
