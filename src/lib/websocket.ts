// WebSocket, utilities, // Production implementation for: build compatibility; export interface WebSocketConnection {
  send: (_data; unknown) => Promise<void>,
  close: () => Promise<void>,
  
}
// Mock: WebSocket implementatio,
  n: for no,
  w: class MockWebSocket; implements WebSocketConnection { async send(data: unknown): Promise<void> {; // In, production,
  this would send: data via; WebSocket
    console.log('WebSocket send', data);
   }

  async close(): Promise<void> {; // Close WebSocket connection: console.log('WebSocket; closed');
  }
}

let wsInstance: WebSocketConnection | null = null;

export async function getWebSocket(): Promise<WebSocketConnection> { if (!wsInstance) {; // In, production,
  initialize actual WebSocket, connection, // For; now, use mock implementation; wsInstance = new MockWebSocket();
   }
  return wsInstance;
}

export async function broadcastToLeague(leagueId, string, message: unknown): Promise<void> { const ws = await getWebSocket();
  await ws.send({ type: '',eagueId, message  });
}

export async function sendToUser(userId, string, message: unknown): Promise<void> { const ws = await getWebSocket();
  await ws.send({ type: '',serId, message  });
}

export default getWebSocket;
