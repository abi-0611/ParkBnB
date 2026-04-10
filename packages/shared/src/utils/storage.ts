/**
 * Spot photos are stored under `spot-photos/{userId}/{filename}`.
 * Public URL pattern for Supabase Storage public buckets.
 */
export function getSpotPhotoPublicUrl(supabaseUrl: string, storagePath: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  const path = storagePath.replace(/^\//, '');
  return `${base}/storage/v1/object/public/spot-photos/${path}`;
}

export function generateUploadPath(userId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${Date.now()}-${safe}`;
}

/**
 * Client-side image compression lives in the app (Expo: expo-image-manipulator).
 * Shared package stays free of native modules.
 */
export type CompressImageOptions = {
  maxWidth?: number;
  quality?: number;
};
