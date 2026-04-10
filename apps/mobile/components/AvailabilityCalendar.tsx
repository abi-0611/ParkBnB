import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

type AvRow = {
  id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  spotId: string;
  isEditable: boolean;
};

export function AvailabilityCalendar({ spotId, isEditable }: Props) {
  const [avail, setAvail] = useState<AvRow[]>([]);
  const [bookingCount, setBookingCount] = useState(0);

  const load = useCallback(async () => {
    const { data: a } = await supabase.from('availability').select('*').eq('spot_id', spotId);
    setAvail((a as AvRow[]) ?? []);
    if (!isEditable) {
      setBookingCount(0);
      return;
    }
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('spot_id', spotId)
      .in('status', ['confirmed', 'checked_in', 'active', 'completed']);
    setBookingCount(count ?? 0);
  }, [spotId, isEditable]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`bookings-${spotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `spot_id=eq.${spotId}` },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [spotId, load]);

  const byDay = useMemo(() => {
    const m = new Map<number, AvRow[]>();
    for (const r of avail) {
      if (r.day_of_week == null) continue;
      const arr = m.get(r.day_of_week) ?? [];
      arr.push(r);
      m.set(r.day_of_week, arr);
    }
    return m;
  }, [avail]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Availability & bookings</Text>
      <Text style={styles.meta}>
        {isEditable ? 'Recurring rules below. Blue = booking count on this spot.' : 'View only.'} Total booking
        rows (all time): {bookingCount}
      </Text>
      <View style={styles.grid}>
        {DAYS.map((label, day) => {
          const rows = byDay.get(day) ?? [];
          return (
            <View key={label} style={styles.day}>
              <Text style={styles.dayLabel}>{label}</Text>
              {rows.length ? (
                rows.map((r) => (
                  <View key={r.id} style={styles.block}>
                    <Text style={styles.blockText}>
                      {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>—</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#020617',
    gap: 8,
  },
  title: { color: '#e2e8f0', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  day: {
    width: '30%',
    minWidth: 100,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    gap: 4,
  },
  dayLabel: { color: '#38bdf8', fontWeight: '700', fontSize: 12 },
  block: { backgroundColor: '#14532d', borderRadius: 6, padding: 4 },
  blockText: { color: '#bbf7d0', fontSize: 11 },
  muted: { color: '#64748b', fontSize: 12 },
});
