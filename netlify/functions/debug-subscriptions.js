import { json, methodNotAllowed } from "./lib/http.js";
import { getSecretValidation } from "./lib/announcements.js";
import { getSubscriptionsStore } from "./lib/store.js";

// Temporary debug endpoint — lists all stored subscription audienceKeys
// so you can compare against what the app sends as targetAudienceKeys.
// Protected by ANNOUNCEMENT_ADMIN_SECRET.
// Remove this file once the push targeting issue is resolved.

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  const secret = getSecretValidation(event);
  if (!secret.ok) return json(secret.statusCode, { error: secret.message });

  try {
    const store = getSubscriptionsStore(event);
    const { blobs } = await store.list({ prefix: "subscription/" });

    const subscriptions = await Promise.all(
      blobs.map(async ({ key }) => {
        const record = await store.get(key, { type: "json" });
        return {
          storeKey: key,
          audienceKey: record?.audience?.audienceKey || null,
          playerId: record?.audience?.playerId || null,
          playerName: record?.audience?.playerName || null,
          role: record?.audience?.role || null,
          updatedAt: record?.updatedAt || null,
        };
      })
    );

    return json(200, { count: subscriptions.length, subscriptions });
  } catch (error) {
    return json(500, { error: error.message || "Could not list subscriptions." });
  }
}
