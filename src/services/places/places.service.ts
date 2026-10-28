const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

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

export const placesService = {
  searchPlaces: async (input: string): Promise<PlaceSuggestion[]> => {
    if (!input || input.trim().length < 2) return [];

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.text.text',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json();
      const suggestions = data?.suggestions || [];

      return suggestions.map((s: any) => {
        const placeId = s.placePrediction?.place || '';
        // Remove 'places/' prefix if present
        const cleanId = placeId.startsWith('places/') ? placeId.replace('places/', '') : placeId;
        return {
          placeId: cleanId,
          displayName: s.placePrediction?.text?.text || '',
        };
      });
    } catch {
      return [];
    }
  },

  getPlaceDetails: async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId) return null;
    const cleanId = placeId.startsWith('places/') ? placeId.replace('places/', '') : placeId;

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${cleanId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
        },
      });

      const data = await response.json();
      if (!data?.id) return null;

      const components = data.addressComponents || [];
      const city =
        components.find((c: any) => c.types?.includes('locality'))?.longText ||
        components.find((c: any) => c.types?.includes('administrative_area_level_2'))?.longText ||
        null;

      const state =
        components.find((c: any) => c.types?.includes('administrative_area_level_1'))?.longText ||
        null;

      const country =
        components.find((c: any) => c.types?.includes('country'))?.longText ||
        null;

      const countryCode =
        components.find((c: any) => c.types?.includes('country'))?.shortText ||
        'IN';

      return {
        placeId: data.id,
        displayName: data.displayName?.text || data.formattedAddress?.split(',')[0] || '',
        formattedAddress: data.formattedAddress || '',
        city,
        state,
        country,
        countryCode,
        latitude: data.location?.latitude ?? null,
        longitude: data.location?.longitude ?? null,
      };
    } catch {
      return null;
    }
  },
};
