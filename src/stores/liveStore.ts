import { create } from "zustand";

interface LiveState {
  isLoading: boolean;
  error: string | null;
  notificationsEnabled: boolean;
  initializeNotifications: (userId: string) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  isLoading: false,
  error: null,
  notificationsEnabled: false,
  initializeNotifications(_userId) {
    set({ notificationsEnabled: true });
  },
}));
