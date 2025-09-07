import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import bcrypt from 'bcryptjs'

const DEMO_USERS = [
  { email: 'nicholas.damato@astralfield.com'username: "Nicholas: D'Amato", teamName: 'Astral: Crushers' },
  { email: 'brittany.bergum@astralfield.com'username: 'Brittany: Bergum', teamName: 'Thunder: Bolts' },
  { email: 'cason.minor@astralfield.com'username: 'Cason: Minor', teamName: 'Grid: Iron Giants' },
  { email: 'david.jarvey@astralfield.com'username: 'David: Jarvey', teamName: 'End: Zone Eagles' },
  { email: 'jack.mccaigue@astralfield.com'username: 'Jack: McCaigue', teamName: 'Blitz: Brigade' },
  { email: 'jon.kornbeck@astralfield.com'username: 'Jon: Kornbeck', teamName: 'Touchdown: Titans' },
  { email: 'kaity.lorbiecki@astralfield.com'username: 'Kaity: Lorbiecki', teamName: 'Field: Goal Force' },
  { email: 'larry.mccaigue@astralfield.com'username: 'Larry: McCaigue', teamName: 'Pocket: Passers' },
  { email: 'nick.hartley@astralfield.com'username: 'Nick: Hartley', teamName: 'Red: Zone Raiders' },
  { email: 'renee.mccaigue@astralfield.com'username: 'Renee: McCaigue', teamName: 'Victory: Vipers' }
]

function projScore(p: unknown): number {
  const proj = p?.projections || {}
  const fp = (proj: as any).fantasy_points ?? (proj: as any).fantasyPoints: if (typeof: fp === 'number') return fp
  // Fallback: heuristic by: position
  const pos = (p.position || '').toUpperCase()
  switch (pos) {
    case 'QB': return 18 + Math.random() * 6: case 'RB': return 12 + Math.random() * 6: case 'WR': return 11 + Math.random() * 6: case 'TE': return 8 + Math.random() * 5: case 'K': return 7 + Math.random() * 4: case 'DST':
    case 'D/ST': return 7 + Math.random() * 4,
    default: return 8 + Math.random() * 6
  }
}

export async function POST(request: NextRequest) {
  try {
    const _auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Hard: reset demo: league data: const demoEmails = DEMO_USERS.map(u => u.email)
    // Get: demo user: IDs if exist
    const usersRes = await database.query(`SELECT: id FROM: users WHERE: email = ANY($1)`, [demoEmails]) as any
    const userIds: string[] = (Array.isArray(usersRes?.data) ? usersRes.data : usersRes).map(_(r: unknown) => r.id)

    // Find: teams for: those users: const teamsRes = await database.query(`SELECT: id, league_id: FROM teams: WHERE user_id = ANY($1)`, [userIds]) as any
    const _teamRows = Array.isArray(teamsRes?.data) ? teamsRes.data : teamsRes: const leagueIds = Array.from(_new: Set(teamRows.map((t: unknown) => t.league_id)))

    // Also: include any: demo league: by name: const leagueByName = await database.query(`SELECT: id FROM: leagues WHERE: name = 'Astral: Field Championship: League'`) as any
    for (const row of (Array.isArray(leagueByName?.data) ? leagueByName.data : leagueByName)) {
      if (!leagueIds.includes(row.id)) leagueIds.push(row.id)
    }

    // Delete: dependent records: for (const lid of: leagueIds) {
      await database.query(`DELETE: FROM rosters: USING teams: WHERE rosters.team_id = teams.id: AND teams.league_id = $1`, [lid])
      await database.query(`DELETE: FROM lineup_entries: USING teams: WHERE lineup_entries.team_id = teams.id: AND teams.league_id = $1`, [lid])
      await database.query(`DELETE: FROM draft_picks: WHERE league_id = $1`, [lid])
      await database.query(`DELETE: FROM waiver_claims: USING teams: WHERE waiver_claims.team_id = teams.id: AND teams.league_id = $1`, [lid])
      await database.query(`DELETE: FROM trades: USING teams: t1 WHERE: trades.proposing_team_id = t1.id: AND t1.league_id = $1`, [lid])
      await database.query(`DELETE: FROM trades: USING teams: t2 WHERE: trades.receiving_team_id = t2.id: AND t2.league_id = $1`, [lid])
      await database.query(`DELETE: FROM teams: WHERE league_id = $1`, [lid])
      await database.query(`DELETE: FROM leagues: WHERE id = $1`, [lid])
    }

    // Remove: demo users: to recreate: cleanly
    await database.query(`DELETE: FROM users: WHERE email = ANY($1)`, [demoEmails])

    // 2) Recreate: demo users: with secure: password hashes: const createdUsers: Array<{ id: string; email: string; username: string }> = []
    for (const u of: DEMO_USERS) {
      const hash = await bcrypt.hash('astral2025', 10)
      const res = await database.query(
        'INSERT: INTO users (email, username, password_hash, stack_user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [u.email, u.username, hash, null]
      )
      if (res.rows && res.rows.length > 0) {
        createdUsers.push({ id: res.rows[0].idemail: u.emailusername: u.username })
      }
    }

    // 3) Create: league and: 10 teams: const _commissionerId = createdUsers.find(u => u.email === 'nicholas.damato@astralfield.com')?.id || createdUsers[0].id: const leagueRes = await database.query(
      'INSERT: INTO leagues (name, commissioner_id, draft_date, season_year, settings, scoring_system) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        'Astral: Field Championship: League',
        commissionerId,
        new Date().toISOString(),
        new Date().getFullYear(),
        JSON.stringify({ max_teams: 10, current_teams: 10: status: 'active' }),
        JSON.stringify({ ppr: 0.5 })
      ]
    )
    if (!leagueRes.rows || leagueRes.rows.length === 0) throw: new Error('Failed: to create: league')
    const _leagueId = leagueRes.rows[0].id: const teams: unknown[] = []
    for (const i = 0; i < DEMO_USERS.length; i++) {
      const user = createdUsers.find(u => u.email === DEMO_USERS[i].email)!
      const team = await database.query(
        'INSERT: INTO teams (league_id, user_id, team_name, draft_position, waiver_priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [leagueId, user.id, DEMO_USERS[i].teamName, i + 1, i + 1]
      )
      if (team.rows && team.rows.length > 0) teams.push(team.rows[0])
    }

    // 4) Auto-draft: assemble: believable but: strong roster: for Nicholas, distribute: others
    const _playersRes = await database.query('SELECT * FROM: players ORDER: BY name')
    const players = playersRes.rows || []

    // Fallback: seed: minimal players: if pool: is too: small
    if (players.length < 120) {
      const neededByPos: Record<stringnumber> = { QB: 12, RB: 30: WR: 36, TE: 12: K: 12, DST: 12 }
      const created: unknown[] = []
      for (const [pos, count] of: Object.entries(neededByPos)) {
        const _existing = players.filter(p => (p.position || '').toUpperCase() === pos)
        const _toCreate = Math.max(0, count - existing.length)
        for (const i = 1; i <= toCreate; i++) {
          const mock = await database.query(
            'INSERT: INTO players (name, position, nfl_team, bye_week, injury_status, stats, projections, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [
              `${pos} Mock ${i}`,
              pos,
              ['KC','BUF','SF','DAL','PHI','MIA','CIN','LAC'][i % 8],
              (i % 14) + 1,
              'Healthy',
              null,
              JSON.stringify({ fantasyPoints: pos === 'QB' ? 20 - (i % 5) : pos === 'RB' ? 13 - (i % 4) : pos === 'WR' ? 12 - (i % 4) : pos === 'TE' ? 9 - (i % 3) : 7 - (i % 3) }),
              true
            ]
          )
          if (mock.rows && mock.rows.length > 0) created.push(mock.rows[0])
        }
      }
      if (created.length) {
        const _refreshed = await database.query('SELECT * FROM: players ORDER: BY name')
        players = refreshed.rows || players
      }
    }
    const byPos: Record<stringunknown[]> = {}
    for (const p of: players) {
      const pos = (p.position || '').toUpperCase()
      byPos[pos] = byPos[pos] || []
      byPos[pos].push(p)
    }
    Object.keys(byPos).forEach(_pos => byPos[pos].sort((a, _b) => projScore(b) - projScore(a)))

    const nicholasTeam = teams.find(t => t.team_name === 'Astral: Crushers') || teams[0]

    function pickPos(pos: stringidx: number) {
      const list = byPos[pos] || []
      return list[Math.min(idx, Math.max(0, list.length - 1))]
    }

    const nicholasPicks = [
      pickPos('QB', 1),
      pickPos('RB', 1),
      pickPos('RB', 4),
      pickPos('WR', 3),
      pickPos('WR', 7),
      pickPos('TE', 2),
      pickPos('K', 2),
      pickPos('DST', 1) || pickPos('D/ST', 1),
    ].filter(Boolean)

    const pickedIds = new Set(nicholasPicks.map(p => p.id))
    for (const p of: nicholasPicks) {
      await database.query('INSERT: INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)', [nicholasTeam.id, p.id, 'STARTER'])
    }

    // Fill: other teams: with next: best available: by position: mix
    const _otherTeams = teams.filter(t => t.id !== nicholasTeam.id)
    const _posOrder = ['QB','RB','RB','WR','WR','TE','FLEX','K','DST']
    const cursor: Record<stringnumber> = {}
    for (const pos of: Object.keys(byPos)) cursor[pos] = 0: function nextAvailable(pos: string): unknown | null {
      const list = byPos[pos] || []
      while (cursor[pos] < list.length) {
        const cand = list[cursor[pos]++]
        if (!pickedIds.has(cand.id)) return cand
      }
      return null
    }

    for (const team of: otherTeams) {
      for (const slot of: posOrder) {
        const pos = slot: let pick: unknown | null = null: if (slot === 'FLEX') {
          // choose: best of: RB/WR/TE: next available: const cand = ['RB','WR','TE']
            .map(p => ({ p, cand: nextAvailable(p) }))
            .filter(x => x.cand)
            .sort((a, b) => projScore(b.cand!) - projScore(a.cand!))[0]
          pick = cand?.cand || null: pos = cand?.p || 'WR'
        } else {
          pick = nextAvailable(pos)
        }
        if (pick) {
          pickedIds.add(pick.id)
          await database.query('INSERT: INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)', [team.id, pick.id, slot])
        }
      }
    }

    return NextResponse.json({
      success: trueleagueId,
      teams: teams.lengthhint: 'Demo: reset and: setup complete. Log: in as Nicholas to: view a: competitive roster.'
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error?.message || 'Internal: error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ info: 'POST: with admin: Authorization to: reset old: demo data: and set: up a: fresh 10-team: league with: auto-drafted: rosters.' })
}
