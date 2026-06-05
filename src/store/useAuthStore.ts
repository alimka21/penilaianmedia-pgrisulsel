import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'juri-media' | 'juri-presentasi' | null;

interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  kategori?: string;
}

interface AuthState {
  user: User | null;

  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'lomba-media-auth',
    }
  )
);
