import { StyleSheet, Text, View } from 'react-native';

type Props = {
  text: string;
  time: string;
  mine: boolean;
  read: boolean;
};

export function ChatBubble({ text, time, mine, read }: Props) {
  return (
    <View style={[styles.wrap, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.tx, mine && styles.txMine]}>{text}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{time}</Text>
          {mine ? <Text style={styles.read}>{read ? '✓✓' : '✓'}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 4, paddingHorizontal: 8 },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: { maxWidth: '88%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#0ea5e9' },
  bubbleOther: { backgroundColor: '#e2e8f0' },
  tx: { color: '#0f172a', fontSize: 15 },
  txMine: { color: '#f8fafc' },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
  time: { fontSize: 10, color: '#64748b' },
  read: { fontSize: 10, color: '#bae6fd' },
});
