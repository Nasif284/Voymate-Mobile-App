import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../features/profile/services/profile.service';

export interface BlockedUser {
  id: string;
  name?: string;
  avatar?: string;
  blockedAt: number;
}

interface SafetyState {
  blockedUsers: Record<string, BlockedUser>;
  blockedUserIds: string[];
  isLoaded: boolean;

  loadBlockedUsers: () => Promise<void>;
  blockUser: (user: { id: string; name?: string; avatar?: string }) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  reset: () => void;
}

const STORAGE_KEY = '@voymate_blocked_users';

export const useSafetyStore = create<SafetyState>((set, get) => ({
  blockedUsers: {},
  blockedUserIds: [],
  isLoaded: false,

  loadBlockedUsers: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, BlockedUser> = JSON.parse(raw);
        set({
          blockedUsers: parsed,
          blockedUserIds: Object.keys(parsed),
          isLoaded: true,
        });
      } else {
        set({ blockedUsers: {}, blockedUserIds: [], isLoaded: true });
      }

      // Sync fresh records from database if authenticated
      try {
        const serverList = await profileService.getBlockedUsers();
        if (Array.isArray(serverList)) {
          const mapped: Record<string, BlockedUser> = {};
          serverList.forEach((item) => {
            mapped[item.id] = {
              id: item.id,
              name: item.name || 'Traveler',
              avatar: item.avatarUrl || undefined,
              blockedAt: new Date(item.blockedAt).getTime(),
            };
          });
          set({
            blockedUsers: mapped,
            blockedUserIds: Object.keys(mapped),
            isLoaded: true,
          });
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Offline or unauthenticated; local cache remains active
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to load blocked users from storage:', e);
      }
      set({ isLoaded: true });
    }
  },

  blockUser: async ({ id, name, avatar }) => {
    const current = { ...get().blockedUsers };
    current[id] = {
      id,
      name: name || 'Traveler',
      avatar,
      blockedAt: Date.now(),
    };
    const ids = Object.keys(current);
    set({ blockedUsers: current, blockedUserIds: ids });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to persist blocked user:', e);
      }
    }
  },

  unblockUser: async (userId: string) => {
    const current = { ...get().blockedUsers };
    delete current[userId];
    const ids = Object.keys(current);
    set({ blockedUsers: current, blockedUserIds: ids });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to update blocked users in storage:', e);
      }
    }

    try {
      await profileService.unblockUser(userId);
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to sync unblock to server:', e);
      }
    }
  },

  isBlocked: (userId: string) => {
    return Boolean(get().blockedUsers[userId]);
  },

  reset: () => {
    set({ blockedUsers: {}, blockedUserIds: [], isLoaded: true });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

// Hydrate on module import
void useSafetyStore.getState().loadBlockedUsers();
