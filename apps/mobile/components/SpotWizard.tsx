import { spotSchema } from '@parknear/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { SpotImagePicker } from '@/components/ImagePicker';
import { SpotPreview } from '@/components/SpotPreview';
import { defaultRegion, reverseGeocode } from '@/lib/geocoding';
import { supabase } from '@/lib/supabase';
import { AMENITY_OPTIONS, useCreateSpotStore } from '@/stores/createSpot';
import { useAuthStore } from '@/stores/auth';

import type { SpotType, Coverage, VehicleSize } from '@parknear/shared';

const BG = '#020617';
const CARD = '#0f172a';
const BORDER = '#334155';
const SKY = '#0ea5e9';
const EMERALD = '#10b981';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toTimeSql(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function buildAvailabilityRows(
  spotId: string,
  s: ReturnType<typeof useCreateSpotStore.getState>
) {
  const days = s.availableAllDay ? [0, 1, 2, 3, 4, 5, 6] : s.activeDays;
  const start = s.availableAllDay ? '00:00:00' : toTimeSql(s.startTime);
  const end = s.availableAllDay ? '23:59:59' : toTimeSql(s.endTime);
  return days.map((day_of_week) => ({
    spot_id: spotId,
    day_of_week,
    start_time: start,
    end_time: end,
    is_recurring: true,
    specific_date: null as string | null,
  }));
}

type Props = { mode: 'create' | 'edit' };

export function SpotWizard({ mode }: Props) {
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const spotId = typeof routeId === 'string' ? routeId : Array.isArray(routeId) ? routeId[0] : undefined;

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

  const s = useCreateSpotStore();
  const hydrate = useCreateSpotStore((st) => st.hydrate);
  const reset = useCreateSpotStore((st) => st.reset);

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      reset();
    }
  }, [mode, reset]);

  useEffect(() => {
    if (mode !== 'edit' || !spotId) return;
    let cancelled = false;
    void (async () => {
      const { data, error: e } = await supabase.rpc('get_spot_for_owner_edit', { p_id: spotId });
      if (cancelled) return;
      if (e || !data) {
        setError(e?.message ?? 'Not found');
        setLoading(false);
        return;
      }
      const row = (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, unknown>;
      hydrate({
        step: 1,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        addressLine: String(row.address_line ?? ''),
        landmark: String(row.landmark ?? ''),
        pincode: String(row.pincode ?? ''),
        fuzzyLandmark: String(row.fuzzy_landmark ?? ''),
        fuzzyRadiusMeters: Number(row.fuzzy_radius_meters ?? 500),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        spotType: row.spot_type as SpotType,
        coverage: row.coverage as Coverage,
        vehicleSize: row.vehicle_size as VehicleSize,
        totalSlots: Number(row.total_slots ?? 1),
        amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
        photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
        videoUrl: String(row.video_url ?? ''),
        priceHour: row.price_per_hour != null ? String(row.price_per_hour) : '',
        priceDay: row.price_per_day != null ? String(row.price_per_day) : '',
        priceMonth: row.price_per_month != null ? String(row.price_per_month) : '',
        instantBook: Boolean(row.is_instant_book),
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, spotId, hydrate]);

  const region = useMemo(() => {
    if (s.latitude != null && s.longitude != null) {
      return {
        latitude: s.latitude,
        longitude: s.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return defaultRegion();
  }, [s.latitude, s.longitude]);

  const onMapPress = async (lat: number, lng: number) => {
    hydrate({ latitude: lat, longitude: lng });
    const geo = await reverseGeocode(lat, lng);
    hydrate({
      addressLine: geo.addressLine,
      pincode: geo.pincode || s.pincode,
      landmark: s.landmark || geo.landmark,
    });
  };

  const validateForSubmit = () => {
    const ph = parseFloat(s.priceHour);
    const pd = parseFloat(s.priceDay);
    const pm = parseFloat(s.priceMonth);
    const hasPrice = [ph, pd, pm].some((x) => Number.isFinite(x) && x > 0);
    if (!hasPrice) return 'Set at least one price (hourly, daily, or monthly).';
    if (s.photos.length < 2) return 'Add at least 2 photos.';
    if (s.latitude == null || s.longitude == null) return 'Choose a location on the map.';
    const parsed = spotSchema.safeParse({
      title: s.title,
      description: s.description || undefined,
      spot_type: s.spotType,
      coverage: s.coverage,
      vehicle_size: s.vehicleSize,
      total_slots: s.totalSlots,
      address_line: s.addressLine,
      landmark: s.landmark || undefined,
      pincode: s.pincode || undefined,
      fuzzy_landmark: s.fuzzyLandmark,
      fuzzy_radius_meters: s.fuzzyRadiusMeters,
      price_per_hour: Number.isFinite(ph) ? ph : undefined,
      price_per_day: Number.isFinite(pd) ? pd : undefined,
      price_per_month: Number.isFinite(pm) ? pm : undefined,
      is_instant_book: s.instantBook,
      amenities: s.amenities,
      photos: s.photos,
      video_url: s.videoUrl.trim() ? s.videoUrl.trim() : null,
    });
    if (!parsed.success) return parsed.error.errors[0]?.message ?? 'Invalid form';
    return null;
  };

  const persistAvailability = async (id: string) => {
    await supabase.from('availability').delete().eq('spot_id', id);
    const rows = buildAvailabilityRows(id, useCreateSpotStore.getState());
    const { error: ae } = await supabase.from('availability').insert(rows);
    if (ae) throw ae;
  };

  const onSubmit = async () => {
    const msg = validateForSubmit();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const ph = parseFloat(s.priceHour);
      const pd = parseFloat(s.priceDay);
      const pm = parseFloat(s.priceMonth);
      if (mode === 'create') {
        const { data: newId, error: ce } = await supabase.rpc('create_spot', {
          p_title: s.title.trim(),
          p_description: s.description.trim(),
          p_spot_type: s.spotType,
          p_coverage: s.coverage,
          p_vehicle_size: s.vehicleSize,
          p_total_slots: s.totalSlots,
          p_longitude: s.longitude!,
          p_latitude: s.latitude!,
          p_address_line: s.addressLine.trim(),
          p_landmark: s.landmark.trim(),
          p_pincode: s.pincode.trim(),
          p_fuzzy_landmark: s.fuzzyLandmark.trim(),
          p_fuzzy_radius_meters: s.fuzzyRadiusMeters,
          p_price_per_hour: Number.isFinite(ph) ? ph : null,
          p_price_per_day: Number.isFinite(pd) ? pd : null,
          p_price_per_month: Number.isFinite(pm) ? pm : null,
          p_is_instant_book: s.instantBook,
          p_amenities: s.amenities,
          p_photos: s.photos,
          p_video_url: s.videoUrl.trim(),
        });
        if (ce) throw ce;
        const id = newId as string;
        await persistAvailability(id);
        Alert.alert('Listed!', 'Your spot is live.', [
          { text: 'OK', onPress: () => router.replace('/(owner)/dashboard') },
        ]);
        reset();
      } else if (spotId) {
        const { error: ue } = await supabase.rpc('update_spot', {
          p_spot_id: spotId,
          p_title: s.title.trim(),
          p_description: s.description.trim(),
          p_spot_type: s.spotType,
          p_coverage: s.coverage,
          p_vehicle_size: s.vehicleSize,
          p_total_slots: s.totalSlots,
          p_longitude: s.longitude!,
          p_latitude: s.latitude!,
          p_address_line: s.addressLine.trim(),
          p_landmark: s.landmark.trim(),
          p_pincode: s.pincode.trim(),
          p_fuzzy_landmark: s.fuzzyLandmark.trim(),
          p_fuzzy_radius_meters: s.fuzzyRadiusMeters,
          p_price_per_hour: Number.isFinite(ph) ? ph : null,
          p_price_per_day: Number.isFinite(pd) ? pd : null,
          p_price_per_month: Number.isFinite(pm) ? pm : null,
          p_is_instant_book: s.instantBook,
          p_is_active: true,
          p_amenities: s.amenities,
          p_photos: s.photos,
          p_video_url: s.videoUrl.trim(),
        });
        if (ue) throw ue;
        await persistAvailability(spotId);
        Alert.alert('Saved', 'Your listing was updated.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!spotId) return;
    Alert.alert('Delete listing?', 'Active bookings may need to be cancelled manually.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          const { error: de } = await supabase.from('spots').update({ is_active: false }).eq('id', spotId);
          if (de) Alert.alert('Error', de.message);
          else router.replace('/(owner)/dashboard');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sign in required</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={SKY} />
      </View>
    );
  }

  const stepValid =
    s.step === 1
      ? s.latitude != null && s.fuzzyLandmark.trim().length > 1
      : s.step === 2
        ? s.title.trim().length > 2
        : s.step === 3
          ? s.photos.length >= 2
          : true;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>
          Step {s.step}/4 · {mode === 'edit' ? 'Edit listing' : 'New listing'}
        </Text>
        {error ? <Text style={styles.err}>{error}</Text> : null}

        {s.step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Drop a pin on your parking spot</Text>
            <MapView
              style={styles.map}
              region={region}
              onPress={(e) => onMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
            >
              {s.latitude != null && s.longitude != null ? (
                <Marker
                  coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                  draggable
                  onDragEnd={(e) => void onMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
                />
              ) : null}
            </MapView>
            <Text style={styles.hint}>Tap map or drag marker · Chennai</Text>

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={s.addressLine}
              onChangeText={(t) => hydrate({ addressLine: t })}
              placeholder="Reverse geocoded address"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              value={s.landmark}
              onChangeText={(t) => hydrate({ landmark: t })}
              placeholder="Optional"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={s.pincode}
              onChangeText={(t) => hydrate({ pincode: t })}
              keyboardType="number-pad"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Fuzzy landmark (seekers see this)</Text>
            <TextInput
              style={styles.input}
              value={s.fuzzyLandmark}
              onChangeText={(t) => hydrate({ fuzzyLandmark: t })}
              placeholder="Near Phoenix Mall"
              placeholderTextColor="#64748b"
            />
          </View>
        ) : null}

        {s.step === 2 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={s.title} onChangeText={(t) => hydrate({ title: t })} />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              multiline
              value={s.description}
              onChangeText={(t) => hydrate({ description: t })}
            />
            <SegRow
              label="Spot type"
              options={[
                ['car', 'Car'],
                ['bike', 'Bike'],
                ['both', 'Both'],
                ['ev_charging', 'EV'],
              ]}
              value={s.spotType}
              onChange={(v) => hydrate({ spotType: v as SpotType })}
            />
            <SegRow
              label="Coverage"
              options={[
                ['covered', 'Covered'],
                ['open', 'Open'],
                ['underground', 'Under'],
              ]}
              value={s.coverage}
              onChange={(v) => hydrate({ coverage: v as Coverage })}
            />
            <SegRow
              label="Vehicle size"
              options={[
                ['hatchback', 'Hatch'],
                ['sedan', 'Sedan'],
                ['suv', 'SUV'],
                ['any', 'Any'],
              ]}
              value={s.vehicleSize}
              onChange={(v) => hydrate({ vehicleSize: v as VehicleSize })}
            />
            <Text style={styles.label}>Slots</Text>
            <View style={styles.row}>
              <Pressable style={styles.chip} onPress={() => hydrate({ totalSlots: Math.max(1, s.totalSlots - 1) })}>
                <Text style={styles.chipText}>-</Text>
              </Pressable>
              <Text style={styles.slotCount}>{s.totalSlots}</Text>
              <Pressable style={styles.chip} onPress={() => hydrate({ totalSlots: Math.min(20, s.totalSlots + 1) })}>
                <Text style={styles.chipText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.label}>Amenities</Text>
            <View style={styles.chipWrap}>
              {AMENITY_OPTIONS.map((a) => {
                const on = s.amenities.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() =>
                      hydrate({
                        amenities: on ? s.amenities.filter((x) => x !== a.id) : [...s.amenities, a.id],
                      })
                    }
                    style={[styles.amenity, on && styles.amenityOn]}
                  >
                    <Text style={{ color: on ? '#0f172a' : '#e2e8f0', fontSize: 12 }}>{a.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {s.step === 3 ? (
          <View style={styles.card}>
            <SpotImagePicker
              userId={user.id}
              supabaseUrl={supabaseUrl}
              paths={s.photos}
              onPathsChange={(paths) => hydrate({ photos: paths })}
            />
            <Text style={styles.label}>Video URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={s.videoUrl}
              onChangeText={(t) => hydrate({ videoUrl: t })}
              placeholder="https://..."
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {s.step === 4 ? (
          <View style={styles.card}>
            <Text style={styles.label}>₹ / hour</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={s.priceHour}
              onChangeText={(t) => hydrate({ priceHour: t })}
            />
            <Text style={styles.label}>₹ / day</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={s.priceDay}
              onChangeText={(t) => hydrate({ priceDay: t })}
            />
            <Text style={styles.label}>₹ / month</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={s.priceMonth}
              onChangeText={(t) => hydrate({ priceMonth: t })}
            />
            <Text style={styles.hint}>Tip: try daily ≈ hourly × 8</Text>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Available all day</Text>
              <Switch value={s.availableAllDay} onValueChange={(v) => hydrate({ availableAllDay: v })} />
            </View>

            {!s.availableAllDay ? (
              <>
                <Text style={styles.label}>Active days (tap)</Text>
                <View style={styles.chipWrap}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, day) => {
                    const on = s.activeDays.includes(day);
                    return (
                      <Pressable
                        key={label + day}
                        onPress={() =>
                          hydrate({
                            activeDays: on ? s.activeDays.filter((d) => d !== day) : [...s.activeDays, day].sort(),
                          })
                        }
                        style={[styles.dayChip, on && styles.amenityOn]}
                      >
                        <Text style={{ color: on ? '#0f172a' : '#e2e8f0', fontWeight: '700' }}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable style={styles.timeBtn} onPress={() => setShowStart(true)}>
                  <Text style={styles.timeBtnText}>Start {toTimeSql(s.startTime)}</Text>
                </Pressable>
                <Pressable style={styles.timeBtn} onPress={() => setShowEnd(true)}>
                  <Text style={styles.timeBtnText}>End {toTimeSql(s.endTime)}</Text>
                </Pressable>
                {showStart ? (
                  <DateTimePicker
                    value={s.startTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      setShowStart(Platform.OS === 'ios');
                      if (d) hydrate({ startTime: d });
                    }}
                  />
                ) : null}
                {showEnd ? (
                  <DateTimePicker
                    value={s.endTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      setShowEnd(Platform.OS === 'ios');
                      if (d) hydrate({ endTime: d });
                    }}
                  />
                ) : null}
              </>
            ) : null}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Instant book</Text>
              <Switch value={s.instantBook} onValueChange={(v) => hydrate({ instantBook: v })} />
            </View>
          </View>
        ) : null}

        <View style={styles.navRow}>
          {s.step > 1 ? (
            <Pressable style={styles.secondary} onPress={() => hydrate({ step: (s.step - 1) as 1 | 2 | 3 | 4 })}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 100 }} />
          )}
          {s.step < 4 ? (
            <Pressable
              style={[styles.primary, !stepValid && { opacity: 0.4 }]}
              disabled={!stepValid}
              onPress={() => stepValid && hydrate({ step: (s.step + 1) as 1 | 2 | 3 | 4 })}
            >
              <Text style={styles.primaryText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.primary, saving && { opacity: 0.6 }]} disabled={saving} onPress={onSubmit}>
              <Text style={styles.primaryText}>{saving ? 'Saving…' : mode === 'create' ? 'Publish' : 'Save'}</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => setPreviewOpen(true)} style={{ marginTop: 12 }}>
          <Text style={{ color: SKY, textAlign: 'center' }}>Preview as seeker</Text>
        </Pressable>

        {mode === 'edit' ? (
          <Pressable onPress={onDelete} style={{ marginTop: 16 }}>
            <Text style={{ color: '#f87171', textAlign: 'center' }}>Deactivate listing</Text>
          </Pressable>
        ) : null}

        {mode === 'edit' && spotId ? <AvailabilityCalendar spotId={spotId} isEditable /> : null}
      </ScrollView>

      <Modal visible={previewOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <SpotPreview
              title={s.title}
              fuzzyLandmark={s.fuzzyLandmark}
              spotType={s.spotType}
              priceHour={s.priceHour}
              photos={s.photos}
              supabaseUrl={supabaseUrl}
            />
            <Pressable style={styles.primary} onPress={() => setPreviewOpen(false)}>
              <Text style={styles.primaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SegRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map(([k, lbl]) => {
          const on = value === k;
          return (
            <Pressable key={k} onPress={() => onChange(k)} style={[styles.amenity, on && styles.amenityOn]}>
              <Text style={{ color: on ? '#0f172a' : '#e2e8f0', fontSize: 12 }}>{lbl}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#94a3b8' },
  stepLabel: { color: '#e2e8f0', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  err: { color: '#f87171', marginBottom: 8 },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 8,
  },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 10,
    color: '#f8fafc',
  },
  map: { width: '100%', height: 220, borderRadius: 12 },
  hint: { color: '#64748b', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: '#f8fafc', fontSize: 20, fontWeight: '700' },
  slotCount: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  amenityOn: { backgroundColor: EMERALD, borderColor: EMERALD },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  timeBtn: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timeBtnText: { color: '#e2e8f0', textAlign: 'center' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  primary: {
    backgroundColor: SKY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryText: { color: '#0f172a', fontWeight: '700' },
  secondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryText: { color: '#e2e8f0' },
  modalBg: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 12 },
});
