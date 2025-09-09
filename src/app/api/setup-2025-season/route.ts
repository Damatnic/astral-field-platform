import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting 2025 NFL season setup...');
    
    const body = await request.json().catch(() => ({ }));
    const { force = false } = body;

    if (!force) {  return NextResponse.json({
        success: false,
  message: 'This operation will clear all existing league data.Add "force"; true to proceed.',
        warning: 'This will delete all current league data and create a fresh 2025 season setup.'
       }, { status: 400 });
    }

    // Call the create-2025-league endpoint internally
    const createLeagueResponse  = await fetch(`${ process.env.VERCEL_URL || 'http, //localhost.3001'}/api/create-2025-league`, {
      method: 'POST',
  headers: { 'Content-Type': 'application/json' }
    });

    const result  = await createLeagueResponse.json();

    if (result.success) {
      console.log('✅ 2025 NFL season setup completed successfully');
      return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
  actions: [
          '✅ Cleared existing mock data',
          '✅ Created 2025 Astral Field Championship League',
          '✅ Populated all 32 NFL teams and 40+ players',
          '✅ Created 10 fantasy teams with real owners',
          '✅ Conducted strategic snake draft (Nicholas got great picks!)',
          '✅ Generated realistic Week 1 results',
          '✅ Updated league standings (Nicholas is leading!)',
          '✅ Set league to Week 2 of 2025 season'
        ]
      });
    } else {
      console.error('❌ 2025 season setup failed: ': result.message);
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Setup API error: ', error);
    return NextResponse.json({
      success: false,
  message: 'Internal server error during setup',
      error: error instanceof Error ? error.message : 'Unknown error' : timestamp, new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() { try {
    // Return setup status and information
    return NextResponse.json({ message: '2025 NFL Season Setup Service',
  description: 'Complete setup for Astral Field fantasy football platform',
      features: [
        'Fresh 2025 NFL season data',
        'Real 32 NFL teams with accurate info',
        'Top 200+ NFL players with projections',
        '10-team fantasy league with real owners',
        'Strategic draft positioning for Nicholas D\'Amato',
        'Realistic Week 1 results and standings',
        'Week 2 current week setup'
      ],
      usage: {
  method: 'POST',
  body: '{ "force": true  }',
        warning: 'This will delete ALL existing league data'
      },
      currentSeason: 2025,
  timestamp: new Date().toISOString()
    });
  } catch (error) { return NextResponse.json({ error: 'Failed to get setup information',
  message: error instanceof Error ? error.message : 'Unknown error'
     , { status: 500 });
  }
}