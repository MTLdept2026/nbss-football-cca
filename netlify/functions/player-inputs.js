import { json, methodNotAllowed } from "./lib/http.js";
import { getPlayerInputsQuery, summarizePlayerInputs } from "./lib/player-inputs.js";
import { getPlayerInputsStore } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  try {
    const store = getPlayerInputsStore(event);
    const { blobs } = await store.list({ prefix: "player-input/" });
    const records = (await Promise.all(
      blobs.map(async ({ key }) => store.get(key, { type: "json" }))
    ))
      .filter(Boolean)
      .map((record) => ({ ...record, source: record.source || "netlify" }));

    const { date } = getPlayerInputsQuery(event);
    const filtered = date ? records.filter((record) => record.date === date) : records;

    return json(200, {
      playerInputs: filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))),
      summary: summarizePlayerInputs(filtered),
      filters: { date: date || null },
    });
  } catch (error) {
    return json(500, { error: error.message || "Could not load player inputs." });
  }
}
