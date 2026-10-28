import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { ActiveTrip, TripMatchesResponse } from '../types';

export interface SearchMatchParams {
  destinationName?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  dateFrom?: string;
  dateTo?: string;
  travelStyle?: string;
  budgetStyle?: string;
  page?: number;
  limit?: number;
}

export const matchesService = {
  getActiveTrip: async (): Promise<ActiveTrip | null> => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.ACTIVE);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  getUserUpcomingTrips: async (): Promise<ActiveTrip[]> => {
    try {
      const res = await apiClient.get(ENDPOINTS.TRIPS.UPCOMING);
      return res.data?.data?.trips || res.data?.data || [];
    } catch {
      return [];
    }
  },

  getTripMatches: async (tripId: string, page = 1, limit = 10): Promise<TripMatchesResponse> => {
    const res = await apiClient.get(ENDPOINTS.TRIPS.MATCHES(tripId), {
      params: { page, limit },
    });
    return res.data?.data || { matches: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  searchMatches: async (params: SearchMatchParams): Promise<TripMatchesResponse> => {
    const res = await apiClient.get(ENDPOINTS.TRIPS.SEARCH_MATCHES, {
      params,
    });
    return res.data?.data || { matches: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  getAllMatches: async (page = 1, limit = 10): Promise<TripMatchesResponse> => {
    const res = await apiClient.get(ENDPOINTS.TRIPS.ALL_MATCHES, {
      params: { page, limit },
    });
    return res.data?.data || { matches: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },
};
