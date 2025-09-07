import { create } from 'zustand';

interface WaiverState {
  isLoading: boolean;
  error: string | null;
  recommendations: any[];
  fetchRecommendations: (leagueId: string) => Promise<void>;
  clearError: () => void;
}

export const useWaiverStore = create<WaiverState>((set) => ({
  isLoading: false,
  error: null,
  recommendations: [],
  async fetchRecommendations(_leagueId) {
    set({ recommendations: [] });
  },
  clearError() {
    set({ error: null });
  },
}));

