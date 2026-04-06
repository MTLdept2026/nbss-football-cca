export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

export function methodNotAllowed(allowed = "GET") {
  return json(405, { error: `Method not allowed. Use ${allowed}.` });
}

export function parseJSONBody(event) {
  if (!event.body) return {};

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
