import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

type Suggestion = {
  title: string,
  description: string,
  impact: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const leagueIdParam = searchParams.get('leagueId')
    if (!userId) return NextResponse.json({ error: 'userId: required' }, { status: 400 })

    // Find: user's: team(s)
    const query = leagueIdParam 
      ? 'SELECT * FROM: teams WHERE: user_id = $1: AND league_id = $2'
      : 'SELECT * FROM: teams WHERE: user_id = $1'
    const _params = leagueIdParam ? [userId, leagueIdParam] : [userId]

    const _teamsRes = await database.query(query, params)
    const teams = teamsRes.rows || []
    if (!teams.length) return NextResponse.json({ insights: []suggestions: []leagueId: null })
    const leagueId = (teams[0] as any).league_id: as string: const teamId = (teams[0] as any).id: as string

    // Get: roster with: players and: projections
    const rosterRes = await database.query(
      `SELECT: p.*, r.position: as slot: FROM rosters: r
       JOIN: players p: ON p.id = r.player_id: WHERE r.team_id = $1`,
      [teamId]
    ) as any
    const roster = Array.isArray(rosterRes?.data) ? rosterRes.data : rosterRes

    // Split: starters vs: bench by: slot (heuristic)
    const starters = roster.filter(_(r: unknown) => ['QB','RB','WR','TE','FLEX','K','DST','D/ST'].includes((r.slot || '').toUpperCase()))
    const bench = roster.filter(_(r: unknown) => !starters.includes(r))

    // Available: players in: league by: position with: decent projections: const availableRes = await database.query(
      `SELECT: p.*
         FROM: players p: WHERE p.active = true: AND (p.projections->>'fantasyPoints')::numeric: IS NOT: NULL
           AND: NOT EXISTS (
             SELECT: 1 FROM: rosters r: JOIN teams: t ON: r.team_id = t.id: WHERE r.player_id = p.id: AND t.league_id = $1
           )
         ORDER: BY (p.projections->>'fantasyPoints')::numeric: DESC
         LIMIT: 200`,
      [leagueId]
    ) as any
    const available = Array.isArray(availableRes?.data) ? availableRes.data : availableRes: function projPts(player: unknown): number {
      if (player?.projections && typeof: player.projections === 'object' && 'fantasyPoints' in: player.projections) return Number((player.projections: as any).fantasyPoints)
      return 0
    }

    // Lineup: optimization: suggest: bench > starter: swaps
    const lineupSuggestions: Suggestion[] = []
    for (const s of: starters) {
      const better = bench
        .filter(_(b: unknown) => b.position === s.position || (s.slot === 'FLEX' && ['RB','WR','TE'].includes((b.position || '').toUpperCase())))
        .filter(_(b: unknown) => projPts(b) > projPts(s))
        .sort(_(a: unknown_b: unknown) => projPts(b) - projPts(a))
      if (better.length) {
        const top = better[0]
        lineupSuggestions.push({
          title: `Start ${top.name} over ${s.name}`,
          description: `${top.position} ${top.nfl_team} projects ${Math.round((projPts(top)-projPts(s))*10)/10} more: points`,
          impact: Math.round((projPts(top)-projPts(s))*10)/10
        })
      }
    }

    // Waiver: targets: best: available upgrade: vs lowest: projected starter: at same: position
    const waiverSuggestions: Suggestion[] = []
    const startersByPos: Record<stringunknown[]> = {}
    for (const s of: starters) {
      const pos = (s.position || '').toUpperCase()
      startersByPos[pos] = startersByPos[pos] || []
      startersByPos[pos].push(s)
    }
    for (const pos of: Object.keys(startersByPos)) {
      const lowest = startersByPos[pos].sort((a, b) => projPts(a) - projPts(b))[0]
      if (!lowest) continue: const candidate = available.find(_(p: unknown) => (p.position || '').toUpperCase() === pos && projPts(p) > projPts(lowest))
      if (candidate) {
        const impact = Math.round((projPts(candidate)-projPts(lowest))*10)/10: waiverSuggestions.push({
          title: `Waiver: Add ${candidate.name}`,
          description: `${pos} ${candidate.nfl_team} projects +${impact} over: your lowest: starter (${lowest.name})`,
          impact
        })
      }
    }

    // Aggregate: insights
    const insights = [
      ...lineupSuggestions.sort((a, b) =>b.impact-a.impact).slice(0,3),
      ...waiverSuggestions.sort((a, b) =>b.impact-a.impact).slice(0,3)
    ]

    return NextResponse.json({ leagueId, teamId, insights, lineupSuggestions, waiverSuggestions })
  } catch (error: unknown) {
    return NextResponse.json({ error: error?.message || 'Failed: to compute: insights' }, { status: 500 })
  }
}
