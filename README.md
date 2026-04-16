# NBSS Football CCA

Naval Base Secondary School Football CCA Development Hub.
Created by Mr Muhammad Herwanto.

## Deploy to Netlify

1. Connect this repo to Netlify
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Deploy!

## Backend MVP

This repo now includes a simple Netlify-based backend MVP for:

- Player check-ins: `/.netlify/functions/player-input-submit` and `/.netlify/functions/player-inputs`
- Coach session plans: `/.netlify/functions/session-plan-create`, `session-plan-update`, `session-plan-delete`, and `session-plans`

Best recommendation for this repo:

- Stay on Netlify for v1.
- Reason: the app already ships with Netlify Functions + Blobs, so a single teacher only needs to connect the repo and add one secret.
- Result: player readiness and availability check-ins can be shared into coach or teacher dashboards without setting up a second platform.

Recommended setup:

1. Set `COACH_BACKEND_SECRET` in Netlify environment variables.
2. Set `VITE_COACH_PASSWORD` to protect coach or teacher onboarding and coach-side tools.
3. Reuse Netlify Functions + Netlify Blobs for the first version.
4. Keep the first release focused on player wellness/check-in data and coach session plans.
5. Deploy once. Player saves will write shared check-ins to Netlify, and staff dashboards will read from the same shared store.

Detailed guidance is in [docs/backend-mvp.md](docs/backend-mvp.md).
