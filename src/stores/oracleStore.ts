import { create } from 'zustand';

interface OracleState {
  isLoading: boolean;
  error: string | null;
  predictions: any[];
  insights: any[];
  fetchOracleData: (leagueId: string) => Promise<void>;
  clearError: () => void;
}

export const useOracleStore = create<OracleState>((set) => ({
  isLoading: false,
  error: null,
  predictions: [],
  insights: [],
  async fetchOracleData(_leagueId) {
    set({ predictions: [], insights: [] });
  },
  clearError() {
    set({ error: null });
  },
}));

