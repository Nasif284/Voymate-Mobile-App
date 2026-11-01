import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

export interface OnboardingTravelStylePayload {
  travelType: string;
  interests: string[];
  travelPersonality: string;
  matchWith: string;
}

export const onboardingService = {
  setSource: async (payload: { source: string }) => {
    const res = await apiClient.post(ENDPOINTS.ONBOARDING.SOURCE, payload);
    return res.data?.data || res.data;
  },

  setProfile: async (formData: FormData) => {
    const res = await apiClient.post(ENDPOINTS.ONBOARDING.PROFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  setTravelStyle: async (payload: OnboardingTravelStylePayload) => {
    const res = await apiClient.post(ENDPOINTS.ONBOARDING.TRAVEL_STYLE, payload);
    return res.data?.data || res.data;
  },

  reverseGeocode: async (payload: { latitude: number; longitude: number }) => {
    const res = await apiClient.post(ENDPOINTS.LOCATION.REVERSE_GEOCODE, payload);
    return res.data?.data || res.data;
  },
};
