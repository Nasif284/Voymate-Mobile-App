import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  getApiErrorMessage,
  invalidateTripQueries,
  QUERY_KEYS,
} from '../../../api/queryClient';
import { CreateTripPayload, tripService } from '../services/trip.service';
import { EditTripPayload } from '../types';

export function useGetActiveTrip(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.activeTrip,
    queryFn: () => tripService.getActiveTrip(),
    enabled,
  });
}

export function useGetUpcomingTrips(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.upcomingTrips,
    queryFn: () => tripService.getUpcomingTrips(),
    enabled,
  });
}

export function useGetPastTrips(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.pastTrips,
    queryFn: () => tripService.getPastTrips(),
    enabled,
  });
}

export function useCreateTripPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTripPayload) => tripService.createTrip(payload),
    onSuccess: () => {
      invalidateTripQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Could Not Create Trip',
        getApiErrorMessage(error, 'Failed to create trip. Please check your details.')
      );
    },
  });
}

export function useUpdateTripPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tripId, payload }: { tripId: string; payload: EditTripPayload }) =>
      tripService.updateTrip(tripId, payload),
    onSuccess: () => {
      invalidateTripQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Update Failed',
        getApiErrorMessage(error, 'Could not update trip details. Please try again.')
      );
    },
  });
}

export function useDeleteTripPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId: string) => tripService.deleteTrip(tripId),
    onSuccess: () => {
      invalidateTripQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        getApiErrorMessage(error, 'Could not delete trip. Please try again.')
      );
    },
  });
}
