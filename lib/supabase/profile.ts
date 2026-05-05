/**
 * Supabase profile & scan history sync.
 * Photos are stored in Supabase Storage (scan-photos bucket),
 * not as base64 in the database columns.
 */
import { createClient } from './client';
import { uploadScanPhotos, deleteScanPhotos, isBase64DataUrl } from './storage';
import type { UserProfile, BodyMeasurements, CapturedPose } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────

export interface ScanRecord {
  id: string;
  capturedAt: Date;
  measurements: BodyMeasurements;
  photos: {
    front: string | null;
    side:  string | null;
    back:  string | null;
  };
  heightAtScan: number | null;
  weightAtScan: number | null;
}

// ─── Profile ──────────────────────────────────────────────────

export async function syncProfileToSupabase(profile: UserProfile): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_profiles').upsert({
    id:         user.id,
    height:     profile.height,
    weight:     profile.weight,
    gender:     profile.gender ?? 1.5,
    updated_at: new Date().toISOString(),
  });
}

export async function getProfileFromSupabase(): Promise<Partial<UserProfile> | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return {
    height: data.height,
    weight: data.weight,
    gender: data.gender as 1 | 1.5 | 2,
  };
}

// ─── Scans ────────────────────────────────────────────────────

export async function saveScanToSupabase(
  measurements: BodyMeasurements,
  poses: CapturedPose[],
  profile: UserProfile
): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Step 1: Insert scan record to get the ID
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id:        user.id,
      shoulders:      measurements.shoulders,
      chest:          measurements.chest,
      waist:          measurements.waist,
      hips:           measurements.hips,
      inseam:         measurements.inseam,
      arm_length:     measurements.armLength,
      torso_length:   measurements.torsoLength,
      confidence:     measurements.confidence,
      bmi:            measurements.bmi ?? null,
      is_estimated:   measurements.isEstimated ?? true,
      height_at_scan: profile.height,
      weight_at_scan: profile.weight,
      captured_at:    new Date(measurements.capturedAt).toISOString(),
      // Photos start as null — updated after upload
      photo_front: null,
      photo_side:  null,
      photo_back:  null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[supabase] saveScan insert error:', error);
    return null;
  }

  const scanId = data.id as string;

  // Step 2: Upload photos to Storage concurrently
  const front = poses.find((p) => p.poseId === 'front');
  const side  = poses.find((p) => p.poseId === 'side');
  const back  = poses.find((p) => p.poseId === 'back');

  const uploadedPhotos = await uploadScanPhotos(user.id, scanId, {
    front: front?.imageDataUrl,
    side:  side?.imageDataUrl,
    back:  back?.imageDataUrl,
  });

  // Step 3: Update scan record with photo URLs
  const hasAnyPhoto = uploadedPhotos.front || uploadedPhotos.side || uploadedPhotos.back;
  if (hasAnyPhoto) {
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        photo_front: uploadedPhotos.front,
        photo_side:  uploadedPhotos.side,
        photo_back:  uploadedPhotos.back,
      })
      .eq('id', scanId);

    if (updateError) {
      console.error('[supabase] saveScan photo update error:', updateError);
      // Non-fatal — scan is saved, just without photo URLs
    }
  }

  return scanId;
}

export async function getAllScansFromSupabase(): Promise<ScanRecord[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('scans')
    // Exclude photo columns from the list query — they're large URLs
    // and we only need them when expanding a specific scan
    .select('id, captured_at, shoulders, chest, waist, hips, inseam, arm_length, torso_length, confidence, bmi, is_estimated, height_at_scan, weight_at_scan, photo_front, photo_side, photo_back')
    .eq('user_id', user.id)
    .order('captured_at', { ascending: false })
    .limit(50); // pagination guard

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    capturedAt: new Date(row.captured_at),
    measurements: {
      shoulders:   row.shoulders,
      chest:       row.chest,
      waist:       row.waist,
      hips:        row.hips,
      inseam:      row.inseam,
      armLength:   row.arm_length,
      torsoLength: row.torso_length,
      confidence:  row.confidence,
      bmi:         row.bmi ?? undefined,
      capturedAt:  new Date(row.captured_at),
    },
    photos: {
      // If the stored value is a legacy base64 string, keep it as-is
      // (will be migrated on next scan). Otherwise use the Storage URL.
      front: row.photo_front ?? null,
      side:  row.photo_side  ?? null,
      back:  row.photo_back  ?? null,
    },
    heightAtScan: row.height_at_scan,
    weightAtScan: row.weight_at_scan,
  }));
}

export async function getLatestMeasurementsFromSupabase(): Promise<BodyMeasurements | null> {
  const scans = await getAllScansFromSupabase();
  if (scans.length === 0) return null;
  return scans[0].measurements;
}

export async function deleteScanFromSupabase(scanId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Delete photos from Storage first
  await deleteScanPhotos(user.id, scanId);

  // Then delete the database record
  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('id', scanId)
    .eq('user_id', user.id); // extra safety: only delete own scans

  if (error) {
    console.error('[supabase] deleteScan error:', error);
  }
}
