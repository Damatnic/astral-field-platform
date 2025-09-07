export interface TeamInfo { abbreviation: string; name: string }
export interface PlayerInfo { id: string; name: string; position: string; team: string }

class SportsDataService {
  async getTeams(): Promise<TeamInfo[]> {
    return [];
  }
  async getPlayersByTeam(_abbr: string): Promise<PlayerInfo[]> {
    return [];
  }
  async getCurrentWeek(): Promise<number> {
    return 1;
  }
}

const sportsDataService = new SportsDataService();
export default sportsDataService;

