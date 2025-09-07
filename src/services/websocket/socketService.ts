export type SocketEventType =
  | "trade_proposal"
  | "trade_accepted"
  | "trade_rejected"
  | "waiver_processed"
  | "lineup_updated"
  | "player_scores"
  | "league_activity"
  | "draft_pick"
  | "draft_state_change"
  | "game_start"
  | "game_end";

export interface SocketEvent {
  type: SocketEventType;
  leagueId: string;
  teamId?: string;
  data: unknown;
  timestamp: string;
  userId?: string;
}

class SocketService {
  async connect(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {
    // no-op
  }
  async subscribeToLeague(_leagueId: string): Promise<void> {
    // no-op stub
  }
  async subscribeToLiveScoring(): Promise<void> {
    // no-op stub
  }
  async subscribeToTeam(_teamId: string): Promise<void> {
    // no-op stub
  }
  on(
    _eventType: SocketEventType,
    _handler: (event: SocketEvent) => void,
  ): void {
    // no-op stub
  }
  off(
    _eventType: SocketEventType,
    _handler: (event: SocketEvent) => void,
  ): void {
    // no-op stub
  }
  async broadcast(_event: Omit<SocketEvent, "timestamp">): Promise<void> {
    // no-op stub
  }
}

const socketService = new SocketService();
export default socketService;
