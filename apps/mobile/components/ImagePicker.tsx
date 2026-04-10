import { generateUploadPath, getSpotPhotoPublicUrl } from '@parknear/shared';
import * as ImagePickerExpo from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { compressImage } from '@/lib/compressImage';
import { supabase } from '@/lib/supabase';

type Props = {
  maxImages?: number;
  minImages?: number;
  paths: string[];
  userId: string;
  supabaseUrl: string;
  onPathsChange: (paths: string[]) => void;
};

export function SpotImagePicker({
  maxImages = 6,
  minImages = 2,
  paths,
  userId,
  supabaseUrl,
  onPathsChange,
}: Props) {
  const [uploadingUri, setUploadingUri] = useState<string | null>(null);

  const pickAndUpload = async () => {
    if (paths.length >= maxImages) return;
    const perm = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - paths.length,
      quality: 1,
    });

    if (result.canceled) return;

    let next = [...paths];
    for (const asset of result.assets) {
      if (next.length >= maxImages) break;
      setUploadingUri(asset.uri);
      try {
        const compressed = await compressImage(asset.uri);
        const path = generateUploadPath(userId, 'spot.jpg');
        const body = await (await fetch(compressed)).blob();
        const { error } = await supabase.storage.from('spot-photos').upload(path, body, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        if (error) throw error;
        next = [...next, path];
        onPathsChange(next);
      } catch {
        /* ignore single failure */
      } finally {
        setUploadingUri(null);
      }
    }
  };

  const removeAt = (index: number) => {
    onPathsChange(paths.filter((_, i) => i !== index));
  };

  const countLabel = `${paths.length}/${maxImages}`;
  const meetsMin = paths.length >= minImages;

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Photos ({countLabel}) — min {minImages}. First photo is the listing thumbnail.
      </Text>
      {!meetsMin ? <Text style={styles.warn}>Add at least {minImages} photos to continue.</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {paths.map((p, index) => (
          <View key={p + index} style={styles.thumbWrap}>
            <Image source={{ uri: getSpotPhotoPublicUrl(supabaseUrl, p) }} style={styles.thumb} />
            <Pressable style={styles.remove} onPress={() => removeAt(index)} hitSlop={8}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        ))}

        {uploadingUri ? (
          <View style={styles.thumbWrap}>
            <Image source={{ uri: uploadingUri }} style={styles.thumb} />
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" />
            </View>
          </View>
        ) : null}

        {paths.length < maxImages ? (
          <Pressable style={styles.add} onPress={pickAndUpload}>
            <Text style={styles.addText}>+</Text>
            <Text style={styles.addSub}>Add</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  hint: { color: '#94a3b8', fontSize: 13 },
  warn: { color: '#fbbf24', fontSize: 13 },
  row: { gap: 12, paddingVertical: 8, alignItems: 'flex-start' },
  thumbWrap: { width: 104, height: 104, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -2 },
  add: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  addText: { color: '#94a3b8', fontSize: 32, fontWeight: '300' },
  addSub: { color: '#64748b', fontSize: 12 },
});
