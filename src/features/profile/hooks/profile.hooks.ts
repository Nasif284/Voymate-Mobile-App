import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  getApiErrorMessage,
  invalidateProfileQueries,
  QUERY_KEYS,
} from '../../../api/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { profileService } from '../services/profile.service';
import { UpdatePersonalProfilePayload, UserProfileData } from '../types';

export function useGetMe(enabled = true) {
  const { user: authUser, setUser } = useAuthStore();

  return useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => {
      const profile = await profileService.getMe();
      if (profile && authUser && authUser.isTraveling !== Boolean(profile.isTraveling)) {
        setUser({ ...authUser, isTraveling: Boolean(profile.isTraveling) });
      }
      return profile;
    },
    enabled,
  });
}

/**
 * Returns the current viewer's home country from cached profile
 */
export function useViewerCountry(): string | null {
  const { data: profile } = useGetMe();
  return profile?.country ?? null;
}

export function useGetUserProfile(userId: string, enabled = true) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: QUERY_KEYS.user(userId),
    queryFn: async () => {
      const userRes = await profileService.getUserProfile(userId);
      const store = useConnectionStore.getState();

      if (userRes.connectionStatus && userRes.id) {
        store.setRelationship(
          userRes.id,
          userRes.connectionStatus,
          userRes.requestId,
          userRes.connectionId
        );
      } else if (userRes.id && !store.relationships[userRes.id]) {
        await store.syncFromServerFallback(currentUserId);
      }

      return userRes;
    },
    enabled: Boolean(userId) && enabled,
  });
}

export interface UseGetMatchProfileOptions {
  enabled?: boolean;
  sourceTripId?: string;
  mode?: 'TRIP' | 'SEARCH';
}

export function useGetMatchProfile(
  matchId?: string,
  options?: UseGetMatchProfileOptions
) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const enabled = options?.enabled ?? Boolean(matchId);
  const sourceTripId = options?.sourceTripId;
  const mode = options?.mode;

  return useQuery({
    queryKey: QUERY_KEYS.tripMatchProfile(matchId, sourceTripId, mode),
    queryFn: async () => {
      if (!matchId) {
        throw new Error('Missing matchId');
      }
      const matchRes = await profileService.getMatchProfile(matchId, {
        sourceTripId,
        mode,
      });
      const store = useConnectionStore.getState();

      const serverStatus =
        matchRes.connectionStatus || matchRes.user?.connectionStatus;
      const serverReqId =
        matchRes.requestId || matchRes.user?.requestId || null;
      const serverConnId =
        matchRes.connectionId || matchRes.user?.connectionId || null;

      if (serverStatus && matchRes.user?.id) {
        store.setRelationship(
          matchRes.user.id,
          serverStatus,
          serverReqId,
          serverConnId
        );
      } else if (matchRes.user?.id && !store.relationships[matchRes.user.id]) {
        await store.syncFromServerFallback(currentUserId);
      }

      return matchRes;
    },
    enabled: Boolean(matchId) && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useGetProfileUpcomingTrips(userId?: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.profileUpcomingTrips(userId || ''),
    queryFn: () => profileService.getUserUpcomingTrips(userId!),
    enabled: Boolean(userId) && enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (payload: UpdatePersonalProfilePayload) =>
      profileService.updateProfile(payload),
    onMutate: async (newPayload) => {
      if (newPayload.isTraveling !== undefined) {
        await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userProfile });
        const previousProfile = queryClient.getQueryData<UserProfileData>(
          QUERY_KEYS.userProfile
        );

        if (previousProfile) {
          queryClient.setQueryData<UserProfileData>(QUERY_KEYS.userProfile, {
            ...previousProfile,
            isTraveling: newPayload.isTraveling,
          });
        }

        if (authUser) {
          setUser({ ...authUser, isTraveling: newPayload.isTraveling });
        }

        return { previousProfile };
      }
      return {};
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile) {
        queryClient.setQueryData(QUERY_KEYS.userProfile, updatedProfile);
      }
      invalidateProfileQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Update Failed',
        getApiErrorMessage(error, 'Could not update profile. Please try again.')
      );
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => profileService.updateAvatar(imageUri),
    onSuccess: () => {
      invalidateProfileQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Upload Failed',
        getApiErrorMessage(error, 'Could not update profile photo. Please try again.')
      );
    },
  });
}

export function useUpdateCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => profileService.updateCover(imageUri),
    onSuccess: () => {
      invalidateProfileQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Upload Failed',
        getApiErrorMessage(error, 'Could not update cover photo. Please try again.')
      );
    },
  });
}

export function useProfileResetPassword() {
  return useMutation({
    mutationFn: ({ password, email }: { password: string; email: string }) =>
      profileService.resetPassword(password, email),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Reset Failed',
        getApiErrorMessage(error, 'Could not reset password. Please try again.')
      );
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Action Failed',
        getApiErrorMessage(error, 'Could not delete your account. Please try again later or contact support.')
      );
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => profileService.blockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.connections });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usersForCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Block Failed',
        getApiErrorMessage(error, 'Could not block traveler. Please try again.')
      );
    },
  });
}

export function useReportUser() {
  return useMutation({
    mutationFn: ({
      targetUserId,
      reason,
      details,
    }: {
      targetUserId: string;
      reason: string;
      details?: string;
    }) => profileService.reportUser(targetUserId, reason, details),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Report Failed',
        getApiErrorMessage(error, 'Could not submit report. Please try again.')
      );
    },
  });
}
