/**
 * Supabase Storage helpers for scan photos.
 *
 * Photos are stored at: scan-photos/{userId}/{scanId}/{pose}.jpg
 * Access is private — only the owner can read/write via RLS policies.
 */
import { createClient } from './client';

const BUCKET = 'scan-photos';

// ─── Types ────────────────────────────────────────────────────

export interface UploadedPhotos {
  front: string | null;
  side:  string | null;
  back:  string | null;
}

// ─── Upload ───────────────────────────────────────────────────

/**
 * Converts a base64 data URL to a Blob for upload.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Uploads a single scan photo to Supabase Storage.
 * Returns the public URL or null on failure.
 *
 * Path: scan-photos/{userId}/{scanId}/{pose}.jpg
 */
export async function uploadScanPhoto(
  userId: string,
  scanId: string,
  pose: 'front' | 'side' | 'back',
  dataUrl: string
): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;

  const supabase = createClient();
  const path = `${userId}/${scanId}/${pose}.jpg`;

  try {
    const blob = dataUrlToBlob(dataUrl);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true, // overwrite if re-scanning
      });

    if (error) {
      console.error(`[storage] upload ${pose} failed:`, error.message);
      return null;
    }

    // Return the signed URL (private bucket — expires in 10 years)
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    return data?.signedUrl ?? null;
  } catch (err) {
    console.error(`[storage] upload ${pose} error:`, err);
    return null;
  }
}

/**
 * Uploads all three scan photos concurrently.
 * Returns URLs for each pose (null if upload failed or no photo).
 */
export async function uploadScanPhotos(
  userId: string,
  scanId: string,
  photos: { front?: string | null; side?: string | null; back?: string | null }
): Promise<UploadedPhotos> {
  const [front, side, back] = await Promise.all([
    photos.front ? uploadScanPhoto(userId, scanId, 'front', photos.front) : Promise.resolve(null),
    photos.side  ? uploadScanPhoto(userId, scanId, 'side',  photos.side)  : Promise.resolve(null),
    photos.back  ? uploadScanPhoto(userId, scanId, 'back',  photos.back)  : Promise.resolve(null),
  ]);

  return { front, side, back };
}

// ─── Read ─────────────────────────────────────────────────────

/**
 * Refreshes a signed URL for a scan photo.
 * Useful when a stored URL has expired.
 */
export async function refreshScanPhotoUrl(
  userId: string,
  scanId: string,
  pose: 'front' | 'side' | 'back'
): Promise<string | null> {
  const supabase = createClient();
  const path = `${userId}/${scanId}/${pose}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

  if (error) {
    console.error(`[storage] refresh URL ${pose} failed:`, error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

// ─── Delete ───────────────────────────────────────────────────

/**
 * Deletes all photos for a scan from Storage.
 * Called when a scan record is deleted.
 */
export async function deleteScanPhotos(
  userId: string,
  scanId: string
): Promise<void> {
  const supabase = createClient();
  const paths = [
    `${userId}/${scanId}/front.jpg`,
    `${userId}/${scanId}/side.jpg`,
    `${userId}/${scanId}/back.jpg`,
  ];

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error('[storage] delete scan photos failed:', error.message);
  }
}

// ─── Legacy base64 detection ─────────────────────────────────

/**
 * Returns true if the value looks like a base64 data URL
 * (legacy format before Storage migration).
 */
export function isBase64DataUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('data:image/');
}
