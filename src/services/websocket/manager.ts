export interface WebSocketMessage {
  type: string;
  data?: unknown;
  userId?: string;
  leagueId?: string;
  timestamp: Date;
}

export interface ConnectedClient {
  id: string;
  userId?: string;
  leagueId?: string;
  socket: any;
  lastActivity: Date;
}

export class WebSocketManager {
  private clients = new Map<string, ConnectedClient>();
  private userConnections = new Map<string, string[]>();
  private leagueConnections = new Map<string, string[]>();

  addClient(clientId: string, socket: any, userId?: string, leagueId?: string): void {
    const client: ConnectedClient = { id: clientId, userId, leagueId, socket, lastActivity: new Date() };
    this.clients.set(clientId, client);
    if (userId) this.userConnections.set(userId, [...(this.userConnections.get(userId) || []), clientId]);
    if (leagueId) this.leagueConnections.set(leagueId, [...(this.leagueConnections.get(leagueId) || []), clientId]);
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    if (client.userId) this.userConnections.set(client.userId, (this.userConnections.get(client.userId) || []).filter(id => id !== clientId));
    if (client.leagueId) this.leagueConnections.set(client.leagueId, (this.leagueConnections.get(client.leagueId) || []).filter(id => id !== clientId));
    this.clients.delete(clientId);
  }

  async sendToUser(userId: string, message: WebSocketMessage): Promise<boolean> {
    const ids = this.userConnections.get(userId) || [];
    let count = 0;
    for (const id of ids) {
      const client = this.clients.get(id);
      if (client) {
        try {
          client.socket?.send?.(JSON.stringify(message));
          count++;
        } catch (_) {
          this.removeClient(id);
        }
      }
    }
    return count > 0;
  }

  async sendToLeague(leagueId: string, message: WebSocketMessage, excludeUserId?: string): Promise<number> {
    const ids = this.leagueConnections.get(leagueId) || [];
    let count = 0;
    for (const id of ids) {
      const client = this.clients.get(id);
      if (client && client.userId !== excludeUserId) {
        try {
          client.socket?.send?.(JSON.stringify(message));
          count++;
        } catch (_) {
          this.removeClient(id);
        }
      }
    }
    return count;
  }

  getConnectionStats() {
    return {
      totalConnections: this.clients.size,
      userConnections: this.userConnections.size,
      leagueConnections: this.leagueConnections.size,
      activeConnections: this.clients.size,
    };
  }
}

export default new WebSocketManager();

