import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { matchesService, SearchMatchParams } from '../services/matches.service';

export function useGetMatchesActiveTrip(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.activeTrip,
    queryFn: () => matchesService.getActiveTrip(),
    enabled,
  });
}

export function useGetMatchesUpcomingTrips(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.upcomingTrips,
    queryFn: () => matchesService.getUserUpcomingTrips(),
    enabled,
  });
}

export function useGetTripMatches(tripId?: string | null, page = 1, limit = 15) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEYS.tripMatches(tripId || undefined), { page, limit }],
    queryFn: async () => {
      if (!tripId) {
        return { matches: [], buddiesOnRoad: [], total: 0, page: 1, limit, totalPages: 1 };
      }
      const res = await matchesService.getTripMatches(tripId, page, limit);
      const matchItems = res.matches || [];
      const roadBuddies = res.buddiesOnRoad || [];
      const store = useConnectionStore.getState();

      store.seedFromMatches([...matchItems, ...roadBuddies]);

      if (
        matchItems.some(
          (m) => !m.connectionStatus && !m.tripMatch?.connectionStatus
        )
      ) {
        await store.syncFromServerFallback(currentUserId);
      }

      return res;
    },
    enabled: Boolean(tripId),
  });
}

export function useSearchTripMatches(params: SearchMatchParams, enabled = false) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: QUERY_KEYS.searchTripMatches(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await matchesService.searchMatches(params);
      const matchItems = res.matches || [];
      const store = useConnectionStore.getState();

      store.seedFromMatches(matchItems);

      if (
        matchItems.some(
          (m) => !m.connectionStatus && !m.tripMatch?.connectionStatus
        )
      ) {
        await store.syncFromServerFallback(currentUserId);
      }

      return res;
    },
    enabled,
  });
}
