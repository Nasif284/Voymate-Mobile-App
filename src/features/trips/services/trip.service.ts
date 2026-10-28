import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

export interface CreateTripPayload {
  name: string;
  destinationName: string;
  placeId: string;
  city?: string | null;
  state?: string | null;
  countryCode: string;
  latitude?: number | null;
  longitude?: number | null;
  dateFrom: string;
  dateTo: string;
  travelStyleCode: string;
  budgetStyle: string;
}

export const tripService = {
  createTrip: async (payload: CreateTripPayload) => {
    const res = await apiClient.post(ENDPOINTS.TRIPS.CREATE, payload);
    return res.data;
  },

  getActiveTrip: async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.ACTIVE);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  getUpcomingTrips: async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.UPCOMING);
      return res.data?.data?.trips || res.data?.data || [];
    } catch {
      return [];
    }
  },
};
