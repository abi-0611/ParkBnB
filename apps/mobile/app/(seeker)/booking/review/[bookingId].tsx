import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const TAGS = ['Clean spot', 'Easy to find', 'Good communication', 'As described', 'Would park again'];

export default function SeekerReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [existing, setExisting] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
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
      .select('spot_id, seeker_id, status, spots ( title, owner_id )')
      .eq('id', bookingId)
      .single();

    if (!b || (b as { seeker_id: string }).seeker_id !== user.id) {
      setLoading(false);
      return;
    }
    const row = b as unknown as { spot_id: string; spots: { title: string; owner_id: string } | null };
    setTitle(row.spots?.title ?? 'Spot');
    setSpotId(row.spot_id);
    setOwnerId(row.spots?.owner_id ?? null);

    const { data: rev } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('review_type', 'seeker_to_owner')
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
    if (!bookingId || !ownerId || !spotId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      reviewee_id: ownerId,
      spot_id: spotId,
      rating,
      comment: comment.trim() || null,
      tags,
      review_type: 'seeker_to_owner',
    });
    if (!error) router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (existing) {
    return (
      <View style={styles.center}>
        <Text style={styles.done}>You already reviewed this stay.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>How was parking at {title}?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={{ fontSize: 32, color: n <= rating ? '#fbbf24' : '#e2e8f0' }}>★</Text>
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
        placeholder="Optional comment (max 500)"
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  done: { color: '#64748b', marginBottom: 16 },
  wrap: { padding: 16, paddingBottom: 40, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  stars: { flexDirection: 'row', gap: 8, marginTop: 16 },
  label: { marginTop: 20, fontWeight: '700', color: '#64748b' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e2e8f0' },
  tagOn: { backgroundColor: '#0ea5e9' },
  tagTx: { fontWeight: '600', color: '#475569', fontSize: 12 },
  tagTxOn: { color: '#fff' },
  input: {
    marginTop: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
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
  link: { marginTop: 16, textAlign: 'center', color: '#94a3b8', fontWeight: '600' },
});
