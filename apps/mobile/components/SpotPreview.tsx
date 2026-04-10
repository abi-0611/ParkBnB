import { getSpotPhotoPublicUrl } from '@parknear/shared';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  fuzzyLandmark: string;
  spotType: string;
  priceHour: string;
  photos: string[];
  supabaseUrl: string;
};

export function SpotPreview({ title, fuzzyLandmark, spotType, priceHour, photos, supabaseUrl }: Props) {
  const thumb = photos[0];
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Seeker preview</Text>
      {thumb ? (
        <Image source={{ uri: getSpotPhotoPublicUrl(supabaseUrl, thumb) }} style={styles.img} />
      ) : null}
      <Text style={styles.title}>{title || 'Listing title'}</Text>
      <Text style={styles.sub}>Near {fuzzyLandmark || 'landmark'}</Text>
      <Text style={styles.meta}>
        {spotType.toUpperCase()} {priceHour ? `· ₹${priceHour}/hr` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    backgroundColor: '#020617',
    gap: 6,
  },
  badge: { color: '#38bdf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  img: { width: '100%', height: 140, borderRadius: 10, marginTop: 4 },
  title: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  sub: { color: '#94a3b8', fontSize: 14 },
  meta: { color: '#cbd5e1', fontSize: 13 },
});
