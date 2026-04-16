import { json, methodNotAllowed } from "./lib/http.js";
import { getSessionPlansStore } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  try {
    const store = getSessionPlansStore(event);
    const { blobs } = await store.list({ prefix: "session-plan/" });
    const records = (await Promise.all(
      blobs.map(async ({ key }) => store.get(key, { type: "json" }))
    ))
      .filter(Boolean)
      .map((record) => ({ ...record, source: record.source || "netlify" }))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    return json(200, { sessionPlans: records });
  } catch (error) {
    return json(500, { error: error.message || "Could not load session plans." });
  }
}
