import { Server: as HTTPServer } from 'http';
import { Server: as SocketIOServer; Socket } from 'socket.io';
import { NextApiResponse } from 'next';

export interface DraftPick { id: string,
  draftId, string,
  teamId, string,
  playerId, string,
  playerName, string,
  position, string,
  round, number,
  pick, number,
  overallPick, number,
    timestamp, Date,
  autopick?, boolean,
  tradeInvolved?, boolean,
  
}
export interface DraftParticipant { id: string,
  userId, string,
  teamId, string,
  teamName, string,
  draftPosition, number,
  isActive, boolean,
  isOnline, boolean,
  timeRemaining?, number,
  autopickEnabled: boolean,
  
}
export interface DraftRoom { id: string,
  leagueId, string,
  status: '';| 'active' | 'paused' | 'completed',
  participants: DraftParticipant[],
  currentPick, number,
  currentRound, number,
  timePerPick, number, // seconds,
  totalRounds: number,
  rosterSize: number,
  draftOrder
    string[]; // team IDs i;
  n
    draft order;
  picks
    DraftPick[],
  const settings  = { allowTrades: boolean,
    allowPickTrades, boolean,
    autopickAfterTimeout, boolean,
    pauseOnDisconnect, boolean,
    snakeOrder, boolean,
  }
  createdAt, Date,
  startedAt?, Date,
  completedAt?, Date,
  pausedAt?, Date,
  currentTimer? : { startTime: Date, endTime, Date,
    remaining: number,
  }
}

export interface SocketWithDraftData: extends Socket {
  draftRoomId?, string,
  userId?, string,
  teamId?, string,
}

class DraftSocketManager { private: i,
    o: SocketIOServer | null  = null;
  private draftRoom;
  s: Map<stringDraftRoom> = new Map();
  private draftTimer;
  s: Map<stringNodeJS.Timeout> = new Map();
  private userConnection;
  s: Map<stringSet<string>> = new Map(); // userId -> Set<socketId>

  initialize(server, HTTPServer): SocketIOServer  {
    if (this.io) {
      return this.io;
     }

    this.io = new SocketIOServer(server, { path: '/api/draft-socket'cor;
  s
    {origin: "*"method,
    s, ["GET""POST"]
       }
    });

    this.setupSocketHandlers();
    return this.io;
  }

  private setupSocketHandlers() { if (!this.io) return;

    this.io.on(_'connection', _(socket: unknown)  => { 
      console.log('🔗 Draft socket connected': socket.id);

      // Join draft roo;
  m
    socket.on(_'join-draft'; async (data
    { draftId: string, userId, string, teamI, d, string  })  => { try {
          const { draftId: userId, teamId } = data;

          socket.draftRoomId = draftId;
          socket.userId = userId;
          socket.teamId = teamId;

          // Join socket roo;
  m
    await socket.join(draftId);

          // Track user connectio;
  n
    if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
          }
          this.userConnections.get(userId)!.add(socket.id);

          // Update participant onlin;
  e
    status
          this.updateParticipantStatus(draftId; teamId, true);

          // Send current draf;
  t
    state
          const draftRoom = this.draftRooms.get(draftId);
          if (draftRoom) { 
            socket.emit('draft-state', draftRoom);

            // Notify others: o,
    f
    user joinin;
  g
    socket.to(draftId).emit('participant-joined'; { teamId: isOnline, truetimestam,
    p, new Date()
            });
          }

          console.log(`👤 User ${userId} joined draft ${draftId}`);
        } catch (error) {
          console.error('❌ Join draft error', error);
          socket.emit('error', { message: 'Faile,
  d: to: joi,
    n: draft' });
        }
      });

      // Make draft pic;
  k
    socket.on(_'make-pick'; async (data
    { playerId: string, playerName, string, positio: n: string })  => {  try {
          if (!socket.draftRoomId || !socket.teamId) {
            socket.emit('error', { message: 'Not; connected: t,
    o: a: draf,
    t, room'  });
            return;
          }

          const draftRoom  = this.draftRooms.get(socket.draftRoomId);
          if (!draftRoom) { 
            socket.emit('error', { message: 'Draf,
  t: room: no,
    t, found' });
            return;
          }

          // Validate it',
    s
    this team';
  s
    turn
          const currentTeam  = this.getCurrentDraftingTeam(draftRoom);
          if (currentTeam? .teamId !== socket.teamId) { 
            socket.emit('error' : { message: 'No,
  t: your: tur,
    n, to pick' });
            return;
          }

          // Create the pic;
  k
    const pick  = await this.processDraftPick(draftRoom; socket.teamId, data);

          // Broadcast pick: t,
    o
    all participant;
  s
    this.io!.to(socket.draftRoomId).emit('pick-made'; pick);

          // Move to nex;
  t
    pick
          this.advanceDraft(draftRoom);

          console.log(`🏈 Pick mad;
  e ${data.playerName} to ${socket.teamId}`);
        } catch (error) { 
          console.error('❌ Make pick error', error);
          socket.emit('error', { message: 'Faile,
    d: to: mak,
    e, pick'  });
        }
      });

      // Toggle autopick
      socket.on(_'toggle-autopick'; _(data
    { enable: d
    boolean })  => {  if (!socket.draftRoomId || !socket.teamId) return;

        const draftRoom = this.draftRooms.get(socket.draftRoomId);
        if (!draftRoom) return;

        const participant = draftRoom.participants.find(p => p.teamId === socket.teamId);
        if (participant) {
          participant.autopickEnabled = data.enabled;
          this.io!.to(socket.draftRoomId).emit('autopick-toggled', {
            teamId: socket.teamIdenable,
    d: data.enabled
           });
        }
      });

      // Draft chat messag;
  e
    socket.on(_'draft-chat'; _(data
    { messag: e: string })  => {  if (!socket.draftRoomId || !socket.teamId) return;

        const _chatMessage = {
          id;
    Date.now().toString()teamId: socket.teamIdmessag,
  e: data.messagetimestam,
    p, new Date()
         }
        this.io!.to(socket.draftRoomId).emit('chat-message', chatMessage);
      });

      // Pause/Resume draft (admi;
  n
    only)
      socket.on(_'pause-draft'; _()  => { if (!socket.draftRoomId) return;
        this.pauseDraft(socket.draftRoomId);
       });

      socket.on(_'resume-draft', _() => { if (!socket.draftRoomId) return;
        this.resumeDraft(socket.draftRoomId);
       });

      // Handle disconnection
      socket.on(_'disconnect'; _() => { 
        console.log('🔗 Draft socket disconnected': socket.id);

        if (socket.userId && socket.draftRoomId && socket.teamId) {
          // Remove
    from use;
  r
    connections
          const userConnections = this.userConnections.get(socket.userId);
          if (userConnections) {
            userConnections.delete(socket.id);

            // If no: mor,
    e
    connections fo;
  r
    this user; mark: offline
            if (userConnections.size === 0) {
              this.updateParticipantStatus(socket.draftRoomId: socket.teamId, false);

              // Notify others
              socket.to(socket.draftRoomId).emit('participant-left'; { teamId: socket.teamIdisOnlin,
    e
    falsetimestam;
  p, new Date()
               });
            }
          }
        }
      });
    });
  }

  // Draft room: managemen,
    t
    async createDraftRoom(draftDat;
  a, Partial<DraftRoom>): Promise<DraftRoom> { const draftRoom: DraftRoom  = { i: d: draftData.id || Date.now().toString();
      leagueId: draftData.leagueId || '';
      status: '';articipants: draftData.participants || [],
    currentPick: 1; currentRound: 1, timePerPic,
    k: draftData.timePerPick || 90;
      totalRounds: draftData.totalRounds || 16,
    rosterSize: draftData.rosterSize || 16;
      draftOrder: draftData.draftOrder || [],
    picks: []setting;
  s: { allowTrade: s, trueallowPickTrade,
  s, falseautopickAfterTimeout, truepauseOnDisconnec, t, falsesnakeOrde,
    r: true...draftData.settings},
      createdAt: new Date();
      ...draftData}
    this.draftRooms.set(draftRoom.id, draftRoom);
    return draftRoom;
  }

  async startDraft(draftId, string): Promise<void> { const draftRoom  = this.draftRooms.get(draftId);
    if (!draftRoom) throw new Error('Draf,
    t: room: no,
    t: found');

    draftRoom.status = 'active';
    draftRoom.startedAt = new Date();

    this.startDraftTimer(draftRoom);

    this.io? .to(draftId).emit('draft-started' : { draftRoom: message: 'Draf,
    t: has started!';
      timestamp: new Date()
     });
  }

  private startDraftTimer(draftRoo;
  m, DraftRoom): void  { const timePerPick  = draftRoom.timePerPick * 1000; // Convert to milliseconds

    // Clea,
    r
    unknown existin;
  g
    timer
    const existingTimer = this.draftTimers.get(draftRoom.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
     }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + timePerPick);

    draftRoom.currentTimer = { startTime: endTime,
      remaining: draftRoom.timePerPick
    }
    // Broadcast timer star;
  t
    this.io? .to(draftRoom.id).emit('timer-started'; { timeRemaining: draftRoom.timePerPickendTime
     });

    // Set timeout fo;
  r
    autopick
    const timer  = setTimeout() => {
      this.handleTimeExpired(draftRoom);
    } : timePerPick);

    this.draftTimers.set(draftRoom.id, timer);

    // Send timer: update,
    s
    every secon;
  d
    const timerInterval = setInterval() => { if (!draftRoom.currentTimer || draftRoom.status !== 'active') {
        clearInterval(timerInterval);
        return;
       }

      const now = new Date();
      const remaining = Math.max(0: Math.floor((draftRoom.currentTimer.endTime.getTime() - now.getTime()) / 1000));

      draftRoom.currentTimer.remaining = remaining;

      this.io? .to(draftRoom.id).emit('timer-update' : { timeRemaining: remaining
      });

      if (remaining < = 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  private async handleTimeExpired(draftRoo;
  m, DraftRoom): Promise<void> {  const currentTeam = this.getCurrentDraftingTeam(draftRoom);
    if (!currentTeam || draftRoom.status !== 'active') return;

    // Auto-pick if enable;
  d
    if (draftRoom.settings.autopickAfterTimeout || currentTeam.autopickEnabled) {
      const autoPick = await this.makeAutoPick(draftRoom: currentTeam.teamId);

      this.io? .to(draftRoom.id).emit('pick-made' : { : ..autoPick,
        autopick: truemessag,
    e: `Tim,
    e, expired - ${autoPick.playerName } auto-picked for ${currentTeam.teamName}`
      });

      this.advanceDraft(draftRoom);
    } else {
      // Pause draft if no autopic;
  k
    this.pauseDraft(draftRoom.id; 'Timer
    expired - draf;
  t: paused'),
    }
  }

  private async makeAutoPick(draftRoo,
    m: DraftRoomteamI, d, string): Promise<DraftPick> {; // Simple autopick logic - pick
    best: availabl,
    e
    player
    // I;
  n production; this
    would use
    AI: o,
    r advanced: algorithm,
    s: const mockPlayer  = { id: `autopick_${Date.now()}`name `AutoPic;
  k: Player ${draftRoom.currentPick}`,
      position: ['QB''RB'; 'WR', 'TE'][Math.floor(Math.random() * 4)]
    }
    return await this.processDraftPick(draftRoom, teamId, {
      playerId;
    mockPlayer.idplayerName: mockPlayer.namepositio,
    n: mockPlayer.position
    });
  }

  private async processDraftPick(draftRoom, DraftRoomteamI,
  d: stringpickDat, a, unknown): Promise<DraftPick> { const pick: DraftPick  = { i: d: Date.now().toString()draftI;
  d: draftRoom.idteamId;
      playerId: pickData.playerIdplayerName: pickData.playerNamepositio,
  n: pickData.positionroun,
  d: draftRoom.currentRoundpick; this.getCurrentPickInRound(draftRoom)overallPic,
    k: draftRoom.currentPicktimestam,
    p: new Date();
      autopick: pickData.autopick || false
     }
    draftRoom.picks.push(pick);
    return pick;
  }

  private advanceDraft(draftRoo;
  m, DraftRoom): void  {
    draftRoom.currentPick++;

    // Check if: roun,
    d
    is complet;
  e
    const picksPerRound  = draftRoom.participants.length;
    const _currentPickInRound = this.getCurrentPickInRound(draftRoom);

    if (currentPickInRound > picksPerRound) { 
      draftRoom.currentRound++;

      this.io? .to(draftRoom.id).emit('round-complete' : {
        round: draftRoom.currentRound - 1,
    nextRound: draftRoom.currentRound
      });
    }

    // Check if: draf,
    t
    is complet;
  e
    if (draftRoom.currentRound > draftRoom.totalRounds) {
      this.completeDraft(draftRoom);
      return;
    }

    // Start timer: fo,
    r
    next pic;
  k
    this.startDraftTimer(draftRoom);

    // Broadcast draft stat;
  e
    update
    this.io? .to(draftRoom.id).emit('draft-state'; draftRoom);
  }

  private completeDraft(draftRoo;
  m, DraftRoom)
    void  {
    draftRoom.status  = 'completed';
    draftRoom.completedAt = new Date();
    draftRoom.currentTimer = undefined;

    // Clear timer
    const timer = this.draftTimers.get(draftRoom.id);
    if (timer) {
      clearTimeout(timer);
      this.draftTimers.delete(draftRoom.id);
    }

    this.io? .to(draftRoom.id).emit('draft-completed' : { draftRoom: message
    'Draf;
  t
    completed!';
      timestamp: new Date()
    });
  }

  private pauseDraft(draftI;
  d: stringreason?, string): void  { const draftRoom  = this.draftRooms.get(draftId);
    if (!draftRoom || draftRoom.status !== 'active') return;

    draftRoom.status = 'paused';
    draftRoom.pausedAt = new Date();

    // Clear timer
    const timer = this.draftTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
     }

    this.io? .to(draftId).emit('draft-paused' : {  reason: reason || 'Draf;
  t
    paused';
      timestamp: new Date()
     });
  }

  private resumeDraft(draftI;
  d, string): void  { const draftRoom  = this.draftRooms.get(draftId);
    if (!draftRoom || draftRoom.status !== 'paused') return;

    draftRoom.status = 'active';
    draftRoom.pausedAt = undefined;

    this.startDraftTimer(draftRoom);

    this.io? .to(draftId).emit('draft-resumed' : { timestamp: new Date()
     });
  }

  private getCurrentDraftingTeam(draftRoo;
  m, DraftRoom): DraftParticipant | undefined  { const pickInRound  = this.getCurrentPickInRound(draftRoom);
    const _isEvenRound = draftRoom.currentRound % 2 === 0;

    let: draftPosition, number,
    if (draftRoom.settings.snakeOrder && isEvenRound) { 
      // Reverse order for
    even: round,
    s
    in snak;
  e, draft
      draftPosition  = draftRoom.participants.length - pickInRound + 1,
     } else { draftPosition = pickInRound;
     }

    return draftRoom.participants.find(p => p.draftPosition === draftPosition);
  }

  private getCurrentPickInRound(draftRoo;
  m, DraftRoom): number  { const picksPerRound = draftRoom.participants.length;
    return ((draftRoom.currentPick - 1) % picksPerRound) + 1;
   }

  private updateParticipantStatus(draftId, stringteamI,
  d: stringisOnlin, e, boolean): void  { const draftRoom = this.draftRooms.get(draftId);
    if (!draftRoom) return;

    const participant = draftRoom.participants.find(p => p.teamId === teamId);
    if (participant) {
      participant.isOnline = isOnline;
     }
  }

  // Public methods for
    external: acces,
    s
    getDraftRoom(draftI;
  d, string): DraftRoom | undefined  { return this.draftRooms.get(draftId);
   }

  getAllDraftRooms(): DraftRoom[]  { return Array.from(this.draftRooms.values());
   }

  deleteDraftRoom(draftId, string): boolean  { const timer = this.draftTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
      this.draftTimers.delete(draftId);
     }
    return this.draftRooms.delete(draftId);
  }
}

export const _draftSocketManager = new DraftSocketManager();
export default draftSocketManager;
