import { supabase } from '@/lib/supabase';
import { checkOutRpc, fetchSeekerBookings, type BookingSeekerRow } from '@parknear/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabTx, active && styles.tabTxOn]}>{label}</Text>
    </Pressable>
  );
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'active' | 'past'>('upcoming');
  const [rows, setRows] = useState<BookingSeekerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchSeekerBookings(supabase);
    setRows(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = rows.filter((b) => {
    if (tab === 'upcoming') return b.status === 'confirmed' && new Date(b.start_time) > new Date();
    if (tab === 'active') return ['checked_in', 'active'].includes(b.status);
    return ['completed', 'cancelled_by_seeker', 'cancelled_by_owner', 'no_show'].includes(b.status);
  });

  const renderItem = ({ item }: { item: BookingSeekerRow }) => {
    const thumb = item.spots?.photos?.[0];
    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          if (item.status === 'confirmed' || item.status === 'checked_in' || item.status === 'active') {
            router.push(`/(seeker)/booking/confirmation/${item.id}`);
          }
        }}
      >
        {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} /> : <View style={[styles.thumb, styles.ph]} />}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.spots?.title ?? 'Spot'}</Text>
          <Text style={styles.cardMeta}>
            {new Date(item.start_time).toLocaleString()} · {item.status}
          </Text>
          <Text style={styles.cardMeta}>₹{Number(item.total_price).toFixed(0)}</Text>
          {['checked_in', 'active'].includes(item.status) ? (
            <Pressable
              style={styles.out}
              onPress={async () => {
                await checkOutRpc(supabase, item.id);
                void load();
              }}
            >
              <Text style={styles.outTx}>Check out</Text>
            </Pressable>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={() => router.push(`/(common)/chat/${item.id}`)}>
              <Text style={styles.actionLink}>Chat</Text>
            </Pressable>
            {item.status === 'completed' ? (
              <Pressable onPress={() => router.push(`/(seeker)/booking/review/${item.id}`)}>
                <Text style={styles.actionLink}>Review</Text>
              </Pressable>
            ) : null}
            {item.status === 'completed' ? (
              <Pressable onPress={() => router.push(`/(common)/support/dispute/${item.id}`)}>
                <Text style={styles.actionLink}>Dispute</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>My bookings</Text>
      <View style={styles.tabs}>
        <Tab label="Upcoming" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Tab label="Active" active={tab === 'active'} onPress={() => setTab('active')} />
        <Tab label="Past" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#0ea5e9" />
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  h1: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e2e8f0' },
  tabOn: { backgroundColor: '#0ea5e9' },
  tabTx: { fontWeight: '700', color: '#475569' },
  tabTxOn: { color: '#fff' },
  card: { flexDirection: 'row', gap: 12, marginTop: 12, backgroundColor: '#fff', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#e2e8f0' },
  ph: {},
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '800', color: '#0f172a' },
  cardMeta: { color: '#64748b', fontSize: 13 },
  out: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  outTx: { color: '#fff', fontWeight: '800', fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  actionLink: { color: '#0ea5e9', fontWeight: '700', fontSize: 13 },
});
