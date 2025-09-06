// WebSocket Manager Service
// Handles real-time communication and websocket connections

import { WebSocket } from 'ws';

export interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: string;
  leagueId?: string;
  timestamp: Date;
}

export interface ConnectedClient {
  id: string;
  userId?: string;
  leagueId?: string;
  socket: WebSocket | any;
  lastActivity: Date;
}

export class WebSocketManager {
  private clients: Map<string, ConnectedClient> = new Map();
  private userConnections: Map<string, string[]> = new Map();
  private leagueConnections: Map<string, string[]> = new Map();

  constructor() {
    // Initialize WebSocket manager
    this.setupCleanupInterval();
  }

  public addClient(clientId: string, socket: WebSocket | any, userId?: string, leagueId?: string): void {
    const client: ConnectedClient = {
      id: clientId,
      userId,
      leagueId,
      socket,
      lastActivity: new Date()
    };

    this.clients.set(clientId, client);

    // Track user connections
    if (userId) {
      const userClients = this.userConnections.get(userId) || [];
      userClients.push(clientId);
      this.userConnections.set(userId, userClients);
    }

    // Track league connections
    if (leagueId) {
      const leagueClients = this.leagueConnections.get(leagueId) || [];
      leagueClients.push(clientId);
      this.leagueConnections.set(leagueId, leagueClients);
    }
  }

  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from user connections
    if (client.userId) {
      const userClients = this.userConnections.get(client.userId) || [];
      const filteredClients = userClients.filter(id => id !== clientId);
      if (filteredClients.length === 0) {
        this.userConnections.delete(client.userId);
      } else {
        this.userConnections.set(client.userId, filteredClients);
      }
    }

    // Remove from league connections
    if (client.leagueId) {
      const leagueClients = this.leagueConnections.get(client.leagueId) || [];
      const filteredClients = leagueClients.filter(id => id !== clientId);
      if (filteredClients.length === 0) {
        this.leagueConnections.delete(client.leagueId);
      } else {
        this.leagueConnections.set(client.leagueId, filteredClients);
      }
    }

    this.clients.delete(clientId);
  }

  public async sendToUser(userId: string, message: any): Promise<boolean> {
    const clientIds = this.userConnections.get(userId);
    if (!clientIds || clientIds.length === 0) {
      return false;
    }

    let sentCount = 0;
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && this.isSocketOpen(client.socket)) {
        try {
          await this.sendMessage(client.socket, {
            ...message,
            userId,
            timestamp: new Date()
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send message to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }

    return sentCount > 0;
  }

  public async sendToLeague(leagueId: string, message: any, excludeUserId?: string): Promise<number> {
    const clientIds = this.leagueConnections.get(leagueId);
    if (!clientIds || clientIds.length === 0) {
      return 0;
    }

    let sentCount = 0;
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.userId !== excludeUserId && this.isSocketOpen(client.socket)) {
        try {
          await this.sendMessage(client.socket, {
            ...message,
            leagueId,
            timestamp: new Date()
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send message to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }

    return sentCount;
  }

  public async broadcast(message: any): Promise<number> {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients) {
      if (this.isSocketOpen(client.socket)) {
        try {
          await this.sendMessage(client.socket, {
            ...message,
            timestamp: new Date()
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to broadcast to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }

    return sentCount;
  }

  public getConnectionStats(): {
    totalConnections: number;
    userConnections: number;
    leagueConnections: number;
    activeConnections: number;
  } {
    const activeConnections = Array.from(this.clients.values())
      .filter(client => this.isSocketOpen(client.socket)).length;

    return {
      totalConnections: this.clients.size,
      userConnections: this.userConnections.size,
      leagueConnections: this.leagueConnections.size,
      activeConnections
    };
  }

  public getUserConnectionCount(userId: string): number {
    const clientIds = this.userConnections.get(userId);
    if (!clientIds) return 0;
    
    return clientIds.filter(clientId => {
      const client = this.clients.get(clientId);
      return client && this.isSocketOpen(client.socket);
    }).length;
  }

  public getLeagueConnectionCount(leagueId: string): number {
    const clientIds = this.leagueConnections.get(leagueId);
    if (!clientIds) return 0;
    
    return clientIds.filter(clientId => {
      const client = this.clients.get(clientId);
      return client && this.isSocketOpen(client.socket);
    }).length;
  }

  private async sendMessage(socket: WebSocket | any, message: any): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    if (socket.readyState === 1) { // WebSocket.OPEN
      socket.send(messageStr);
    } else {
      throw new Error('Socket not open');
    }
  }

  private isSocketOpen(socket: WebSocket | any): boolean {
    return socket && socket.readyState === 1; // WebSocket.OPEN
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // Clean up every 30 seconds
  }

  private cleanupStaleConnections(): void {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, client] of this.clients) {
      const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
      
      if (!this.isSocketOpen(client.socket) || timeSinceActivity > staleThreshold) {
        this.removeClient(clientId);
      }
    }
  }

  public updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
    }
  }
}

export default WebSocketManager;