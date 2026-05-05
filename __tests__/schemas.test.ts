import { describe, it, expect } from 'vitest';
import {
  tryOnRequestSchema,
  lightingRequestSchema,
  poseRequestSchema,
  predictionIdSchema,
} from '@/lib/api/schemas';

// ─── Helpers ──────────────────────────────────────────────────

/** Minimal valid base64 JPEG data URL */
const VALID_IMAGE = `data:image/jpeg;base64,${'A'.repeat(200)}`;

/** String that's too long to be a valid image (>4MB) */
const OVERSIZED_IMAGE = 'A'.repeat(4 * 1024 * 1024 + 1);

// ─── tryOnRequestSchema ───────────────────────────────────────

describe('tryOnRequestSchema', () => {
  it('accepts valid input', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue denim jacket',
    });
    expect(result.success).toBe(true);
  });

  it('trims garmentDescription whitespace', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: '  Blue jacket  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.garmentDescription).toBe('Blue jacket');
    }
  });

  it('rejects missing personImageBase64', () => {
    const result = tryOnRequestSchema.safeParse({
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue jacket',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing garmentDescription', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty garmentDescription', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects garmentDescription over 200 chars', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects oversized personImage', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: OVERSIZED_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue jacket',
    });
    expect(result.success).toBe(false);
  });

  it('rejects oversized garmentImage', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: OVERSIZED_IMAGE,
      garmentDescription: 'Blue jacket',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional garmentId', () => {
    const result = tryOnRequestSchema.safeParse({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue jacket',
      garmentId: 'garment-123',
    });
    expect(result.success).toBe(true);
  });
});

// ─── lightingRequestSchema ────────────────────────────────────

describe('lightingRequestSchema', () => {
  it('accepts valid input', () => {
    const result = lightingRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
      lightingPrompt: 'warm sunset lighting',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = lightingRequestSchema.safeParse({
      baseImageUrl: 'not-a-url',
      lightingPrompt: 'warm lighting',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing lightingPrompt', () => {
    const result = lightingRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional garmentDescription', () => {
    const result = lightingRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
      lightingPrompt: 'warm lighting',
      garmentDescription: 'Blue jacket',
    });
    expect(result.success).toBe(true);
  });
});

// ─── poseRequestSchema ────────────────────────────────────────

describe('poseRequestSchema', () => {
  it('accepts valid input', () => {
    const result = poseRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
      targetPose: 'standing',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing targetPose', () => {
    const result = poseRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty targetPose', () => {
    const result = poseRequestSchema.safeParse({
      baseImageUrl: 'https://example.com/image.jpg',
      targetPose: '',
    });
    expect(result.success).toBe(false);
  });
});

// ─── predictionIdSchema ───────────────────────────────────────

describe('predictionIdSchema', () => {
  it('accepts valid prediction IDs', () => {
    expect(predictionIdSchema.safeParse('abc123def456').success).toBe(true);
    expect(predictionIdSchema.safeParse('ABCDEF123456').success).toBe(true);
    expect(predictionIdSchema.safeParse('a1b2c3d4e5f6').success).toBe(true);
  });

  it('rejects IDs that are too short', () => {
    expect(predictionIdSchema.safeParse('abc123').success).toBe(false);
  });

  it('rejects IDs with special characters', () => {
    expect(predictionIdSchema.safeParse('abc-123-def456').success).toBe(false);
    expect(predictionIdSchema.safeParse('abc_123_def456').success).toBe(false);
    expect(predictionIdSchema.safeParse('../etc/passwd').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(predictionIdSchema.safeParse('').success).toBe(false);
  });
});
