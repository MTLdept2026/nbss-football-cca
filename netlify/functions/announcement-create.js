import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { getSecretValidation, normalizeAnnouncement } from "./lib/announcements.js";
import { sendPushNotification } from "./lib/push.js";
import { announcementKey, getAnnouncementsStore, getSubscriptionsStore, subscriptionKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const secret = getSecretValidation(event);
    if (!secret.ok) return json(secret.statusCode, { error: secret.message });

    const body = parseJSONBody(event);
    const announcement = normalizeAnnouncement(body);
    const pushOnly = Boolean(body.pushOnly);

    // Accept an array of candidate keys — the sender may include both playerId-based
    // and name-based slugs per player to handle subscriptions registered under either format.
    const targetAudienceKeys = Array.isArray(body.targetAudienceKeys)
      ? new Set(body.targetAudienceKeys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean))
      : null;

    const announcementsStore = getAnnouncementsStore(event);
    const subscriptionsStore = getSubscriptionsStore(event);

    if (!pushOnly) {
      await announcementsStore.setJSON(announcementKey(announcement.id), announcement);
    }

    const { blobs } = await subscriptionsStore.list({ prefix: "subscription/" });
    let sent = 0;
    let removed = 0;
    let skipped = 0;

    function sanitizeKey(value) {
      return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    await Promise.all(blobs.map(async ({ key }) => {
      const record = await subscriptionsStore.get(key, { type: "json" });
      const subscription = record?.subscription;
      if (!subscription?.endpoint) return;

      if (targetAudienceKeys?.size) {
        // Match on any candidate key the subscription might be stored under:
        // audienceKey (whatever was sent at subscribe time), playerId slug, or playerName slug
        const audience = record?.audience || {};
        const candidateKeys = [
          audience.audienceKey,
          sanitizeKey(audience.playerId),
          sanitizeKey(audience.playerName),
        ].filter(Boolean);

        const matched = candidateKeys.some((k) => targetAudienceKeys.has(k));
        if (!matched) {
          skipped += 1;
          return;
        }
      }

      try {
        await sendPushNotification(subscription, {
          title: announcement.title || "New announcement",
          body: announcement.body || "Open GamePlan to view the latest update.",
          url: "/",
          tag: `announcement-${announcement.id}`,
        });
        sent += 1;
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await subscriptionsStore.delete(subscriptionKey(subscription.endpoint));
          removed += 1;
          return;
        }

        throw error;
      }
    }));

    return json(200, { ok: true, announcement, sent, removed, skipped, pushOnly });
  } catch (error) {
    return json(500, { error: error.message || "Could not create announcement." });
  }
}
