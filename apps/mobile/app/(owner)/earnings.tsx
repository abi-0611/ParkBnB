import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG    = '#020617';
const CARD  = '#0f172a';
const BORD  = '#334155';
const SKY   = '#0ea5e9';
const MUTED = '#94a3b8';
const WHITE = '#f8fafc';
const GREEN = '#10b981';

type EarningRow = {
  id: string;
  start_time: string;
  total_price: number;
  status: string;
  refund_amount: number | null;
  spots: { title: string } | null;
};

type MonthlyStats = {
  total: number;
  completed: number;
  cancelled: number;
  net: number;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcStats(rows: EarningRow[]): MonthlyStats {
  let total = 0, completed = 0, cancelled = 0, refunds = 0;
  for (const r of rows) {
    if (r.status === 'completed') {
      total += Number(r.total_price);
      completed++;
    } else if (r.status.startsWith('cancelled')) {
      cancelled++;
      refunds += Number(r.refund_amount ?? 0);
    }
  }
  return { total, completed, cancelled, net: total - refunds };
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);

  const now      = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [rows, setRows]     = useState<EarningRow[]>([]);
  const [stats, setStats]   = useState<MonthlyStats>({ total: 0, completed: 0, cancelled: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // First find all spots owned by this user
    const { data: spots } = await supabase
      .from('spots')
      .select('id')
      .eq('owner_id', user.id);

    if (!spots || spots.length === 0) {
      setRows([]);
      setStats({ total: 0, completed: 0, cancelled: 0, net: 0 });
      setLoading(false);
      return;
    }

    const spotIds = (spots as { id: string }[]).map((s) => s.id);

    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('bookings')
      .select('id, start_time, total_price, status, refund_amount, spots ( title )')
      .in('spot_id', spotIds)
      .gte('start_time', startOfMonth)
      .lte('start_time', endOfMonth)
      .order('start_time', { ascending: false });

    const typed = (data ?? []) as unknown as EarningRow[];
    setRows(typed);
    setStats(calcStats(typed));
    setLoading(false);
  }, [user?.id, year, month]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else              { setMonth((m) => m - 1); }
  };
  const nextMonth = () => {
    const nm = new Date(year, month + 1, 1);
    if (nm > new Date()) return; // can't go to future
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else               { setMonth((m) => m + 1); }
  };

  const isFuture = new Date(year, month + 1, 1) > new Date();

  const statusColor = (s: string) => {
    if (s === 'completed')              return GREEN;
    if (s.startsWith('cancelled'))      return '#f87171';
    if (s === 'confirmed')              return SKY;
    return MUTED;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* ── Month picker ── */}
      <View style={styles.monthBar}>
        <Pressable onPress={prevMonth} style={styles.arrow}>
          <Text style={styles.arrowTx}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow} disabled={isFuture}>
          <Text style={[styles.arrowTx, isFuture && styles.dim]}>›</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={SKY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 24), padding: 16, gap: 12 }}
          ListHeaderComponent={
            <>
              {/* ── Stats row ── */}
              <View style={styles.statsGrid}>
                <StatCard label="Gross earnings"  value={`₹${stats.total.toFixed(0)}`}    accent={GREEN}  />
                <StatCard label="Net (after refunds)" value={`₹${stats.net.toFixed(0)}`}  accent={SKY}    />
                <StatCard label="Completed bookings" value={String(stats.completed)}       accent={GREEN}  />
                <StatCard label="Cancellations"       value={String(stats.cancelled)}      accent="#f87171"/>
              </View>

              {rows.length > 0 && (
                <Text style={styles.subhead}>Transactions</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No transactions this month</Text>
              <Text style={styles.emptyBody}>
                Earnings from completed bookings will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{item.spots?.title ?? 'Spot'}</Text>
                <Text style={styles.txDate}>{fmt(item.start_time)}</Text>
                <Text style={[styles.txStatus, { color: statusColor(item.status) }]}>{item.status.replace(/_/g, ' ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txAmount}>₹{Number(item.total_price).toFixed(0)}</Text>
                {item.refund_amount ? (
                  <Text style={styles.refund}>−₹{Number(item.refund_amount).toFixed(0)} refunded</Text>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: accent, borderTopWidth: 2 }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORD,
  },
  arrow: { padding: 8 },
  arrowTx: { fontSize: 22, color: WHITE, fontWeight: '700' },
  dim: { color: BORD },
  monthLabel: { fontSize: 17, fontWeight: '800', color: WHITE },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORD },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { marginTop: 4, fontSize: 11, color: MUTED },

  subhead: { fontSize: 13, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },

  txRow: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORD,
  },
  txTitle:  { fontSize: 15, fontWeight: '700', color: WHITE },
  txDate:   { fontSize: 12, color: MUTED, marginTop: 2 },
  txStatus: { fontSize: 12, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  txAmount: { fontSize: 17, fontWeight: '900', color: WHITE },
  refund:   { fontSize: 11, color: '#f87171', marginTop: 2 },

  empty: { backgroundColor: CARD, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: BORD, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: WHITE, textAlign: 'center' },
  emptyBody:  { marginTop: 6, color: MUTED, textAlign: 'center', fontSize: 13 },
});
