import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  valueUri: string | null;
  onPick: (uri: string) => void;
};

export function DocumentUploader({ label, valueUri, onPick }: Props) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
      if (!res.canceled && res.assets[0]?.uri) onPick(res.assets[0].uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {valueUri ? <Image source={{ uri: valueUri }} style={styles.preview} /> : <View style={[styles.preview, styles.ph]} />}
      <Pressable style={styles.btn} onPress={pick} disabled={busy}>
        <Text style={styles.btnTx}>{valueUri ? 'Change' : 'Choose photo'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 8 },
  label: { fontWeight: '700', color: '#0f172a' },
  preview: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#e2e8f0' },
  ph: {},
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnTx: { color: '#fff', fontWeight: '700' },
});
