import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { supabase } from '@/lib/supabase';
import { getSpotSeekerDetail, type SpotSeekerDetail } from '@parknear/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function formatInr(n: string | number | null | undefined) {
  if (n == null) return null;
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return null;
  return `₹${Math.round(num)}`;
}

export default function SeekerSpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [spot, setSpot] = useState<SpotSeekerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    const { data, error } = await getSpotSeekerDetail(supabase, id);
    if (error) setErr(error.message);
    setSpot(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (err || !spot) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{err ?? 'Spot not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const hero = spot.photos[0];
  const rating = typeof spot.avg_rating === 'number' ? spot.avg_rating : Number(spot.avg_rating);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {hero ? <Image source={{ uri: hero }} style={styles.hero} /> : <View style={[styles.hero, styles.ph]} />}
      <Text style={styles.title}>{spot.title}</Text>
      <Text style={styles.landmark}>{spot.fuzzy_landmark} · ~{spot.fuzzy_radius_meters}m area</Text>
      <Text style={styles.prices}>
        {[formatInr(spot.price_per_hour) && `${formatInr(spot.price_per_hour)}/hr`, formatInr(spot.price_per_day) && `${formatInr(spot.price_per_day)}/day`, formatInr(spot.price_per_month) && `${formatInr(spot.price_per_month)}/mo`]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <View style={styles.owner}>
        {spot.owner_avatar_url ? (
          <Image source={{ uri: spot.owner_avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.ph]} />
        )}
        <View>
          <Text style={styles.ownerName}>{spot.owner_name}</Text>
          <Text style={styles.ownerMeta}>
            {spot.owner_verified ? 'Verified · ' : ''}
            Host since {new Date(spot.owner_member_since).getFullYear()}
          </Text>
        </View>
      </View>
      {spot.description ? <Text style={styles.desc}>{spot.description}</Text> : null}
      <Text style={styles.section}>Reviews</Text>
      {spot.reviews.length === 0 ? (
        <Text style={styles.muted}>No reviews yet.</Text>
      ) : (
        spot.reviews.map((r, i) => (
          <View key={`${r.created_at}-${i}`} style={styles.review}>
            <Text style={styles.reviewHead}>
              ★ {r.rating} · {r.reviewer_name}
            </Text>
            {r.comment ? <Text style={styles.reviewBody}>{r.comment}</Text> : null}
          </View>
        ))
      )}
      <AvailabilityCalendar spotId={spot.id} isEditable={false} />
      <Pressable style={styles.cta} onPress={() => {}}>
        <Text style={styles.ctaText}>Book (coming next phase)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  err: { color: '#b91c1c', textAlign: 'center' },
  back: { marginTop: 16 },
  backText: { color: '#0ea5e9', fontWeight: '700' },
  hero: { width: '100%', height: 220, backgroundColor: '#e2e8f0' },
  ph: {},
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', paddingHorizontal: 16, marginTop: 16 },
  landmark: { color: '#64748b', paddingHorizontal: 16, marginTop: 6 },
  prices: { color: '#0ea5e9', fontWeight: '800', paddingHorizontal: 16, marginTop: 10, fontSize: 16 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0' },
  ownerName: { fontWeight: '800', color: '#0f172a', fontSize: 16 },
  ownerMeta: { color: '#64748b', fontSize: 13, marginTop: 2 },
  desc: { paddingHorizontal: 16, marginTop: 16, color: '#334155', lineHeight: 22, fontSize: 15 },
  section: { paddingHorizontal: 16, marginTop: 24, fontWeight: '800', fontSize: 17, color: '#0f172a' },
  muted: { paddingHorizontal: 16, color: '#94a3b8' },
  review: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHead: { fontWeight: '700', color: '#0f172a' },
  reviewBody: { marginTop: 6, color: '#475569' },
  cta: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#f8fafc', fontWeight: '800', fontSize: 16 },
});
