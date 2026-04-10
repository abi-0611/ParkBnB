import { supabase } from '@/lib/supabase';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Skeleton } from '@/components/Skeleton';

type Row = {
  booking_id: string;
  content: string;
  created_at: string;
  bookings: {
    id: string;
    status: string;
    spots: { title: string } | null;
  } | null;
};

export default function ChatListScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('messages')
      .select(
        `
        booking_id,
        content,
        created_at,
        bookings!inner (
          id,
          status,
          spots ( title )
        )
      `
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(80);

    const seen = new Set<string>();
    const out: Row[] = [];
    for (const m of data ?? []) {
      const r = m as unknown as Row;
      if (seen.has(r.booking_id)) continue;
      seen.add(r.booking_id);
      out.push(r);
    }
    setRows(out);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    // Free-tier safe fallback: keep chat list fresh without realtime replication.
    const poll = setInterval(() => {
      void load();
    }, 5000);
    return () => clearInterval(poll);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.list}>
        <Skeleton height={66} radius={14} />
        <Skeleton height={66} radius={14} />
        <Skeleton height={66} radius={14} />
      </View>
    );
  }

  return (
    <FlashList
      data={rows}
      keyExtractor={(item) => item.booking_id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No messages yet.</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => Toast.show({ type: 'info', text1: 'No conversations yet' })}
          >
            <Text style={styles.emptyBtnTx}>Refresh</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/(common)/chat/${item.booking_id}`)}>
          <View>
            <Text style={styles.title}>{item.bookings?.spots?.title ?? 'Booking'}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.content}
            </Text>
          </View>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f8fafc', flexGrow: 1 },
  emptyWrap: { alignItems: 'center', marginTop: 32, gap: 10 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  emptyBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  emptyBtnTx: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontWeight: '800', color: '#0f172a' },
  preview: { color: '#64748b', marginTop: 4, maxWidth: 240 },
  time: { fontSize: 12, color: '#94a3b8' },
});
