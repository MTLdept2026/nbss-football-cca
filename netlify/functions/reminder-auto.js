import { json } from "./lib/http.js";
import { getScheduleStore, getPlayerInputsStore, getSubscriptionsStore } from "./lib/store.js";
import { sendPushNotification } from "./lib/push.js";

// Netlify scheduled function -- runs daily at 12:00 UTC (8pm SGT).
// Checks today's schedule events, cross-references player inputs,
// identifies who hasn't logged, sends targeted push reminders.

function todayDateKey() {
  const now = new Date();
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 10);
}

function sanitizePlayerKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPlayerRecordKey(record = {}) {
  return sanitizePlayerKey(record.playerId || record.playerName || record.id || "");
}

export async function handler(event) {
  try {
    const today = todayDateKey();

    // 1. Load today's schedule events
    const scheduleStore = getScheduleStore(event);
    const { blobs: scheduleBlobs } = await scheduleStore.list({ prefix: "schedule/" });
    const scheduleEvents = (
      await Promise.all(scheduleBlobs.map(({ key }) => scheduleStore.get(key, { type: "json" })))
    ).filter(Boolean);

    const todayEvents = scheduleEvents.filter((e) => e.date === today);
    if (todayEvents.length === 0) {
      return json(200, { ok: true, skipped: true, reason: "No schedule events today.", today });
    }

    // 2. Load all player inputs
    const playerInputsStore = getPlayerInputsStore(event);
    const { blobs: inputBlobs } = await playerInputsStore.list({ prefix: "player-input/" });
    const playerInputs = (
      await Promise.all(inputBlobs.map(({ key }) => playerInputsStore.get(key, { type: "json" })))
    ).filter(Boolean);

    // Build set of player keys who have logged for today
    const loggedToday = new Set();
    playerInputs.forEach((record) => {
      if (record.date === today || record.latestSessionDate === today) {
        const key = getPlayerRecordKey(record);
        if (key) loggedToday.add(key);
      }
    });

    // Build map of all known player keys from all-time inputs
    const allPlayerKeys = new Map();
    playerInputs.forEach((record) => {
      const key = getPlayerRecordKey(record);
      if (key) {
        allPlayerKeys.set(key, {
          key,
          playerName: record.playerName || record.playerId || "",
        });
      }
    });

    // 3. Find players who haven't logged today
    const missingPlayers = [...allPlayerKeys.values()].filter((p) => !loggedToday.has(p.key));
    if (missingPlayers.length === 0) {
      return json(200, { ok: true, skipped: true, reason: "All players have logged today.", today });
    }

    const missingKeys = new Set(missingPlayers.map((p) => p.key));

    // 4. Build reminder message
    const eventLabels = todayEvents.map((e) => e.title || e.type || "session").join(", ");
    const reminderTitle = "Log your GamePlan entry";
    const reminderBody = `Reminder: Your ${eventLabels} (${today}) GamePlan log is still missing. Open the app and log your session now. Training is not finished until the reflection is logged.`;

    // 5. Send targeted push notifications to missing players only
    const subscriptionsStore = getSubscriptionsStore(event);
    const { blobs: subBlobs } = await subscriptionsStore.list({ prefix: "subscription/" });

    let sent = 0;
    let removed = 0;
    let skipped = 0;

    await Promise.all(
      subBlobs.map(async ({ key }) => {
        const record = await subscriptionsStore.get(key, { type: "json" });
        const subscription = record?.subscription;
        if (!subscription?.endpoint) return;

        const audienceKey = sanitizePlayerKey(record?.audience?.audienceKey || "");
        if (!audienceKey || !missingKeys.has(audienceKey)) {
          skipped += 1;
          return;
        }

        try {
          await sendPushNotification(subscription, {
            title: reminderTitle,
            body: reminderBody,
            url: "/",
            tag: `auto-reminder-${today}`,
          });
          sent += 1;
        } catch (error) {
          const statusCode = error?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await subscriptionsStore.delete(key);
            removed += 1;
            return;
          }
          console.error(`Push failed for ${key}:`, error.message || error);
        }
      })
    );

    return json(200, { ok: true, today, events: todayEvents.length, missingPlayers: missingPlayers.length, sent, removed, skipped });
  } catch (error) {
    return json(500, { error: error.message || "Auto-reminder failed." });
  }
}
