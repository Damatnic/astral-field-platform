export interface Player {
  id: string;
  name: string;
  position: string;
  team?: string;
}

class PlayerService {
  async getPlayer(
    _playerId: string,
  ): Promise<{ player: Player | null; error: string | null }> {
    return { player: null, error: null };
  }
  async getPlayers(_options?: {
    position?: string;
    team?: string;
    limit?: number;
    search?: string;
  }): Promise<{ players: Player[]; error: string | null }> {
    return { players: [], error: null };
  }
}

const playerService = new PlayerService();
export default playerService;
