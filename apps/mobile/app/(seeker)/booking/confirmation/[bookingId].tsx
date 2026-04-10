import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/lib/supabase';
import { checkInRpc, getSpotCoordinatesForSeeker } from '@parknear/shared';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Row = {
  id: string;
  spot_id: string;
  status: string;
  start_time: string;
  end_time: string;
  gate_otp: string | null;
  gate_otp_expires_at: string | null;
  spots: {
    title: string;
    address_line: string;
    landmark: string | null;
  } | null;
  vehicles: { vehicle_type: string; number_plate: string } | null;
};

export default function BookingConfirmationScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { latitude, longitude } = useLocation();
  const [row, setRow] = useState<Row | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [checkInBusy, setCheckInBusy] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        spot_id,
        status,
        start_time,
        end_time,
        gate_otp,
        gate_otp_expires_at,
        spots ( title, address_line, landmark ),
        vehicles ( vehicle_type, number_plate )
      `
      )
      .eq('id', bookingId)
      .single();

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    const r = data as unknown as Row;
    setRow(r);
    if (r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'active') {
      const c = await getSpotCoordinatesForSeeker(supabase, r.spot_id);
      setCoords(c);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCheckIn = async () => {
    if (!bookingId) return;
    setCheckInBusy(true);
    setErr(null);
    const { error } = await checkInRpc(supabase, bookingId, latitude, longitude);
    setCheckInBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    void load();
  };

  const openMaps = () => {
    if (!coords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    void Linking.openURL(url);
  };

  const copyOtp = async () => {
    if (row?.gate_otp) await Clipboard.setStringAsync(row.gate_otp);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (err || !row) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err ?? 'Not found'}</Text>
      </View>
    );
  }

  const otpDigits = (row.gate_otp ?? '------').split('');

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.success}>Booking confirmed</Text>
      <Text style={styles.title}>{row.spots?.title}</Text>
      <Text style={styles.meta}>
        {new Date(row.start_time).toLocaleString()} → {new Date(row.end_time).toLocaleString()}
      </Text>
      <Text style={styles.meta}>ID · {row.id.slice(0, 8)}</Text>
      {row.vehicles ? (
        <Text style={styles.meta}>
          {row.vehicles.vehicle_type} · {row.vehicles.number_plate}
        </Text>
      ) : null}

      <Text style={styles.section}>Parking location</Text>
      <View style={styles.card}>
        <Text style={styles.address}>{row.spots?.address_line}</Text>
        {row.spots?.landmark ? <Text style={styles.landmark}>{row.spots.landmark}</Text> : null}
        {coords ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coords.lat,
              longitude: coords.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={row.spots?.title} />
          </MapView>
        ) : (
          <Text style={styles.muted}>Map unavailable</Text>
        )}
        <Pressable style={styles.primary} onPress={openMaps}>
          <Text style={styles.primaryTx}>Navigate in Google Maps</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Gate code</Text>
      <View style={styles.otpRow}>
        {otpDigits.map((d, i) => (
          <Text key={i} style={styles.otpDigit}>
            {d}
          </Text>
        ))}
      </View>
      <Pressable onPress={() => void copyOtp()}>
        <Text style={styles.link}>Copy code</Text>
      </Pressable>
      {row.gate_otp_expires_at ? (
        <Text style={styles.muted}>Valid until {new Date(row.gate_otp_expires_at).toLocaleString()}</Text>
      ) : null}

      {row.status === 'confirmed' ? (
        <Pressable style={styles.secondary} disabled={checkInBusy} onPress={() => void onCheckIn()}>
          {checkInBusy ? <ActivityIndicator /> : <Text style={styles.secondaryTx}>Check in (within 200m)</Text>}
        </Pressable>
      ) : null}

      {row.status === 'checked_in' || row.status === 'active' ? (
        <Text style={styles.live}>Session active — check out from My bookings when you leave.</Text>
      ) : null}

      {err ? <Text style={styles.err}>{err}</Text> : null}

      <Pressable onPress={() => router.push(`/(common)/chat/${bookingId}`)}>
        <Text style={styles.link}>Message host</Text>
      </Pressable>

      {row.status === 'completed' ? (
        <>
          <Pressable onPress={() => router.push(`/(seeker)/booking/review/${bookingId}`)}>
            <Text style={styles.link}>Leave review</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/(common)/support/dispute/${bookingId}`)}>
            <Text style={styles.link}>Open dispute</Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        style={styles.share}
        onPress={() =>
          void Share.share({
            message: `${row.spots?.title}\n${row.spots?.address_line}\nCode: ${row.gate_otp}`,
          })
        }
      >
        <Text style={styles.link}>Share details</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(seeker)/bookings')}>
        <Text style={styles.link}>My bookings</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc' },
  wrap: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  success: { fontSize: 14, fontWeight: '800', color: '#059669', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 8 },
  meta: { marginTop: 6, color: '#64748b' },
  section: { marginTop: 24, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  card: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  address: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
  landmark: { color: '#64748b' },
  map: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
  primary: {
    marginTop: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  otpDigit: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  link: { color: '#0ea5e9', fontWeight: '700', marginTop: 8 },
  muted: { color: '#94a3b8', marginTop: 8 },
  secondary: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryTx: { color: '#fff', fontWeight: '800' },
  live: { marginTop: 16, color: '#047857', fontWeight: '700' },
  err: { color: '#b91c1c', marginTop: 8 },
  share: { marginTop: 16 },
});
