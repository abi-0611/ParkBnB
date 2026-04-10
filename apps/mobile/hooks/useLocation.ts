import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { geoMmkv } from '@/lib/storage';

const CHENNAI = { latitude: 13.0827, longitude: 80.2707 };
const MMKV_LAT = 'last_lat';
const MMKV_LNG = 'last_lng';

export type LocationPermissionStatus = Location.PermissionStatus;

export function useLocation() {
  const [latitude, setLatitude] = useState<number>(() => geoMmkv.getNumber(MMKV_LAT) ?? CHENNAI.latitude);
  const [longitude, setLongitude] = useState<number>(() => geoMmkv.getNumber(MMKV_LNG) ?? CHENNAI.longitude);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const persist = useCallback((lat: number, lng: number) => {
    geoMmkv.set(MMKV_LAT, lat);
    geoMmkv.set(MMKV_LNG, lng);
  }, []);

  const applyCoords = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      persist(lat, lng);
    },
    [persist]
  );

  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        applyCoords(CHENNAI.latitude, CHENNAI.longitude);
        setIsLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyCoords(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location error');
      applyCoords(CHENNAI.latitude, CHENNAI.longitude);
    } finally {
      setIsLoading(false);
    }
  }, [applyCoords]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        applyCoords(CHENNAI.latitude, CHENNAI.longitude);
        setIsLoading(false);
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyCoords(pos.coords.latitude, pos.coords.longitude);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location error');
      applyCoords(CHENNAI.latitude, CHENNAI.longitude);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyCoords]);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === Location.PermissionStatus.GRANTED) {
        await refreshLocation();
      } else {
        const lat = geoMmkv.getNumber(MMKV_LAT);
        const lng = geoMmkv.getNumber(MMKV_LNG);
        if (lat != null && lng != null) {
          setLatitude(lat);
          setLongitude(lng);
        } else {
          applyCoords(CHENNAI.latitude, CHENNAI.longitude);
        }
        setIsLoading(false);
      }
    })();
  }, [applyCoords, refreshLocation]);

  useEffect(() => {
    if (permissionStatus !== Location.PermissionStatus.GRANTED) return;

    void (async () => {
      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
        }
      );
    })();

    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [permissionStatus, applyCoords]);

  const usingFallback =
    permissionStatus !== null && permissionStatus !== Location.PermissionStatus.GRANTED;

  return {
    latitude,
    longitude,
    isLoading,
    error,
    permissionStatus,
    requestPermission,
    refreshLocation,
    usingFallback,
    chennaiCenter: CHENNAI,
  };
}
