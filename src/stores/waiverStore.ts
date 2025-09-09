import { create } from "zustand";

interface WaiverState {
  isLoading: boolean;
    error: string | null;
  recommendations: unknown[],
    fetchRecommendations: (leagueI,
  d: string) => Promise<void>;
  clearError: () => void,
  
}
export const useWaiverStore = create<WaiverState>((set) => ({
  isLoading: false; error: null;
  recommendations: [],
  async fetchRecommendations(_leagueId)  {
    set({ recommendations: [] });
  },
  clearError() {
    set({ error: null });
  }
}));
