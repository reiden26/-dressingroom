export interface MeasurementsToValidate {
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  armLength: number;
  torsoLength: number;
  confidence: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateMeasurements(
  measurements: MeasurementsToValidate,
  heightCm: number
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const absMin = (percentage: number) => (heightCm * percentage * 0.8);
  const absMax = (percentage: number) => (heightCm * percentage * 1.2);

  const shouldersMin = Math.max(25, absMin(0.18));
  const shouldersMax = Math.min(60, absMax(0.28));
  if (measurements.shoulders < shouldersMin || measurements.shoulders > shouldersMax) {
    errors.push(`Anchura de hombros (${measurements.shoulders}cm) fuera de rango anatomico valido (${Math.round(shouldersMin)}-${Math.round(shouldersMax)}cm)`);
  }

  const chestMin = Math.max(60, absMin(0.30));
  const chestMax = Math.min(150, absMax(0.45));
  if (measurements.chest < chestMin || measurements.chest > chestMax) {
    errors.push(`Pecho (${measurements.chest}cm) fuera de rango anatomico valido (${Math.round(chestMin)}-${Math.round(chestMax)}cm)`);
  }

  const waistMin = Math.max(50, absMin(0.12));
  const waistMax = Math.min(150, absMax(0.20));
  if (measurements.waist < waistMin || measurements.waist > waistMax) {
    errors.push(`Cintura (${measurements.waist}cm) fuera de rango anatomico valido (${Math.round(waistMin)}-${Math.round(waistMax)}cm)`);
  }

  const hipsMin = Math.max(60, absMin(0.14));
  const hipsMax = Math.min(160, absMax(0.22));
  if (measurements.hips < hipsMin || measurements.hips > hipsMax) {
    errors.push(`Cadera (${measurements.hips}cm) fuera de rango anatomico valido (${Math.round(hipsMin)}-${Math.round(hipsMax)}cm)`);
  }

  const inseamMin = Math.max(40, absMin(0.26));
  const inseamMax = Math.min(100, absMax(0.36));
  if (measurements.inseam < inseamMin || measurements.inseam > inseamMax) {
    errors.push(`Entrepierna (${measurements.inseam}cm) fuera de rango anatomico valido (${Math.round(inseamMin)}-${Math.round(inseamMax)}cm)`);
  }

  const armLengthMin = Math.max(40, absMin(0.18));
  const armLengthMax = Math.min(90, absMax(0.26));
  if (measurements.armLength < armLengthMin || measurements.armLength > armLengthMax) {
    warnings.push(`Largo de brazo (${measurements.armLength}cm) fuera del rango tipico (${Math.round(armLengthMin)}-${Math.round(armLengthMax)}cm)`);
  }

  const torsoLengthMin = Math.max(35, absMin(0.24));
  const torsoLengthMax = Math.min(60, absMax(0.34));
  if (measurements.torsoLength < torsoLengthMin || measurements.torsoLength > torsoLengthMax) {
    warnings.push(`Largo de torso (${measurements.torsoLength}cm) fuera del rango tipico (${Math.round(torsoLengthMin)}-${Math.round(torsoLengthMax)}cm)`);
  }

  const shoulderToWaistRatio = measurements.shoulders / (measurements.waist || 1);
  if (shoulderToWaistRatio < 1.1 || shoulderToWaistRatio > 1.8) {
    warnings.push(`Proporcion hombro-cintura (${shoulderToWaistRatio.toFixed(2)}) es inusual`);
  }

  const waistToHipRatio = measurements.waist / (measurements.hips || 1);
  if (waistToHipRatio < 0.6 || waistToHipRatio > 1.0) {
    warnings.push(`Proporcion cintura-cadera (${waistToHipRatio.toFixed(2)}) es inusual`);
  }

  const inseamToHeightRatio = measurements.inseam / (heightCm || 1);
  if (inseamToHeightRatio < 0.40 || inseamToHeightRatio > 0.55) {
    warnings.push(`Proporcion entrepierna-altura (${inseamToHeightRatio.toFixed(2)}) es inusual`);
  }

  if (measurements.confidence < 0.5) {
    warnings.push('Nivel de confianza bajo, las medidas pueden no ser precisas');
  }

  const valid = errors.length === 0;

  return { valid, warnings, errors };
}

export function getSizeRecommendation(
  measurements: MeasurementsToValidate
): { size: string; category: ' XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' } {
  const waist = measurements.waist;

  if (waist < 66) return { size: 'XS', category: ' XS' };
  if (waist < 71) return { size: 'S', category: 'S' };
  if (waist < 78) return { size: 'M', category: 'M' };
  if (waist < 84) return { size: 'L', category: 'L' };
  if (waist < 92) return { size: 'XL', category: 'XL' };
  return { size: 'XXL', category: 'XXL' };
}

export function formatMeasurement(valueCm: number, isEstimated: boolean): string {
  const value = Math.round(valueCm);
  return isEstimated ? `~${value}cm` : `${value}cm`;
}
