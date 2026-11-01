import { Alert } from 'react-native';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  getApiErrorMessage,
  invalidateProfileQueries,
  QUERY_KEYS,
} from '../../../api/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { homeService } from '../services/home.service';
import { UserWithDetails } from '../types';

export function useGetUsersForCardsInfinite(pageSize = 8) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.usersForCards, pageSize],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await homeService.getUsersForCards(pageParam, pageSize, true);
      const users: UserWithDetails[] = res?.users || [];
      const store = useConnectionStore.getState();

      store.seedFromUsers(users);
      if (users.some((u) => u.connectionStatus === undefined)) {
        await store.syncFromServerFallback(currentUserId);
      }

      return {
        users,
        page: res?.page || pageParam,
        totalPages: res?.totalPages || 1,
        total: res?.total || users.length,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages && lastPage.users.length > 0) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useGetNearbyUsers(radiusKm = 50, enabled = false) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEYS.nearbyUsers, radiusKm],
    queryFn: async () => {
      const res = await homeService.getNearbyUsers(1, 10, radiusKm);
      const activeNearby: UserWithDetails[] = (res?.users || []).filter(
        (u: UserWithDetails) => u.isTraveling !== false
      );
      const store = useConnectionStore.getState();

      store.seedFromUsers(activeNearby);
      if (activeNearby.some((u) => u.connectionStatus === undefined)) {
        await store.syncFromServerFallback(currentUserId);
      }

      return activeNearby;
    },
    enabled,
  });
}

export function useToggleTravelingStatus() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({
      isTraveling,
      currentProfile,
    }: {
      isTraveling: boolean;
      currentProfile?: unknown;
    }) => homeService.updateTravelingStatus(isTraveling, currentProfile),
    onMutate: async ({ isTraveling }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userProfile });
      const previousProfile = queryClient.getQueryData<Record<string, unknown>>(
        QUERY_KEYS.userProfile
      );

      if (previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.userProfile, {
          ...previousProfile,
          isTraveling,
        });
      }

      if (authUser) {
        setUser({ ...authUser, isTraveling });
      }

      return { previousProfile };
    },
    onSuccess: (_res, { isTraveling }) => {
      invalidateProfileQueries(queryClient);
      if (isTraveling) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.userProfile, context.previousProfile);
        if (authUser) {
          setUser({
            ...authUser,
            isTraveling: Boolean(context.previousProfile.isTraveling),
          });
        }
      }
      Alert.alert(
        'Status Update Failed',
        getApiErrorMessage(error, 'Could not update your traveling status. Please try again.')
      );
    },
  });
}
