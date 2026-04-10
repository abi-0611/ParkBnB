import * as ImageManipulator from 'expo-image-manipulator';

export async function compressImage(
  uri: string,
  options?: { maxWidth?: number; quality?: number }
): Promise<string> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 0.8;
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
