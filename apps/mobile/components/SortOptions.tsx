import type { SeekerSortKey } from '@parknear/shared';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const OPTIONS: { key: SeekerSortKey; label: string }[] = [
  { key: 'distance', label: 'Nearest' },
  { key: 'price_low', label: 'Price ↑' },
  { key: 'price_high', label: 'Price ↓' },
  { key: 'rating', label: 'Top rated' },
];

type Props = {
  value: SeekerSortKey;
  onChange: (v: SeekerSortKey) => void;
};

export function SortOptions({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#0ea5e9' },
  chipText: { fontWeight: '700', fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#f8fafc' },
});
