import type { SearchSpotsResult } from '@parknear/shared';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function formatInr(n: string | number | null | undefined) {
  if (n == null) return null;
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return null;
  return `₹${Math.round(num)}`;
}

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

type MiniProps = {
  spot: SearchSpotsResult;
  onPress?: () => void;
};

function SpotCardMiniBase({ spot, onPress }: MiniProps) {
  const router = useRouter();
  const photo = spot.photos[0];
  const price = formatInr(spot.price_per_hour);

  return (
    <Pressable
      style={styles.miniWrap}
      onPress={() => {
        onPress?.();
        router.push(`/(seeker)/spot/${spot.id}`);
      }}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.miniThumb} contentFit="cover" transition={120} />
      ) : (
        <View style={[styles.miniThumb, styles.miniPlaceholder]} />
      )}
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle} numberOfLines={1}>
          {spot.title}
        </Text>
        <Text style={styles.miniRow}>
          {price ? `${price}/hr` : '—'} · {formatDistance(spot.distance_meters)} · ★{' '}
          {typeof spot.avg_rating === 'number' ? spot.avg_rating : Number(spot.avg_rating) || '—'}
        </Text>
      </View>
    </Pressable>
  );
}

type FullProps = {
  spot: SearchSpotsResult;
};

function SpotCardFullBase({ spot }: FullProps) {
  const router = useRouter();
  const hero = spot.photos[0];
  const rating = typeof spot.avg_rating === 'number' ? spot.avg_rating : Number(spot.avg_rating);

  return (
    <Pressable style={styles.fullWrap} onPress={() => router.push(`/(seeker)/spot/${spot.id}`)}>
      {hero ? (
        <Image source={{ uri: hero }} style={styles.hero} contentFit="cover" transition={120} />
      ) : (
        <View style={[styles.hero, styles.placeholder]} />
      )}
      <View style={styles.fullBody}>
        <Text style={styles.fullTitle}>{spot.title}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{spot.spot_type}</Text>
          <Text style={styles.badge}>{spot.coverage}</Text>
          <Text style={styles.badge}>{spot.vehicle_size}</Text>
        </View>
        <Text style={styles.landmark}>
          ~{formatDistance(spot.distance_meters)} · {spot.fuzzy_landmark || 'Chennai'}
        </Text>
        <Text style={styles.priceRow}>
          {[formatInr(spot.price_per_hour) && `${formatInr(spot.price_per_hour)}/hr`, formatInr(spot.price_per_day) && `${formatInr(spot.price_per_day)}/day`, formatInr(spot.price_per_month) && `${formatInr(spot.price_per_month)}/mo`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>
            ★ {Number.isFinite(rating) ? rating.toFixed(1) : '—'} ({spot.total_reviews})
          </Text>
          {spot.is_instant_book ? <Text style={styles.instant}>Instant Book</Text> : null}
        </View>
        <Pressable style={styles.bookBtn} onPress={() => router.push(`/(seeker)/spot/${spot.id}`)}>
          <Text style={styles.bookBtnText}>View details</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const SpotCardMini = memo(SpotCardMiniBase);
export const SpotCardFull = memo(SpotCardFullBase);

const styles = StyleSheet.create({
  miniWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  miniThumb: { width: 80, height: 80, backgroundColor: '#e2e8f0' },
  miniPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  miniBody: { flex: 1, padding: 10, justifyContent: 'center', gap: 4 },
  miniTitle: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  miniRow: { fontSize: 13, color: '#64748b' },
  fullWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  hero: { width: '100%', height: 180, backgroundColor: '#e2e8f0' },
  placeholder: {},
  fullBody: { padding: 14, gap: 8 },
  fullTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  landmark: { color: '#64748b', fontSize: 14 },
  priceRow: { color: '#0ea5e9', fontWeight: '700', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rating: { color: '#0f172a', fontWeight: '600' },
  instant: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookBtn: {
    marginTop: 4,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookBtnText: { color: '#f8fafc', fontWeight: '800', fontSize: 15 },
});
