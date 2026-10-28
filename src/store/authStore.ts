import { create } from 'zustand';
import { User, AuthTokens } from '../types/auth.types';
import { storageService } from '../services/storage/storage.service';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  onboarding: {
    step: number;
    isCompleted: boolean;
  };

  // Actions
  setUser: (user: User | null) => void;
  setOnboarding: (step: number, isCompleted: boolean) => void;
  setVerified: (isVerified: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuth: () => Promise<void>;
  setAuthSession: (
    user: User,
    tokens: AuthTokens,
    onboarding?: { step: number; isCompleted: boolean },
    isVerified?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isVerified: true,
  isLoading: true,
  onboarding: {
    step: 1,
    isCompleted: false,
  },

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setOnboarding: (step, isCompleted) =>
    set({
      onboarding: { step, isCompleted },
    }),

  setVerified: (isVerified) => set({ isVerified }),

  setLoading: (isLoading) => set({ isLoading }),

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await storageService.getAccessToken();
      const cachedUser = await storageService.getUserData<User>();

      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      if (cachedUser) {
        set({ user: cachedUser, isAuthenticated: true });
      }

      // Verify token & hydrate fresh user state from server
      try {
        const res = await apiClient.get(ENDPOINTS.AUTH.ME);
        const data = res.data?.data;
        if (data?.user) {
          await storageService.setUserData(data.user);
          set({
            user: data.user,
            isAuthenticated: true,
            isVerified: data.isVerified ?? true,
            onboarding: {
              step: data.onboardingStep ?? get().onboarding.step,
              isCompleted: data.onboardingCompleted ?? get().onboarding.isCompleted,
            },
          });
        }
      } catch (meError) {
        // If 401 and refresh also failed, storage was cleared by interceptor
        const currentToken = await storageService.getAccessToken();
        if (!currentToken) {
          set({ user: null, isAuthenticated: false });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setAuthSession: async (user, tokens, onboarding, isVerified = true) => {
    await Promise.all([
      storageService.setAccessToken(tokens.accessToken),
      storageService.setRefreshToken(tokens.refreshToken),
      storageService.setUserData(user),
    ]);

    set({
      user,
      isAuthenticated: true,
      isVerified,
      onboarding: onboarding ?? {
        step: 1,
        isCompleted: false,
      },
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      const refreshToken = await storageService.getRefreshToken();
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken }).catch(() => {});
    } finally {
      await storageService.clearSession();
      set({
        user: null,
        isAuthenticated: false,
        onboarding: { step: 0, isCompleted: false },
        isLoading: false,
      });
    }
  },
}));
