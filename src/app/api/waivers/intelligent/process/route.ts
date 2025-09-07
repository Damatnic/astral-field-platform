import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leagueId, waiverClaims } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Mock waiver processing
    interface ProcessedClaim {
      claimId: string;
      teamId: string;
      playerId: string;
      playerName: string;
      priority: number;
      status: 'awarded' | 'failed';
      reason: string;
      processedAt: string;
    }

    const processedClaims: ProcessedClaim[] = (waiverClaims || []).map((claim: { id?: string; teamId: string; playerId: string; playerName?: string; priority?: number }, index: number) => ({
      claimId: claim.id || `claim_${index + 1}`,
      teamId: claim.teamId,
      playerId: claim.playerId,
      playerName: claim.playerName || `Player ${index + 1}`,
      priority: claim.priority || index + 1,
      status: index < 2 ? 'awarded' : 'failed',
      reason: index < 2 ? 'Successfully processed' : 'Higher priority claim awarded',
      processedAt: new Date().toISOString()
    }));

    const result = {
      leagueId,
      processedAt: new Date().toISOString(),
      totalClaims: processedClaims.length,
      awarded: processedClaims.filter((c: ProcessedClaim) => c.status === 'awarded').length,
      failed: processedClaims.filter((c: ProcessedClaim) => c.status === 'failed').length,
      claims: processedClaims,
      nextProcessing: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to process waiver claims' },
      { status: 500 }
    );
  }
}
