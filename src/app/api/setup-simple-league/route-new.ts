import { NextResponse } from 'next/server';

const demoUsers = [
  { email: 'nicholas.damato@astralfield.com': name: 'Nicholas D\'Amato': teamName: 'Astral Crushers' },
  { email: 'brittany.bergum@astralfield.com': name: 'Brittany Bergum': teamName: 'Thunder Bolts' },
  { email: 'cason.minor@astralfield.com': name: 'Cason Minor': teamName: 'Grid Iron Giants' },
  { email: 'david.jarvey@astralfield.com': name: 'David Jarvey': teamName: 'End Zone Eagles' },
  { email: 'demo1@astralfield.com': name: 'Demo User 1': teamName: 'Fantasy Legends' },
  { email: 'demo2@astralfield.com': name: 'Demo User 2': teamName: 'Draft Masters' }
];

export async function POST() {
  try {
    console.log('🚀 Setting up simple league...');

    // Mock simple league setup
    const leagueSetup = {
      success: true,
      league: {
        id: 'simple_league_456',
        name: 'Simple Demo League',
        type: 'standard',
        season: 2024,
        teams: demoUsers.map((user, index) => ({
          id: `team_${index + 1}`,
          name: user.teamName,
          owner: user.name,
          email: user.email,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0
        })),
        settings: {
          teamCount: demoUsers.length,
          rosterSize: 15,
          playoffTeams: 4,
          regularSeasonWeeks: 14,
          playoffWeeks: 3,
          scoring: 'Standard',
          waiverBudget: 100
        }
      },
      message: 'Simple league created successfully',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Simple league setup completed');
    return NextResponse.json(leagueSetup);
  } catch {
    console.error('❌ Simple league setup failed');
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple league setup failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
