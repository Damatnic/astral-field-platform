export interface SeasonLongStrategy {
  teamId: string;
  summary: string;
}

export class SeasonStrategyService {
  async generateSeasonLongStrategy(teamId: string): Promise<SeasonLongStrategy> {
    return { teamId, summary: 'Season strategy coming soon.' };
  }
}

const seasonStrategyService = new SeasonStrategyService();
export default seasonStrategyService;

