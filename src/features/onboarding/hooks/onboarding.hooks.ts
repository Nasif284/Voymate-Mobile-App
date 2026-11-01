import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { getApiErrorMessage, invalidateProfileQueries } from '../../../api/queryClient';
import { useHaptics } from '../../../hooks/useHaptics';
import { useAuthStore } from '../../../store/authStore';
import {
  onboardingService,
  OnboardingTravelStylePayload,
} from '../services/onboarding.service';

export function useSetOnboardingSource(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: { source: string }) => onboardingService.setSource(payload),
    onSuccess: () => {
      haptics.success();
      setOnboarding(2, false);
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Could not save your response. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useSetOnboardingProfile(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const queryClient = useQueryClient();
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (formData: FormData) => onboardingService.setProfile(formData),
    onSuccess: () => {
      haptics.success();
      setOnboarding(3, false);
      invalidateProfileQueries(queryClient);
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Could not save your profile. Please check your information.'
      );
      options?.onError?.(message);
    },
  });
}

export function useSetOnboardingTravelStyle(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const queryClient = useQueryClient();
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: OnboardingTravelStylePayload) =>
      onboardingService.setTravelStyle(payload),
    onSuccess: () => {
      haptics.success();
      setOnboarding(3, true);
      invalidateProfileQueries(queryClient);
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Could not save your travel preferences. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useReverseGeocode(options?: {
  onSuccess?: (locData: any) => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        haptics.error();
        Alert.alert(
          'Location Permission Required',
          'Please allow Voymate to access your location in your phone settings to auto-fill your hometown.'
        );
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return onboardingService.reverseGeocode({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    onSuccess: (locData) => {
      if (locData) {
        haptics.success();
        options?.onSuccess?.(locData);
      }
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Could not detect location. Please pick your country, region, and city below.'
      );
      options?.onError?.(message);
    },
  });
}
