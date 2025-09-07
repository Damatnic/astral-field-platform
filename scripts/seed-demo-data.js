/* Demo data seeder for Neon/Postgres
 * Populates minimal users, league, teams, players, roster, lineup entries,
 * waiver claims and trades so SQL-backed analytics have data to read.
 *
 * Usage: DATABASE_URL=... node scripts/seed-demo-data.js
 */
const { Client } = require('pg')

async function getClient() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL or NEON_DATABASE_URL')
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  return client
}

async function upsertUser(client, { email, username }) {
  const sel = await client.query('SELECT id FROM users WHERE email = $1', [email])
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id',
    [email, username]
  )
  return ins.rows[0].id
}

async function upsertLeague(client, { name, commissioner_id }) {
  const sel = await client.query('SELECT id FROM leagues WHERE name = $1', [name])
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO leagues (name, commissioner_id, settings, scoring_system, season_year) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, commissioner_id, {}, { ppr: true }, new Date().getFullYear()]
  )
  return ins.rows[0].id
}

async function upsertTeam(client, { league_id, user_id, team_name, draft_position = 1 }) {
  const sel = await client.query(
    'SELECT id FROM teams WHERE league_id = $1 AND team_name = $2',
    [league_id, team_name]
  )
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO teams (league_id, user_id, team_name, draft_position, waiver_priority) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [league_id, user_id, team_name, draft_position, 1]
  )
  return ins.rows[0].id
}

async function upsertPlayer(client, { name, position, nfl_team, injury_status = null, bye_week = 9 }) {
  const sel = await client.query(
    'SELECT id FROM players WHERE name = $1 AND nfl_team = $2 AND position = $3',
    [name, nfl_team, position]
  )
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO players (name, position, nfl_team, injury_status, bye_week) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, position, nfl_team, injury_status, bye_week]
  )
  return ins.rows[0].id
}

async function ensureRoster(client, { team_id, player_id, position_slot = 'STARTER' }) {
  const sel = await client.query(
    'SELECT id FROM rosters WHERE team_id = $1 AND player_id = $2 AND dropped_date IS NULL',
    [team_id, player_id]
  )
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3) RETURNING id',
    [team_id, player_id, position_slot]
  )
  return ins.rows[0].id
}

async function ensureLineupEntry(client, { team_id, week, player_id, position_slot, points_scored }) {
  const sel = await client.query(
    'SELECT id FROM lineup_entries WHERE team_id = $1 AND week = $2 AND player_id = $3',
    [team_id, week, player_id]
  )
  if (sel.rowCount) return sel.rows[0].id
  const ins = await client.query(
    'INSERT INTO lineup_entries (team_id, week, player_id, position_slot, points_scored) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [team_id, week, player_id, position_slot, points_scored]
  )
  return ins.rows[0].id
}

async function ensureWaiver(client, { team_id, player_add_id, player_drop_id = null, status = 'processed' }) {
  const ins = await client.query(
    'INSERT INTO waiver_claims (team_id, player_add_id, player_drop_id, waiver_priority, status, processed_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
    [team_id, player_add_id, player_drop_id, 1, status]
  )
  return ins.rows[0].id
}

async function ensureTrade(client, { proposing_team_id, receiving_team_id, proposed_players = [], requested_players = [], status = 'accepted' }) {
  const ins = await client.query(
    'INSERT INTO trades (proposing_team_id, receiving_team_id, proposed_players, requested_players, status, expires_at, processed_at) VALUES ($1, $2, $3, $4, $5, NOW() + interval \'7 days\', NOW()) RETURNING id',
    [proposing_team_id, receiving_team_id, JSON.stringify(proposed_players), JSON.stringify(requested_players), status]
  )
  return ins.rows[0].id
}

async function main() {
  const client = await getClient()
  let created = { users: 0, league: false, teams: 0, players: 0, lineup: 0, waivers: 0, trades: 0 }
  try {
    await client.query('BEGIN')

    // Users
    const u1 = await upsertUser(client, { email: 'demo1@example.com', username: 'Demo One' })
    const u2 = await upsertUser(client, { email: 'demo2@example.com', username: 'Demo Two' })
    created.users = 2

    // League
    const leagueId = await upsertLeague(client, { name: 'Demo League', commissioner_id: u1 })
    created.league = true

    // Teams
    const t1 = await upsertTeam(client, { league_id: leagueId, user_id: u1, team_name: 'Alpha Astrals', draft_position: 1 })
    const t2 = await upsertTeam(client, { league_id: leagueId, user_id: u2, team_name: 'Beta Blazers', draft_position: 2 })
    created.teams = 2

    // Players
    const p_rb1 = await upsertPlayer(client, { name: 'Demo RB1', position: 'RB', nfl_team: 'NE', bye_week: 8 })
    const p_rb2 = await upsertPlayer(client, { name: 'Demo RB2', position: 'RB', nfl_team: 'KC', injury_status: 'questionable', bye_week: 10 })
    const p_wr1 = await upsertPlayer(client, { name: 'Demo WR1', position: 'WR', nfl_team: 'SF', bye_week: 9 })
    const p_wr2 = await upsertPlayer(client, { name: 'Demo WR2', position: 'WR', nfl_team: 'DAL', bye_week: 7 })
    const p_te1 = await upsertPlayer(client, { name: 'Demo TE1', position: 'TE', nfl_team: 'BAL', bye_week: 13 })
    created.players = 5

    // Rosters
    await ensureRoster(client, { team_id: t1, player_id: p_rb1 })
    await ensureRoster(client, { team_id: t1, player_id: p_wr1 })
    await ensureRoster(client, { team_id: t1, player_id: p_te1 })
    await ensureRoster(client, { team_id: t2, player_id: p_rb2 })
    await ensureRoster(client, { team_id: t2, player_id: p_wr2 })

    // Lineup entries for weeks 1-3 (team 1)
    await ensureLineupEntry(client, { team_id: t1, week: 1, player_id: p_rb1, position_slot: 'RB', points_scored: 16.2 })
    await ensureLineupEntry(client, { team_id: t1, week: 1, player_id: p_wr1, position_slot: 'WR', points_scored: 12.4 })
    await ensureLineupEntry(client, { team_id: t1, week: 2, player_id: p_rb1, position_slot: 'RB', points_scored: 18.7 })
    await ensureLineupEntry(client, { team_id: t1, week: 2, player_id: p_wr1, position_slot: 'WR', points_scored: 9.1 })
    await ensureLineupEntry(client, { team_id: t1, week: 3, player_id: p_rb1, position_slot: 'RB', points_scored: 14.9 })
    await ensureLineupEntry(client, { team_id: t1, week: 3, player_id: p_wr1, position_slot: 'WR', points_scored: 17.0 })

    // Lineup entries for team 2 (week 3 only)
    await ensureLineupEntry(client, { team_id: t2, week: 3, player_id: p_rb2, position_slot: 'RB', points_scored: 11.0 })
    await ensureLineupEntry(client, { team_id: t2, week: 3, player_id: p_wr2, position_slot: 'WR', points_scored: 8.3 })
    created.lineup = 8

    // Waiver claim
    await ensureWaiver(client, { team_id: t1, player_add_id: p_wr2, player_drop_id: null, status: 'processed' })
    created.waivers = 1

    // Trade
    await ensureTrade(client, { proposing_team_id: t1, receiving_team_id: t2, proposed_players: [p_wr1], requested_players: [p_rb2], status: 'accepted' })
    created.trades = 1

    await client.query('COMMIT')
    console.log('✅ Seed complete:', created)
    console.log('League ID:', leagueId, 'Team1:', t1, 'Team2:', t2)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', e.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Seed script error:', e)
  process.exit(1)
})

