import type { SearchFiltersState } from '@/stores/search';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

type Props = {
  filters: SearchFiltersState;
  searchRadius: number;
  onApply: (next: SearchFiltersState, radius: number) => void;
  onClear: () => void;
};

const SPOT_TYPES: { key: NonNullable<SearchFiltersState['spotType']>; label: string }[] = [
  { key: 'car', label: 'Car' },
  { key: 'bike', label: 'Bike' },
  { key: 'ev_charging', label: 'EV' },
];

const COVERAGE: { key: NonNullable<SearchFiltersState['coverage']>; label: string }[] = [
  { key: 'covered', label: 'Covered' },
  { key: 'open', label: 'Open' },
  { key: 'underground', label: 'Underground' },
];

const VSIZE: { key: NonNullable<SearchFiltersState['vehicleSize']>; label: string }[] = [
  { key: 'hatchback', label: 'Hatchback' },
  { key: 'sedan', label: 'Sedan' },
  { key: 'suv', label: 'SUV' },
];

const PRICES = [null, 30, 50, 100, 200] as const;
const RADII = [500, 1000, 2000, 5000] as const;

export const SearchFiltersSheet = forwardRef<BottomSheetModal, Props>(function SearchFiltersSheet(
  { filters, searchRadius, onApply, onClear },
  ref
) {
  const [local, setLocal] = useState(filters);
  const [radius, setRadius] = useState(searchRadius);

  const snapPoints = useMemo(() => ['88%'], []);

  const syncFromProps = useCallback(() => {
    setLocal(filters);
    setRadius(searchRadius);
  }, [filters, searchRadius]);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={(index) => {
        if (index >= 0) syncFromProps();
      }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Filters</Text>

        <Text style={styles.section}>Vehicle</Text>
        <View style={styles.chips}>
          <Chip label="Any" active={local.spotType == null} onPress={() => setLocal((s) => ({ ...s, spotType: null }))} />
          {SPOT_TYPES.map((x) => (
            <Chip
              key={x.key}
              label={x.label}
              active={local.spotType === x.key}
              onPress={() => setLocal((s) => ({ ...s, spotType: x.key }))}
            />
          ))}
        </View>

        <Text style={styles.section}>Coverage</Text>
        <View style={styles.chips}>
          <Chip label="Any" active={local.coverage == null} onPress={() => setLocal((s) => ({ ...s, coverage: null }))} />
          {COVERAGE.map((x) => (
            <Chip
              key={x.key}
              label={x.label}
              active={local.coverage === x.key}
              onPress={() => setLocal((s) => ({ ...s, coverage: x.key }))}
            />
          ))}
        </View>

        <Text style={styles.section}>Max price / hr</Text>
        <View style={styles.chips}>
          {PRICES.map((p) => (
            <Chip
              key={String(p)}
              label={p == null ? 'Any' : `₹${p}`}
              active={local.maxPricePerHour === p}
              onPress={() => setLocal((s) => ({ ...s, maxPricePerHour: p }))}
            />
          ))}
        </View>

        <Text style={styles.section}>Vehicle size</Text>
        <View style={styles.chips}>
          <Chip
            label="Any"
            active={local.vehicleSize == null}
            onPress={() => setLocal((s) => ({ ...s, vehicleSize: null }))}
          />
          {VSIZE.map((x) => (
            <Chip
              key={x.key}
              label={x.label}
              active={local.vehicleSize === x.key}
              onPress={() => setLocal((s) => ({ ...s, vehicleSize: x.key }))}
            />
          ))}
        </View>

        <Text style={styles.section}>Rating</Text>
        <View style={styles.chips}>
          <Chip label="Any" active={local.minRating == null} onPress={() => setLocal((s) => ({ ...s, minRating: null }))} />
          <Chip label="3+" active={local.minRating === 3} onPress={() => setLocal((s) => ({ ...s, minRating: 3 }))} />
          <Chip label="4+" active={local.minRating === 4} onPress={() => setLocal((s) => ({ ...s, minRating: 4 }))} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>EV amenities (client filter)</Text>
          <Switch
            value={local.hasEVCharging}
            onValueChange={(v) => setLocal((s) => ({ ...s, hasEVCharging: v }))}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Instant book only</Text>
          <Switch
            value={local.isInstantBook === true}
            onValueChange={(v) => setLocal((s) => ({ ...s, isInstantBook: v ? true : null }))}
          />
        </View>

        <Text style={styles.section}>Search radius</Text>
        <View style={styles.chips}>
          {RADII.map((r) => (
            <Chip
              key={r}
              label={r < 1000 ? `${r} m` : `${r / 1000} km`}
              active={radius === r}
              onPress={() => setRadius(r)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply(local, radius);
            }}
            style={styles.applyBtn}
          >
            <Text style={styles.applyText}>Apply filters</Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipTx, active && styles.chipTxOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  heading: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  section: { marginTop: 12, fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  chipOn: { backgroundColor: '#0ea5e9' },
  chipTx: { fontWeight: '700', color: '#475569', fontSize: 13 },
  chipTxOn: { color: '#f8fafc' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
  toggleLabel: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  clearText: { color: '#64748b', fontWeight: '700' },
  applyBtn: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: { color: '#f8fafc', fontWeight: '800', fontSize: 15 },
});
