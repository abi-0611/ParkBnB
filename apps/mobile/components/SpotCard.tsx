import type { SearchSpotsResult } from '@parknear/shared';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Typography, Easing } from '@/constants/Theme';

function formatInr(n: string | number | null | undefined): string | null {
  if (n == null) return null;
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return null;
  return `₹${Math.round(num)}`;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// ─── Mini spot card (selected pin preview) ──────────────────
type MiniProps = { spot: SearchSpotsResult; onPress?: () => void };

function SpotCardMiniBase({ spot, onPress }: MiniProps) {
  const router  = useRouter();
  const photo   = spot.photos[0];
  const price   = formatInr(spot.price_per_hour);
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, Easing.snappy) }],
  }));

  return (
    <Animated.View style={animStyle}>
    <Pressable
      style={styles.miniWrap}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={() => {
        onPress?.();
        router.push(`/(seeker)/spot/${spot.id}`);
      }}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.miniThumb} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.miniThumb, styles.miniPlaceholder]}>
          <Ionicons name="car-outline" size={24} color={Colors.textDisabled} />
        </View>
      )}
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle} numberOfLines={1}>{spot.title}</Text>
        <View style={styles.miniMeta}>
          {price ? (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>{price}/hr</Text>
            </View>
          ) : null}
          <Text style={styles.miniSub}>
            {formatDistance(spot.distance_meters)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
    </Pressable>
    </Animated.View>
  );
}

// ─── Full spot card (list) ──────────────────────────────────
type FullProps = { spot: SearchSpotsResult };

function SpotCardFullBase({ spot }: FullProps) {
  const router  = useRouter();
  const hero    = spot.photos[0];
  const rating  = typeof spot.avg_rating === 'number' ? spot.avg_rating : Number(spot.avg_rating);
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, Easing.snappy) }],
  }));

  const priceLabel = [
    formatInr(spot.price_per_hour) ? `${formatInr(spot.price_per_hour)}/hr` : null,
    formatInr(spot.price_per_day)  ? `${formatInr(spot.price_per_day)}/day` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Animated.View style={animStyle}>
    <Pressable
      style={styles.fullWrap}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={() => router.push(`/(seeker)/spot/${spot.id}`)}
    >
      {/* Hero image */}
      <View style={styles.heroWrap}>
        {hero ? (
          <Image source={{ uri: hero }} style={styles.hero} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.hero, styles.placeholder]}>
            <Ionicons name="car-outline" size={36} color={Colors.textDisabled} />
          </View>
        )}
        {/* Price overlay */}
        {priceLabel ? (
          <View style={styles.priceOverlay}>
            <Text style={styles.priceOverlayText}>{priceLabel}</Text>
          </View>
        ) : null}
        {/* Instant book badge */}
        {spot.is_instant_book ? (
          <View style={styles.instantBadge}>
            <Ionicons name="flash" size={10} color="#fff" />
            <Text style={styles.instantText}>Instant</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.fullBody}>
        <View style={styles.titleRow}>
          <Text style={styles.fullTitle} numberOfLines={1}>{spot.title}</Text>
          {Number.isFinite(rating) ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={Colors.warning} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {spot.fuzzy_landmark ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.landmark} numberOfLines={1}>{spot.fuzzy_landmark}</Text>
            <Text style={styles.distText}>{formatDistance(spot.distance_meters)}</Text>
          </View>
        ) : null}

        {/* Type badges */}
        <View style={styles.badgeRow}>
          {[spot.spot_type, spot.coverage, spot.vehicle_size].filter(Boolean).map((b) => (
            <View key={b} style={styles.badge}>
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Book button */}
        <Pressable
          style={styles.bookBtn}
          onPress={() => router.push(`/(seeker)/spot/${spot.id}`)}
        >
          <Text style={styles.bookBtnText}>View & Book</Text>
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
    </Animated.View>
  );
}

export const SpotCardMini = memo(SpotCardMiniBase);
export const SpotCardFull = memo(SpotCardFullBase);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Mini
  miniWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 12,
    ...Shadows.card,
  },
  miniThumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
  miniPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  miniBody: { flex: 1, gap: 6 },
  miniTitle: { ...Typography.base, fontWeight: '700', color: Colors.textPrimary },
  miniMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniSub:  { ...Typography.sm, color: Colors.textMuted },
  pricePill: {
    backgroundColor: `${Colors.electric}1F`,
    borderWidth: 1,
    borderColor: `${Colors.electric}40`,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pricePillText: { ...Typography.xs, fontWeight: '800', color: Colors.electricBright },

  // Full card
  fullWrap: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii['2xl'],
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 190, backgroundColor: Colors.bgElevated },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  priceOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(5,5,14,0.85)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.electric}40`,
  },
  priceOverlayText: {
    ...Typography.sm,
    fontWeight: '800',
    color: Colors.electricBright,
  },
  instantBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emerald,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  instantText: { ...Typography.xs, fontWeight: '800', color: '#fff' },

  fullBody: { padding: 14, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  fullTitle: { ...Typography.lg, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${Colors.warning}18`,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: { ...Typography.xs, fontWeight: '800', color: Colors.warning },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  landmark: { ...Typography.sm, color: Colors.textMuted, flex: 1 },
  distText:  { ...Typography.sm, fontWeight: '700', color: Colors.electric },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: `${Colors.electric}14`,
    borderWidth: 1,
    borderColor: `${Colors.electric}28`,
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { ...Typography.xs, fontWeight: '700', color: Colors.electricBright, textTransform: 'capitalize' },

  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: Colors.electric,
    paddingVertical: 13,
    borderRadius: Radii.lg,
  },
  bookBtnText: { ...Typography.base, fontWeight: '800', color: '#fff' },
});

// ─── Price bubble (map marker) ──────────────────────────────
export function PriceBubble({ price, selected }: { price: string | null; selected: boolean }) {
  return (
    <View
      style={[
        bubbleStyles.wrap,
        selected && bubbleStyles.selectedWrap,
      ]}
    >
      <Text style={[bubbleStyles.text, selected && bubbleStyles.selectedText]}>
        {price ?? '—'}
      </Text>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  selectedWrap: {
    backgroundColor: Colors.electric,
    borderColor: Colors.electricBright,
    ...Shadows.md,
  },
  text: {
    fontWeight: '800',
    color: Colors.electricBright,
    fontSize: 12,
  },
  selectedText: { color: '#fff' },
});
