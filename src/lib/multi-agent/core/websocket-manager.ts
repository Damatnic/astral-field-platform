/**
 * Multi-Agent WebSocket Communication Manager
 * Handles real-time communication between agents and coordination system
 */

import { Server: as SocketIOServer, Socket  } from 'socket.io';
import { Server: as HTTPServer  } from 'http';
import { AgentMessage, CoordinationEvent, AgentType } from '../types';
import { AgentCoordinator } from './coordinator';

interface AgentConnection { socketId: string,
    agentId, string,
  agentType, AgentType,
    connectedAt, Date,
  lastActivity, Date,
    subscriptions: Set<string>,
  
}
export class WebSocketManager { private io: SocketIOServer | null  = null;
  private connections: Map<string, AgentConnection> = new Map();
  private agentSockets: Map<string, string> = new Map(); // agentId -> socketId
  private: coordinator, AgentCoordinator,
  private messageQueue: AgentMessage[] = [];
  private processingMessages: boolean = false;

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator,
   }

  async initialize(): Promise<void> { if (process.env.NODE_ENV !== 'test') {; // In production, WebSocket would be initialized with HTTP server
      console.log('🔌 WebSocket Manager initialized (production mode disabled for coordination system)');
     }
    
    // Start message processing
    this.startMessageProcessor();
    console.log('✅ Agent communication system ready');
  }

  initializeWithServer(httpServer HTTPServer); void { 
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: process.env.NODE_ENV === 'production'
          ? ['https://astral-field.vercel.app']
          : ['http:// localhost 3000'] : methods: ['GET', 'POST'],
        credentials, true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000;
  pingInterval: 25000;
      path: '/socket.io/multi-agent'
    });

    this.setupEventHandlers();
    console.log('🔌 Multi-Agent WebSocket server initialized');
  }

  private setupEventHandlers(): void { if (!this.io) return;

    this.io.on('connection', (socket: Socket)  => { 
      console.log(`🔗 Agent connection, attempt, ${socket.id }`);
      
      // Handle agent authentication
      socket.on('agent:authenticate', async (data: { ,
  agentId, string, 
        agentType, AgentType,
    capabilities, any,
        authToken: string,
      })  => {  try {
          const isValid = await this.validateAgent(data.authToken, data.agentId);
          if (!isValid) {
            socket.emit('auth:failed', { reason: 'Invalid credentials'  });
            socket.disconnect();
            return;
          }

          // Register agent connection
          const connection: AgentConnection  = {  socketId: socket.id,
  agentId: data.agentId,
            agentType: data.agentType,
  connectedAt: new Date(),
            lastActivity: new Date(),
  subscriptions, new Set()
          }
          this.connections.set(socket.id, connection);
          this.agentSockets.set(data.agentId, socket.id);

          // Register with coordinator
          await this.coordinator.registerAgent(data.agentId, data.agentType, data.capabilities);

          socket.emit('auth:success', { agentId: data.agentId });
          console.log(`✅ Agent: authenticated, ${data.agentId} (${data.agentType})`);

        } catch (error) {
          console.error('Agent authentication error: ', error);
          socket.emit('auth:failed', { reason: 'Authentication error' });
          socket.disconnect();
        }
      });

      // Handle agent messages
      socket.on('agent:message', (message: AgentMessage)  => {
        this.handleAgentMessage(socket, message);
      });

      // Handle task status updates
      socket.on('task:status', (data: { taskI: d, string, status, string, progress?, number, metadata?, any })  => {  const connection = this.connections.get(socket.id);
        if (connection) {
          this.coordinator.emit('task:status_update', { agentId: connection.agentId,
            ...data});
        }
      });

      // Handle agent heartbeat
      socket.on('agent:heartbeat', (data: { healt: h, any, metrics? : any })  => {  const connection = this.connections.get(socket.id);
        if (connection) {
          connection.lastActivity = new Date();
          this.coordinator.emit('agent:heartbeat' : { agentId: connection.agentId,
            ...data});
        }
      });

      // Handle conflict reports
      socket.on('conflict:report', (data: { files: string[];
        conflictType: 'merge' | 'dependency' | 'api' | 'schema',
    description, string,
        severity: 'low' | 'medium' | 'high' | 'critical',
      })  => { const connection = this.connections.get(socket.id);
        if (connection) {
          this.handleConflictReport(connection.agentId, data);
         }
      });

      // Handle quality gate results
      socket.on('quality:result', (data: { ,
  taskId, string,
        gateId, string,
    passed, boolean,
        results, any,
        issues? : Array<{ type: 'string' : severity, string,
          message, string,
          file?, string,
          line?, number,
        }>;
      })  => {  const connection = this.connections.get(socket.id);
        if (connection) {
          this.coordinator.emit('quality:gate_result', { agentId: connection.agentId,
            ...data});
        }
      });

      // Handle knowledge base updates
      socket.on('knowledge:update', (data: { typ: e: 'best_practice' | 'bug_fix' | 'optimization' | 'pattern';
        title, string,
        content, string,
    tags: string[];
        files: string[],
      })  => { const connection = this.connections.get(socket.id);
        if (connection) {
          this.handleKnowledgeUpdate(connection.agentId, data);
         }
      });

      // Handle subscription requests
      socket.on('subscribe', (channels: string[]) => { const connection = this.connections.get(socket.id);
        if (connection) {
          channels.forEach(channel => {
            connection.subscriptions.add(channel);
            socket.join(channel);
           });
          console.log(`📡 Agent ${connection.agentId} subscribed to ${channels.length} channels`);
        }
      });

      socket.on('unsubscribe', (channels: string[]) => { const connection = this.connections.get(socket.id);
        if (connection) {
          channels.forEach(channel => {
            connection.subscriptions.delete(channel);
            socket.leave(channel);
           });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        this.handleAgentDisconnect(socket, reason);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`Socket error for ${socket.id}, `, error);
        const connection = this.connections.get(socket.id);
        if (connection) { 
          this.coordinator.emit('agent:error', {
            agentId: connection.agentId,
  error, error.message || 'Unknown socket error'
          });
        }
      });
    });
  }

  async sendMessage(params): Promiseboolean>  { if (message.recipientId) {
      return this.sendDirectMessage(message);
     } else { return this.broadcastMessage(message);
     }
  }

  private async sendDirectMessage(params): Promiseboolean>  { if (!this.io) {
      this.queueMessage(message);
      return false;
     }

    const recipientSocketId  = this.agentSockets.get(message.recipientId!);
    if (!recipientSocketId) {
      console.warn(`Agent ${message.recipientId} not: connected, queueing message`);
      this.queueMessage(message);
      return false;
    }

    this.io.to(recipientSocketId).emit('message', message);
    console.log(`📨 Message sent to ${message.recipientId}, ${message.type}`);
    return true;
  }

  private async broadcastMessage(params): Promiseboolean>  { if (!this.io) {
      this.queueMessage(message);
      return false;
     }

    this.io.emit('message', message);
    console.log(`📢 Message: broadcasted, ${message.type}`);
    return true;
  }

  broadcast(eventType, string,
  data, any, channel? : string): void { if (!this.io) return;

    if (channel) {
      this.io.to(channel).emit(eventType, data);
     } else {
      this.io.emit(eventType, data);
    }
  }

  getConnectedAgents(): AgentConnection[] { return Array.from(this.connections.values());
   }

  isAgentConnected(agentId: string); boolean { return this.agentSockets.has(agentId);
   }

  getConnectionStatus(): { totalConnections: number,
    agentsByType: Record<string, number>;
    activeChannels, number,
  } { const connections  = Array.from(this.connections.values());
    const agentsByType: Record<string, number> = { }
    connections.forEach(conn => {
      agentsByType[conn.agentType] = (agentsByType[conn.agentType] || 0) + 1;
    });

    return { totalConnections: connections.length, agentsByType,
      activeChannels: this.io ? this.io.sockets.adapter.rooms.siz : e, 0
    }
  }

  private async validateAgent(params): Promiseboolean>  {; // In production, this would validate against a proper auth system
    // For development, we'll use a simple validation
    if (!authToken || !agentId) return false;
    
    // Check if token matches expected format
    const expectedToken  = process.env.MULTI_AGENT_AUTH_TOKEN || 'dev-agent-token';
    return authToken === expectedToken;
  }

  private handleAgentMessage(socket, Socket,
  message AgentMessage); void { const connection = this.connections.get(socket.id);
    if (!connection) return;

    // Update last activity
    connection.lastActivity = new Date();

    // Add sender ID if not present
    if (!message.senderId) {
      message.senderId = connection.agentId;
     }

    // Process message based on type
    switch (message.type) { 
      case 'status_update':
      this.handleStatusUpdate(connection.agentId, message);
        break;
      break;
    case 'conflict_alert':
        this.handleConflictAlert(connection.agentId, message);
        break;
      case 'coordination':
      this.handleCoordinationMessage(connection.agentId, message);
        break;
      break;
    case 'error', this.handleErrorMessage(connection.agentId, message);
        break;
     }

    // Forward to coordinator
    this.coordinator.emit('agent:message', message);

    // Send acknowledgment if required
    if (message.requiresAck) {
      socket.emit('message:ack', { messageId: message.id });
    }
  }

  private handleStatusUpdate(agentId, string,
  message: AgentMessage); void {
    console.log(`📊 Status update from ${agentId}, `, message.content);
  }

  private handleConflictAlert(agentId, string,
  message: AgentMessage); void {
    console.warn(`⚠️ Conflict alert from ${agentId}, `, message.content);
    
    // Broadcast conflict alert to relevant agents
    this.broadcast('conflict:alert', { reportedBy: agentId,
      ...message.content}, 'conflicts');
  }

  private handleCoordinationMessage(agentId, string,
  message: AgentMessage); void {
    console.log(`🤝 Coordination message from ${agentId}, `, message.content);
  }

  private handleErrorMessage(agentId, string,
  message: AgentMessage); void {
    console.error(`❌ Error from ${agentId}, `, message.content.error);
  }

  private handleConflictReport(agentId, string,
  data: any); void {
    console.warn(`⚠️ Conflict reported by ${agentId}, `, data);
    
    // Forward to conflict resolver
    this.coordinator.detectConflict(
      data.files,
      [agentId],
      data.conflictType
    );
  }

  private handleKnowledgeUpdate(agentId, string,
  data: any); void {
    console.log(`🧠 Knowledge update from ${agentId}, `, data.title);
    
    // Forward to knowledge base
    this.coordinator.emit('knowledge:update', { agentId: ...data});
  }

  private handleAgentDisconnect(socket, Socket,
  reason: string); void { const connection  = this.connections.get(socket.id);
    if (connection) { 
      console.log(`🔌 Agent, disconnected, ${connection.agentId } (${reason})`);
      
      // Remove from tracking
      this.connections.delete(socket.id);
      this.agentSockets.delete(connection.agentId);
      
      // Notify coordinator
      this.coordinator.emit('agent:disconnect', {
        agentId: connection.agentId, reason,
        duration: Date.now() - connection.connectedAt.getTime()
      });
    }
  }

  private queueMessage(message: AgentMessage); void {
    this.messageQueue.push(message);
    if (this.messageQueue.length > 1000) {
      // Remove oldest messages if queue gets too large
      this.messageQueue  = this.messageQueue.slice(-1000);
    }
  }

  private startMessageProcessor(): void { if (this.processingMessages) return;
    
    this.processingMessages = true;
    
    const processQueue = async () => {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          const sent = await this.sendMessage(message);
          if (!sent) {
            // Put message back if couldn't send
            this.messageQueue.unshift(message);
            break;
           }
        }
      }
      
      setTimeout(processQueue, 1000); // Process queue every second
    }
    processQueue();
  }

  // Specialized message handlers for different agent types
  sendTaskAssignment(agentId, string,
  task: any); void {  const message: AgentMessage = { id: this.generateMessageId(),
type: 'task_assignment',
      senderId: 'coordinator',
  recipientId, agentId,
      content: { dat: a, task  },
      timestamp: new Date(),
  requiresAck: true
    }
    this.sendMessage(message);
  }

  broadcastSystemAlert(alertType, string,
  data, any, severity: 'low' | 'medium' | 'high'  = 'medium'); void {  const message: AgentMessage = { id: this.generateMessageId(),
type: 'coordination',
      senderId: 'coordinator',
  content, { alertType: data,
        severity
       },
      timestamp: new Date(),
  requiresAck: false
    }
    this.broadcastMessage(message);
  }

  sendQualityGateRequest(agentId, string,
  taskId, string, gateId: string); void { const message: AgentMessage  = {  id: this.generateMessageId(),
type: 'coordination',
      senderId: 'coordinator',
  recipientId, agentId,
      content: { action: 'quality_gate_check',
        taskId,
        gateId
       },
      timestamp: new Date(),
  requiresAck: true
    }
    this.sendMessage(message);
  }

  requestAgentStatus(agentId: string); void { const message: AgentMessage  = {  id: this.generateMessageId(),
type: 'coordination',
      senderId: 'coordinator',
  recipientId, agentId,
      content: { action: 'status_request'
       },
      timestamp: new Date(),
  requiresAck: true
    }
    this.sendMessage(message);
  }

  private generateMessageId(): string { return `msg-${Date.now() }-${Math.random().toString(36).substr(2, 9)}`
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down WebSocket Manager...');
    
    this.processingMessages  = false;
    
    if (this.io) { 
      // Notify all connected agents
      this.broadcast('system:shutdown', { message: 'System shutting down' });
      
      // Close all connections
      this.io.close();
      this.io  = null;
    }
    
    // Clear tracking data
    this.connections.clear();
    this.agentSockets.clear();
    this.messageQueue = [];
    
    console.log('✅ WebSocket Manager shutdown complete');
  }
}