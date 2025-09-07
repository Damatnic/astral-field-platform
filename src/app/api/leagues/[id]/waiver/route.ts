import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mock waiver players and data
const waiverPlayers = [
  { id: 'w1', name: 'Rico Dowdle', position: 'RB', team: 'DAL', percentOwned: 45, percentStarted: 32, projection: 11.5, last3Games: [14.2, 8.6, 19.3], waiverPriority: 1, currentBid: 15 },
  { id: 'w2', name: 'Rome Odunze', position: 'WR', team: 'CHI', percentOwned: 34, percentStarted: 28, projection: 9.1, last3Games: [8.4, 11.7, 6.2], waiverPriority: 2, currentBid: 12 },
  { id: 'w3', name: 'Cade Otton', position: 'TE', team: 'TB', percentOwned: 56, percentStarted: 43, projection: 9.9, last3Games: [9.8, 12.4, 7.6], waiverPriority: 3, currentBid: 8 },
  { id: 'w4', name: 'Ladd McConkey', position: 'WR', team: 'LAC', percentOwned: 68, percentStarted: 52, projection: 12.9, last3Games: [12.7, 16.4, 9.8], waiverPriority: 4, currentBid: 22 },
  { id: 'w5', name: 'Ka\'imi Fairbairn', position: 'K', team: 'HOU', percentOwned: 43, percentStarted: 38, projection: 8.8, last3Games: [14.0, 7.0, 10.0], waiverPriority: 5, currentBid: 3 }
];

const mockWaiverClaims = [
  {
    id: 'claim1',
    playerName: 'Rico Dowdle',
    position: 'RB',
    team: 'DAL',
    bidAmount: 15,
    dropPlayerName: 'Jerome Ford',
    priority: 1,
    status: 'pending',
    processDate: '2025-01-15T08:00:00Z',
    submittedAt: '2025-01-13T14:30:00Z'
  },
  {
    id: 'claim2',
    playerName: 'Ladd McConkey',
    position: 'WR',
    team: 'LAC',
    bidAmount: 22,
    dropPlayerName: 'Darnell Mooney',
    priority: 2,
    status: 'pending',
    processDate: '2025-01-15T08:00:00Z',
    submittedAt: '2025-01-13T16:45:00Z'
  }
];

const mockWaiverOrder = [
  { teamName: 'Thunder Hawks', ownerName: 'Mike Johnson', priority: 1, faabRemaining: 85 },
  { teamName: 'Lightning Bolts', ownerName: 'Sarah Wilson', priority: 2, faabRemaining: 78 },
  { teamName: 'Fire Eagles', ownerName: 'David Brown', priority: 3, faabRemaining: 92 },
  { teamName: 'Storm Wolves', ownerName: 'Lisa Garcia', priority: 4, faabRemaining: 66 },
  { teamName: 'Ice Bears', ownerName: 'Chris Miller', priority: 5, faabRemaining: 71 },
  { teamName: 'Wind Runners', ownerName: 'Amanda Davis', priority: 6, faabRemaining: 89 }
];

const mockRecentTransactions = [
  {
    id: 'tx1',
    type: 'waiver',
    playerAdded: 'Rachaad White',
    playerDropped: 'Zack Moss',
    teamName: 'Fire Eagles',
    ownerName: 'David Brown',
    bidAmount: 18,
    processedAt: '2025-01-08T08:00:00Z'
  },
  {
    id: 'tx2',
    type: 'waiver',
    playerAdded: 'Cooper Kupp',
    playerDropped: 'Tyler Lockett',
    teamName: 'Storm Wolves',
    ownerName: 'Lisa Garcia',
    bidAmount: 35,
    processedAt: '2025-01-08T08:00:00Z'
  },
  {
    id: 'tx3',
    type: 'free_agent',
    playerAdded: 'Minnesota DST',
    playerDropped: 'Carolina DST',
    teamName: 'Ice Bears',
    ownerName: 'Chris Miller',
    bidAmount: 0,
    processedAt: '2025-01-07T12:30:00Z'
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify league exists
    const leagueResult = await db.query(
      'SELECT id FROM leagues WHERE id = $1 AND is_active = true',
      [id]
    );

    if (leagueResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Mock user's FAAB budget and current claims
    const userBudget = {
      total: 100,
      remaining: 78,
      spent: 22
    };

    return NextResponse.json({
      waiverPlayers,
      userClaims: mockWaiverClaims,
      waiverOrder: mockWaiverOrder,
      recentTransactions: mockRecentTransactions,
      budget: userBudget,
      waiverSettings: {
        waiverType: 'FAAB',
        processTime: '08:00 AM ET',
        processDays: ['Wednesday', 'Saturday'],
        nextProcessDate: '2025-01-15T08:00:00Z',
        claimDeadline: '2025-01-15T07:00:00Z'
      }
    });

  } catch (error) {
    console.error('Error fetching waiver data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, playerId, dropPlayerId, bidAmount, priority } = body;

    // Verify league exists
    const leagueResult = await db.query(
      'SELECT id FROM leagues WHERE id = $1 AND is_active = true',
      [id]
    );

    if (leagueResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    let message = '';
    
    switch (action) {
      case 'submit_claim':
        if (!bidAmount || bidAmount <= 0) {
          throw new Error('Bid amount must be greater than 0');
        }
        message = `Waiver claim submitted for $${bidAmount}`;
        break;
      case 'cancel_claim':
        message = `Waiver claim cancelled`;
        break;
      case 'update_claim':
        message = `Waiver claim updated`;
        break;
      default:
        throw new Error('Invalid action');
    }

    return NextResponse.json({
      success: true,
      message,
      claimId: `claim_${Date.now()}` // Mock claim ID
    });

  } catch (error) {
    console.error('Error processing waiver action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}