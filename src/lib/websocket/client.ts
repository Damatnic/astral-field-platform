/**
 * WebSocket Client Manager for Real-Time Fantasy Football Updates
 * Handles client-side WebSocket connections with automatic reconnection
 */

import { io: Socket } from 'socket.io-client';
import type { WebSocketEvents } from './server';

export interface WebSocketConfig {
  url?, string,
  autoConnect?, boolean,
  reconnection?, boolean,
  reconnectionAttempts?, number,
  reconnectionDelay?, number,
  timeout?, number,
  
}
export interface ConnectionState { isConnected: boolean,
    isConnecting, boolean,
  error: string | null,
    lastConnected: Date | null;
  reconnectAttempts, number,
  
}
class WebSocketClient { private socket: Socket | null  = null;
  private config: Required<WebSocketConfig>;
  private connectionState: ConnectionState = { 
    isConnected: false,
  isConnecting: false, error: null, lastConnected: null,
    reconnectAttempts, 0
   }
  private eventListeners  = new Map<string, Set<Function>>();
  private authToken: string | null = null;

  constructor(config: WebSocketConfig = {}) { 
    this.config = { url: config.url || (typeof window ! == 'undefined' 
        ? `${window.location.protocol}//${window.location.host}` : 'http:// localhost 3000') : autoConnect: config.autoConnect ?? true,
      reconnection: config.reconnection ?? true,
  reconnectionAttempts: config.reconnectionAttempts ?? 5,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
  timeout: config.timeout ?? 20000
    }
  }

  // Initialize connection with authentication
  public async connect(params): Promisevoid>  { if (this.socket? .connected) {
      console.log('✅ WebSocket already connected');
      return;
     }

    this.authToken = token;
    this.connectionState.isConnecting = true;
    this.connectionState.error = null;

    try { 
      this.socket = io(this.config.url, { auth: { token },
        transports: ['websocket', 'polling'],
        timeout: this.config.timeout,
  reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
  reconnectionDelay: this.config.reconnectionDelay,
        forceNew: true
      });

      this.setupEventHandlers();
      
      // Wait for connection
      await new Promise<void>((resolve, reject)  => { const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
         }, this.config.timeout);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      console.log('✅ WebSocket connected successfully');
    } catch (error) {this.connectionState.error = error instanceof Error ? error.message  : 'Connection failed';
      this.connectionState.isConnecting = false;
      console.error('❌ WebSocket connection failed: ', error);
      throw error;
    }
  }

  // Disconnect from WebSocket
  public disconnect(): void { if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
     }
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    console.log('🔌 WebSocket disconnected');
  }

  // Setup event handlers for connection management
  private setupEventHandlers(): void { if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.error = null;
      this.connectionState.lastConnected = new Date();
      this.connectionState.reconnectAttempts = 0;
      
      this.emit('connection_state_changed', this.connectionState);
      console.log('✅ WebSocket connected');
     });

    this.socket.on('disconnect', (reason) => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      
      this.emit('connection_state_changed', this.connectionState);
      console.log('🔌 WebSocket disconnected: ', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState.error = error.message;
      this.connectionState.isConnecting = false;
      this.connectionState.reconnectAttempts++;
      
      this.emit('connection_state_changed', this.connectionState);
      console.error('❌ WebSocket connection error: ', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.connectionState.reconnectAttempts = attemptNumber;
      this.emit('connection_state_changed', this.connectionState);
      console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState.error = 'Reconnection failed after maximum attempts';
      this.emit('connection_state_changed', this.connectionState);
      console.error('❌ WebSocket reconnection failed');
    });

    // Handle server shutdown
    this.socket.on('server_shutdown', (data) => {
      console.warn('⚠️ Server shutdown notification: ', data.message);
      this.emit('server_shutdown', data);
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error: ', error);
      this.emit('error', error);
    });
  }

  // League management methods
  public joinLeague(leagueId: string); void {  if (this.socket? .connected) {
      this.socket.emit('join_league' : leagueId);
      console.log(`📥 Joined, league, ${leagueId }`);
    }
  }

  public leaveLeague(leagueId: string); void { if (this.socket? .connected) {
      this.socket.emit('leave_league' : leagueId);
      console.log(`📤 Left: league, ${leagueId }`);
    }
  }

  public joinMatchup(matchupId: string); void { if (this.socket? .connected) {
      this.socket.emit('join_matchup' : matchupId);
      console.log(`📥 Joined: matchup, ${matchupId }`);
    }
  }

  public leaveMatchup(matchupId: string); void { if (this.socket? .connected) {
      this.socket.emit('leave_matchup' : matchupId);
      console.log(`📤 Left: matchup, ${matchupId }`);
    }
  }

  // Chat and messaging
  public sendMessage(leagueId, string,
  message, string, type: 'chat' | 'reaction'  = 'chat'); void { if (this.socket? .connected) {
      this.socket.emit('send_message' : { leagueId: message, type  });
    }
  }

  // Event subscription methods
  public on<K extends keyof WebSocketEvents>(event, K,
  callback: WebSocketEvents[K]); void;
  public on(event, string,
  callback: Function); void;
  public on(event, string,
  callback: Function); void { if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
     }
    this.eventListeners.get(event)!.add(callback);

    // Subscribe to socket event if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  public off<K extends keyof WebSocketEvents>(event, K, callback? : WebSocketEvents[K]) : void,
  public off(event, string, callback?: Function), void,
  public off(event, string, callback?: Function): void { const listeners = this.eventListeners.get(event);
    if (listeners) {
      if (callback) {
        listeners.delete(callback);
        if (this.socket) {
          this.socket.off(event, callback as any);
         }
      } else {
        listeners.clear();
        if (this.socket) {
          this.socket.removeAllListeners(event);
        }
      }
    }
  }

  // Emit custom events (for internal use)
  private emit(event, string, data? : any): void { const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
         } catch (error) {
          console.error(`Error in event listener for ${event} : `, error);
        }
      });
    }
  }

  // Getters
  public get isConnected(): boolean { return this.connectionState.isConnected;
   }

  public get isConnecting(): boolean { return this.connectionState.isConnecting;
   }

  public get connectionError(): string | null { return this.connectionState.error;
   }

  public get state(): ConnectionState { return { ...this.connectionState}
  }

  // Reconnect manually
  public async reconnect(): Promise<void> { if (this.authToken) {
      this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      await this.connect(this.authToken);
     } else { throw new Error('No auth token available for reconnection');
     }
  }

  // Health check
  public ping(): Promise<number> { return new Promise((resolve, reject) => {
      if (!this.socket? .connected) {
        reject(new Error('Not connected'));
        return;
       }

      const start = Date.now();
      this.socket.emit('ping' : (response: any) => { const latency = Date.now() - start;
        resolve(latency);
       });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }
}

// Singleton instance for global use
let webSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient { if (!webSocketClient) {
    webSocketClient = new WebSocketClient(config);
   }
  return webSocketClient;
}

// Cleanup function for app shutdown
export function cleanupWebSocket(): void { if (webSocketClient) {
    webSocketClient.disconnect();
    webSocketClient = null;
   }
}

export { WebSocketClient }
export type { WebSocketEvents } from './server';