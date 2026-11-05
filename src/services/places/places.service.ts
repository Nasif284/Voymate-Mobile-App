import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface PlaceSuggestion {
  placeId: string;
  displayName: string;
}

export interface PlaceDetails {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
}

function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let activeSessionToken: string = generateSessionToken();

export const placesService = {
  getSessionToken: () => activeSessionToken,

  resetSessionToken: () => {
    activeSessionToken = generateSessionToken();
  },

  searchPlaces: async (input: string): Promise<PlaceSuggestion[]> => {
    if (!input || input.trim().length < 2) return [];

    try {
      const res = await apiClient.post(
        ENDPOINTS.LOCATION.PLACES_AUTOCOMPLETE,
        {
          input: input.trim(),
          sessionToken: activeSessionToken,
        }
      );
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  getPlaceDetails: async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId) return null;
    const cleanId = placeId.startsWith('places/')
      ? placeId.replace('places/', '')
      : placeId;

    try {
      const res = await apiClient.get(
        ENDPOINTS.LOCATION.PLACES_DETAILS(cleanId),
        {
          params: { sessionToken: activeSessionToken },
        }
      );
      // Once details are retrieved, this autocomplete session is completed.
      // Generate a fresh session token for subsequent searches to optimize billing.
      activeSessionToken = generateSessionToken();

      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },
};
