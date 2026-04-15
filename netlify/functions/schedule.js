import { json, methodNotAllowed } from "./lib/http.js";
import { getScheduleStore } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  try {
    const store = getScheduleStore(event);
    const { blobs } = await store.list({ prefix: "schedule/" });

    const records = await Promise.all(
      blobs.map(async ({ key }) => store.get(key, { type: "json" }))
    );

    return json(200, {
      schedule: records
        .filter(Boolean)
        .map((record) => ({ ...record, source: record.source || "netlify" }))
        .sort((a, b) => {
          const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
          if (dateCompare !== 0) return dateCompare;
          return String(a.title || "").localeCompare(String(b.title || ""));
        }),
    });
  } catch (error) {
    return json(500, { error: error.message || "Could not load schedule." });
  }
}
