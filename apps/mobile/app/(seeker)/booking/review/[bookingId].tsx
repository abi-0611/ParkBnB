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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const TAGS = [
  { key: 'clean',                label: 'Clean spot' },
  { key: 'safe',                 label: 'Safe area' },
  { key: 'easy_access',          label: 'Easy access' },
  { key: 'good_lighting',        label: 'Good lighting' },
  { key: 'spacious',             label: 'Spacious' },
  { key: 'helpful_host',         label: 'Helpful host' },
  { key: 'accurate_description', label: 'Accurate description' },
  { key: 'great_value',          label: 'Great value' },
];

export default function SeekerReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle]       = useState('');
  const [rating, setRating]     = useState(5);
  const [hoverRating]           = useState(0);
  const [tags, setTags]         = useState<string[]>([]);
  const [comment, setComment]   = useState('');
  const [existing, setExisting] = useState(false);
  const [ownerId, setOwnerId]   = useState<string | null>(null);
  const [spotId, setSpotId]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    const { data: { user } } = await supabase.auth.getUser();
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

  useEffect(() => { void load(); }, [load]);

  const toggleTag = (k: string) => {
    setTags((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const submit = async () => {
    if (!bookingId || !ownerId || !spotId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      booking_id:   bookingId,
      reviewer_id:  user.id,
      reviewee_id:  ownerId,
      spot_id:      spotId,
      rating,
      comment:      comment.trim() || null,
      tags,
      review_type:  'seeker_to_owner',
    });
    setSubmitting(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Failed to submit', text2: error.message });
    } else {
      Toast.show({ type: 'success', text1: 'Review submitted!' });
      router.back();
    }
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
        <Text style={styles.done}>✓ You already reviewed this stay.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.link}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
    >
      <Text style={styles.h1}>How was parking at</Text>
      <Text style={styles.h1Accent}>{title}?</Text>

      {/* Stars */}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} style={styles.starBtn}>
            <Text style={[styles.star, n <= displayRating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][displayRating]}
      </Text>

      {/* Tags */}
      <Text style={styles.label}>Quick tags</Text>
      <View style={styles.tags}>
        {TAGS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tag, tags.includes(key) && styles.tagOn]}
            onPress={() => toggleTag(key)}
          >
            <Text style={[styles.tagTx, tags.includes(key) && styles.tagTxOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Comment */}
      <Text style={[styles.label, { marginTop: 16 }]}>Comment (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Share your experience…"
        placeholderTextColor="#94a3b8"
        multiline
        maxLength={500}
        value={comment}
        onChangeText={setComment}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{comment.length}/500</Text>

      <Pressable
        style={[styles.primary, submitting && styles.primaryDisabled]}
        onPress={() => void submit()}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTx}>Submit review</Text>}
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={styles.link}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  done: { fontSize: 16, color: '#059669', fontWeight: '700' },
  wrap: { padding: 16, backgroundColor: '#f8fafc' },

  h1: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  h1Accent: { fontSize: 22, fontWeight: '900', color: '#0ea5e9', marginBottom: 12 },

  stars: { flexDirection: 'row', gap: 6, marginTop: 4 },
  starBtn: { padding: 4 },
  star: { fontSize: 36, color: '#e2e8f0' },
  starOn: { color: '#fbbf24' },
  ratingLabel: { marginTop: 4, fontWeight: '600', color: '#64748b' },

  label: { marginTop: 20, fontWeight: '700', color: '#64748b', fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#e2e8f0' },
  tagOn: { backgroundColor: '#eff6ff', borderColor: '#0ea5e9' },
  tagTx: { fontWeight: '600', color: '#475569', fontSize: 12 },
  tagTxOn: { color: '#0ea5e9' },

  input: {
    marginTop: 8,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    color: '#0f172a',
    backgroundColor: '#fff',
    fontSize: 14,
  },
  charCount: { textAlign: 'right', marginTop: 4, fontSize: 11, color: '#94a3b8' },

  primary: { marginTop: 20, backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryDisabled: { opacity: 0.6 },
  primaryTx: { color: '#fff', fontWeight: '800', fontSize: 15 },
  link: { textAlign: 'center', color: '#94a3b8', fontWeight: '600', fontSize: 14 },
});
