import { create } from "zustand";

interface DraftState {
  isLoading: boolean;
  error: string | null;
  room: unknown | null;
  createRoom: (leagueId: string, participants: unknown[]) => Promise<boolean>;
  joinRoom: (leagueId: string) => Promise<boolean>;
  leaveRoom: (leagueId: string) => Promise<void>;
  clearError: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  isLoading: false,
  error: null,
  room: null,
  async createRoom(_leagueId, _participants) {
    set({ room: { id: "demo" } });
    return true;
  },
  async joinRoom(_leagueId) {
    set({ room: { id: "demo" } });
    return true;
  },
  async leaveRoom(_leagueId) {
    set({ room: null });
  },
  clearError() {
    set({ error: null });
  },
}));
