import { AppState, AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { AxiosError } from 'axios';

// 1. AppState Focus Manager:
// Automatically informs TanStack Query when the mobile app transitions between foreground/background.
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', onAppStateChange);

// 2. Network Awareness (NetInfo):
// Automatically pauses queries when offline and resumes/refetches when connection is restored.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

// 3. Persisted Offline Cache (AsyncStorage):
// Persists query cache to disk for instant 0 ms cold boot rendering.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'VOYMATE_QUERY_CACHE',
  throttleTime: 1000,
});

export async function clearPersistedQueryCache(): Promise<void> {
  try {
    await asyncStoragePersister.removeClient();
  } catch (err) {
    if (__DEV__) {
      console.warn('Failed to clear persisted query cache:', err);
    }
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (for persistence)
      refetchOnWindowFocus: true, // Auto-refetch stale queries when app returns to foreground
      refetchOnReconnect: true, // Auto-refetch stale queries when device regains network
    },
  },
});

export const QUERY_KEYS = {
  userProfile: ['user_profile'] as const,
  profileSettings: ['profile_settings'] as const,
  user: (userId: string) => ['user', userId] as const,
  profileUpcomingTrips: (userId: string) => ['profile_upcoming_trips', userId] as const,
  usersForCards: ['users_for_cards'] as const,
  nearbyUsers: ['nearby_users'] as const,
  activeTrip: ['active_trip'] as const,
  upcomingTrips: ['upcoming_trips'] as const,
  pastTrips: ['past_trips'] as const,
  tripMatches: (tripId?: string) =>
    tripId ? (['trip_matches', tripId] as const) : (['trip_matches'] as const),
  tripMatchProfile: (matchId?: string, sourceTripId?: string, mode?: string) =>
    matchId
      ? (['trip_match_profile', matchId, mode || 'TRIP', sourceTripId || ''] as const)
      : (['trip_match_profile'] as const),
  searchTripMatches: (params?: Record<string, unknown>) =>
    params ? (['search_trip_matches', params] as const) : (['search_trip_matches'] as const),
  connections: ['connections'] as const,
  incomingRequests: ['incoming_requests'] as const,
  sentRequests: ['sent_requests'] as const,
  allRequests: ['all_requests'] as const,
  conversations: ['conversations'] as const,
  directChat: (targetUserId: string) => ['direct_chat', targetUserId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  placesAutocomplete: (search: string) => ['places_autocomplete', search] as const,
  liveLocation: ['live_location'] as const,
  geoCountries: ['geo_countries'] as const,
  geoStates: (countryCode: string) => ['geo_states', countryCode] as const,
  geoCities: (countryCode: string, stateCode: string) => ['geo_cities', countryCode, stateCode] as const,
} as const;

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message || data?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function invalidateRelationshipQueries(client: QueryClient = queryClient): void {
  client.invalidateQueries({ queryKey: QUERY_KEYS.allRequests });
  client.invalidateQueries({ queryKey: QUERY_KEYS.incomingRequests });
  client.invalidateQueries({ queryKey: QUERY_KEYS.sentRequests });
  client.invalidateQueries({ queryKey: QUERY_KEYS.connections });
  client.invalidateQueries({ queryKey: QUERY_KEYS.usersForCards });
  client.invalidateQueries({ queryKey: QUERY_KEYS.nearbyUsers });
  client.invalidateQueries({ queryKey: ['user'] });
  client.invalidateQueries({ queryKey: QUERY_KEYS.tripMatchProfile() });
  client.invalidateQueries({ queryKey: QUERY_KEYS.tripMatches() });
  client.invalidateQueries({ queryKey: QUERY_KEYS.searchTripMatches() });
}

export function invalidateTripQueries(client: QueryClient = queryClient): void {
  client.invalidateQueries({ queryKey: QUERY_KEYS.activeTrip });
  client.invalidateQueries({ queryKey: QUERY_KEYS.upcomingTrips });
  client.invalidateQueries({ queryKey: QUERY_KEYS.pastTrips });
  client.invalidateQueries({ queryKey: ['profile_upcoming_trips'] });
  client.invalidateQueries({ queryKey: QUERY_KEYS.tripMatches() });
  client.invalidateQueries({ queryKey: QUERY_KEYS.usersForCards });
}

export function invalidateProfileQueries(client: QueryClient = queryClient): void {
  client.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
  client.invalidateQueries({ queryKey: QUERY_KEYS.usersForCards });
  client.invalidateQueries({ queryKey: QUERY_KEYS.nearbyUsers });
}
