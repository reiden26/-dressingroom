/**
 * Body measurement calculator from MediaPipe Pose landmarks.
 *
 * Strategy:
 *  1. Compute a vertical scale factor (cm per pixel) using the user-declared
 *     height and the visible vertical extent of the body in the frontal image,
 *     correcting for the offset between the topmost detected facial landmark
 *     and the actual top of the head, and between the lowest detected foot
 *     landmark and the actual floor.
 *  2. Derive widths and lengths from the front view in centimeters.
 *  3. If a side view is available, derive depths (front-to-back distance) from
 *     it and combine width + depth into ellipse-perimeter circumferences.
 *     Otherwise, fall back to anthropometric ratios.
 */

export interface LandmarkWithVisibility {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface BodyMeasurementsResult {
  measurements: {
    shoulders: number;
    chest: number;
    waist: number;
    hips: number;
    inseam: number;
    armLength: number;
    torsoLength: number;
    capturedAt: Date;
    confidence: number;
    isEstimated: boolean;
  };
  warnings: string[];
}

const LM = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

const MIN_VISIBILITY = 0.3;

function get(
  landmarks: LandmarkWithVisibility[],
  index: number,
  minVisibility = MIN_VISIBILITY
): LandmarkWithVisibility | null {
  const lm = landmarks[index];
  if (!lm) return null;
  if ((lm.visibility ?? 0) < minVisibility) return null;
  return lm;
}

function pixelDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (a.x - b.x) * imageWidth;
  const dy = (a.y - b.y) * imageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns the perimeter of an ellipse with given full-width and full-depth
 * using Ramanujan's first approximation. Inputs are diameters; the formula
 * uses semi-axes a = width / 2, b = depth / 2.
 */
function ellipsePerimeter(width: number, depth: number): number {
  if (width <= 0 || depth <= 0) return 0;
  const a = width / 2;
  const b = depth / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/**
 * Estimate the cm-per-pixel scale factor along the vertical axis using the
 * user's declared height. We pick the topmost visible head landmark and the
 * lowest visible foot landmark, and account for the small offsets between
 * those landmarks and the true top of the head / floor.
 *
 * The offsets are expressed as a fraction of total body height.
 */
function computeVerticalScaleFactor(
  landmarks: LandmarkWithVisibility[],
  heightCm: number,
  imageHeight: number
): { scaleFactor: number; visibleRatio: number } | null {
  const headCandidates: { lm: LandmarkWithVisibility | null; offset: number }[] = [
    { lm: get(landmarks, LM.LEFT_EAR), offset: 0.06 },
    { lm: get(landmarks, LM.RIGHT_EAR), offset: 0.06 },
    { lm: get(landmarks, LM.LEFT_EYE), offset: 0.07 },
    { lm: get(landmarks, LM.RIGHT_EYE), offset: 0.07 },
    { lm: get(landmarks, LM.NOSE), offset: 0.1 },
  ].filter((c) => c.lm !== null) as { lm: LandmarkWithVisibility; offset: number }[];

  const footCandidates: { lm: LandmarkWithVisibility | null; offset: number }[] = [
    { lm: get(landmarks, LM.LEFT_FOOT_INDEX), offset: 0 },
    { lm: get(landmarks, LM.RIGHT_FOOT_INDEX), offset: 0 },
    { lm: get(landmarks, LM.LEFT_HEEL), offset: 0.02 },
    { lm: get(landmarks, LM.RIGHT_HEEL), offset: 0.02 },
    { lm: get(landmarks, LM.LEFT_ANKLE), offset: 0.04 },
    { lm: get(landmarks, LM.RIGHT_ANKLE), offset: 0.04 },
  ].filter((c) => c.lm !== null) as { lm: LandmarkWithVisibility; offset: number }[];

  if (headCandidates.length === 0 || footCandidates.length === 0) return null;

  // Topmost head landmark = smallest y (origin at top of frame).
  const head = headCandidates.reduce((acc, cur) => (cur.lm.y < acc.lm.y ? cur : acc));
  // Lowest foot landmark = largest y.
  const foot = footCandidates.reduce((acc, cur) => (cur.lm.y > acc.lm.y ? cur : acc));

  const visibleNormalized = foot.lm.y - head.lm.y; // 0..1 of frame height
  if (visibleNormalized <= 0.05) return null;

  const visiblePixels = visibleNormalized * imageHeight;
  const visibleRatio = Math.max(0.7, 1 - head.offset - foot.offset);
  const totalPixelHeight = visiblePixels / visibleRatio;
  const scaleFactor = heightCm / totalPixelHeight;

  return { scaleFactor, visibleRatio };
}

function avgVisibility(landmarks: (LandmarkWithVisibility | null)[]): number {
  const valid = landmarks.filter((l): l is LandmarkWithVisibility => l !== null);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, l) => sum + (l.visibility ?? 0), 0) / valid.length;
}

/**
 * Estimate horizontal depth between left/right shoulders (or hips) when seen
 * from a side view. In a true profile view, both sides project onto the same
 * image plane, and the horizontal distance between them approximates the
 * front-to-back depth of the body at that level.
 */
function depthFromSide(
  sideLandmarks: LandmarkWithVisibility[] | null,
  leftIdx: number,
  rightIdx: number,
  scaleFactor: number,
  imageWidth: number
): number | null {
  if (!sideLandmarks || sideLandmarks.length === 0) return null;
  const left = get(sideLandmarks, leftIdx, 0.2);
  const right = get(sideLandmarks, rightIdx, 0.2);
  if (!left || !right) return null;
  const px = Math.abs(left.x - right.x) * imageWidth;
  // Heuristic correction: in pure profile, only one side is sharply
  // visible; the other has lower confidence and slightly compressed x.
  return px * scaleFactor * 1.05;
}

export function calculateMeasurements(
  frontLandmarks: LandmarkWithVisibility[],
  sideLandmarks: LandmarkWithVisibility[],
  heightCm: number,
  imageWidth: number,
  imageHeight: number
): BodyMeasurementsResult {
  const warnings: string[] = [];

  if (!frontLandmarks || frontLandmarks.length === 0) {
    return emptyResult([
      'No se detectaron landmarks en la pose frontal. Asegurate de que tu cuerpo entero sea visible.',
    ]);
  }

  const scale = computeVerticalScaleFactor(frontLandmarks, heightCm, imageHeight);
  if (!scale) {
    return emptyResult([
      'No se pudo calibrar la escala. Asegurate de que la cabeza y los pies sean visibles en la pose frontal.',
    ]);
  }
  const { scaleFactor } = scale;

  const lShoulder = get(frontLandmarks, LM.LEFT_SHOULDER);
  const rShoulder = get(frontLandmarks, LM.RIGHT_SHOULDER);
  const lHip = get(frontLandmarks, LM.LEFT_HIP);
  const rHip = get(frontLandmarks, LM.RIGHT_HIP);
  const lKnee = get(frontLandmarks, LM.LEFT_KNEE);
  const rKnee = get(frontLandmarks, LM.RIGHT_KNEE);
  const lAnkle = get(frontLandmarks, LM.LEFT_ANKLE);
  const rAnkle = get(frontLandmarks, LM.RIGHT_ANKLE);
  const lElbow = get(frontLandmarks, LM.LEFT_ELBOW);
  const rElbow = get(frontLandmarks, LM.RIGHT_ELBOW);
  const lWrist = get(frontLandmarks, LM.LEFT_WRIST);
  const rWrist = get(frontLandmarks, LM.RIGHT_WRIST);

  // ---- Width measurements (front view) ----
  // Shoulders: bone-to-bone landmark distance is slightly narrower than the
  // actual shoulder breadth (acromion-to-acromion); 1.12 brings it closer.
  let shoulderWidthCm = 0;
  if (lShoulder && rShoulder) {
    const px = pixelDistance(lShoulder, rShoulder, imageWidth, imageHeight);
    shoulderWidthCm = px * scaleFactor * 1.12;
  }

  // Hip width: landmarks are at the joint, slightly inside the actual outer
  // hip line; 1.1 compensates.
  let hipWidthCm = 0;
  if (lHip && rHip) {
    const px = pixelDistance(lHip, rHip, imageWidth, imageHeight);
    hipWidthCm = px * scaleFactor * 1.1;
  }

  // Chest width is wider than the shoulder-joint distance (ribcage spreads
  // out); use a small expansion of shoulder width.
  const chestWidthCm = shoulderWidthCm > 0 ? shoulderWidthCm * 0.95 : 0;
  // Natural waist width sits roughly between shoulder and hip width; with
  // average proportion it is ~0.78 of hip width.
  const waistWidthCm = hipWidthCm > 0 ? hipWidthCm * 0.82 : 0;

  // ---- Lengths ----
  // Torso length: midpoint of shoulders to midpoint of hips.
  let torsoLengthCm = 0;
  if (lShoulder && rShoulder && lHip && rHip) {
    const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
    const hipMidY = (lHip.y + rHip.y) / 2;
    torsoLengthCm = Math.abs(hipMidY - shoulderMidY) * imageHeight * scaleFactor;
  }

  // Inseam: hip joint to ankle, vertical distance (the side of the leg).
  // This is the canonical garment measurement, NOT knee-to-ankle.
  let inseamCm = 0;
  {
    const hip = lHip ?? rHip;
    const ankle = lAnkle ?? rAnkle;
    if (hip && ankle) {
      inseamCm = Math.abs(ankle.y - hip.y) * imageHeight * scaleFactor;
      // Small inward offset: actual inseam starts at the crotch which is
      // ~3 cm below the hip joint landmark.
      inseamCm = Math.max(0, inseamCm - 3);
    }
  }

  // Arm length: shoulder -> elbow -> wrist (sum of segments). Average sides.
  function armLen(
    s: LandmarkWithVisibility | null,
    e: LandmarkWithVisibility | null,
    w: LandmarkWithVisibility | null
  ): number {
    if (!s || !e || !w) return 0;
    const upper = pixelDistance(s, e, imageWidth, imageHeight);
    const lower = pixelDistance(e, w, imageWidth, imageHeight);
    return (upper + lower) * scaleFactor;
  }
  const leftArm = armLen(lShoulder, lElbow, lWrist);
  const rightArm = armLen(rShoulder, rElbow, rWrist);
  const armSamples = [leftArm, rightArm].filter((v) => v > 0);
  const armLengthCm =
    armSamples.length > 0 ? armSamples.reduce((a, b) => a + b, 0) / armSamples.length : 0;

  // ---- Depths from side view (optional) ----
  const shoulderDepthCm = depthFromSide(
    sideLandmarks,
    LM.LEFT_SHOULDER,
    LM.RIGHT_SHOULDER,
    scaleFactor,
    imageWidth
  );
  const hipDepthCm = depthFromSide(sideLandmarks, LM.LEFT_HIP, LM.RIGHT_HIP, scaleFactor, imageWidth);

  const hasSideDepth = shoulderDepthCm !== null && hipDepthCm !== null;

  // ---- Circumferences ----
  // Chest: ellipse(chestWidth, chestDepth) where chestDepth ≈ shoulder depth.
  // Hips: ellipse(hipWidth, hipDepth).
  // Waist: ellipse interpolation between chest and hip.
  let chestCircumCm = 0;
  let waistCircumCm = 0;
  let hipCircumCm = 0;

  if (hasSideDepth && shoulderDepthCm! > 0 && hipDepthCm! > 0) {
    const chestDepth = shoulderDepthCm!; // chest depth ~= shoulder depth
    const waistDepth = (shoulderDepthCm! + hipDepthCm!) / 2 * 0.88;
    chestCircumCm = ellipsePerimeter(chestWidthCm, chestDepth);
    waistCircumCm = ellipsePerimeter(waistWidthCm, waistDepth);
    hipCircumCm = ellipsePerimeter(hipWidthCm, hipDepthCm!);
  } else {
    // Fallback: anthropometric ratio constants from front-only widths.
    // These correspond roughly to a circular-but-not-circular cross section
    // typical of adults of average build.
    chestCircumCm = chestWidthCm > 0 ? chestWidthCm * 2.85 : 0;
    waistCircumCm = waistWidthCm > 0 ? waistWidthCm * 2.95 : 0;
    hipCircumCm = hipWidthCm > 0 ? hipWidthCm * 3.05 : 0;
    if (sideLandmarks && sideLandmarks.length > 0) {
      warnings.push('La vista lateral no fue clara, las circunferencias son estimaciones.');
    } else {
      warnings.push('Sin vista lateral. Las circunferencias se estimaron por proporciones.');
    }
  }

  // ---- Confidence ----
  const usedFront = [lShoulder, rShoulder, lHip, rHip, lAnkle ?? rAnkle];
  let confidence = avgVisibility(usedFront);
  const frontCount = usedFront.filter((l) => l !== null).length;
  let isEstimated = false;

  if (frontCount < 4) {
    confidence *= 0.7;
    isEstimated = true;
    warnings.push('Algunas medidas se estimaron porque faltaban landmarks clave en la vista frontal.');
  }

  if (hasSideDepth) {
    confidence = Math.min(1, confidence + 0.1);
  } else {
    confidence *= 0.85;
  }

  // Sanity range checks against declared height.
  if (shoulderWidthCm > 0 && (shoulderWidthCm < heightCm * 0.18 || shoulderWidthCm > heightCm * 0.3)) {
    warnings.push(
      `El ancho de hombros (${Math.round(shoulderWidthCm)} cm) esta fuera del rango esperado.`
    );
    confidence *= 0.85;
  }
  if (waistCircumCm > 0 && (waistCircumCm < heightCm * 0.35 || waistCircumCm > heightCm * 0.7)) {
    warnings.push(`La cintura (${Math.round(waistCircumCm)} cm) esta fuera del rango esperado.`);
    confidence *= 0.85;
  }

  confidence = Math.max(0, Math.min(1, confidence));

  console.log('[v0] Mediciones calculadas', {
    scaleFactor,
    shoulderWidthCm,
    hipWidthCm,
    chestCircumCm,
    waistCircumCm,
    hipCircumCm,
    inseamCm,
    armLengthCm,
    torsoLengthCm,
    hasSideDepth,
    confidence,
  });

  return {
    measurements: {
      shoulders: Math.round(shoulderWidthCm),
      chest: Math.round(chestCircumCm),
      waist: Math.round(waistCircumCm),
      hips: Math.round(hipCircumCm),
      inseam: Math.round(inseamCm),
      armLength: Math.round(armLengthCm),
      torsoLength: Math.round(torsoLengthCm),
      capturedAt: new Date(),
      confidence: Math.round(confidence * 100) / 100,
      isEstimated,
    },
    warnings,
  };
}

function emptyResult(warnings: string[]): BodyMeasurementsResult {
  return {
    measurements: {
      shoulders: 0,
      chest: 0,
      waist: 0,
      hips: 0,
      inseam: 0,
      armLength: 0,
      torsoLength: 0,
      capturedAt: new Date(),
      confidence: 0,
      isEstimated: true,
    },
    warnings,
  };
}
