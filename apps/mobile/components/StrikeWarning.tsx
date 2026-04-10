import { StyleSheet, Text, View } from 'react-native';

type Props = {
  strikeCount: number;
};

export function StrikeWarning({ strikeCount }: Props) {
  if (strikeCount < 1) return null;

  let msg = 'Drive respectfully — avoid no-shows and late cancellations.';
  if (strikeCount >= 3) msg = 'Your account may be restricted from new bookings.';
  if (strikeCount >= 5) msg = 'Serious violations can lead to suspension.';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Trust & safety</Text>
      <Text style={styles.body}>
        You have {strikeCount} strike{strikeCount === 1 ? '' : 's'}. {msg}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  title: { fontWeight: '800', color: '#9a3412' },
  body: { marginTop: 6, color: '#7c2d12', fontSize: 13, lineHeight: 18 },
});
