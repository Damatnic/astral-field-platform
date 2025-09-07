export interface LeagueSettings {
  leagueId: string;
  name: string;
  commissionerId: string;
  seasonYear: number;
  teamCount: number;
  maxRosterSize: number;
}

export interface LeagueActivity {
  id: string;
  type: 'waiver' | 'lineup' | 'message' | 'draft' | 'admin';
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class CommissionerService {
  async getLeagueSettings(leagueId: string): Promise<LeagueSettings> {
    return {
      leagueId,
      name: 'Demo League',
      commissionerId: 'demo',
      seasonYear: 2024,
      teamCount: 12,
      maxRosterSize: 16,
    };
  }
  async listRecentActivity(_leagueId: string): Promise<LeagueActivity[]> {
    return [];
  }
}

const commissionerService = new CommissionerService();
export default commissionerService;

