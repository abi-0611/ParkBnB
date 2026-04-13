import { supabase } from '@/lib/supabase';
import type { EmergencyContact } from '@parknear/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<EmergencyContact[]>([{ name: '', phone: '' }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('users').select('emergency_contacts').eq('id', user.id).single();
    const raw = (data as { emergency_contacts?: unknown })?.emergency_contacts;
    if (Array.isArray(raw) && raw.length > 0) {
      setRows(
        (raw as EmergencyContact[]).map((r) => ({
          name: r.name ?? '',
          phone: r.phone ?? '',
        }))
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const cleaned = rows.filter((r) => r.name.trim() && r.phone.trim()).slice(0, 3);
    await supabase.from('users').update({ emergency_contacts: cleaned as unknown as EmergencyContact[] }).eq('id', user.id);
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
      <Text style={styles.h}>Up to 3 contacts for SOS alerts (MVP logs only).</Text>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={r.name}
            onChangeText={(t) => {
              const next = [...rows];
              next[i] = { ...next[i], name: t };
              setRows(next);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            keyboardType="phone-pad"
            value={r.phone}
            onChangeText={(t) => {
              const next = [...rows];
              next[i] = { ...next[i], phone: t };
              setRows(next);
            }}
          />
        </View>
      ))}
      {rows.length < 3 ? (
        <Pressable
          onPress={() => setRows([...rows, { name: '', phone: '' }])}
          style={{ marginTop: 8 }}
        >
          <Text style={styles.link}>+ Add contact</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.primary} disabled={saving} onPress={() => void save()}>
        <Text style={styles.primaryTx}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, backgroundColor: '#f8fafc' },
  h: { color: '#64748b', marginBottom: 16 },
  row: { gap: 8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  link: { color: '#0ea5e9', fontWeight: '700' },
  primary: {
    marginTop: 24,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800' },
});
