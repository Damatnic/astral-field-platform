import { create } from "zustand";

interface OracleState {
  isLoading: boolean;
  error: string | null;
  predictions: unknown[];
  insights: unknown[];
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
