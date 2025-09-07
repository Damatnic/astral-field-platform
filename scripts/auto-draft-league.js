const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://udqlhdagqjbhkswzgitj.supabase.co'
const supabaseServiceKey = 'sb_secret_ZD550ahg4-Lx_GNjX2Aevw_Vm6cpH9l'
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: falsepersistSession: false
  }
})
// PPR scoring system
const pprScoringSystem = {
  passingYards: 0.04passingTouchdowns: 4passingInterceptions: -2rushingYards: 0.1rushingTouchdowns: 6receivingYards: 0.1receivingTouchdowns: 6receptions: 1// PPR bonus
  fumbles: -2fieldGoals: 3extraPoints: 1defensePoints: 1
}
// League settings for 10-team PPR
const leagueSettings = {
  maxTeams: 10rounds: 16playoffTeams: 4playoffWeeks: 3waiverDays: 2tradeDeadline: 12startingLineup: {
    QB: 1RB: 2WR: 2TE: 1FLEX: 1K: 1DST: 1BENCH: 6
  }
}
// Top fantasy football players for 2024 season with realistic projections
const playerPool = [
  // QBs
  { name: 'Josh Allen', position: 'QB'team: 'BUF'adp: 12projectedPoints: 320 },
  { name: 'Lamar Jackson', position: 'QB'team: 'BAL'adp: 15projectedPoints: 315 },
  { name: 'Jalen Hurts', position: 'QB'team: 'PHI'adp: 18projectedPoints: 310 },
  { name: 'Patrick Mahomes', position: 'QB'team: 'KC'adp: 22projectedPoints: 305 },
  { name: 'Dak Prescott', position: 'QB'team: 'DAL'adp: 45projectedPoints: 285 },
  { name: 'Tua Tagovailoa', position: 'QB'team: 'MIA'adp: 48projectedPoints: 280 },
  { name: 'Joe Burrow', position: 'QB'team: 'CIN'adp: 52projectedPoints: 275 },
  { name: 'Justin Herbert', position: 'QB'team: 'LAC'adp: 55projectedPoints: 270 },
  { name: 'Aaron Rodgers', position: 'QB'team: 'NYJ'adp: 65projectedPoints: 265 },
  { name: 'Trevor Lawrence', position: 'QB'team: 'JAX'adp: 68projectedPoints: 260 },
  // RBs
  { name: 'Christian McCaffrey', position: 'RB'team: 'SF'adp: 1projectedPoints: 280 },
  { name: 'Austin Ekeler', position: 'RB'team: 'WAS'adp: 8projectedPoints: 240 },
  { name: 'Bijan Robinson', position: 'RB'team: 'ATL'adp: 10projectedPoints: 235 },
  { name: 'Breece Hall', position: 'RB'team: 'NYJ'adp: 11projectedPoints: 230 },
  { name: 'Saquon Barkley', position: 'RB'team: 'PHI'adp: 13projectedPoints: 225 },
  { name: 'Jonathan Taylor', position: 'RB'team: 'IND'adp: 16projectedPoints: 220 },
  { name: 'Derrick Henry', position: 'RB'team: 'BAL'adp: 19projectedPoints: 215 },
  { name: 'Josh Jacobs', position: 'RB'team: 'GB'adp: 21projectedPoints: 210 },
  { name: 'Alvin Kamara', position: 'RB'team: 'NO'adp: 23projectedPoints: 205 },
  { name: 'Nick Chubb', position: 'RB'team: 'CLE'adp: 25projectedPoints: 200 },
  { name: 'Joe Mixon', position: 'RB'team: 'HOU'adp: 28projectedPoints: 195 },
  { name: 'Kenneth Walker III', position: 'RB'team: 'SEA'adp: 30projectedPoints: 190 },
  { name: 'Jahmyr Gibbs', position: 'RB'team: 'DET'adp: 32projectedPoints: 185 },
  { name: 'De\'Von Achane', position: 'RB'team: 'MIA'adp: 35projectedPoints: 180 },
  { name: 'Tony Pollard', position: 'RB'team: 'TEN'adp: 38projectedPoints: 175 },
  // WRs
  { name: 'Tyreek Hill', position: 'WR'team: 'MIA'adp: 2projectedPoints: 260 },
  { name: 'CeeDee Lamb', position: 'WR'team: 'DAL'adp: 3projectedPoints: 255 },
  { name: 'Justin Jefferson', position: 'WR'team: 'MIN'adp: 4projectedPoints: 250 },
  { name: 'Ja\'Marr Chase', position: 'WR'team: 'CIN'adp: 5projectedPoints: 245 },
  { name: 'A.J. Brown', position: 'WR'team: 'PHI'adp: 6projectedPoints: 240 },
  { name: 'Amon-Ra St. Brown', position: 'WR'team: 'DET'adp: 7projectedPoints: 235 },
  { name: 'Stefon Diggs', position: 'WR'team: 'HOU'adp: 9projectedPoints: 230 },
  { name: 'Davante Adams', position: 'WR'team: 'LV'adp: 14projectedPoints: 225 },
  { name: 'DK Metcalf', position: 'WR'team: 'SEA'adp: 17projectedPoints: 220 },
  { name: 'DeVonta Smith', position: 'WR'team: 'PHI'adp: 20projectedPoints: 215 },
  { name: 'Mike Evans', position: 'WR'team: 'TB'adp: 24projectedPoints: 210 },
  { name: 'Keenan Allen', position: 'WR'team: 'CHI'adp: 26projectedPoints: 205 },
  { name: 'Chris Olave', position: 'WR'team: 'NO'adp: 27projectedPoints: 200 },
  { name: 'Puka Nacua', position: 'WR'team: 'LAR'adp: 29projectedPoints: 195 },
  { name: 'Tee Higgins', position: 'WR'team: 'CIN'adp: 31projectedPoints: 190 },
  // TEs
  { name: 'Travis Kelce', position: 'TE'team: 'KC'adp: 33projectedPoints: 180 },
  { name: 'Mark Andrews', position: 'TE'team: 'BAL'adp: 34projectedPoints: 165 },
  { name: 'T.J. Hockenson', position: 'TE'team: 'MIN'adp: 36projectedPoints: 150 },
  { name: 'Kyle Pitts', position: 'TE'team: 'ATL'adp: 37projectedPoints: 145 },
  { name: 'George Kittle', position: 'TE'team: 'SF'adp: 39projectedPoints: 140 },
  { name: 'Evan Engram', position: 'TE'team: 'JAX'adp: 42projectedPoints: 135 },
  { name: 'Dallas Goedert', position: 'TE'team: 'PHI'adp: 44projectedPoints: 130 },
  { name: 'Sam LaPorta', position: 'TE'team: 'DET'adp: 46projectedPoints: 125 },
  { name: 'David Njoku', position: 'TE'team: 'CLE'adp: 50projectedPoints: 120 },
  { name: 'Jake Ferguson', position: 'TE'team: 'DAL'adp: 54projectedPoints: 115 },
  // Kickers
  { name: 'Justin Tucker', position: 'K'team: 'BAL'adp: 120projectedPoints: 140 },
  { name: 'Harrison Butker', position: 'K'team: 'KC'adp: 125projectedPoints: 135 },
  { name: 'Tyler Bass', position: 'K'team: 'BUF'adp: 130projectedPoints: 130 },
  { name: 'Brandon McManus', position: 'K'team: 'GB'adp: 135projectedPoints: 125 },
  { name: 'Jake Moody', position: 'K'team: 'SF'adp: 140projectedPoints: 120 },
  { name: 'Younghoe Koo', position: 'K'team: 'ATL'adp: 145projectedPoints: 115 },
  { name: 'Daniel Carlson', position: 'K'team: 'LV'adp: 150projectedPoints: 110 },
  { name: 'Wil Lutz', position: 'K'team: 'NO'adp: 155projectedPoints: 105 },
  { name: 'Dustin Hopkins', position: 'K'team: 'CLE'adp: 160projectedPoints: 100 },
  { name: 'Jake Elliott', position: 'K'team: 'PHI'adp: 165projectedPoints: 95 },
  // Defenses
  { name: 'San Francisco 49ers', position: 'DST'team: 'SF'adp: 110projectedPoints: 145 },
  { name: 'Baltimore Ravens', position: 'DST'team: 'BAL'adp: 115projectedPoints: 140 },
  { name: 'Buffalo Bills', position: 'DST'team: 'BUF'adp: 118projectedPoints: 135 },
  { name: 'Cleveland Browns', position: 'DST'team: 'CLE'adp: 122projectedPoints: 130 },
  { name: 'Pittsburgh Steelers', position: 'DST'team: 'PIT'adp: 127projectedPoints: 125 },
  { name: 'Dallas Cowboys', position: 'DST'team: 'DAL'adp: 132projectedPoints: 120 },
  { name: 'New York Jets', position: 'DST'team: 'NYJ'adp: 137projectedPoints: 115 },
  { name: 'Miami Dolphins', position: 'DST'team: 'MIA'adp: 142projectedPoints: 110 },
  { name: 'Philadelphia Eagles', position: 'DST'team: 'PHI'adp: 147projectedPoints: 105 },
  { name: 'New England Patriots', position: 'DST'team: 'NE'adp: 152projectedPoints: 100 }
]
const users = [
  { email: 'nicholas.damato@astralfield.com'username: 'Nicholas D\'Amato', teamName: 'D\'Amato Dynasty' },
  { email: 'brittany.bergum@astralfield.com'username: 'Brittany Bergum', teamName: 'Bergum Ballers' },
  { email: 'cason.minor@astralfield.com'username: 'Cason Minor', teamName: 'Minor Miracles' },
  { email: 'david.jarvey@astralfield.com'username: 'David Jarvey', teamName: 'Jarvey\'s Juggernauts' },
  { email: 'jack.mccaigue@astralfield.com'username: 'Jack McCaigue', teamName: 'McCaigue Mayhem' },
  { email: 'jon.kornbeck@astralfield.com'username: 'Jon Kornbeck', teamName: 'Kornbeck Crushers' },
  { email: 'kaity.lorbiecki@astralfield.com'username: 'Kaity Lorbiecki', teamName: 'Kaity\'s Kings' },
  { email: 'larry.mccaigue@astralfield.com'username: 'Larry McCaigue', teamName: 'Larry\'s Legends' },
  { email: 'nick.hartley@astralfield.com'username: 'Nick Hartley', teamName: 'Hartley Heroes' },
  { email: 'renee.mccaigue@astralfield.com'username: 'Renee McCaigue', teamName: 'Renee\'s Rockets' }
]
async function autoDraftLeague() {
  console.log('🏈 Auto-drafting PPR 10-Team League...\n')
  try {
    // First, we'll simulate the draft process by distributing players
    const draftOrder = [...Array(10)].map((_, i) => i)
    const rounds = 16
    const picks = []
    // Snake draft order
    for (const round = 1; round <= rounds; round++) {
      const roundOrder = round % 2 === 1 ? draftOrder : [...draftOrder].reverse()
      roundOrder.forEach((teamIndex, pickInRound) => {
        const overallPick = (round - 1) * 10 + pickInRound + 1
        if (overallPick <= playerPool.length) {
          picks.push({
            round,
            pick: pickInRound + 1,
            overallPick,
            teamIndex,
            player: playerPool[overallPick - 1]
          })
        }
      })
    }
    console.log('🎯 Draft Results:')
    console.log('=' * 80)
    users.forEach((user, teamIndex) => {
      const teamPicks = picks.filter(pick => pick.teamIndex === teamIndex).slice(0, 16)
      console.log(`\n${user.teamName} (${user.username}):`)
      console.log('-'.repeat(50))
      const positions = { QB: []RB: []WR: []TE: []K: []DST: [] }
      teamPicks.forEach(pick => {
        const { player, round, pick: pickNum } = pick
        console.log(`Round ${round}, Pick ${pickNum}: ${player.name} (${player.position}, ${player.team})`)
        positions[player.position]?.push(player)
      })
      console.log('\nStarting Lineup:')
      console.log(`QB: ${positions.QB[0]?.name || 'None'}`)
      console.log(`RB1: ${positions.RB[0]?.name || 'None'}`)
      console.log(`RB2: ${positions.RB[1]?.name || 'None'}`)
      console.log(`WR1: ${positions.WR[0]?.name || 'None'}`)
      console.log(`WR2: ${positions.WR[1]?.name || 'None'}`)
      console.log(`TE: ${positions.TE[0]?.name || 'None'}`)
      console.log(`FLEX: ${positions.RB[2]?.name || positions.WR[2]?.name || positions.TE[1]?.name || 'None'}`)
      console.log(`K: ${positions.K[0]?.name || 'None'}`)
      console.log(`DST: ${positions.DST[0]?.name || 'None'}`)
      const totalProjected = teamPicks.reduce((sum, pick) => sum + pick.player.projectedPoints, 0)
      console.log(`Projected Season Points: ${totalProjected}`)
    })
    console.log('\n🏆 League Summary:')
    console.log(`League: "The Astral Field Championship"`)
    console.log(`Format: PPR (Point Per Reception)`)
    console.log(`Teams: 10`)
    console.log(`Regular Season: 16 weeks`)
    console.log(`Playoffs: Week 17-19 (Top 4 teams)`)
    console.log(`Commissioner: Nicholas D'Amato`)
    console.log('\n📋 Draft Complete! All teams ready for the season.')
  } catch (error) {
    console.error('Error creating auto-draft: 'error)
  }
}
autoDraftLeague().catch(console.error)