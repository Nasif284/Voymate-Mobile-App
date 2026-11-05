import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryClient';
import { homeService } from '../services/home.service';

const MIN_GEOCODE_DISTANCE_METERS = 250;
const MIN_SERVER_SYNC_DISTANCE_METERS = 500;
const WATCH_TIME_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
function getDistanceMeters(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Formats city/state/country into a clean pill label (e.g., "Manali, Himachal Pradesh").
 */
function formatLocationLabel(parts: {
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
}): string | null {
  const primary = parts.city || parts.district;
  const secondary = parts.state || parts.country;

  if (primary && secondary && primary !== secondary) {
    return `${primary}, ${secondary}`;
  }
  return primary || secondary || null;
}

/**
 * Resolves human-readable location using free native OS geocoder first,
 * falling back to backend reverse-geocode only if native lookup returns empty.
 */
async function resolveLocationLabel(coords: Coords): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (results && results.length > 0) {
      const place = results[0];
      const label = formatLocationLabel({
        city: place.city || place.subregion || place.district,
        district: place.district,
        state: place.region,
        country: place.country,
      });
      if (label) return label;
    }
  } catch {
    // Fallback to backend below if native geocoder fails
  }

  try {
    const fallback = await homeService.reverseGeocodeFallback(
      coords.latitude,
      coords.longitude
    );
    return formatLocationLabel(fallback);
  } catch {
    return null;
  }
}

export function useLiveLocation(isTraveling: boolean) {
  const queryClient = useQueryClient();

  const { data: liveLocation = null } = useQuery<string | null>({
    queryKey: QUERY_KEYS.liveLocation,
    queryFn: async () =>
      queryClient.getQueryData<string | null>(QUERY_KEYS.liveLocation) ?? null,
    staleTime: Infinity,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastGeocodedCoordsRef = useRef<Coords | null>(null);
  const lastSyncedCoordsRef = useRef<Coords | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopWatching = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  const processCoordinates = useCallback(
    async (coords: Coords, forceSync = false) => {
      const cachedLabel = queryClient.getQueryData<string | null>(
        QUERY_KEYS.liveLocation
      );

      const shouldGeocode =
        forceSync ||
        !cachedLabel ||
        !lastGeocodedCoordsRef.current ||
        getDistanceMeters(lastGeocodedCoordsRef.current, coords) >=
          MIN_GEOCODE_DISTANCE_METERS;

      if (shouldGeocode) {
        const label = await resolveLocationLabel(coords);
        if (label && isMountedRef.current) {
          lastGeocodedCoordsRef.current = coords;
          queryClient.setQueryData(QUERY_KEYS.liveLocation, label);
        }
      }

      const shouldSyncServer =
        forceSync ||
        !lastSyncedCoordsRef.current ||
        getDistanceMeters(lastSyncedCoordsRef.current, coords) >=
          MIN_SERVER_SYNC_DISTANCE_METERS;

      if (shouldSyncServer) {
        try {
          lastSyncedCoordsRef.current = coords;
          await homeService.updateLiveLocation(
            coords.latitude,
            coords.longitude
          );
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nearbyUsers });
        } catch {
          // Non-fatal: keep local geocoded label displayed even if network sync fails
        }
      }
    },
    [queryClient]
  );

  const startTracking = useCallback(
    async (forceSync = false) => {
      if (!isTraveling) return;

      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          perm = await Location.requestForegroundPermissionsAsync();
        }

        if (perm.status !== 'granted') {
          if (isMountedRef.current) {
            setPermissionDenied(true);
            setIsLocating(false);
          }
          stopWatching();
          return;
        }

        if (isMountedRef.current) {
          setPermissionDenied(false);
          if (!queryClient.getQueryData(QUERY_KEYS.liveLocation)) {
            setIsLocating(true);
          }
        }

        // 1. Instant fix from OS last known position (0ms if cached by OS)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords && isMountedRef.current) {
          await processCoordinates(
            {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            },
            forceSync
          );
          if (isMountedRef.current) {
            setIsLocating(false);
          }
        }

        // 2. Accurate current balanced fix
        const currentPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (currentPos?.coords && isMountedRef.current) {
          await processCoordinates(
            {
              latitude: currentPos.coords.latitude,
              longitude: currentPos.coords.longitude,
            },
            forceSync
          );
        }

        if (isMountedRef.current) {
          setIsLocating(false);
        }

        // 3. Start hardware distance-filtered foreground watcher (500m / 5m)
        stopWatching();
        if (!isMountedRef.current || !isTraveling) return;

        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: MIN_SERVER_SYNC_DISTANCE_METERS,
            timeInterval: WATCH_TIME_INTERVAL_MS,
          },
          (pos) => {
            if (!isMountedRef.current) return;
            void processCoordinates({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        );
      } catch {
        if (isMountedRef.current) {
          setIsLocating(false);
        }
      }
    },
    [isTraveling, processCoordinates, queryClient, stopWatching]
  );

  // Start/stop tracking when `isTraveling` changes
  useEffect(() => {
    if (!isTraveling) {
      stopWatching();
      setIsLocating(false);
      setPermissionDenied(false);
      return;
    }

    void startTracking();

    return () => {
      stopWatching();
    };
  }, [isTraveling, startTracking, stopWatching]);

  // Pause watcher in background and resume when returning to foreground
  useEffect(() => {
    if (!isTraveling) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void startTracking();
        } else {
          stopWatching();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isTraveling, startTracking, stopWatching]);

  const openLocationSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const refreshLiveLocation = useCallback(async () => {
    if (!isTraveling) return;
    await startTracking(true);
  }, [isTraveling, startTracking]);

  return {
    liveLocation: isTraveling ? liveLocation : null,
    isLocating: isTraveling && isLocating && !liveLocation,
    permissionDenied: isTraveling && permissionDenied,
    openLocationSettings,
    refreshLiveLocation,
  };
}
