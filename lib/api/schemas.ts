/**
 * Zod schemas for API route input validation.
 * Used in all API routes to validate request bodies before processing.
 */
import { z } from 'zod';

// ─── Shared ───────────────────────────────────────────────────

/** Base64 image string — data URL or raw base64 */
const base64ImageSchema = z
  .string()
  .min(100, 'Image data is too short')
  .max(4 * 1024 * 1024, 'Image exceeds 3MB limit') // base64 of 3MB ≈ 4MB string
  .refine(
    (val) =>
      val.startsWith('data:image/') ||
      /^[A-Za-z0-9+/]+=*$/.test(val.slice(0, 100)),
    'Must be a valid base64 image or data URL'
  );

/** Replicate prediction ID */
export const predictionIdSchema = z
  .string()
  .regex(/^[a-z0-9]{10,30}$/i, 'Invalid prediction ID format');

// ─── Try-on ───────────────────────────────────────────────────

export const tryOnRequestSchema = z.object({
  personImageBase64: base64ImageSchema,
  garmentImageBase64: base64ImageSchema,
  garmentDescription: z
    .string()
    .min(1, 'Garment description is required')
    .max(200, 'Garment description too long')
    .transform((s) => s.trim()),
  garmentId: z.string().max(100).optional(),
});

export type TryOnRequest = z.infer<typeof tryOnRequestSchema>;

// ─── Lighting ─────────────────────────────────────────────────

export const lightingRequestSchema = z.object({
  baseImageUrl: z
    .string()
    .url('baseImageUrl must be a valid URL')
    .max(2048),
  lightingPrompt: z
    .string()
    .min(1, 'Lighting prompt is required')
    .max(300)
    .transform((s) => s.trim()),
  garmentDescription: z.string().max(200).optional(),
});

export type LightingRequest = z.infer<typeof lightingRequestSchema>;

// ─── Pose ─────────────────────────────────────────────────────

export const poseRequestSchema = z.object({
  baseImageUrl: z
    .string()
    .url('baseImageUrl must be a valid URL')
    .max(2048),
  targetPose: z
    .string()
    .min(1, 'Target pose is required')
    .max(100)
    .transform((s) => s.trim()),
  stylePrompt: z.string().max(300).optional(),
  garmentDescription: z.string().max(200).optional(),
});

export type PoseRequest = z.infer<typeof poseRequestSchema>;

// ─── Helper ───────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Cuerpo de la solicitud inválido o no es JSON.' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Datos inválidos.', details: messages },
        { status: 422 }
      ),
    };
  }

  return { data: result.data, error: null };
}
