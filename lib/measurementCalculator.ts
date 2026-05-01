import type { LandmarkWithVisibility, BodyMeasurementsResult } from './types';

// ============================================================================
// CAPA 1 — PROPORCIONES ESTRUCTURALES (CSV)
// ============================================================================
// Coeficientes para medidas estructurales donde el R² era aceptable.
// Solo: entrepierna, torso, largo_brazo.
const STRUCTURAL_COEFFICIENTS = {
  entrepierna: { intercept: 19.05, altura: 0.43, genero: -2.30 },
  torso:       { intercept: 18.71, altura: 0.26, genero: -3.15 },
  largo_brazo: { intercept: 21.68, altura: 0.23, genero: -1.43 },
} as const;

function predictStructural(
  key: keyof typeof STRUCTURAL_COEFFICIENTS,
  altura: number,
  genero: number   // 1=M, 2=F, 1.5=neutro
): number {
  const c = STRUCTURAL_COEFFICIENTS[key];
  return c.intercept + c.altura * altura + c.genero * genero;
}

// ============================================================================
// CAPA 2 — CIRCUNFERENCIAS POR BMI (ANSUR II)
// ============================================================================
// Para pecho, cintura, cadera, hombros — donde el R² era malo sin peso.
// Calibrado contra ANSUR II (n=4082) y validado contra ISO 8559.

const CIRCUMFERENCE_BASE = {
  male: {
    pecho:   { base: 99.5,  dAltura: 0.30, dBmi: 1.40 },
    cintura: { base: 83.0,  dAltura: 0.20, dBmi: 2.10 },
    cadera:  { base: 99.0,  dAltura: 0.25, dBmi: 1.60 },
    hombros: { base: 44.5,  dAltura: 0.22, dBmi: 0.45 },
  },
  female: {
    pecho:   { base: 93.0,  dAltura: 0.28, dBmi: 1.50 },
    cintura: { base: 72.0,  dAltura: 0.18, dBmi: 2.20 },
    cadera:  { base: 99.5,  dAltura: 0.22, dBmi: 1.70 },
    hombros: { base: 40.5,  dAltura: 0.20, dBmi: 0.40 },
  },
} as const;

const REFERENCE_HEIGHT = { male: 175, female: 163 };
const REFERENCE_BMI    = { male: 25.1, female: 23.7 };

function _calcCirc(
  key: 'pecho' | 'cintura' | 'cadera' | 'hombros',
  altura: number,
  bmi: number,
  sex: 'male' | 'female'
): number {
  const c = CIRCUMFERENCE_BASE[sex][key];
  const refH = REFERENCE_HEIGHT[sex];
  const refB = REFERENCE_BMI[sex];
  return c.base + c.dAltura * (altura - refH) + c.dBmi * (bmi - refB);
}

function predictCircumference(
  key: 'pecho' | 'cintura' | 'cadera' | 'hombros',
  altura: number,
  bmi: number,
  genero: number   // 1=M, 2=F, 1.5=neutro
): number {
  // Para género neutro (1.5), interpola entre M y F
  const maleVal   = _calcCirc(key, altura, bmi, 'male');
  const femaleVal = _calcCirc(key, altura, bmi, 'female');
  const t = (genero - 1);   // 0 → male, 1 → female, 0.5 → neutro
  return maleVal * (1 - t) + femaleVal * t;
}

// ============================================================================
// CAPA 3 — AJUSTE MEDIAPIPE (delta ±12%)
// ============================================================================
// MediaPipe ajusta la estimación base, nunca la reemplaza.
// Solo se aplica cuando la visibilidad del landmark es >= 0.5.

function applyLandmarkDelta(
  base: number,
  visual: number,
  landmarkConfidence: number,
  maxDelta = 0.12
): number {
  if (visual <= 0 || landmarkConfidence < 0.5) return base;
  const delta = (visual - base) / base;
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
  // Peso del landmark proporcional a su confianza, máximo 60%
  const weight = Math.min(landmarkConfidence * 0.6, 0.60);
  return base * (1 + clamped * weight);
}

// ============================================================================
// UTILIDADES
// ============================================================================
const LANDMARK_INDICES = {
  NOSE: 0,
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

  const ankle = (leftAnkle ?? rightAnkle)!;
  const nosePixelY = nose.y * imageHeight;
  const anklePixelY = ankle.y * imageHeight;

  const bodyPixelHeight = Math.abs(anklePixelY - nosePixelY);
  const scaleFactor = heightCm / (bodyPixelHeight * 0.92);

  return scaleFactor;
}

// ============================================================================
// FUNCIÓN PRINCIPAL — calculateMeasurements
// ============================================================================
export function calculateMeasurements(
  frontLandmarks: LandmarkWithVisibility[],
  sideLandmarks: LandmarkWithVisibility[],
  heightCm: number,
  imageWidth: number,
  imageHeight: number,
  weightKg?: number,
  gender: 1 | 1.5 | 2 = 1.5
): BodyMeasurementsResult {
  const warnings: string[] = [];

  // -------------------------------------------------------------------------
  // 1. CALCULAR BMI (neutro = 22 si no hay peso)
  // -------------------------------------------------------------------------
  const bmi = weightKg && weightKg > 0
    ? weightKg / ((heightCm / 100) ** 2)
    : 22;

  // -------------------------------------------------------------------------
  // 2. ESTIMACIÓN BASE: Capa 1 + Capa 2
  // -------------------------------------------------------------------------
  const base = {
    hombros:     predictCircumference('hombros', heightCm, bmi, gender),
    pecho:       predictCircumference('pecho', heightCm, bmi, gender),
    cintura:     predictCircumference('cintura', heightCm, bmi, gender),
    cadera:      predictCircumference('cadera', heightCm, bmi, gender),
    entrepierna: predictStructural('entrepierna', heightCm, gender),
    torso:       predictStructural('torso', heightCm, gender),
    largo_brazo: predictStructural('largo_brazo', heightCm, gender),
  };

  // -------------------------------------------------------------------------
  // 3. EXTRACCIÓN DE LANDMARKS Y MEDIDAS VISUALES
  // -------------------------------------------------------------------------
  const scaleFactor = calculateScaleFactor(frontLandmarks, heightCm, imageWidth, imageHeight);

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

  // Ancho biacromial visual (NO es circunferencia)
  let visualShoulderWidth = 0;
  let shoulderConfidence = 0;
  if (leftShoulder && rightShoulder) {
    const rawShoulders = pixelDistance(leftShoulder, rightShoulder, imageWidth, imageHeight);
    visualShoulderWidth = scaleFactor ? rawShoulders * scaleFactor * 1.15 : 0;
    shoulderConfidence = (leftShoulder.visibility + rightShoulder.visibility) / 2;
  }

  // Ancho de caderas visual
  let visualHipWidth = 0;
  let hipConfidence = 0;
  if (leftHip && rightHip) {
    const rawHips = pixelDistance(leftHip, rightHip, imageWidth, imageHeight);
    visualHipWidth = scaleFactor ? rawHips * scaleFactor * 1.1 : 0;
    hipConfidence = (leftHip.visibility + rightHip.visibility) / 2;
  }

  // Largo de torso (hombros a caderas)
  let visualTorso = 0;
  if (leftShoulder && rightShoulder && leftHip && rightHip && scaleFactor) {
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    visualTorso = Math.abs(hipMidY - shoulderMidY) * imageHeight * scaleFactor;
  }

  // Entrepierna (cadera a tobillo)
  let visualInseam = 0;
  let inseamConfidence = 0;
  const hipForInseam = leftHip || rightHip;
  const ankleForInseam = leftAnkle || rightAnkle;
  const kneeForInseam = leftKnee || rightKnee;

  if (hipForInseam && ankleForInseam && scaleFactor) {
    visualInseam = Math.abs(ankleForInseam.y - hipForInseam.y) * imageHeight * scaleFactor * 0.95;
    inseamConfidence = Math.max(hipForInseam.visibility, ankleForInseam.visibility);
  } else if (kneeForInseam && ankleForInseam && scaleFactor) {
    visualInseam = Math.abs(ankleForInseam.y - kneeForInseam.y) * imageHeight * scaleFactor * 2.05;
    inseamConfidence = Math.max(kneeForInseam.visibility, ankleForInseam.visibility) * 0.7;
  }

  // Largo de brazo
  let leftArmLength = 0;
  let rightArmLength = 0;
  let armConfidence = 0;

  if (leftShoulder && leftElbow && leftWrist && scaleFactor) {
    const upperArm = pixelDistance(leftShoulder, leftElbow, imageWidth, imageHeight);
    const lowerArm = pixelDistance(leftElbow, leftWrist, imageWidth, imageHeight);
    leftArmLength = (upperArm + lowerArm) * scaleFactor;
    armConfidence = Math.max(armConfidence, (leftShoulder.visibility + leftElbow.visibility + leftWrist.visibility) / 3);
  }
  if (rightShoulder && rightElbow && rightWrist && scaleFactor) {
    const upperArm = pixelDistance(rightShoulder, rightElbow, imageWidth, imageHeight);
    const lowerArm = pixelDistance(rightElbow, rightWrist, imageWidth, imageHeight);
    rightArmLength = (upperArm + lowerArm) * scaleFactor;
    armConfidence = Math.max(armConfidence, (rightShoulder.visibility + rightElbow.visibility + rightWrist.visibility) / 3);
  }
  const visualArmLength = (leftArmLength + rightArmLength) / 2 || 0;

  // -------------------------------------------------------------------------
  // 4. CÁLCULO DE DESVIACIÓN RELATIVA (ratio anatómico)
  // -------------------------------------------------------------------------
  // Proporción anatómica media: ancho biacromial ≈ hombros_circunferencia / 2.85
  const expectedShoulderWidth = base.hombros / 2.85;
  const shoulderRatio = visualShoulderWidth > 0 && expectedShoulderWidth > 0
    ? visualShoulderWidth / expectedShoulderWidth
    : 1;

  // Proporción anatómica media: ancho caderas ≈ cadera_circunferencia / 3.0
  const expectedHipWidth = base.cadera / 3.0;
  const hipRatio = visualHipWidth > 0 && expectedHipWidth > 0
    ? visualHipWidth / expectedHipWidth
    : 1;

  // -------------------------------------------------------------------------
  // 5. APLICAR CAPA 3 — AJUSTE MEDIAPIPE (solo hombros y cadera)
  // -------------------------------------------------------------------------
  // El delta se aplica como ratio, no como diferencia absoluta
  const clampRatio = (ratio: number, maxDelta = 0.12) => {
    const delta = ratio - 1;
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    return 1 + clamped;
  };

  let finalShoulders = base.hombros;
  let finalHips = base.cadera;

  if (shoulderConfidence >= 0.5 && scaleFactor) {
    const clampedRatio = clampRatio(shoulderRatio);
    const weight = Math.min(shoulderConfidence * 0.6, 0.60);
    finalShoulders = base.hombros * (1 + (clampedRatio - 1) * weight);
  }

  if (hipConfidence >= 0.5 && scaleFactor) {
    const clampedRatio = clampRatio(hipRatio);
    const weight = Math.min(hipConfidence * 0.6, 0.60);
    finalHips = base.cadera * (1 + (clampedRatio - 1) * weight);
  }

  // El resto viene directo de la base (MediaPipe no puede medirlos bien)
  const finalChest = base.pecho;
  const finalWaist = base.cintura;
  const finalTorso = visualTorso > 0 && shoulderConfidence >= 0.5 && hipConfidence >= 0.5
    ? applyLandmarkDelta(base.torso, visualTorso, Math.min(shoulderConfidence, hipConfidence))
    : base.torso;
  const finalInseam = visualInseam > 0 && inseamConfidence >= 0.5
    ? applyLandmarkDelta(base.entrepierna, visualInseam, inseamConfidence)
    : base.entrepierna;
  const finalArmLength = visualArmLength > 0 && armConfidence >= 0.5
    ? applyLandmarkDelta(base.largo_brazo, visualArmLength, armConfidence)
    : base.largo_brazo;

  // -------------------------------------------------------------------------
  // 6. CÁLCULO DE CONFIANZA
  // -------------------------------------------------------------------------
  const keyLandmarks = [
    nose,
    leftShoulder, rightShoulder,
    leftHip, rightHip,
    leftAnkle, rightAnkle,
  ];
  const avgVisibility = averageVisibility(keyLandmarks);

  let confidence = avgVisibility;

  const groupsDetected = {
    shoulders: leftShoulder && rightShoulder,
    hips: leftHip && rightHip,
    ankles: leftAnkle && rightAnkle,
    nose: !!nose,
  };

  const groupsCount = Object.values(groupsDetected).filter(Boolean).length;
  if (groupsCount === 4) {
    confidence = Math.min(confidence + 0.10, 1.0);
  }

  if (!groupsDetected.ankles) {
    confidence *= 0.85;
    warnings.push('Tobillos no visibles - entrepierna estimada');
  } else {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  if (!groupsDetected.hips) {
    confidence *= 0.75;
    warnings.push('Caderas no visibles - cintura y cadera estimadas');
  }

  if (!groupsDetected.shoulders) {
    confidence *= 0.8;
    warnings.push('Hombros no visibles - pecho y hombros estimados');
  }

  if (weightKg && weightKg > 0) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Vista lateral
  const sideShoulder = getLandmark(sideLandmarks, LANDMARK_INDICES.LEFT_SHOULDER);
  const sideHip = getLandmark(sideLandmarks, LANDMARK_INDICES.LEFT_HIP);
  if (sideShoulder && sideHip) {
    confidence = Math.min(confidence + 0.05, 1.0);
  } else {
    confidence *= 0.9;
    warnings.push('Falta vista lateral');
  }

  // Clamp final: mínimo 0.3 porque siempre tenemos altura+peso
  confidence = Math.max(0.3, Math.min(1.0, confidence));

  // -------------------------------------------------------------------------
  // 7. VALIDACIÓN DE RESULTADOS (DEV LOG)
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'development') {
    // Casos de prueba esperados
    const testCases = [
      { h: 170, w: 82, g: 1 as const, expectedPecho: 104, expectedCintura: 92, expectedHombros: 46 },
      { h: 155, w: 62, g: 2 as const, expectedPecho: 95, expectedCintura: 80, expectedHombros: 41 },
      { h: 175, w: 70, g: 1 as const, expectedPecho: 99, expectedCintura: 83, expectedHombros: 44 },
    ];

    for (const tc of testCases) {
      if (Math.abs(heightCm - tc.h) < 2 && Math.abs((weightKg || 22) - tc.w) < 2 && gender === tc.g) {
        const pechoOk = Math.abs(finalChest - tc.expectedPecho) <= 5;
        const cinturaOk = Math.abs(finalWaist - tc.expectedCintura) <= 5;
        const hombrosOk = Math.abs(finalShoulders - tc.expectedHombros) <= 5;
        if (!pechoOk || !cinturaOk || !hombrosOk) {
          console.warn('[measurementCalculator] BUG en coeficientes:', {
            caso: tc,
            resultado: { pecho: Math.round(finalChest), cintura: Math.round(finalWaist), hombros: Math.round(finalShoulders) },
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 8. RESULTADO FINAL
  // -------------------------------------------------------------------------
  const isEstimated = !scaleFactor || confidence < 0.5;

  return {
    measurements: {
      shoulders: Math.round(finalShoulders),
      chest: Math.round(finalChest),
      waist: Math.round(finalWaist),
      hips: Math.round(finalHips),
      inseam: Math.round(finalInseam),
      armLength: Math.round(finalArmLength),
      torsoLength: Math.round(finalTorso),
      capturedAt: new Date(),
      confidence: Math.round(confidence * 100) / 100,
      isEstimated,
      bmi: weightKg && weightKg > 0 ? Math.round(bmi * 10) / 10 : undefined,
    },
    warnings,
  };
}
