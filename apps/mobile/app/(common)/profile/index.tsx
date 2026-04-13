import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type Vehicle = {
  id: string;
  vehicle_type: string;
  number_plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  is_default: boolean;
};

const BG    = '#f8fafc';
const CARD  = '#fff';
const BLUE  = '#0ea5e9';
const MUTED = '#64748b';
const BORD  = '#e2e8f0';
const RED   = '#ef4444';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile   = useAuthStore((s) => s.profile);
  const user      = useAuthStore((s) => s.user);
  const signOut   = useAuthStore((s) => s.signOut);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState(profile?.full_name ?? '');
  const [phone, setPhone]         = useState(profile?.phone ?? '');
  const [saving, setSaving]       = useState(false);

  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [vLoading, setVLoading]   = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vType, setVType]         = useState('car');
  const [vPlate, setVPlate]       = useState('');
  const [vMake, setVMake]         = useState('');
  const [vModel, setVModel]       = useState('');
  const [vColor, setVColor]       = useState('');
  const [vSaving, setVSaving]     = useState(false);

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  const loadVehicles = useCallback(async () => {
    if (!user?.id) return;
    setVLoading(true);
    const { data } = await supabase
      .from('vehicles')
      .select('id, vehicle_type, number_plate, make, model, color, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setVehicles((data ?? []) as Vehicle[]);
    setVLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Failed to save', text2: error.message });
    } else {
      await fetchProfile();
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    }
  };

  const addVehicle = async () => {
    if (!user?.id || !vPlate.trim()) return;
    setVSaving(true);
    const { error } = await supabase.from('vehicles').insert({
      user_id:      user.id,
      vehicle_type: vType,
      number_plate: vPlate.trim().toUpperCase(),
      make:         vMake.trim() || null,
      model:        vModel.trim() || null,
      color:        vColor.trim() || null,
      is_default:   vehicles.length === 0,
    });
    setVSaving(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Failed to add vehicle', text2: error.message });
    } else {
      setShowAddVehicle(false);
      setVPlate(''); setVMake(''); setVModel(''); setVColor('');
      void loadVehicles();
    }
  };

  const deleteVehicle = (id: string) => {
    Alert.alert('Remove vehicle', 'Are you sure you want to remove this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('vehicles').delete().eq('id', id);
          void loadVehicles();
        },
      },
    ]);
  };

  const setDefault = async (id: string) => {
    if (!user?.id) return;
    await supabase.from('vehicles').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('vehicles').update({ is_default: true }).eq('id', id);
    void loadVehicles();
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const avatarLetter = (profile?.full_name ?? user?.email ?? '?')[0].toUpperCase();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
    >
      {/* ── Avatar + name ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTx}>{avatarLetter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name ?? 'No name'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {profile?.kyc_status === 'verified' && (
            <View style={styles.badge}>
              <Text style={styles.badgeTx}>✓ Verified</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => setEditing((v) => !v)} style={styles.editBtn}>
          <Text style={styles.editTx}>{editing ? 'Cancel' : 'Edit'}</Text>
        </Pressable>
      </View>

      {/* ── Edit form ── */}
      {editing && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={MUTED}
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 9876543210"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
          />
          <Pressable style={[styles.btn, styles.btnPrimary, { marginTop: 16 }]} onPress={() => void saveProfile()} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTx}>Save changes</Text>}
          </Pressable>
        </View>
      )}

      {/* ── Vehicles ── */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>My vehicles</Text>
          <Pressable onPress={() => setShowAddVehicle((v) => !v)}>
            <Text style={styles.link}>{showAddVehicle ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        </View>

        {vLoading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 12 }} />
        ) : vehicles.length === 0 ? (
          <Text style={styles.muted}>No vehicles added yet.</Text>
        ) : (
          vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehiclePlate}>{v.number_plate}</Text>
                <Text style={styles.vehicleMeta}>
                  {[v.make, v.model, v.color].filter(Boolean).join(' · ') || v.vehicle_type}
                </Text>
                {v.is_default && <Text style={styles.defaultBadge}>Default</Text>}
              </View>
              <View style={styles.vehicleActions}>
                {!v.is_default && (
                  <Pressable onPress={() => void setDefault(v.id)}>
                    <Text style={styles.link}>Set default</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => deleteVehicle(v.id)}>
                  <Text style={[styles.link, { color: RED }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {showAddVehicle && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {/* Vehicle type pills */}
            <View style={styles.row}>
              {['car', 'bike', 'truck', 'van'].map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typePill, vType === t && styles.typePillOn]}
                  onPress={() => setVType(t)}
                >
                  <Text style={[styles.typeTx, vType === t && styles.typeTxOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={vPlate}
              onChangeText={setVPlate}
              placeholder="Number plate *"
              placeholderTextColor={MUTED}
              autoCapitalize="characters"
            />
            <TextInput style={styles.input} value={vMake}  onChangeText={setVMake}  placeholder="Make (e.g. Maruti)" placeholderTextColor={MUTED} />
            <TextInput style={styles.input} value={vModel} onChangeText={setVModel} placeholder="Model (e.g. Swift)"  placeholderTextColor={MUTED} />
            <TextInput style={styles.input} value={vColor} onChangeText={setVColor} placeholder="Color"                placeholderTextColor={MUTED} />
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => void addVehicle()} disabled={vSaving || !vPlate.trim()}>
              {vSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTx}>Add vehicle</Text>}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Quick links ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { label: 'KYC verification',    route: '/(common)/profile/kyc' },
          { label: 'Emergency contacts',  route: '/(common)/profile/emergency-contacts' },
          { label: 'Notification settings', route: '/(common)/settings' },
        ].map(({ label, route }) => (
          <Pressable
            key={route}
            style={styles.menuRow}
            onPress={() => router.push(route as Parameters<typeof router.push>[0])}
          >
            <Text style={styles.menuTx}>{label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Security ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.menuRow}>
          <Text style={styles.menuTx}>Two-factor authentication</Text>
          <Switch
            value={twoFaEnabled}
            onValueChange={setTwoFaEnabled}
            thumbColor={twoFaEnabled ? BLUE : '#94a3b8'}
            trackColor={{ false: BORD, true: `${BLUE}55` }}
          />
        </View>
        <Text style={[styles.muted, { marginTop: 4, fontSize: 11 }]}>
          {twoFaEnabled ? 'Enabled — your account is more secure.' : 'Enable for extra protection.'}
        </Text>
      </View>

      {/* ── Sign out ── */}
      <Pressable style={[styles.btn, styles.btnDanger]} onPress={onSignOut}>
        <Text style={[styles.btnTx, { color: RED }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  wrap: { padding: 16, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarTx: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name:  { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 12, color: MUTED, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTx: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: BORD },
  editTx: { fontSize: 13, fontWeight: '700', color: '#475569' },

  card: { backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORD, gap: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: MUTED },
  input: {
    borderWidth: 1,
    borderColor: BORD,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: BG,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: BORD, gap: 8 },
  vehiclePlate: { fontWeight: '800', color: '#0f172a', fontSize: 14 },
  vehicleMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  defaultBadge: { marginTop: 4, fontSize: 10, fontWeight: '700', color: BLUE },
  vehicleActions: { gap: 6, alignItems: 'flex-end' },

  typePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: BORD },
  typePillOn: { backgroundColor: BLUE, borderColor: BLUE },
  typeTx: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'capitalize' },
  typeTxOn: { color: '#fff' },

  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORD },
  menuTx: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  chevron: { fontSize: 18, color: MUTED },

  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: BLUE },
  btnDanger: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  btnTx: { color: '#fff', fontWeight: '800', fontSize: 14 },
  link: { color: BLUE, fontWeight: '700', fontSize: 13 },
  muted: { color: MUTED, fontSize: 13 },
});
