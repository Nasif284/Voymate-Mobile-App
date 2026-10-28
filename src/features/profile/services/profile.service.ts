import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  UserProfileData,
  MatchProfileData,
  ProfileUpcomingTrip,
  UpdatePersonalProfilePayload,
  UserSettings,
} from '../types';

export const profileService = {
  getUserProfile: async (userId: string): Promise<UserProfileData> => {
    const res = await apiClient.get(ENDPOINTS.USERS.PROFILE(userId));
    return res.data?.data || res.data;
  },

  getMatchProfile: async (matchId: string): Promise<MatchProfileData> => {
    const res = await apiClient.get(ENDPOINTS.TRIPS.MATCH_PROFILE(matchId));
    return res.data?.data || res.data;
  },

  getUserUpcomingTrips: async (userId: string): Promise<ProfileUpcomingTrip[]> => {
    const res = await apiClient.get(ENDPOINTS.TRIPS.USER_UPCOMING(userId));
    const data = res.data?.data || res.data;
    return data?.trips || (Array.isArray(data) ? data : []);
  },

  getMe: async (): Promise<UserProfileData> => {
    const res = await apiClient.get(ENDPOINTS.USERS.ME);
    return res.data?.data || res.data;
  },

  updateProfile: async (payload: UpdatePersonalProfilePayload): Promise<UserProfileData> => {
    const res = await apiClient.patch(ENDPOINTS.PROFILE.UPDATE, payload);
    return res.data?.data || res.data;
  },

  updateAvatar: async (imageUri: string, mimeType: string = 'image/jpeg'): Promise<any> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await apiClient.patch(ENDPOINTS.PROFILE.AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  updateCover: async (imageUri: string, mimeType: string = 'image/jpeg'): Promise<any> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'cover.jpg';
    formData.append('cover', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await apiClient.patch(ENDPOINTS.PROFILE.COVER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  getSettings: async (): Promise<UserSettings> => {
    const res = await apiClient.get(ENDPOINTS.PROFILE.SETTINGS);
    return res.data?.data || res.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<any> => {
    const res = await apiClient.patch(ENDPOINTS.PROFILE.SETTINGS, settings);
    return res.data?.data || res.data;
  },

  getDocVerificationStatus: async (): Promise<any> => {
    const res = await apiClient.get(ENDPOINTS.PROFILE.VERIFY_DOCS);
    return res.data?.data || res.data;
  },

  resetPassword: async (password: string, email: string): Promise<any> => {
    const res = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      password,
    });
    return res.data;
  },
};
