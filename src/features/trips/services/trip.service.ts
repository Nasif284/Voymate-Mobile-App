import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { UserTrip, EditTripPayload } from '../types';

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

  getActiveTrip: async (): Promise<UserTrip | null> => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.ACTIVE);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  getUpcomingTrips: async (): Promise<UserTrip[]> => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.UPCOMING);
      const data = res.data?.data;
      if (Array.isArray(data?.trips)) return data.trips;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  getPastTrips: async (): Promise<UserTrip[]> => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.PAST);
      const data = res.data?.data;
      if (Array.isArray(data?.trips)) return data.trips;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  updateTrip: async (tripId: string, payload: EditTripPayload): Promise<any> => {
    const res = await apiClient.patch(ENDPOINTS.TRIPS.UPDATE(tripId), payload);
    return res.data?.data || res.data;
  },

  deleteTrip: async (tripId: string): Promise<any> => {
    const res = await apiClient.patch(ENDPOINTS.TRIPS.DELETE(tripId));
    return res.data?.data || res.data;
  },
};
