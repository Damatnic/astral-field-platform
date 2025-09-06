import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { NextApiResponse } from 'next';

export interface DraftPick {
  id: string;
  draftId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  position: string;
  round: number;
  pick: number;
  overallPick: number;
  timestamp: Date;
  autopick?: boolean;
  tradeInvolved?: boolean;
}

export interface DraftParticipant {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  draftPosition: number;
  isActive: boolean;
  isOnline: boolean;
  timeRemaining?: number;
  autopickEnabled: boolean;
}

export interface DraftRoom {
  id: string;
  leagueId: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  participants: DraftParticipant[];
  currentPick: number;
  currentRound: number;
  timePerPick: number; // seconds
  totalRounds: number;
  rosterSize: number;
  draftOrder: string[]; // team IDs in draft order
  picks: DraftPick[];
  settings: {
    allowTrades: boolean;
    allowPickTrades: boolean;
    autopickAfterTimeout: boolean;
    pauseOnDisconnect: boolean;
    snakeOrder: boolean;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  currentTimer?: {
    startTime: Date;
    endTime: Date;
    remaining: number;
  };
}

export interface SocketWithDraftData extends Socket {
  draftRoomId?: string;
  userId?: string;
  teamId?: string;
}

class DraftSocketManager {
  private io: SocketIOServer | null = null;
  private draftRooms: Map<string, DraftRoom> = new Map();
  private draftTimers: Map<string, NodeJS.Timeout> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  initialize(server: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      path: '/api/draft-socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    return this.io;
  }

  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: any) => {
      console.log('🔗 Draft socket connected:', socket.id);

      // Join draft room
      socket.on('join-draft', async (data: { draftId: string; userId: string; teamId: string }) => {
        try {
          const { draftId, userId, teamId } = data;
          
          socket.draftRoomId = draftId;
          socket.userId = userId;
          socket.teamId = teamId;

          // Join socket room
          await socket.join(draftId);

          // Track user connection
          if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
          }
          this.userConnections.get(userId)!.add(socket.id);

          // Update participant online status
          this.updateParticipantStatus(draftId, teamId, true);

          // Send current draft state
          const draftRoom = this.draftRooms.get(draftId);
          if (draftRoom) {
            socket.emit('draft-state', draftRoom);
            
            // Notify others of user joining
            socket.to(draftId).emit('participant-joined', {
              teamId,
              isOnline: true,
              timestamp: new Date()
            });
          }

          console.log(`👤 User ${userId} joined draft ${draftId}`);
        } catch (error) {
          console.error('❌ Join draft error:', error);
          socket.emit('error', { message: 'Failed to join draft' });
        }
      });

      // Make draft pick
      socket.on('make-pick', async (data: { playerId: string; playerName: string; position: string }) => {
        try {
          if (!socket.draftRoomId || !socket.teamId) {
            socket.emit('error', { message: 'Not connected to a draft room' });
            return;
          }

          const draftRoom = this.draftRooms.get(socket.draftRoomId);
          if (!draftRoom) {
            socket.emit('error', { message: 'Draft room not found' });
            return;
          }

          // Validate it's this team's turn
          const currentTeam = this.getCurrentDraftingTeam(draftRoom);
          if (currentTeam?.teamId !== socket.teamId) {
            socket.emit('error', { message: 'Not your turn to pick' });
            return;
          }

          // Create the pick
          const pick = await this.processDraftPick(draftRoom, socket.teamId, data);
          
          // Broadcast pick to all participants
          this.io!.to(socket.draftRoomId).emit('pick-made', pick);

          // Move to next pick
          this.advanceDraft(draftRoom);

          console.log(`🏈 Pick made: ${data.playerName} to ${socket.teamId}`);
        } catch (error) {
          console.error('❌ Make pick error:', error);
          socket.emit('error', { message: 'Failed to make pick' });
        }
      });

      // Toggle autopick
      socket.on('toggle-autopick', (data: { enabled: boolean }) => {
        if (!socket.draftRoomId || !socket.teamId) return;

        const draftRoom = this.draftRooms.get(socket.draftRoomId);
        if (!draftRoom) return;

        const participant = draftRoom.participants.find(p => p.teamId === socket.teamId);
        if (participant) {
          participant.autopickEnabled = data.enabled;
          this.io!.to(socket.draftRoomId).emit('autopick-toggled', {
            teamId: socket.teamId,
            enabled: data.enabled
          });
        }
      });

      // Draft chat message
      socket.on('draft-chat', (data: { message: string }) => {
        if (!socket.draftRoomId || !socket.teamId) return;

        const chatMessage = {
          id: Date.now().toString(),
          teamId: socket.teamId,
          message: data.message,
          timestamp: new Date()
        };

        this.io!.to(socket.draftRoomId).emit('chat-message', chatMessage);
      });

      // Pause/Resume draft (admin only)
      socket.on('pause-draft', () => {
        if (!socket.draftRoomId) return;
        this.pauseDraft(socket.draftRoomId);
      });

      socket.on('resume-draft', () => {
        if (!socket.draftRoomId) return;
        this.resumeDraft(socket.draftRoomId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔗 Draft socket disconnected:', socket.id);

        if (socket.userId && socket.draftRoomId && socket.teamId) {
          // Remove from user connections
          const userConnections = this.userConnections.get(socket.userId);
          if (userConnections) {
            userConnections.delete(socket.id);
            
            // If no more connections for this user, mark offline
            if (userConnections.size === 0) {
              this.updateParticipantStatus(socket.draftRoomId, socket.teamId, false);
              
              // Notify others
              socket.to(socket.draftRoomId).emit('participant-left', {
                teamId: socket.teamId,
                isOnline: false,
                timestamp: new Date()
              });
            }
          }
        }
      });
    });
  }

  // Draft room management
  async createDraftRoom(draftData: Partial<DraftRoom>): Promise<DraftRoom> {
    const draftRoom: DraftRoom = {
      id: draftData.id || Date.now().toString(),
      leagueId: draftData.leagueId || '',
      status: 'waiting',
      participants: draftData.participants || [],
      currentPick: 1,
      currentRound: 1,
      timePerPick: draftData.timePerPick || 90,
      totalRounds: draftData.totalRounds || 16,
      rosterSize: draftData.rosterSize || 16,
      draftOrder: draftData.draftOrder || [],
      picks: [],
      settings: {
        allowTrades: true,
        allowPickTrades: false,
        autopickAfterTimeout: true,
        pauseOnDisconnect: false,
        snakeOrder: true,
        ...draftData.settings
      },
      createdAt: new Date(),
      ...draftData
    };

    this.draftRooms.set(draftRoom.id, draftRoom);
    return draftRoom;
  }

  async startDraft(draftId: string): Promise<void> {
    const draftRoom = this.draftRooms.get(draftId);
    if (!draftRoom) throw new Error('Draft room not found');

    draftRoom.status = 'active';
    draftRoom.startedAt = new Date();

    this.startDraftTimer(draftRoom);
    
    this.io?.to(draftId).emit('draft-started', {
      draftRoom,
      message: 'Draft has started!',
      timestamp: new Date()
    });
  }

  private startDraftTimer(draftRoom: DraftRoom): void {
    const timePerPick = draftRoom.timePerPick * 1000; // Convert to milliseconds
    
    // Clear any existing timer
    const existingTimer = this.draftTimers.get(draftRoom.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + timePerPick);

    draftRoom.currentTimer = {
      startTime,
      endTime,
      remaining: draftRoom.timePerPick
    };

    // Broadcast timer start
    this.io?.to(draftRoom.id).emit('timer-started', {
      timeRemaining: draftRoom.timePerPick,
      endTime
    });

    // Set timeout for autopick
    const timer = setTimeout(() => {
      this.handleTimeExpired(draftRoom);
    }, timePerPick);

    this.draftTimers.set(draftRoom.id, timer);

    // Send timer updates every second
    const timerInterval = setInterval(() => {
      if (!draftRoom.currentTimer || draftRoom.status !== 'active') {
        clearInterval(timerInterval);
        return;
      }

      const now = new Date();
      const remaining = Math.max(0, Math.floor((draftRoom.currentTimer.endTime.getTime() - now.getTime()) / 1000));
      
      draftRoom.currentTimer.remaining = remaining;
      
      this.io?.to(draftRoom.id).emit('timer-update', {
        timeRemaining: remaining
      });

      if (remaining <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  private async handleTimeExpired(draftRoom: DraftRoom): Promise<void> {
    const currentTeam = this.getCurrentDraftingTeam(draftRoom);
    if (!currentTeam || draftRoom.status !== 'active') return;

    // Auto-pick if enabled
    if (draftRoom.settings.autopickAfterTimeout || currentTeam.autopickEnabled) {
      const autoPick = await this.makeAutoPick(draftRoom, currentTeam.teamId);
      
      this.io?.to(draftRoom.id).emit('pick-made', {
        ...autoPick,
        autopick: true,
        message: `Time expired - ${autoPick.playerName} auto-picked for ${currentTeam.teamName}`
      });

      this.advanceDraft(draftRoom);
    } else {
      // Pause draft if no autopick
      this.pauseDraft(draftRoom.id, 'Timer expired - draft paused');
    }
  }

  private async makeAutoPick(draftRoom: DraftRoom, teamId: string): Promise<DraftPick> {
    // Simple autopick logic - pick best available player
    // In production, this would use AI or advanced algorithms
    const mockPlayer = {
      id: `autopick_${Date.now()}`,
      name: `AutoPick Player ${draftRoom.currentPick}`,
      position: ['QB', 'RB', 'WR', 'TE'][Math.floor(Math.random() * 4)]
    };

    return await this.processDraftPick(draftRoom, teamId, {
      playerId: mockPlayer.id,
      playerName: mockPlayer.name,
      position: mockPlayer.position
    });
  }

  private async processDraftPick(draftRoom: DraftRoom, teamId: string, pickData: any): Promise<DraftPick> {
    const pick: DraftPick = {
      id: Date.now().toString(),
      draftId: draftRoom.id,
      teamId,
      playerId: pickData.playerId,
      playerName: pickData.playerName,
      position: pickData.position,
      round: draftRoom.currentRound,
      pick: this.getCurrentPickInRound(draftRoom),
      overallPick: draftRoom.currentPick,
      timestamp: new Date(),
      autopick: pickData.autopick || false
    };

    draftRoom.picks.push(pick);
    return pick;
  }

  private advanceDraft(draftRoom: DraftRoom): void {
    draftRoom.currentPick++;

    // Check if round is complete
    const picksPerRound = draftRoom.participants.length;
    const currentPickInRound = this.getCurrentPickInRound(draftRoom);
    
    if (currentPickInRound > picksPerRound) {
      draftRoom.currentRound++;
      
      this.io?.to(draftRoom.id).emit('round-complete', {
        round: draftRoom.currentRound - 1,
        nextRound: draftRoom.currentRound
      });
    }

    // Check if draft is complete
    if (draftRoom.currentRound > draftRoom.totalRounds) {
      this.completeDraft(draftRoom);
      return;
    }

    // Start timer for next pick
    this.startDraftTimer(draftRoom);

    // Broadcast draft state update
    this.io?.to(draftRoom.id).emit('draft-state', draftRoom);
  }

  private completeDraft(draftRoom: DraftRoom): void {
    draftRoom.status = 'completed';
    draftRoom.completedAt = new Date();
    draftRoom.currentTimer = undefined;

    // Clear timer
    const timer = this.draftTimers.get(draftRoom.id);
    if (timer) {
      clearTimeout(timer);
      this.draftTimers.delete(draftRoom.id);
    }

    this.io?.to(draftRoom.id).emit('draft-completed', {
      draftRoom,
      message: 'Draft completed!',
      timestamp: new Date()
    });
  }

  private pauseDraft(draftId: string, reason?: string): void {
    const draftRoom = this.draftRooms.get(draftId);
    if (!draftRoom || draftRoom.status !== 'active') return;

    draftRoom.status = 'paused';
    draftRoom.pausedAt = new Date();

    // Clear timer
    const timer = this.draftTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
    }

    this.io?.to(draftId).emit('draft-paused', {
      reason: reason || 'Draft paused',
      timestamp: new Date()
    });
  }

  private resumeDraft(draftId: string): void {
    const draftRoom = this.draftRooms.get(draftId);
    if (!draftRoom || draftRoom.status !== 'paused') return;

    draftRoom.status = 'active';
    draftRoom.pausedAt = undefined;

    this.startDraftTimer(draftRoom);

    this.io?.to(draftId).emit('draft-resumed', {
      timestamp: new Date()
    });
  }

  private getCurrentDraftingTeam(draftRoom: DraftRoom): DraftParticipant | undefined {
    const pickInRound = this.getCurrentPickInRound(draftRoom);
    const isEvenRound = draftRoom.currentRound % 2 === 0;
    
    let draftPosition: number;
    if (draftRoom.settings.snakeOrder && isEvenRound) {
      // Reverse order for even rounds in snake draft
      draftPosition = draftRoom.participants.length - pickInRound + 1;
    } else {
      draftPosition = pickInRound;
    }

    return draftRoom.participants.find(p => p.draftPosition === draftPosition);
  }

  private getCurrentPickInRound(draftRoom: DraftRoom): number {
    const picksPerRound = draftRoom.participants.length;
    return ((draftRoom.currentPick - 1) % picksPerRound) + 1;
  }

  private updateParticipantStatus(draftId: string, teamId: string, isOnline: boolean): void {
    const draftRoom = this.draftRooms.get(draftId);
    if (!draftRoom) return;

    const participant = draftRoom.participants.find(p => p.teamId === teamId);
    if (participant) {
      participant.isOnline = isOnline;
    }
  }

  // Public methods for external access
  getDraftRoom(draftId: string): DraftRoom | undefined {
    return this.draftRooms.get(draftId);
  }

  getAllDraftRooms(): DraftRoom[] {
    return Array.from(this.draftRooms.values());
  }

  deleteDraftRoom(draftId: string): boolean {
    const timer = this.draftTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
      this.draftTimers.delete(draftId);
    }
    return this.draftRooms.delete(draftId);
  }
}

export const draftSocketManager = new DraftSocketManager();
export default draftSocketManager;