const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

async function readJSONResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data;
}

export async function fetchPlayerInputs(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/player-inputs${query}`, {
    cache: "no-store",
  });

  return readJSONResponse(response, "Could not load player inputs.");
}

export async function submitPlayerInput(payload) {
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/player-input-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJSONResponse(response, "Could not submit player input.");
}

export async function fetchSessionPlans() {
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/session-plans`, {
    cache: "no-store",
  });

  return readJSONResponse(response, "Could not load session plans.");
}

export async function createSessionPlan(payload, secret) {
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/session-plan-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-coach-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  return readJSONResponse(response, "Could not create session plan.");
}

export async function updateSessionPlan(payload, secret) {
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/session-plan-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-coach-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  return readJSONResponse(response, "Could not update session plan.");
}

export async function deleteSessionPlan(id, secret) {
  const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/session-plan-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-coach-secret": secret,
    },
    body: JSON.stringify({ id }),
  });

  return readJSONResponse(response, "Could not delete session plan.");
}
