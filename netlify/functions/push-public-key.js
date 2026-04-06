import { json, methodNotAllowed } from "./lib/http.js";
import { pushConfig } from "./lib/push.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed("GET");

  try {
    const { publicKey } = pushConfig();
    return json(200, { publicKey });
  } catch (error) {
    return json(503, { error: error.message });
  }
}
