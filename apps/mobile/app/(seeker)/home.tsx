import { SpotCardFull, SpotCardMini, PriceBubble } from '@/components/SpotCard';
import { Colors, DARK_MAP_STYLE, Radii, Shadows, Typography } from '@/constants/Theme';
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
          customMapStyle={DARK_MAP_STYLE}
        >
          {spots.flatMap((s) => {
            const selectedHere = s.id === selectedSpotId;
            return [
              <Circle
                key={`c-${s.id}`}
                center={{ latitude: s.fuzzy_lat, longitude: s.fuzzy_lng }}
                radius={s.fuzzy_radius_meters}
                fillColor={selectedHere ? Colors.mapSelectedFill : Colors.mapCircleFill}
                strokeColor={selectedHere ? Colors.mapSelectedStroke : Colors.mapCircleStroke}
                strokeWidth={1.5}
              />,
              <Marker
                key={`m-${s.id}`}
                coordinate={{ latitude: s.fuzzy_lat, longitude: s.fuzzy_lng }}
                onPress={() => selectSpot(s.id)}
              >
                <PriceBubble
                  price={s.price_per_hour != null ? `₹${Math.round(Number(s.price_per_hour))}` : null}
                  selected={selectedHere}
                />
              </Marker>,
            ];
          })}
        </MapView>

        <SearchBar areaLabel={areaLabel} onOpenFilters={() => filterRef.current?.present()} />

        <Pressable
          style={[styles.recenter, { bottom: 120 + insets.bottom }]}
          onPress={() => {
            mapRef.current?.animateToRegion(
              { latitude, longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
              350
            );
            void refreshLocation();
          }}
        >
          <Ionicons name="locate" size={22} color={Colors.electricBright} />
        </Pressable>

        {(locLoading || isLoading) && (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.electric} />
          </View>
        )}

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <BottomSheet
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: Colors.bgSurface, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'] }}
        handleIndicatorStyle={{ backgroundColor: Colors.borderBright, width: 36 }}
      >
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
  root: { flex: 1, backgroundColor: Colors.bgBase },
  mapWrap: { flex: 1 },
  recenter: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(9,9,23,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderBright,
    ...Shadows.md,
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
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: 10,
    borderRadius: Radii.lg,
  },
  errorText: { color: Colors.danger, textAlign: 'center', ...Typography.sm },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetTitle: { ...Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  link: { ...Typography.sm, color: Colors.electricBright, fontWeight: '700' },
  linkMuted: { ...Typography.sm, color: Colors.textMuted, fontWeight: '600' },
  listPad: { paddingHorizontal: 12, paddingBottom: 32 },
});
