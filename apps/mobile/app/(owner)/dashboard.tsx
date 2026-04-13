import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSpotPhotoPublicUrl } from '@parknear/shared';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useOwnerDashboardStore } from '@/stores/ownerDashboard';

const BG = '#020617';
const CARD = '#0f172a';
const BORDER = '#334155';
const SKY = '#0ea5e9';
const EMERALD = '#10b981';

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const insets = useSafeAreaInsets();

  const { spots, stats, loading, fetchDashboard, toggleSpotActive, deleteSpot } = useOwnerDashboardStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void fetchDashboard(user.id);
    }, [user?.id, fetchDashboard])
  );

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  const onToggle = (id: string, current: boolean) => {
    setBusyId(id);
    void (async () => {
      const { error } = await toggleSpotActive(id, !current);
      setBusyId(null);
      if (error) Alert.alert('Error', error);
    })();
  };

  const onDelete = (id: string) => {
    Alert.alert('Deactivate listing?', 'You can reactivate later from Supabase or support.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            const { error } = await deleteSpot(id);
            if (error) Alert.alert('Error', error);
          })(),
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sign in to manage listings</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(100, 80 + insets.bottom) }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.greet}>Hello, {profile?.full_name ?? 'Owner'}</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable onPress={() => router.push('/(owner)/earnings')}>
              <Text style={{ color: EMERALD, fontWeight: '600' }}>Earnings</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(seeker)/home')}>
              <Text style={{ color: SKY, fontWeight: '600' }}>Find parking</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={SKY} style={{ marginVertical: 24 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            <StatCard label="Active" value={`${stats.activeListings}`} icon="car" />
            <StatCard label="Bookings (mo)" value={`${stats.totalBookingsMonth}`} icon="calendar" />
            <StatCard label="Earnings (mo)" value={`₹${Math.round(stats.monthlyEarnings)}`} icon="money" />
            <StatCard label="Avg rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} icon="star" />
          </ScrollView>
        )}

        <Text style={styles.section}>Your spots</Text>
        {spots.length === 0 ? (
          <Text style={styles.muted}>No listings yet. Tap + to create one.</Text>
        ) : (
          spots.map((spot) => {
            const thumb = spot.photos?.[0];
            return (
              <Pressable
                key={spot.id}
                style={styles.card}
                onPress={() => router.push(`/(owner)/spots/${spot.id}`)}
              >
                <View style={styles.cardRow}>
                  {thumb ? (
                    <Image
                      source={{ uri: getSpotPhotoPublicUrl(supabaseUrl, thumb) }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPh]} />
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.cardTitle}>{spot.title}</Text>
                    <Text style={styles.cardMeta}>
                      {spot.spot_type} · {spot.coverage}
                      {spot.price_per_hour != null ? ` · ₹${spot.price_per_hour}/hr` : ''}
                    </Text>
                    <Text style={styles.cardMeta}>★ {Number(spot.avg_rating).toFixed(1)}</Text>
                    <View style={styles.badgeRow}>
                      <Text style={[styles.badge, spot.is_active ? styles.badgeOn : styles.badgeOff]}>
                        {spot.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => router.push(`/(owner)/spots/${spot.id}`)}
                  >
                    <Text style={styles.actionTxt}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    disabled={busyId === spot.id}
                    onPress={() => onToggle(spot.id, spot.is_active)}
                  >
                    <Text style={styles.actionTxt}>{spot.is_active ? 'Pause' : 'Activate'}</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => onDelete(spot.id)}>
                    <Text style={[styles.actionTxt, { color: '#f87171' }]}>Deactivate</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: 28 + insets.bottom }]} onPress={() => router.push('/(owner)/spots/create')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof FontAwesome.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon} size={18} color={SKY} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12 },
  greet: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  muted: { color: '#94a3b8' },
  statsRow: { gap: 12, paddingVertical: 8 },
  statCard: {
    width: 140,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    gap: 6,
  },
  statVal: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  statLbl: { color: '#94a3b8', fontSize: 11 },
  section: { marginTop: 8, color: '#e2e8f0', fontSize: 16, fontWeight: '700' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    padding: 12,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbPh: { backgroundColor: '#1e293b' },
  cardTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  cardMeta: { color: '#94a3b8', fontSize: 13 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeOn: { backgroundColor: '#14532d', color: '#bbf7d0' },
  badgeOff: { backgroundColor: '#1e293b', color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionTxt: { color: SKY, fontWeight: '600', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    /* bottom is set dynamically via insets */
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EMERALD,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#0f172a', fontSize: 32, fontWeight: '300', marginTop: -2 },
});
