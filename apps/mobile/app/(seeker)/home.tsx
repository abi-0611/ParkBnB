import { SpotCardFull, SpotCardMini } from '@/components/SpotCard';
import { StrikeWarning } from '@/components/StrikeWarning';
import { LocationBanner } from '@/components/LocationBanner';
import { LocationRationaleModal } from '@/components/LocationRationaleModal';
import { SearchBar } from '@/components/SearchBar';
import { SearchFiltersSheet } from '@/components/SearchFilters';
import { SortOptions } from '@/components/SortOptions';
import { useLocation } from '@/hooks/useLocation';
import { geoMmkv } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth';
import { useSearchStore } from '@/stores/search';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet, { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

const RATIONALE_KEY = 'location_rationale_seen_v1';

export default function SeekerHomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const filterRef = useRef<BottomSheetModal>(null);

  const {
    latitude,
    longitude,
    isLoading: locLoading,
    permissionStatus,
    requestPermission,
    refreshLocation,
    usingFallback,
  } = useLocation();

  const [areaLabel, setAreaLabel] = useState('Chennai');
  const [rationaleVisible, setRationaleVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const spots = useSearchStore((s) => s.spots);
  const isLoading = useSearchStore((s) => s.isLoading);
  const error = useSearchStore((s) => s.error);
  const filters = useSearchStore((s) => s.filters);
  const sortBy = useSearchStore((s) => s.sortBy);
  const searchRadius = useSearchStore((s) => s.searchRadius);
  const selectedSpotId = useSearchStore((s) => s.selectedSpotId);
  const searchNearby = useSearchStore((s) => s.searchNearby);
  const applyFilters = useSearchStore((s) => s.applyFilters);
  const setSortBy = useSearchStore((s) => s.setSortBy);
  const clearFilters = useSearchStore((s) => s.clearFilters);
  const selectSpot = useSearchStore((s) => s.selectSpot);
  const setUserLocation = useSearchStore((s) => s.setUserLocation);

  const snapPoints = useMemo(() => ['14%', '48%', '88%'], []);

  useEffect(() => {
    if (permissionStatus == null) return;
    if (permissionStatus === Location.PermissionStatus.UNDETERMINED && !geoMmkv.getBoolean(RATIONALE_KEY)) {
      setRationaleVisible(true);
    }
  }, [permissionStatus]);

  useEffect(() => {
    void (async () => {
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const p = places[0];
        const label = [p?.district, p?.city, p?.region].filter(Boolean).join(', ') || 'Chennai';
        setAreaLabel(label);
      } catch {
        setAreaLabel('Chennai');
      }
    })();
  }, [latitude, longitude]);

  useEffect(() => {
    const t = setTimeout(() => {
      setUserLocation({ lat: latitude, lng: longitude });
      void searchNearby(latitude, longitude);
    }, 900);
    return () => clearTimeout(t);
  }, [latitude, longitude, setUserLocation, searchNearby]);

  const region: Region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    }),
    [latitude, longitude]
  );

  const onRationaleAllow = useCallback(async () => {
    geoMmkv.set(RATIONALE_KEY, true);
    setRationaleVisible(false);
    await requestPermission();
  }, [requestPermission]);

  const onRationaleNotNow = useCallback(() => {
    geoMmkv.set(RATIONALE_KEY, true);
    setRationaleVisible(false);
  }, []);

  const selected = spots.find((s) => s.id === selectedSpotId) ?? null;

  if (profile?.is_banned) {
    return (
      <View style={[styles.root, { justifyContent: 'center', padding: 24 }]}>
        <Text style={styles.sheetTitle}>Account suspended</Text>
        <Text style={{ marginTop: 8, color: '#64748b' }}>Contact support if this is a mistake.</Text>
        <Pressable style={{ marginTop: 24 }} onPress={() => void signOut()}>
          <Text style={styles.link}>{t('home.signOut')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LocationRationaleModal visible={rationaleVisible} onAllow={onRationaleAllow} onNotNow={onRationaleNotNow} />

      {profile && profile.strike_count > 0 ? <StrikeWarning strikeCount={profile.strike_count} /> : null}

      {usingFallback && !bannerDismissed ? (
        <LocationBanner
          visible
          onUseChennai={() => {
            setBannerDismissed(true);
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      <View style={[styles.mapWrap, { paddingTop: insets.top }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          showsUserLocation={permissionStatus === Location.PermissionStatus.GRANTED}
          onPress={() => selectSpot(null)}
        >
          {spots.flatMap((s) => {
            const selectedHere = s.id === selectedSpotId;
            return [
              <Circle
                key={`c-${s.id}`}
                center={{ latitude: s.fuzzy_lat, longitude: s.fuzzy_lng }}
                radius={s.fuzzy_radius_meters}
                fillColor={selectedHere ? 'rgba(14, 165, 233, 0.22)' : 'rgba(16, 185, 129, 0.15)'}
                strokeColor={selectedHere ? 'rgba(14, 165, 233, 0.55)' : 'rgba(16, 185, 129, 0.4)'}
              />,
              <Marker
                key={`m-${s.id}`}
                coordinate={{ latitude: s.fuzzy_lat, longitude: s.fuzzy_lng }}
                onPress={() => selectSpot(s.id)}
              >
                <View style={styles.priceBubble}>
                  <Text style={styles.priceBubbleText}>
                    {s.price_per_hour != null ? `₹${Math.round(Number(s.price_per_hour))}` : '—'}
                  </Text>
                </View>
              </Marker>,
            ];
          })}
        </MapView>

        <SearchBar areaLabel={areaLabel} onOpenFilters={() => filterRef.current?.present()} />

        <Pressable
          style={[styles.recenter, { bottom: 120 + insets.bottom }]}
          onPress={() => {
            mapRef.current?.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              },
              350
            );
            void refreshLocation();
          }}
        >
          <Ionicons name="locate" size={22} color="#0f172a" />
        </Pressable>

        {(locLoading || isLoading) && (
          <View style={styles.loading}>
            <ActivityIndicator color="#0ea5e9" />
          </View>
        )}

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <BottomSheet index={1} snapPoints={snapPoints} enablePanDownToClose={false}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {t('home.nearbySpots', { count: spots.length })}
          </Text>
          <View style={styles.sheetActions}>
            <Pressable onPress={() => router.push('/(seeker)/bookings')}>
              <Text style={styles.link}>{t('home.bookings')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(common)/chat')}>
              <Text style={styles.link}>{t('home.chat')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(common)/profile/kyc')}>
              <Text style={styles.link}>{t('home.kyc')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(common)/profile/emergency-contacts')}>
              <Text style={styles.link}>{t('home.sos')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(owner)/dashboard')}>
              <Text style={styles.link}>{t('home.owner')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(common)/settings')}>
              <Text style={styles.link}>{t('home.settings')}</Text>
            </Pressable>
            <Pressable onPress={() => void signOut()}>
              <Text style={styles.linkMuted}>{t('home.signOut')}</Text>
            </Pressable>
          </View>
        </View>
        <SortOptions value={sortBy} onChange={setSortBy} />
        <BottomSheetFlatList
          data={spots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          ListHeaderComponent={
            selected ? (
              <View style={{ marginBottom: 12 }}>
                <SpotCardMini spot={selected} onPress={() => selectSpot(null)} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <SpotCardFull spot={item} />}
        />
      </BottomSheet>

      <SearchFiltersSheet
        ref={filterRef}
        filters={filters}
        searchRadius={searchRadius}
        onApply={(next, r) => applyFilters(next, r)}
        onClear={() => {
          clearFilters();
          filterRef.current?.dismiss();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  mapWrap: { flex: 1 },
  priceBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceBubbleText: { fontWeight: '800', color: '#0ea5e9', fontSize: 12 },
  recenter: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  error: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
  },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  link: { color: '#0ea5e9', fontWeight: '700' },
  linkMuted: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  listPad: { paddingHorizontal: 12, paddingBottom: 32 },
});
