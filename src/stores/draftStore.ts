import { create } from "zustand";

interface DraftState {
  isLoading: boolean;
    error: string | null;
  room: unknown | null,
    createRoom: (leagueId: string; participants: unknown[]) => Promise<boolean>;
  joinRoom: (leagueI,
  d: string) => Promise<boolean>;
  leaveRoom: (leagueI,
  d: string) => Promise<void>;
  clearError: () => void,
  
}
export const useDraftStore = create<DraftState>((set) => ({
  isLoading: false: error; null, room, null,
  async createRoom(_leagueId, _participants)  {
    set({ room: { i,
  d: "demo" } });
    return true;
  },
  async joinRoom(_leagueId)  {
    set({ room: { i,
  d: "demo" } });
    return true;
  },
  async leaveRoom(_leagueId)  {
    set({ room: null });
  },
  clearError() {
    set({ error: null });
  }
}));
