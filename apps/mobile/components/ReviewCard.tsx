import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  reviewerName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
};

function relTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function ReviewCard({ reviewerName, avatarUrl, rating, comment, tags, createdAt }: Props) {
  const stars = useMemo(() => [1, 2, 3, 4, 5].map((i) => i <= rating), [rating]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.ph]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{reviewerName}</Text>
          <Text style={styles.time}>{relTime(createdAt)}</Text>
          <View style={styles.starRow}>
            {stars.map((on, i) => (
              <Text key={i} style={{ color: on ? '#fbbf24' : '#cbd5e1' }}>
                ★
              </Text>
            ))}
          </View>
        </View>
      </View>
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagTx}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {comment ? <Text style={styles.comment}>{comment}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  head: { flexDirection: 'row', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  ph: { backgroundColor: '#e2e8f0' },
  name: { fontWeight: '800', color: '#0f172a' },
  time: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  starRow: { flexDirection: 'row', marginTop: 4, gap: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagTx: { fontSize: 12, fontWeight: '700', color: '#0369a1' },
  comment: { marginTop: 10, color: '#334155', lineHeight: 20 },
});
