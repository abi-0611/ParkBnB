import * as Location from 'expo-location';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onUseChennai: () => void;
  onDismiss: () => void;
};

export function LocationBanner({ visible, onUseChennai, onDismiss }: Props) {
  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={styles.title}>Enable location services</Text>
      <Text style={styles.body}>
        ParkNear works best when we can show spots near you. You can turn on location in Settings.
      </Text>
      <View style={styles.row}>
        <Pressable onPress={openSettings} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Open Settings</Text>
        </Pressable>
        <Pressable onPress={onUseChennai} style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Use Chennai center</Text>
        </Pressable>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function locationGranted(status: Location.PermissionStatus | null) {
  return status === Location.PermissionStatus.GRANTED;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  title: { color: '#9a3412', fontWeight: '700', fontSize: 15 },
  body: { color: '#7c2d12', fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: { color: '#f8fafc', fontWeight: '700', fontSize: 13 },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  btnGhostText: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  dismiss: { color: '#64748b', fontSize: 13, fontWeight: '600' },
});
