# Backend MVP

## Recommendation

Use the existing Netlify stack first.

Why:

- It matches the current repo and deployment path.
- There is already working Netlify Functions + Netlify Blobs code in the app.
- Setup is much lighter than standing up a separate server.
- It should stay within a free or very low-cost footprint for an MVP with moderate school usage.

This is the simplest path for version 1.

## What This MVP Covers

Two backend domains are enough to start:

1. Player inputs
   Collect daily check-ins from players:
   - sleep
   - energy
   - soreness
   - mood
   - availability
   - focus areas
   - notes

2. Session plans
   Let coaches or teachers save session plans linked to:
   - date
   - squad
   - objective
   - planned load
   - focus areas
   - constraints
   - session blocks
   - a snapshot of player-input summary

That gives you the basic loop:

1. Players submit check-ins.
2. Coaches view the summary.
3. Coaches plan the next session using the summary.

## Endpoints Added

### Player inputs

- `GET /.netlify/functions/player-inputs`
- `GET /.netlify/functions/player-inputs?date=YYYY-MM-DD`
- `POST /.netlify/functions/player-input-submit`

Example body:

```json
{
  "playerId": "nbss-001",
  "playerName": "Ahmad Faris",
  "date": "2026-04-16",
  "sleep": 4,
  "energy": 3,
  "soreness": 2,
  "mood": 4,
  "availability": "available",
  "focusAreas": ["finishing", "first touch"],
  "note": "Left calf a bit tight after yesterday."
}
```

### Session plans

- `GET /.netlify/functions/session-plans`
- `POST /.netlify/functions/session-plan-create`
- `POST /.netlify/functions/session-plan-update`
- `POST /.netlify/functions/session-plan-delete`

Create, update, and delete require the header:

```txt
x-coach-secret: <COACH_BACKEND_SECRET>
```

Example create body:

```json
{
  "date": "2026-04-17",
  "title": "B Div Recovery + Pressing Tune-Up",
  "squad": "B Div",
  "coach": "Mr Herwanto",
  "objective": "Reduce load but keep collective pressing detail sharp.",
  "plannedLoad": "Moderate",
  "focusAreas": ["pressing shape", "first touch"],
  "constraints": ["2 players modified", "1 player unavailable"],
  "basedOnDate": "2026-04-16",
  "summarySnapshot": {
    "responses": 18,
    "averageReadiness": 71,
    "unavailableCount": 1
  },
  "blocks": [
    { "title": "Activation", "duration": "12 min", "focus": "Mobility + passing rhythm" },
    { "title": "Unit work", "duration": "20 min", "focus": "Front-foot pressing triggers" },
    { "title": "Conditioned game", "duration": "18 min", "focus": "Press and play forward" }
  ],
  "notes": "Keep sprint exposure controlled."
}
```

## Environment

Add these in Netlify:

- `COACH_BACKEND_SECRET`
- `SCHEDULE_ADMIN_SECRET`
- `ANNOUNCEMENT_ADMIN_SECRET`

`COACH_BACKEND_SECRET` is the main one for the new planning backend.

## Limits

This is an MVP backend, not a full athlete-management platform.

Current tradeoffs:

- No real user accounts yet.
- Player submission endpoint is simple and not strongly authenticated.
- Data is stored as blobs, so querying stays lightweight rather than relational.
- Good for starting fast, not ideal forever if usage grows a lot.

## When To Upgrade

Move to Supabase later if you need:

- real player/coach login
- role-based access
- stronger protection for student data
- richer filtering and dashboards
- audit trails

That would be the point where the app has outgrown the simple Netlify MVP.

## Why Not Start With Supabase Immediately

Supabase is stronger long term.

But for this repo, starting on Netlify is simpler because:

- deployment is already there
- the codebase already uses Netlify Functions
- there is less setup friction
- the first backend slice can ship faster

Inference: based on the current repo shape, Netlify is the lowest-friction first step, while Supabase is the cleaner second-step platform once accounts and stronger data rules matter.

## Official References

- Netlify Blobs docs: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Supabase billing FAQ: https://supabase.com/docs/guides/platform/billing-faq
- Supabase Data API / RLS docs: https://supabase.com/docs/guides/api/hardening-data-api
