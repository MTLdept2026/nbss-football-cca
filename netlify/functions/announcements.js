import { json, methodNotAllowed } from "./lib/http.js";
import { getAnnouncementsStore } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  try {
    const store = getAnnouncementsStore(event);
    const { blobs } = await store.list({ prefix: "announcement/" });

    const records = await Promise.all(
      blobs.map(async ({ key }) => store.get(key, { type: "json" }))
    );

    return json(200, {
      announcements: records
        .filter(Boolean)
        .map((record) => ({ ...record, source: record.source || "netlify" }))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return String(b.date || "").localeCompare(String(a.date || ""));
        }),
    });
  } catch (error) {
    return json(500, { error: error.message || "Could not load announcements." });
  }
}
