import { calculateMeasurements, euclideanDistance, type LandmarkWithVisibility } from '../lib/measurementCalculator';
import { validateMeasurements, getSizeRecommendation } from '../lib/anatomicalValidation';

const IMAGE_WIDTH = 720;
const IMAGE_HEIGHT = 1280;

function createTestLandmarks(
  overrides: Partial<Record<number, LandmarkWithVisibility>> = {}
): LandmarkWithVisibility[] {
  const defaults: LandmarkWithVisibility[] = Array(33).fill(null).map(() => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.9,
  }));

  Object.entries(overrides).forEach(([index, value]) => {
    defaults[parseInt(index)] = value;
  });

  return defaults;
}

function createFrontPoseTestLandmarks(): LandmarkWithVisibility[] {
  return createTestLandmarks({
    0: { x: 0.5, y: 0.08, z: 0, visibility: 0.95 },
    11: { x: 0.42, y: 0.22, z: 0, visibility: 0.92 },
    12: { x: 0.58, y: 0.22, z: 0, visibility: 0.92 },
    13: { x: 0.35, y: 0.32, z: 0, visibility: 0.88 },
    14: { x: 0.65, y: 0.32, z: 0, visibility: 0.88 },
    15: { x: 0.30, y: 0.42, z: 0, visibility: 0.85 },
    16: { x: 0.70, y: 0.42, z: 0, visibility: 0.85 },
    23: { x: 0.43, y: 0.52, z: 0, visibility: 0.90 },
    24: { x: 0.57, y: 0.52, z: 0, visibility: 0.90 },
    25: { x: 0.44, y: 0.72, z: 0, visibility: 0.87 },
    26: { x: 0.56, y: 0.72, z: 0, visibility: 0.87 },
    27: { x: 0.44, y: 0.92, z: 0, visibility: 0.80 },
    28: { x: 0.56, y: 0.92, z: 0, visibility: 0.80 },
    29: { x: 0.44, y: 0.94, z: 0, visibility: 0.75 },
    30: { x: 0.56, y: 0.94, z: 0, visibility: 0.75 },
  });
}

function createSidePoseTestLandmarks(): LandmarkWithVisibility[] {
  return createTestLandmarks({
    0: { x: 0.45, y: 0.08, z: 0.1, visibility: 0.95 },
    11: { x: 0.50, y: 0.22, z: 0.05, visibility: 0.92 },
    12: { x: 0.50, y: 0.22, z: -0.05, visibility: 0.88 },
    13: { x: 0.55, y: 0.32, z: 0.08, visibility: 0.85 },
    14: { x: 0.45, y: 0.32, z: -0.08, visibility: 0.85 },
    23: { x: 0.50, y: 0.52, z: 0.02, visibility: 0.90 },
    24: { x: 0.50, y: 0.52, z: -0.02, visibility: 0.88 },
    25: { x: 0.50, y: 0.72, z: 0.03, visibility: 0.87 },
    26: { x: 0.50, y: 0.72, z: -0.03, visibility: 0.87 },
    27: { x: 0.50, y: 0.92, z: 0, visibility: 0.80 },
    28: { x: 0.50, y: 0.92, z: 0, visibility: 0.80 },
  });
}

describe('euclideanDistance', () => {
  it('calculates distance between two points correctly', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    const distance = euclideanDistance(p1, p2);
    expect(distance).toBeCloseTo(5, 5);
  });

  it('returns 0 for same point', () => {
    const p = { x: 0.5, y: 0.5 };
    expect(euclideanDistance(p, p)).toBe(0);
  });

  it('handles normalized coordinates', () => {
    const p1 = { x: 0.0, y: 0.0 };
    const p2 = { x: 0.5, y: 0.5 };
    const distance = euclideanDistance(p1, p2);
    expect(distance).toBeCloseTo(0.707, 2);
  });
});

describe('calculateMeasurements', () => {
  it('calculates measurements for a 170cm person', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const sideLandmarks = createSidePoseTestLandmarks();

    const result = calculateMeasurements(frontLandmarks, sideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result.measurements.shoulders).toBeGreaterThan(0);
    expect(result.measurements.chest).toBeGreaterThan(0);
    expect(result.measurements.waist).toBeGreaterThan(0);
    expect(result.measurements.hips).toBeGreaterThan(0);
    expect(result.measurements.inseam).toBeGreaterThan(0);
    expect(result.measurements.armLength).toBeGreaterThan(0);
    expect(result.measurements.torsoLength).toBeGreaterThan(0);
  });

  it('returns structured measurements result', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const sideLandmarks = createSidePoseTestLandmarks();

    const result = calculateMeasurements(frontLandmarks, sideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result.measurements).toHaveProperty('shoulders');
    expect(result.measurements).toHaveProperty('chest');
    expect(result.measurements).toHaveProperty('waist');
    expect(result.measurements).toHaveProperty('hips');
    expect(result.measurements).toHaveProperty('inseam');
    expect(result.measurements).toHaveProperty('armLength');
    expect(result.measurements).toHaveProperty('torsoLength');
    expect(result.measurements).toHaveProperty('confidence');
    expect(result.measurements).toHaveProperty('capturedAt');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('returns higher confidence when landmarks have high visibility', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const sideLandmarks = createSidePoseTestLandmarks();

    const result = calculateMeasurements(frontLandmarks, sideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result.measurements.confidence).toBeGreaterThan(0.5);
  });

  it('marks as estimated when side landmarks are missing depth data', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const emptySideLandmarks = createTestLandmarks();

    const result = calculateMeasurements(frontLandmarks, emptySideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns measurements with capturedAt date', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const sideLandmarks = createSidePoseTestLandmarks();

    const before = new Date();
    const result = calculateMeasurements(frontLandmarks, sideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);
    const after = new Date();

    expect(result.measurements.capturedAt).toBeInstanceOf(Date);
    expect(result.measurements.capturedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.measurements.capturedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('scales proportionally with height', () => {
    const frontLandmarks = createFrontPoseTestLandmarks();
    const sideLandmarks = createSidePoseTestLandmarks();

    const result170 = calculateMeasurements(frontLandmarks, sideLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);
    const result180 = calculateMeasurements(frontLandmarks, sideLandmarks, 180, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result180.measurements.shoulders).toBeGreaterThan(result170.measurements.shoulders);
    expect(result180.measurements.inseam).toBeGreaterThan(result170.measurements.inseam);
  });

  it('returns zero measurements for empty landmarks', () => {
    const emptyLandmarks: LandmarkWithVisibility[] = [];

    const result = calculateMeasurements(emptyLandmarks, emptyLandmarks, 170, IMAGE_WIDTH, IMAGE_HEIGHT);

    expect(result.measurements.shoulders).toBe(0);
    expect(result.measurements.confidence).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateMeasurements', () => {
  it('validates measurements and returns structure', () => {
    const measurements = {
      shoulders: 42,
      chest: 90,
      waist: 76,
      hips: 94,
      inseam: 78,
      armLength: 58,
      torsoLength: 48,
      confidence: 0.85,
    };

    const result = validateMeasurements(measurements, 170);

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('returns errors for unreasonable measurements', () => {
    const measurements = {
      shoulders: 5,
      chest: 20,
      waist: 10,
      hips: 15,
      inseam: 5,
      armLength: 5,
      torsoLength: 5,
      confidence: 0.5,
    };

    const result = validateMeasurements(measurements, 170);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns warnings for unusual proportions', () => {
    const measurements = {
      shoulders: 50,
      chest: 100,
      waist: 50,
      hips: 55,
      inseam: 80,
      armLength: 60,
      torsoLength: 50,
      confidence: 0.8,
    };

    const result = validateMeasurements(measurements, 170);

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects unusual waist-to-hip ratio', () => {
    const measurements = {
      shoulders: 42,
      chest: 95,
      waist: 95,
      hips: 70,
      inseam: 78,
      armLength: 58,
      torsoLength: 48,
      confidence: 0.85,
    };

    const result = validateMeasurements(measurements, 170);

    const waistToHipWarning = result.warnings.find(w => w.includes('cintura-cadera'));
    expect(waistToHipWarning).toBeDefined();
  });
});

describe('getSizeRecommendation', () => {
  it('returns XS for very small waist', () => {
    const measurements = {
      shoulders: 35, chest: 80, waist: 60, hips: 85,
      inseam: 70, armLength: 52, torsoLength: 42, confidence: 0.8,
    };
    expect(getSizeRecommendation(measurements).size).toBe('XS');
  });

  it('returns M for average waist', () => {
    const measurements = {
      shoulders: 42, chest: 92, waist: 74, hips: 96,
      inseam: 78, armLength: 58, torsoLength: 48, confidence: 0.8,
    };
    expect(getSizeRecommendation(measurements).size).toBe('M');
  });

  it('returns XL for large waist', () => {
    const measurements = {
      shoulders: 50, chest: 115, waist: 90, hips: 110,
      inseam: 82, armLength: 62, torsoLength: 52, confidence: 0.8,
    };
    expect(getSizeRecommendation(measurements).size).toBe('XL');
  });
});
