import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Radii, Shadows, Typography, Easing } from '@/constants/Theme';

type Props = {
  areaLabel: string;
  onOpenFilters: () => void;
};

export function SearchBar({ areaLabel, onOpenFilters }: Props) {
  const filterPressed = useSharedValue(0);

  const filterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(filterPressed.value ? 0.88 : 1, Easing.bouncy) }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        {/* Search icon + label */}
        <View style={styles.searchIcon}>
          <Ionicons name="search" size={15} color={Colors.electricBright} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {areaLabel}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Filters button */}
        <Animated.View style={filterStyle}>
        <Pressable
          style={styles.filterBtn}
          onPressIn={() => { filterPressed.value = 1; }}
          onPressOut={() => { filterPressed.value = 0; }}
          onPress={onOpenFilters}
          hitSlop={8}
          accessibilityLabel="Open filters"
        >
          <Ionicons name="options-outline" size={17} color={Colors.textSecondary} />
          <Text style={styles.filterLabel}>Filters</Text>
        </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(9, 9, 23, 0.85)',
    borderRadius: Radii['2xl'],
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  searchIcon: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: `${Colors.electric}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    ...Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.electric}10`,
    borderRadius: Radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${Colors.electric}25`,
  },
  filterLabel: {
    ...Typography.xs,
    fontWeight: '700',
    color: Colors.electricBright,
  },
});
