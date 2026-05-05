export interface LandmarkWithVisibility {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface UserProfile {
  id: string;
  height: number;
  weight: number;
  gender?: 1 | 1.5 | 2; // 1=Hombre, 2=Mujer, 1.5=Neutro
  createdAt: Date;
  measurements?: BodyMeasurements;
}

export interface BodyMeasurements {
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  armLength: number;
  torsoLength: number;
  capturedAt: Date;
  confidence: number;
  /** BMI used at calculation time (height/weight derived) */
  bmi?: number;
  /** True when measurements are statistical estimates (no landmark data) */
  isEstimated?: boolean;
}

export interface BodyMeasurementsResult {
  measurements: BodyMeasurements & {
    isEstimated: boolean;
  };
  warnings: string[];
}

export interface CapturedPose {
  poseId: 'front' | 'side' | 'back';
  imageDataUrl: string;
  capturedAt: Date;
  landmarks?: Landmark[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface GarmentItem {
  id: string;
  name: string;
  brand: string;
  category: 'top' | 'bottom' | 'dress' | 'outerwear';
  imageUrl: string;
  sizes: string[];
  color: string;
}

export type ScanStep = 'height' | 'front' | 'side' | 'back' | 'processing' | 'complete';

export interface PoseConfig {
  id: 'front' | 'side' | 'back';
  name: string;
  instruction: string;
  description: string;
  overlayColor: string;
  guidePoints: {
    head: { x: number; y: number };
    shoulders: { x: number; y: number };
    hips: { x: number; y: number };
    feet: { x: number; y: number };
  };
}
