import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import bcrypt from 'bcryptjs'

const DEMO_USERS = [
  { email: 'nicholas.damato@astralfield.com', username: "Nicholas D'Amato", teamName: 'Astral Crushers' },
  { email: 'brittany.bergum@astralfield.com', username: 'Brittany Bergum', teamName: 'Thunder Bolts' },
  { email: 'cason.minor@astralfield.com', username: 'Cason Minor', teamName: 'Grid Iron Giants' },
  { email: 'david.jarvey@astralfield.com', username: 'David Jarvey', teamName: 'End Zone Eagles' },
  { email: 'jack.mccaigue@astralfield.com', username: 'Jack McCaigue', teamName: 'Blitz Brigade' },
  { email: 'jon.kornbeck@astralfield.com', username: 'Jon Kornbeck', teamName: 'Touchdown Titans' },
  { email: 'kaity.lorbiecki@astralfield.com', username: 'Kaity Lorbiecki', teamName: 'Field Goal Force' },
  { email: 'larry.mccaigue@astralfield.com', username: 'Larry McCaigue', teamName: 'Pocket Passers' },
  { email: 'nick.hartley@astralfield.com', username: 'Nick Hartley', teamName: 'Red Zone Raiders' },
  { email: 'renee.mccaigue@astralfield.com', username: 'Renee McCaigue', teamName: 'Victory Vipers' }
]

function projScore(p: any): number {
  const proj = p?.projections || {}
  const fp = (proj as any).fantasy_points ?? (proj as any).fantasyPoints
  if (typeof fp === 'number') return fp
  // Fallback heuristic by position
  const pos = (p.position || '').toUpperCase()
  switch (pos) {
    case 'QB': return 18 + Math.random() * 6
    case 'RB': return 12 + Math.random() * 6
    case 'WR': return 11 + Math.random() * 6
    case 'TE': return 8 + Math.random() * 5
    case 'K': return 7 + Math.random() * 4
    case 'DST':
    case 'D/ST': return 7 + Math.random() * 4
    default: return 8 + Math.random() * 6
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Hard reset demo league data
    const demoEmails = DEMO_USERS.map(u => u.email)
    // Get demo user IDs if exist
    const usersRes = await database.query(`SELECT id FROM users WHERE email = ANY($1)`, [demoEmails]) as any
    const userIds: string[] = (Array.isArray(usersRes?.data) ? usersRes.data : usersRes).map((r: any) => r.id)

    // Find teams for those users
    const teamsRes = await database.query(`SELECT id, league_id FROM teams WHERE user_id = ANY($1)`, [userIds]) as any
    const teamRows = Array.isArray(teamsRes?.data) ? teamsRes.data : teamsRes
    const leagueIds = Array.from(new Set(teamRows.map((t: any) => t.league_id)))

    // Also include any demo league by name
    const leagueByName = await database.query(`SELECT id FROM leagues WHERE name = 'Astral Field Championship League'`) as any
    for (const row of (Array.isArray(leagueByName?.data) ? leagueByName.data : leagueByName)) {
      if (!leagueIds.includes(row.id)) leagueIds.push(row.id)
    }

    // Delete dependent records
    for (const lid of leagueIds) {
      await database.query(`DELETE FROM rosters USING teams WHERE rosters.team_id = teams.id AND teams.league_id = $1`, [lid])
      await database.query(`DELETE FROM lineup_entries USING teams WHERE lineup_entries.team_id = teams.id AND teams.league_id = $1`, [lid])
      await database.query(`DELETE FROM draft_picks WHERE league_id = $1`, [lid])
      await database.query(`DELETE FROM waiver_claims USING teams WHERE waiver_claims.team_id = teams.id AND teams.league_id = $1`, [lid])
      await database.query(`DELETE FROM trades USING teams t1 WHERE trades.proposing_team_id = t1.id AND t1.league_id = $1`, [lid])
      await database.query(`DELETE FROM trades USING teams t2 WHERE trades.receiving_team_id = t2.id AND t2.league_id = $1`, [lid])
      await database.query(`DELETE FROM teams WHERE league_id = $1`, [lid])
      await database.query(`DELETE FROM leagues WHERE id = $1`, [lid])
    }

    // Remove demo users to recreate cleanly
    await database.query(`DELETE FROM users WHERE email = ANY($1)`, [demoEmails])

    // 2) Recreate demo users with secure password hashes
    const createdUsers: Array<{ id: string; email: string; username: string }> = []
    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash('astral2025', 10)
      const res = await database.insert('users', {
        email: u.email,
        username: u.username,
        password_hash: hash,
        stack_user_id: null
      })
      if (res.data) createdUsers.push({ id: res.data.id, email: u.email, username: u.username })
    }

    // 3) Create league and 10 teams
    const commissionerId = createdUsers.find(u => u.email === 'nicholas.damato@astralfield.com')?.id || createdUsers[0].id
    const leagueRes = await database.insert('leagues', {
      name: 'Astral Field Championship League',
      commissioner_id: commissionerId,
      draft_date: new Date().toISOString(),
      season_year: new Date().getFullYear(),
      settings: { max_teams: 10, current_teams: 10, status: 'active' },
      scoring_system: { ppr: 0.5 }
    })
    if (leagueRes.error || !leagueRes.data) throw new Error('Failed to create league')
    const leagueId = leagueRes.data.id

    const teams: any[] = []
    for (let i = 0; i < DEMO_USERS.length; i++) {
      const user = createdUsers.find(u => u.email === DEMO_USERS[i].email)!
      const team = await database.insert('teams', {
        league_id: leagueId,
        user_id: user.id,
        team_name: DEMO_USERS[i].teamName,
        draft_position: i + 1,
        waiver_priority: i + 1
      })
      if (team.data) teams.push(team.data)
    }

    // 4) Auto-draft: assemble believable but strong roster for Nicholas, distribute others
    const playersRes = await database.select('players', { order: { column: 'name' } })
    let players = playersRes.data || []

    // Fallback: seed minimal players if pool is too small
    if (players.length < 120) {
      const neededByPos: Record<string, number> = { QB: 12, RB: 30, WR: 36, TE: 12, K: 12, DST: 12 }
      const created: any[] = []
      for (const [pos, count] of Object.entries(neededByPos)) {
        const existing = players.filter(p => (p.position || '').toUpperCase() === pos)
        const toCreate = Math.max(0, count - existing.length)
        for (let i = 1; i <= toCreate; i++) {
          const mock = await database.insert('players', {
            name: `${pos} Mock ${i}`,
            position: pos,
            nfl_team: ['KC','BUF','SF','DAL','PHI','MIA','CIN','LAC'][i % 8],
            bye_week: (i % 14) + 1,
            injury_status: 'Healthy',
            stats: null,
            projections: { fantasyPoints: pos === 'QB' ? 20 - (i % 5) : pos === 'RB' ? 13 - (i % 4) : pos === 'WR' ? 12 - (i % 4) : pos === 'TE' ? 9 - (i % 3) : 7 - (i % 3) } as any,
            active: true
          })
          if (mock.data) created.push(mock.data)
        }
      }
      if (created.length) {
        const refreshed = await database.select('players', { order: { column: 'name' } })
        players = refreshed.data || players
      }
    }
    const byPos: Record<string, any[]> = {}
    for (const p of players) {
      const pos = (p.position || '').toUpperCase()
      byPos[pos] = byPos[pos] || []
      byPos[pos].push(p)
    }
    Object.keys(byPos).forEach(pos => byPos[pos].sort((a, b) => projScore(b) - projScore(a)))

    const nicholasTeam = teams.find(t => t.team_name === 'Astral Crushers') || teams[0]

    function pickPos(pos: string, idx: number) {
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
    for (const p of nicholasPicks) {
      await database.query('INSERT INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)', [nicholasTeam.id, p.id, 'STARTER'])
    }

    // Fill other teams with next best available by position mix
    const otherTeams = teams.filter(t => t.id !== nicholasTeam.id)
    const posOrder = ['QB','RB','RB','WR','WR','TE','FLEX','K','DST']
    let cursor: Record<string, number> = {}
    for (const pos of Object.keys(byPos)) cursor[pos] = 0

    function nextAvailable(pos: string): any | null {
      const list = byPos[pos] || []
      while (cursor[pos] < list.length) {
        const cand = list[cursor[pos]++]
        if (!pickedIds.has(cand.id)) return cand
      }
      return null
    }

    for (const team of otherTeams) {
      for (const slot of posOrder) {
        let pos = slot
        let pick: any | null = null
        if (slot === 'FLEX') {
          // choose best of RB/WR/TE next available
          const cand = ['RB','WR','TE']
            .map(p => ({ p, cand: nextAvailable(p) }))
            .filter(x => x.cand)
            .sort((a, b) => projScore(b.cand!) - projScore(a.cand!))[0]
          pick = cand?.cand || null
          pos = cand?.p || 'WR'
        } else {
          pick = nextAvailable(pos)
        }
        if (pick) {
          pickedIds.add(pick.id)
          await database.query('INSERT INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)', [team.id, pick.id, slot])
        }
      }
    }

    return NextResponse.json({
      success: true,
      leagueId,
      teams: teams.length,
      hint: 'Demo reset and setup complete. Log in as Nicholas to view a competitive roster.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ info: 'POST with admin Authorization to reset old demo data and set up a fresh 10-team league with auto-drafted rosters.' })
}
