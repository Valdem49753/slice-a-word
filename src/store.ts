import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AppState {
  user: User | null | undefined; // undefined = loading
  setUser: (user: User | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
}));
