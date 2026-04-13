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
  { key: 'clean',  label: 'Left spot clean' },
  { key: 'safe',   label: 'Safe / responsible' },
  { key: 'late',   label: 'Arrived late' },
];

const BG   = '#020617';
const CARD = '#0f172a';
const SKY  = '#0ea5e9';

export default function OwnerReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [seekerName, setSeekerName] = useState('');
  const [rating, setRating]         = useState(5);
  const [tags, setTags]             = useState<string[]>([]);
  const [comment, setComment]       = useState('');
  const [existing, setExisting]     = useState(false);
  const [seekerId, setSeekerId]     = useState<string | null>(null);
  const [spotId, setSpotId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: b } = await supabase
      .from('bookings')
      .select('spot_id, seeker_id, spots ( owner_id )')
      .eq('id', bookingId)
      .single();

    if (!b) { setLoading(false); return; }
    const row = b as unknown as { spot_id: string; seeker_id: string; spots: { owner_id: string } | null };
    if (row.spots?.owner_id !== user.id) { setLoading(false); return; }

    setSpotId(row.spot_id);
    setSeekerId(row.seeker_id);

    const { data: su } = await supabase.from('users').select('full_name').eq('id', row.seeker_id).single();
    setSeekerName((su as { full_name: string })?.full_name ?? 'the guest');

    const { data: rev } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('review_type', 'owner_to_seeker')
      .maybeSingle();
    setExisting(!!rev);
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);

  const toggleTag = (k: string) =>
    setTags((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const submit = async () => {
    if (!bookingId || !seekerId || !spotId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      booking_id:   bookingId,
      reviewer_id:  user.id,
      reviewee_id:  seekerId,
      spot_id:      spotId,
      rating,
      comment:      comment.trim() || null,
      tags,
      review_type:  'owner_to_seeker',
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
        <ActivityIndicator color={SKY} />
      </View>
    );
  }

  if (existing) {
    return (
      <View style={styles.center}>
        <Text style={styles.done}>✓ You already reviewed this guest.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.link}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: BG }}
      contentContainerStyle={[styles.wrap, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
    >
      <Text style={styles.h1}>How was</Text>
      <Text style={styles.h1Accent}>{seekerName}?</Text>

      {/* Stars */}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} style={styles.starBtn}>
            <Text style={[styles.star, n <= rating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
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
        placeholder="Any notes about this guest…"
        placeholderTextColor="#475569"
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: BG },
  done:   { fontSize: 16, color: '#10b981', fontWeight: '700' },
  wrap:   { padding: 16, backgroundColor: BG },

  h1:       { fontSize: 22, fontWeight: '900', color: '#f8fafc' },
  h1Accent: { fontSize: 22, fontWeight: '900', color: SKY, marginBottom: 12 },

  stars:  { flexDirection: 'row', gap: 6, marginTop: 4 },
  starBtn: { padding: 4 },
  star:   { fontSize: 36, color: '#334155' },
  starOn: { color: '#fbbf24' },
  ratingLabel: { marginTop: 4, fontWeight: '600', color: '#64748b' },

  label: { marginTop: 20, fontWeight: '700', color: '#94a3b8', fontSize: 13 },
  tags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tagOn: { backgroundColor: 'rgba(14,165,233,0.15)', borderColor: SKY },
  tagTx: { fontWeight: '600', color: '#cbd5e1', fontSize: 12 },
  tagTxOn: { color: SKY },

  input: {
    marginTop: 8,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    backgroundColor: CARD,
    fontSize: 14,
  },
  charCount: { textAlign: 'right', marginTop: 4, fontSize: 11, color: '#475569' },

  primary:         { marginTop: 20, backgroundColor: SKY, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryDisabled: { opacity: 0.6 },
  primaryTx:       { color: '#fff', fontWeight: '800', fontSize: 15 },
  link:            { textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: 14 },
});
