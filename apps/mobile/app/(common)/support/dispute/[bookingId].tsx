import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const REASONS = [
  'Wrong spot info',
  'Spot unavailable',
  'Damage to vehicle',
  'Payment issue',
  'Rude behavior',
  'Other',
];

export default function DisputeScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [against, setAgainst] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: b } = await supabase
      .from('bookings')
      .select('seeker_id, spots ( owner_id )')
      .eq('id', bookingId)
      .single();
    if (!b) return;
    const row = b as unknown as { seeker_id: string; spots: { owner_id: string } | null };
    const other = user.id === row.seeker_id ? row.spots?.owner_id : row.seeker_id;
    setAgainst(other ?? null);
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!bookingId || !against || description.trim().length < 20) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('disputes').insert({
      booking_id: bookingId,
      raised_by: user.id,
      against_user: against,
      reason,
      description: description.trim(),
      evidence_photos: [],
    });
    setBusy(false);
    if (!error) {
      router.back();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.label}>Reason</Text>
      <View style={styles.chips}>
        {REASONS.map((r) => (
          <Pressable key={r} style={[styles.chip, reason === r && styles.chipOn]} onPress={() => setReason(r)}>
            <Text style={[styles.chipTx, reason === r && styles.chipTxOn]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Description (min 20 chars)</Text>
      <TextInput
        style={styles.input}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="What happened?"
      />
      <Pressable style={styles.primary} disabled={busy || description.trim().length < 20} onPress={() => void submit()}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTx}>Submit dispute</Text>}
      </Pressable>
      <Text style={styles.note}>We&apos;ll review within 48h (demo).</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  label: { fontWeight: '700', color: '#64748b', marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#0ea5e9' },
  chipTx: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTxOn: { color: '#fff' },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  primary: {
    marginTop: 20,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800' },
  note: { marginTop: 12, color: '#94a3b8', fontSize: 13 },
});
