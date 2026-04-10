import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const TAGS = ['Respectful', 'On time', 'Clean exit', 'Good communication'];

export default function OwnerReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [seekerName, setSeekerName] = useState('');
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [existing, setExisting] = useState(false);
  const [seekerId, setSeekerId] = useState<string | null>(null);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!bookingId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: b } = await supabase
      .from('bookings')
      .select('spot_id, seeker_id, spots ( owner_id )')
      .eq('id', bookingId)
      .single();

    if (!b) {
      setLoading(false);
      return;
    }
    const row = b as unknown as { spot_id: string; seeker_id: string; spots: { owner_id: string } | null };
    if (row.spots?.owner_id !== user.id) {
      setLoading(false);
      return;
    }
    setSpotId(row.spot_id);
    setSeekerId(row.seeker_id);
    const { data: su } = await supabase.from('users').select('full_name').eq('id', row.seeker_id).single();
    setSeekerName((su as { full_name: string })?.full_name ?? 'Seeker');

    const { data: rev } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('review_type', 'owner_to_seeker')
      .maybeSingle();
    setExisting(!!rev);
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const submit = async () => {
    if (!bookingId || !seekerId || !spotId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      reviewee_id: seekerId,
      spot_id: spotId,
      rating,
      comment: comment.trim() || null,
      tags,
      review_type: 'owner_to_seeker',
    });
    if (!error) router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (existing) {
    return (
      <View style={styles.center}>
        <Text style={styles.done}>You already reviewed this guest.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>How was {seekerName} as a guest?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={{ fontSize: 32, color: n <= rating ? '#fbbf24' : '#334155' }}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Quick tags</Text>
      <View style={styles.tags}>
        {TAGS.map((t) => (
          <Pressable key={t} style={[styles.tag, tags.includes(t) && styles.tagOn]} onPress={() => toggleTag(t)}>
            <Text style={[styles.tagTx, tags.includes(t) && styles.tagTxOn]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Optional comment"
        multiline
        maxLength={500}
        value={comment}
        onChangeText={setComment}
      />
      <Pressable style={styles.primary} onPress={() => void submit()}>
        <Text style={styles.primaryTx}>Submit review</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Skip</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#020617' },
  done: { color: '#94a3b8', marginBottom: 16 },
  wrap: { padding: 16, paddingBottom: 40, backgroundColor: '#020617' },
  h1: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  stars: { flexDirection: 'row', gap: 8, marginTop: 16 },
  label: { marginTop: 20, fontWeight: '700', color: '#94a3b8' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1e293b' },
  tagOn: { backgroundColor: '#0ea5e9' },
  tagTx: { fontWeight: '600', color: '#cbd5e1', fontSize: 12 },
  tagTxOn: { color: '#fff' },
  input: {
    marginTop: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    textAlignVertical: 'top',
    backgroundColor: '#0f172a',
  },
  primary: {
    marginTop: 20,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTx: { color: '#fff', fontWeight: '800' },
  link: { marginTop: 16, textAlign: 'center', color: '#64748b', fontWeight: '600' },
});
