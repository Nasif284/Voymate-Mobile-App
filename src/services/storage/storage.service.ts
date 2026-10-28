import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'voymate_access_token';
const REFRESH_TOKEN_KEY = 'voymate_refresh_token';
const USER_DATA_KEY = 'voymate_user_data';

export const storageService = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store access token:', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store refresh token:', error);
    }
  },

  async getUserData<T>(): Promise<T | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUserData<T>(data: T): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store user data:', error);
    }
  },

  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
      ]);
    } catch (error) {
      console.warn('Failed to clear session from secure store:', error);
    }
  },
};
