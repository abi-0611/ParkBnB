import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  areaLabel: string;
  onOpenFilters: () => void;
};

export function SearchBar({ areaLabel, onOpenFilters }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Ionicons name="search" size={18} color="#64748b" />
        <Text style={styles.label} numberOfLines={1}>
          {areaLabel}
        </Text>
        <Pressable onPress={onOpenFilters} hitSlop={10} accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={22} color="#0f172a" />
        </Pressable>
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
    zIndex: 2,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a' },
});
