# SportsData.io Integration

This project integrates NFL data via SportsData.io. Keys are no longer hardcoded; configure environment variables for Vercel and local development.

## Environment Variables

- `SPORTSDATA_SECRET_KEY` (preferred): Server-side API key used on API routes and server code.
- `NEXT_PUBLIC_SPORTSDATA_API_KEY` (optional): Fallback for read-only, non-sensitive client usage. Do not use production secrets here.

## Endpoints

- `GET /api/sync-sportsdata` — Status check; returns `currentSeason`, `currentWeek`, and `gamesInProgress`.
- `POST /api/sync-sportsdata` — Perform sync operations:
  - `{ "action": "sync-all-players" }`
  - `{ "action": "sync-team-players", "team": "BUF" }`
  - Requires header: `Authorization: Bearer <ADMIN_SETUP_KEY>`

- `GET /api/nfl/teams` — Basic list of NFL teams for UI usage.

- `GET /api/live/league?leagueId=...&week=...` — Server-side live scoring aggregate for a league and week. Includes games (simulated until wired to live feeds), team totals, and top performers.
- `POST /api/live/tick` — Admin-protected live update tick. Body `{ leagueId?: string, week?: number }`; updates weekly stats from SportsData.io and returns a fresh league snapshot if `leagueId` is provided.
  - With `{ leagueId, week?, ppr? }`, only players in that league's lineups are updated and fantasy points are computed server-side (defaults to 0.5 PPR). If no `leagueId` is provided, performs a broader weekly stats sync.

### League Settings

- `GET /api/league/settings?leagueId=...` — Returns `{ live_polling_enabled, live_polling_until, scoring_ppr }`.
- `POST /api/league/settings` — Admin-protected updates; body can include:
  - `{ leagueId, enable: boolean, minutes?: number }` to toggle the live window
  - `{ leagueId, scoring_ppr: number }` to change scoring PPR

### Weekly Sync API

- `GET /api/sync-week` — Status helper (season, week, gamesInProgress)
- `POST /api/sync-week` — Trigger weekly operations:
  - `{ "action": "sync-projections", "week": 3 }`
  - `{ "action": "sync-stats", "week": 3 }`
  - Requires `Authorization: Bearer <ADMIN_SETUP_KEY>` header

## Scheduling

Vercel cron pings:

- `GET /api/health` every 6 hours
- `GET /api/sync-sportsdata` Tue/Fri 12:15 UTC (keeps integration warm; safe GET)
- `GET /api/sync-week` Fri 12:30 UTC (status-only; safe GET)
- `GET /api/cron/live` every 2 minutes (updates lineup players for active live windows)

To run actual periodic syncs, add a protected cron route (e.g., `/api/cron/sync-players`) that validates `ADMIN_SETUP_KEY` and triggers the POST action server-side.

Live scoring currently prefers any stored `player_stats` for fantasy points and `player_projections` for projected points; otherwise it falls back to a simulation. Wiring real-time updates can be added incrementally by polling SportsData.io box score endpoints during game windows.
