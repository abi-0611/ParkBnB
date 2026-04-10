import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onAllow: () => void;
  onNotNow: () => void;
};

export function LocationRationaleModal({ visible, onAllow, onNotNow }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Find parking near you</Text>
          <Text style={styles.body}>
            ParkNear needs your location to find parking spots near you. We only use your location while the app is open.
          </Text>
          <Pressable style={styles.primary} onPress={onAllow}>
            <Text style={styles.primaryText}>Allow</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onNotNow}>
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 22,
    gap: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  body: { fontSize: 15, lineHeight: 22, color: '#475569' },
  primary: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#f8fafc', fontWeight: '800', fontSize: 16 },
  secondary: { paddingVertical: 10, alignItems: 'center' },
  secondaryText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
});
