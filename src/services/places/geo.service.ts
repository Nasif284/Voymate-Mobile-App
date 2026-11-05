import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { QUERY_KEYS } from '../../api/queryClient';
import { SelectOption } from '../../components/ui/SearchableSelectModal';

export interface CatalogCountry {
  code: string;
  name: string;
  flag: string;
}

export interface CatalogState {
  code: string;
  name: string;
}

export const geoService = {
  getCountries: async (): Promise<CatalogCountry[]> => {
    const res = await apiClient.get<{ success: boolean; data: CatalogCountry[] }>(
      ENDPOINTS.LOCATION.CATALOG_COUNTRIES
    );
    return res.data?.data || [];
  },

  getStates: async (countryCode: string): Promise<CatalogState[]> => {
    if (!countryCode) return [];
    const res = await apiClient.get<{ success: boolean; data: CatalogState[] }>(
      ENDPOINTS.LOCATION.CATALOG_STATES,
      { params: { countryCode } }
    );
    return res.data?.data || [];
  },

  getCities: async (countryCode: string, stateCode: string): Promise<string[]> => {
    if (!countryCode || !stateCode) return [];
    const res = await apiClient.get<{ success: boolean; data: string[] }>(
      ENDPOINTS.LOCATION.CATALOG_CITIES,
      { params: { countryCode, stateCode } }
    );
    return res.data?.data || [];
  },
};

/**
 * Hook to fetch all countries (cached indefinitely in TanStack Query)
 */
export function useGeoCountries() {
  return useQuery({
    queryKey: QUERY_KEYS.geoCountries,
    queryFn: geoService.getCountries,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    select: (countries): SelectOption[] =>
      countries.map((c) => ({
        label: `${c.flag ? `${c.flag} ` : ''}${c.name}`,
        value: c.code,
        sublabel: c.name,
      })),
  });
}

/**
 * Hook to fetch states of a country (cached indefinitely)
 */
export function useGeoStates(countryCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.geoStates(countryCode),
    queryFn: () => geoService.getStates(countryCode),
    enabled: Boolean(countryCode),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    select: (states): SelectOption[] =>
      states.map((s) => ({
        label: s.name,
        value: s.code,
        sublabel: s.code,
      })),
  });
}

/**
 * Hook to fetch cities of a state (cached indefinitely)
 */
export function useGeoCities(countryCode: string, stateCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.geoCities(countryCode, stateCode),
    queryFn: () => geoService.getCities(countryCode, stateCode),
    enabled: Boolean(countryCode && stateCode),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    select: (cities): SelectOption[] =>
      cities.map((cityName) => ({
        label: cityName,
        value: cityName,
      })),
  });
}
