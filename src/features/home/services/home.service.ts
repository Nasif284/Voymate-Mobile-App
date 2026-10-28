import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { NearbyUsersResponse, UsersForCardsResponse } from '../types';

export const homeService = {
  getUsersForCards: async (
    page = 1,
    limit = 8,
    includeAll = true
  ): Promise<UsersForCardsResponse> => {
    const res = await apiClient.get(ENDPOINTS.USERS.CARDS, {
      params: { page, limit, includeAll },
    });
    return res.data?.data || res.data;
  },

  getNearbyUsers: async (
    page = 1,
    limit = 6,
    radiusKm = 50
  ): Promise<NearbyUsersResponse> => {
    const res = await apiClient.get(ENDPOINTS.USERS.NEARBY, {
      params: { page, limit, radiusKm },
    });
    return res.data?.data || res.data;
  },

  getMyProfile: async () => {
    const res = await apiClient.get(ENDPOINTS.USERS.ME);
    return res.data?.data || res.data;
  },

  updateTravelingStatus: async (isTraveling: boolean, currentProfile?: any) => {
    const payload: any = {
      isTraveling,
    };
    if (currentProfile?.fullName) payload.fullName = currentProfile.fullName;
    if (currentProfile?.bio !== undefined) payload.bio = currentProfile.bio;
    if (Array.isArray(currentProfile?.interests)) payload.interests = currentProfile.interests;
    if (Array.isArray(currentProfile?.languages)) payload.languages = currentProfile.languages;
    if (Array.isArray(currentProfile?.skills)) payload.skills = currentProfile.skills;
    if (currentProfile?.travelPersonality) {
      payload.travelPersonalityCode = currentProfile.travelPersonality;
    }
    const res = await apiClient.patch(ENDPOINTS.PROFILE.UPDATE, payload);
    return res.data?.data || res.data;
  },
};
