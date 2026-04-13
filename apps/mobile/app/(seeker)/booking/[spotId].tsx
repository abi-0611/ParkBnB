import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { useRazorpay } from '@/hooks/useRazorpay';
import { supabase } from '@/lib/supabase';
import { createBookingRpc, getSpotSeekerDetail, type SpotSeekerDetail } from '@parknear/shared';
import type { BookingType, VehicleType } from '@parknear/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VehicleRow = { id: string; vehicle_type: VehicleType; number_plate: string };

const DURATIONS = [1, 2, 3, 4] as const;

export default function BookingWizardScreen() {
  const { spotId } = useLocalSearchParams<{ spotId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { payBooking } = useRazorpay();

  const [step, setStep] = useState(1);
  const [spot, setSpot] = useState<SpotSeekerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState<BookingType>('hourly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [durationHrs, setDurationHrs] = useState(2);
  const [dailyDate, setDailyDate] = useState(new Date());
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState<'start' | 'daily' | 'month' | null>(null);

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState<VehicleType>('car_sedan');

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRow, setBookingRow] = useState<{ total_price: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadSpot = useCallback(async () => {
    if (!spotId) return;
    const { data, error } = await getSpotSeekerDetail(supabase, spotId);
    if (error) setErr(error.message);
    setSpot(data);
    setLoading(false);
  }, [spotId]);

  const loadVehicles = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id;
    if (!uid) return;
    const { data } = await supabase.from('vehicles').select('id, vehicle_type, number_plate').eq('user_id', uid);
    setVehicles((data as VehicleRow[]) ?? []);
    if (data?.[0]) setVehicleId(data[0].id);
  }, []);

  useEffect(() => {
    void loadSpot();
    void loadVehicles();
  }, [loadSpot, loadVehicles]);

  const { startIso, endIso } = useMemo(() => {
    if (bookingType === 'hourly') {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setHours(end.getHours() + durationHrs);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    if (bookingType === 'daily') {
      const start = new Date(dailyDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dailyDate);
      end.setHours(23, 59, 59, 999);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
    const start = new Date(monthStart);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }, [bookingType, startDate, durationHrs, dailyDate, monthStart]);

  const onCreateBooking = async () => {
    if (!spotId || !vehicleId) {
      setErr('Select a vehicle');
      return;
    }
    setErr(null);
    const { data: id, error } = await createBookingRpc(supabase, {
      spot_id: spotId,
      vehicle_id: vehicleId,
      booking_type: bookingType,
      start_time: startIso,
      end_time: endIso,
    });
    if (error || !id) {
      setErr(error?.message ?? 'Could not create booking');
      return;
    }
    const { data: row } = await supabase.from('bookings').select('total_price').eq('id', id).single();
    setBookingId(id);
    setBookingRow(row as { total_price: number });
    setStep(3);
  };

  const onPay = async () => {
    if (!bookingId || !bookingRow) return;
    setPaying(true);
    setErr(null);
    try {
      await payBooking(bookingId, Number(bookingRow.total_price));
      router.replace(`/(seeker)/booking/confirmation/${bookingId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const addVehicle = async () => {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id;
    if (!uid || !newPlate.trim()) return;
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ user_id: uid, vehicle_type: newType, number_plate: newPlate.trim().toUpperCase(), is_default: false })
      .select('id, vehicle_type, number_plate')
      .single();
    if (error) {
      setErr(error.message);
      return;
    }
    setVehicles((v) => [...v, data as VehicleRow]);
    setVehicleId((data as VehicleRow).id);
    setAddingVehicle(false);
    setNewPlate('');
  };

  if (loading || !spot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
        {err ? <Text style={styles.err}>{err}</Text> : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(48, insets.bottom + 24) }]}>
      <Text style={styles.h1}>Book · {spot.title}</Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>Booking type</Text>
          <View style={styles.row}>
            {(['hourly', 'daily', 'monthly'] as const).map((t) => (
              <Pressable key={t} style={[styles.chip, bookingType === t && styles.chipOn]} onPress={() => setBookingType(t)}>
                <Text style={[styles.chipTx, bookingType === t && styles.chipTxOn]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {bookingType === 'hourly' && (
            <>
              <Text style={styles.label}>Start</Text>
              <Pressable onPress={() => setShowPicker('start')}>
                <Text style={styles.value}>{startDate.toLocaleString()}</Text>
              </Pressable>
              {showPicker === 'start' && (
                <DateTimePicker
                  value={startDate}
                  mode="datetime"
                  onChange={(_, d) => {
                    setShowPicker(null);
                    if (d) setStartDate(d);
                  }}
                />
              )}
              <Text style={styles.label}>Duration</Text>
              <View style={styles.row}>
                {DURATIONS.map((h) => (
                  <Pressable key={h} style={[styles.chip, durationHrs === h && styles.chipOn]} onPress={() => setDurationHrs(h)}>
                    <Text style={[styles.chipTx, durationHrs === h && styles.chipTxOn]}>{h}h</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {bookingType === 'daily' && (
            <>
              <Text style={styles.label}>Date</Text>
              <Pressable onPress={() => setShowPicker('daily')}>
                <Text style={styles.value}>{dailyDate.toDateString()}</Text>
              </Pressable>
              {showPicker === 'daily' && (
                <DateTimePicker
                  value={dailyDate}
                  mode="date"
                  onChange={(_, d) => {
                    setShowPicker(null);
                    if (d) setDailyDate(d);
                  }}
                />
              )}
            </>
          )}

          {bookingType === 'monthly' && (
            <>
              <Text style={styles.label}>Month start</Text>
              <Pressable onPress={() => setShowPicker('month')}>
                <Text style={styles.value}>{monthStart.toDateString()}</Text>
              </Pressable>
              {showPicker === 'month' && (
                <DateTimePicker
                  value={monthStart}
                  mode="date"
                  onChange={(_, d) => {
                    setShowPicker(null);
                    if (d) setMonthStart(d);
                  }}
                />
              )}
              <Text style={styles.hint}>Renews monthly; cancel anytime (policy applies).</Text>
            </>
          )}

          <AvailabilityCalendar spotId={spot.id} isEditable={false} />

          <Pressable style={styles.primary} onPress={() => setStep(2)}>
            <Text style={styles.primaryTx}>Next</Text>
          </Pressable>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Vehicle</Text>
          {vehicles.map((v) => (
            <Pressable key={v.id} style={[styles.card, vehicleId === v.id && styles.cardOn]} onPress={() => setVehicleId(v.id)}>
              <Text style={styles.cardTitle}>
                {v.vehicle_type} · {v.number_plate}
              </Text>
            </Pressable>
          ))}
          {!addingVehicle ? (
            <Pressable onPress={() => setAddingVehicle(true)}>
              <Text style={styles.link}>+ Add vehicle</Text>
            </Pressable>
          ) : (
            <View style={styles.addBox}>
              <TextInput
                placeholder="Number plate"
                value={newPlate}
                onChangeText={setNewPlate}
                style={styles.input}
                autoCapitalize="characters"
              />
              <Pressable style={styles.secondary} onPress={addVehicle}>
                <Text style={styles.secondaryTx}>Save vehicle</Text>
              </Pressable>
            </View>
          )}
          <Pressable style={styles.primary} onPress={() => void onCreateBooking()}>
            <Text style={styles.primaryTx}>Continue to payment</Text>
          </Pressable>
          <Pressable onPress={() => setStep(1)}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </>
      )}

      {step === 3 && bookingRow && (
        <>
          <Text style={styles.label}>Summary</Text>
          <View style={styles.summary}>
            <Text style={styles.sumRow}>Total (incl. fees)</Text>
            <Text style={styles.sumTotal}>₹{Number(bookingRow.total_price).toFixed(0)}</Text>
          </View>
          <Text style={styles.hint}>12% platform fee included. Owner receives ~90% of base before tax.</Text>
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Pressable style={styles.primary} disabled={paying} onPress={() => void onPay()}>
            {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTx}>Pay with Razorpay</Text>}
          </Pressable>
          <Pressable onPress={() => setStep(2)}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  wrap: { padding: 16, paddingBottom: 48, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  label: { marginTop: 12, fontWeight: '700', color: '#64748b', fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#0ea5e9' },
  chipTx: { fontWeight: '700', color: '#475569' },
  chipTxOn: { color: '#fff' },
  value: { fontSize: 16, color: '#0f172a', marginTop: 4 },
  hint: { marginTop: 8, color: '#64748b', fontSize: 13 },
  primary: {
    marginTop: 24,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryTx: { fontWeight: '700', color: '#0f172a' },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  cardOn: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  cardTitle: { fontWeight: '700', color: '#0f172a' },
  link: { marginTop: 12, color: '#0ea5e9', fontWeight: '700' },
  addBox: { marginTop: 12, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  sumRow: { color: '#64748b', fontWeight: '600' },
  sumTotal: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  err: { color: '#b91c1c', marginTop: 8 },
});
