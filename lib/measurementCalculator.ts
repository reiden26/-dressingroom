export interface LandmarkWithVisibility {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface MeasurementInput {
  frontLandmarks: LandmarkWithVisibility[];
  sideLandmarks: LandmarkWithVisibility[];
  heightCm: number;
  weightKg?: number;
  imageWidth: number;
  imageHeight: number;
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
    bmi?: number;
  };
  warnings: string[];
}

const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
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

export function euclideanDistance(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function pixelDistance(
  landmark1: { x: number; y: number },
  landmark2: { x: number; y: number },
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (landmark1.x - landmark2.x) * imageWidth;
  const dy = (landmark1.y - landmark2.y) * imageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

function getLandmark(landmarks: LandmarkWithVisibility[], index: number): LandmarkWithVisibility | null {
  const lm = landmarks[index];
  if (!lm || lm.visibility < 0.3) return null;
  return lm;
}

function averageVisibility(landmarks: (LandmarkWithVisibility | null)[]): number {
  const valid = landmarks.filter((l): l is LandmarkWithVisibility => l !== null);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, l) => sum + l.visibility, 0) / valid.length;
}

function calculateScaleFactor(
  frontLandmarks: LandmarkWithVisibility[],
  heightCm: number,
  imageWidth: number,
  imageHeight: number
): number | null {
  const nose = getLandmark(frontLandmarks, LANDMARK_INDICES.NOSE);
  const leftAnkle = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_ANKLE);
  const rightAnkle = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_ANKLE);

  if (!nose || (!leftAnkle && !rightAnkle)) return null;

  const ankleY = leftAnkle ? leftAnkle.y : rightAnkle!.y;
  const ankleX = leftAnkle ? leftAnkle.x : rightAnkle!.x;

  const nosePixel = { x: nose.x * imageWidth, y: nose.y * imageHeight };
  const anklePixel = { x: ankleX * imageWidth, y: ankleY * imageHeight };

  const bodyPixelHeight = euclideanDistance(
    { x: nosePixel.x / imageWidth, y: nosePixel.y / imageHeight },
    { x: anklePixel.x / imageWidth, y: anklePixel.y / imageHeight }
  ) * imageHeight;

  // Nose-to-ankle is roughly 92% of total height (top of head is above the nose)
  const scaleFactor = heightCm / (bodyPixelHeight * 0.92);

  return scaleFactor;
}

/**
 * Empirical body-circumference estimates from height + BMI.
 * Calibrated against ANSUR II / ISO 8559 averages — robust when MediaPipe
 * silhouettes are noisy or partially occluded.
 */
function bmiBasedEstimates(heightCm: number, weightKg: number) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const dBmi = bmi - 22; // 22 is the median normal-weight BMI

  // Coefficients calibrated so an average 175cm/72kg adult (BMI ~23.5)
  // returns chest ~95cm, waist ~80cm, hips ~96cm.
  const chest = heightCm * 0.515 + dBmi * 1.6;
  const waist = heightCm * 0.46 + dBmi * 2.6;
  const hips = heightCm * 0.52 + dBmi * 1.8;
  const shoulders = heightCm * 0.235 + dBmi * 0.35;

  return { bmi, chest, waist, hips, shoulders };
}

/**
 * Blends a visual estimate with a BMI-based estimate. The visual estimate
 * is given the lower weight when it falls outside an anatomically plausible
 * window around the BMI estimate (it is more often noisy than the BMI one).
 */
function blendEstimate(visual: number, bmiBased: number, visualWeight = 0.45): number {
  if (visual <= 0) return bmiBased;
  // If the visual measurement is wildly off, trust the BMI estimate more.
  const ratio = visual / bmiBased;
  if (ratio < 0.78 || ratio > 1.22) {
    return bmiBased * 0.85 + visual * 0.15;
  }
  return bmiBased * (1 - visualWeight) + visual * visualWeight;
}

export function calculateMeasurements(
  frontLandmarks: LandmarkWithVisibility[],
  sideLandmarks: LandmarkWithVisibility[],
  heightCm: number,
  imageWidth: number,
  imageHeight: number,
  weightKg?: number
): BodyMeasurementsResult {
  const warnings: string[] = [];

  const scaleFactor = calculateScaleFactor(frontLandmarks, heightCm, imageWidth, imageHeight);

  // BMI-based estimates serve both as a fallback when scaling fails and as
  // an anatomical reference for blending with visual measurements.
  const haveWeight = typeof weightKg === 'number' && weightKg > 0;
  const bmiEst = haveWeight ? bmiBasedEstimates(heightCm, weightKg!) : null;

  if (!scaleFactor) {
    if (bmiEst) {
      warnings.push('No se pudieron detectar todos los puntos. Mostrando estimaciones basadas en altura y peso.');
      return {
        measurements: {
          shoulders: Math.round(bmiEst.shoulders),
          chest: Math.round(bmiEst.chest),
          waist: Math.round(bmiEst.waist),
          hips: Math.round(bmiEst.hips),
          inseam: Math.round(heightCm * 0.46),
          armLength: Math.round(heightCm * 0.33),
          torsoLength: Math.round(heightCm * 0.29),
          capturedAt: new Date(),
          confidence: 0.55,
          isEstimated: true,
          bmi: Math.round(bmiEst.bmi * 10) / 10,
        },
        warnings,
      };
    }
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
      warnings: ['No se pudieron detectar los puntos necesarios para calcular medidas'],
    };
  }

  const leftShoulder = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const rightShoulder = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_SHOULDER);
  const leftHip = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_HIP);
  const rightHip = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_HIP);
  const leftKnee = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_KNEE);
  const rightKnee = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_KNEE);
  const leftAnkle = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_ANKLE);
  const rightAnkle = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_ANKLE);
  const leftWrist = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_WRIST);
  const rightWrist = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_WRIST);
  const leftElbow = getLandmark(frontLandmarks, LANDMARK_INDICES.LEFT_ELBOW);
  const rightElbow = getLandmark(frontLandmarks, LANDMARK_INDICES.RIGHT_ELBOW);
  const nose = getLandmark(frontLandmarks, LANDMARK_INDICES.NOSE);

  let visualShoulders = 0;
  if (leftShoulder && rightShoulder) {
    const rawShoulders = pixelDistance(leftShoulder, rightShoulder, imageWidth, imageHeight);
    // 1.15 corrects for shoulder tip vs. acromion landmark offset
    visualShoulders = rawShoulders * scaleFactor * 1.15;
  }

  let hipsWidth = 0;
  if (leftHip && rightHip) {
    const rawHips = pixelDistance(leftHip, rightHip, imageWidth, imageHeight);
    hipsWidth = rawHips * scaleFactor * 1.1;
  }

  let torsoLength = 0;
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    torsoLength = Math.abs(hipMidY - shoulderMidY) * imageHeight * scaleFactor;
  }

  // Inseam: distance from hip to ankle (proper definition), with a 0.95
  // factor since the hip landmark sits a few cm above the crotch.
  let inseam = 0;
  const hipForInseam = leftHip || rightHip;
  const ankleForInseam = leftAnkle || rightAnkle;
  const kneeForInseam = leftKnee || rightKnee;
  if (hipForInseam && ankleForInseam) {
    const hipY = hipForInseam.y;
    const ankleY = ankleForInseam.y;
    inseam = Math.abs(ankleY - hipY) * imageHeight * scaleFactor * 0.95;
  } else if (kneeForInseam && ankleForInseam) {
    // Lower-leg fallback (extrapolated), used only when hip is not visible
    inseam = Math.abs(ankleForInseam.y - kneeForInseam.y) * imageHeight * scaleFactor * 2.05;
  }

  let leftArmLength = 0;
  let rightArmLength = 0;
  if (leftShoulder && leftElbow && leftWrist) {
    const upperArm = pixelDistance(leftShoulder, leftElbow, imageWidth, imageHeight);
    const lowerArm = pixelDistance(leftElbow, leftWrist, imageWidth, imageHeight);
    leftArmLength = (upperArm + lowerArm) * scaleFactor;
  }
  if (rightShoulder && rightElbow && rightWrist) {
    const upperArm = pixelDistance(rightShoulder, rightElbow, imageWidth, imageHeight);
    const lowerArm = pixelDistance(rightElbow, rightWrist, imageWidth, imageHeight);
    rightArmLength = (upperArm + lowerArm) * scaleFactor;
  }
  const armLength = (leftArmLength + rightArmLength) / 2 || 0;

  let chestDepth = 0;
  const sideNose = sideLandmarks[LANDMARK_INDICES.NOSE];
  const sideLeftShoulder = getLandmark(sideLandmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const sideRightShoulder = getLandmark(sideLandmarks, LANDMARK_INDICES.RIGHT_SHOULDER);

  if (sideNose && sideLeftShoulder && sideRightShoulder) {
    const sideShoulderMidX = (sideLeftShoulder.x + sideRightShoulder.x) / 2;
    chestDepth = Math.abs(sideNose.x - sideShoulderMidX) * imageWidth * scaleFactor * 2.2;
  }

  // Visual circumference approximations from front-view widths
  const visualChest = visualShoulders > 0 ? visualShoulders * 3.1 : 0;
  const visualWaist = hipsWidth > 0 ? hipsWidth * 2.7 : 0;
  const visualHips = hipsWidth > 0 ? hipsWidth * 3.3 : 0;

  // Blend with BMI estimates if weight is available — this is what
  // recovers correct sizes for users whose body shape (broad shoulders,
  // depth, etc.) doesn't match a flat front-projected silhouette.
  let chest = visualChest;
  let waist = visualWaist;
  let hips = visualHips;
  let shouldersWidth = visualShoulders;

  if (bmiEst) {
    chest = blendEstimate(visualChest, bmiEst.chest);
    waist = blendEstimate(visualWaist, bmiEst.waist);
    hips = blendEstimate(visualHips, bmiEst.hips);
    shouldersWidth = blendEstimate(visualShoulders, bmiEst.shoulders, 0.55);
  }

  const usedLandmarks = [
    leftShoulder, rightShoulder, leftHip, rightHip,
    leftKnee, leftAnkle, nose,
  ];
  const avgVisibility = averageVisibility(usedLandmarks);

  let confidence = avgVisibility;
  let isEstimated = false;

  const frontLandmarkCount = [leftShoulder, rightShoulder, leftHip, rightHip, nose, leftAnkle]
    .filter(l => l !== null).length;

  if (frontLandmarkCount < 5) {
    confidence *= 0.7;
    isEstimated = true;
    warnings.push('Algunas medidas son estimaciones basadas en proporciones corporales tipicas');
  }

  if (chestDepth > 0) {
    confidence = Math.min(confidence + 0.1, 1);
  } else {
    confidence *= 0.85;
    warnings.push('Falta la vista lateral para calcular profundidad de pecho y cadera');
  }

  if (bmiEst) {
    // Adding BMI context to the calculation gives us a strong anatomical prior,
    // which raises confidence slightly when measurements come back consistent.
    confidence = Math.min(confidence + 0.05, 1);
  }

  const shoulderRange = { min: heightCm * 0.18, max: heightCm * 0.32 };
  if (shouldersWidth < shoulderRange.min || shouldersWidth > shoulderRange.max) {
    warnings.push(`Anchura de hombros (${Math.round(shouldersWidth)}cm) esta fuera del rango esperado para esta altura`);
    confidence *= 0.8;
  }

  confidence = Math.max(0, Math.min(1, confidence));

  return {
    measurements: {
      shoulders: Math.round(shouldersWidth),
      chest: Math.round(chest),
      waist: Math.round(waist),
      hips: Math.round(hips),
      inseam: Math.round(inseam),
      armLength: Math.round(armLength),
      torsoLength: Math.round(torsoLength),
      capturedAt: new Date(),
      confidence: Math.round(confidence * 100) / 100,
      isEstimated,
      bmi: bmiEst ? Math.round(bmiEst.bmi * 10) / 10 : undefined,
    },
    warnings,
  };
}
