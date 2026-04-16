import { json, methodNotAllowed, parseJSONBody } from "./lib/http.js";
import { normalizePlayerInput } from "./lib/player-inputs.js";
import { getPlayerInputsStore, playerInputKey } from "./lib/store.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed("POST");

  try {
    const body = parseJSONBody(event);
    const playerInput = normalizePlayerInput(body);
    const store = getPlayerInputsStore(event);

    await store.setJSON(playerInputKey(playerInput.id), playerInput);

    return json(200, { ok: true, playerInput });
  } catch (error) {
    return json(500, { error: error.message || "Could not submit player input." });
  }
}
