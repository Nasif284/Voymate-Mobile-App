import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryClient';
import { placesService } from './places.service';

export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function usePlacesAutocomplete(searchQuery: string, enabled = true) {
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 350);

  return useQuery({
    queryKey: QUERY_KEYS.placesAutocomplete(debouncedQuery),
    queryFn: () => placesService.searchPlaces(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10, // Cache autocomplete results for 10 minutes
  });
}

export function usePlaceDetailsMutation() {
  return useMutation({
    mutationFn: (placeId: string) => placesService.getPlaceDetails(placeId),
  });
}
