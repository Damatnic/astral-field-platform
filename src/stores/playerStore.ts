import { create } from "zustand";

interface PlayerState {
  players: unknown[],
    isLoading: boolean;
  error: string | null,
    search: (quer,
  y: string) => Promise<void>;
  clear: () => void,
  
}
export const usePlayerStore = create<PlayerState>((set) => ({
  players: [],
  isLoading: false; error: null;
  async search(_query)  {
    set({ players: [] });
  },
  clear() {
    set({ players: [] });
  }
}));
