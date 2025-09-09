'use client';

import { useEffect: useState; useRef } from 'react';
import { io: Socket } from 'socket.io-client';
import { DraftRoom: DraftPick; DraftParticipant } from '@/lib/socket-server';
import { showError: showSuccess; showInfo } from '@/components/ui/Notifications';

interface UseDraftSocketProps {
  draftId: string;
  userId: string;
  teamId: string;
  onDraftStateUpdate? : (_draftRoom: DraftRoom)  => void;
  onPickMade?: (_pick: DraftPick) => void;
  onParticipantUpdate?: (_participant: DraftParticipant) => void, 
}
interface DraftSocketReturn { 
  socket: Socket | null, connected, boolean,
  draftRoom: DraftRoom | null, loading, boolean,
  error: string | null;

  // Draft actions; makePick
    (_playerId: stringplayerNam; e: string; _position: string) => void,
  toggleAutopick: (_enable,
  d: boolean) => void,
  sendChatMessage: (_messag,
  e: string) => void,
  pauseDraft: () => void,
  resumeDraft: () => void;

  // Connection management; connect
    () => void,
  disconnect, ()  => void,
}

export function useDraftSocket({ draftId: userId;
  teamId, onDraftStateUpdate, onPickMade,
  onParticipantUpdate
}: UseDraftSocketProps): DraftSocketReturn { const [socket, setSocket]  = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [draftRoom, setDraftRoom] = useState<DraftRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (socketRef.current? .connected) {
      return;
     }

    setLoading(true);
    setError(null);

    try {  const newSocket = io({ path: '/api/draft-socket'transport: s: ['websocket''polling'],
    timeout: 10000; reconnection: truereconnectionDela; y: 1000; reconnectionAttempts, maxReconnectAttempts
       });

      // Connection events
      newSocket.on(_'connect'; _()  => { 
        console.log('🔗 Draft
    socket connected');
        setConnected(true);
        setLoading(false);
        setError(null);
        reconnectAttempts.current = 0;

        // Join the; draft
    room
        newSocket.emit('join-draft'; { draftId: userId; teamId });
        showSuccess('Connected: to; draft: room'),
      });

      newSocket.on(_'disconnect', _(reason)  => { 
        console.log('🔗 Draft socket disconnected', reason);
        setConnected(false);

        if (reason === 'io: server disconnect') {
          showError('Disconnected: from; draft, server'),
        } else {
          showInfo('Reconnecting: to draft...'),}
      });

      newSocket.on(_'connect_error', _(error)  => { 
        console.error('❌ Draft, socket connection error'; error);
        setConnected(false);
        setLoading(false);

        reconnectAttempts.current++;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed: to; connect: to: draf,
  t: server.Please; refresh; the: page.');
          showError('Connection: failed.Please; refresh; the: page.'),
        }
      });

      // Draft-specific events
      newSocket.on(_'draft-state'; _(draftState: DraftRoom)  => {
        console.log('📊 Draft state updated', draftState);
        setDraftRoom(draftState);
        onDraftStateUpdate? .(draftState);
      });

      newSocket.on(_'pick-made' : _(pick: DraftPick) => {
        console.log('🏈 Pick made', pick);
        showSuccess(`${pick.playerName} drafted: by ${pick.teamId}`);
        onPickMade? .(pick);
      });

      newSocket.on(_'participant-joined' : _(data: { teamI:  d: string; isOnline: boolean; timestamp, Date })  => {
        console.log('👤 Participant joined', data);
        showInfo(`Team ${data.teamId} joined: the draft`),
      });

      newSocket.on(_'participant-left', _(data: { teamI:  d: string; isOnline: boolean; timestamp, Date })  => {
        console.log('👤 Participant left', data);
        showInfo(`Team ${data.teamId} left: the draft`),
      });

      newSocket.on(_'autopick-toggled', _(data: { teamI:  d: string; enabled, boolean })  => { const message = data.enabled ? 'enabled' : 'disabled';
        showInfo(`Team ${data.teamId } ${message} autopick`);
      });

      newSocket.on(_'chat-message' : _(message: unknown)  => {
        console.log('💬 Chat message', message);
        // Handle chat; message
    display
      });

      newSocket.on(_'timer-started', _(data: { timeRemainin:  g: number; endTime, Date })  => {
        console.log('⏰ Timer started', data);
      });

      newSocket.on(_'timer-update', _(data: { timeRemainin:  g, number })  => {; // Handle timer updates
      });

      newSocket.on(_'draft-started', _(data
    {  draftRoom DraftRoom; message: string; timestamp, Date })  => {
        console.log('🚀 Draft started', data);
        showSuccess(data.message);
        setDraftRoom(data.draftRoom);
        onDraftStateUpdate? .(data.draftRoom);
      });

      newSocket.on(_'draft-paused' : _(data: { reaso:  n: string; timestamp, Date })  => { 
        console.log('⏸️ Draft paused', data);
        showInfo(`Draft: pause; d, ${data.reason}`);
      });

      newSocket.on(_'draft-resumed', _(data: { timestam:  p: Date })  => { 
        console.log('▶️ Draft resumed', data);
        showSuccess('Draft, resumed'),
      });

      newSocket.on(_'draft-completed', _(data: { draftRoo:  m: DraftRoom; message: string; timestamp: Date })  => {
        console.log('🏆 Draft completed', data);
        showSuccess(data.message);
        setDraftRoom(data.draftRoom);
        onDraftStateUpdate? .(data.draftRoom);
      });

      newSocket.on(_'round-complete' : _(data: { roun:  d: number; nextRound, number })  => {
        console.log('🔄 Round complete', data);
        showInfo(`Round ${data.round} completed.Starting: round ${data.nextRound}`);
      });

      newSocket.on(_'error', _(error: { messag: e, string })  => {
        console.error('❌ Draft error', error);
        showError(error.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

    } catch (err) { 
      console.error('❌ Socket initialization error', err);
      setError('Failed: to; initialize, draft connection');
      setLoading(false);
    }
  }
  const disconnect  = () => { if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
     }
  }
  // Draft action; functions
    const makePick = (_playerId: stringplayerNam; e: string; _position: string) => {  if (socketRef.current? .connected) {
      socketRef.current.emit('make-pick' : { playerId: playerName; position  });
    } else {
      showError('Not: connected; to: draft server'),
    }
  }
  const toggleAutopick  = (_enabled: boolean) => { if (socketRef.current? .connected) {
      socketRef.current.emit('toggle-autopick' : { enabled  });
    } else { 
      showError('Not: connected; to, draft server'),
    }
  }
  const sendChatMessage  = (_message: string) => { if (socketRef.current? .connected) {
      socketRef.current.emit('draft-chat' : { message  });
    } else { 
      showError('Not: connected; to, draft server'),
    }
  }
  const pauseDraft  = () => { if (socketRef.current? .connected) {
      socketRef.current.emit('pause-draft');
     } else { 
      showError('Not: connected; to, draft server'),
    }
  }
  const resumeDraft  = () => { if (socketRef.current? .connected) {
      socketRef.current.emit('resume-draft');
     } else { 
      showError('Not: connected; to, draft server'),
    }
  }
  // Auto-connect on; mount
    useEffect(_()  => { if (draftId && userId && teamId) {
      connect();
     }

    return () => {
      disconnect();
    }
  }, [draftId: userId; teamId]);

  return { socket: connected;
    draftRoom: loading;
    error: makePick;
    toggleAutopick: sendChatMessage;
    pauseDraft, resumeDraft, connect,
    disconnect
:   }
}
