export type PosePreset = 'standing_natural' | 'walking' | 'sitting' | 'arms_raised';

export interface OpenPoseKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface PosePresetConfig {
  id: PosePreset;
  name: string;
  icon: string;
  description: string;
  keypoints: {
    nose: OpenPoseKeypoint;
    neck: OpenPoseKeypoint;
    shoulder_r: OpenPoseKeypoint;
    elbow_r: OpenPoseKeypoint;
    wrist_r: OpenPoseKeypoint;
    shoulder_l: OpenPoseKeypoint;
    elbow_l: OpenPoseKeypoint;
    wrist_l: OpenPoseKeypoint;
    hip_r: OpenPoseKeypoint;
    knee_r: OpenPoseKeypoint;
    ankle_r: OpenPoseKeypoint;
    hip_l: OpenPoseKeypoint;
    knee_l: OpenPoseKeypoint;
    ankle_l: OpenPoseKeypoint;
    eye_r: OpenPoseKeypoint;
    eye_l: OpenPoseKeypoint;
    ear_r: OpenPoseKeypoint;
    ear_l: OpenPoseKeypoint;
  };
}

export const POSE_PRESETS: Record<PosePreset, PosePresetConfig> = {
  standing_natural: {
    id: 'standing_natural',
    name: 'De pie natural',
    icon: '🧍',
    description: 'Postura erguida natural con ligera apertura de piernas',
    keypoints: {
      nose: { x: 0.5, y: 0.08, confidence: 1 },
      neck: { x: 0.5, y: 0.12, confidence: 1 },
      shoulder_r: { x: 0.42, y: 0.14, confidence: 1 },
      elbow_r: { x: 0.38, y: 0.24, confidence: 1 },
      wrist_r: { x: 0.35, y: 0.34, confidence: 1 },
      shoulder_l: { x: 0.58, y: 0.14, confidence: 1 },
      elbow_l: { x: 0.62, y: 0.24, confidence: 1 },
      wrist_l: { x: 0.65, y: 0.34, confidence: 1 },
      hip_r: { x: 0.45, y: 0.38, confidence: 1 },
      knee_r: { x: 0.44, y: 0.55, confidence: 1 },
      ankle_r: { x: 0.44, y: 0.72, confidence: 1 },
      hip_l: { x: 0.55, y: 0.38, confidence: 1 },
      knee_l: { x: 0.56, y: 0.55, confidence: 1 },
      ankle_l: { x: 0.56, y: 0.72, confidence: 1 },
      eye_r: { x: 0.48, y: 0.09, confidence: 1 },
      eye_l: { x: 0.52, y: 0.09, confidence: 1 },
      ear_r: { x: 0.45, y: 0.11, confidence: 1 },
      ear_l: { x: 0.55, y: 0.11, confidence: 1 },
    },
  },
  walking: {
    id: 'walking',
    name: 'Caminando',
    icon: '🚶',
    description: 'Pose de caminando con brazos en movimiento natural',
    keypoints: {
      nose: { x: 0.5, y: 0.08, confidence: 1 },
      neck: { x: 0.5, y: 0.12, confidence: 1 },
      shoulder_r: { x: 0.40, y: 0.14, confidence: 1 },
      elbow_r: { x: 0.32, y: 0.22, confidence: 1 },
      wrist_r: { x: 0.28, y: 0.32, confidence: 1 },
      shoulder_l: { x: 0.60, y: 0.14, confidence: 1 },
      elbow_l: { x: 0.68, y: 0.26, confidence: 1 },
      wrist_l: { x: 0.72, y: 0.36, confidence: 1 },
      hip_r: { x: 0.44, y: 0.38, confidence: 1 },
      knee_r: { x: 0.40, y: 0.54, confidence: 1 },
      ankle_r: { x: 0.38, y: 0.72, confidence: 1 },
      hip_l: { x: 0.56, y: 0.38, confidence: 1 },
      knee_l: { x: 0.62, y: 0.54, confidence: 1 },
      ankle_l: { x: 0.64, y: 0.68, confidence: 1 },
      eye_r: { x: 0.48, y: 0.09, confidence: 1 },
      eye_l: { x: 0.52, y: 0.09, confidence: 1 },
      ear_r: { x: 0.45, y: 0.11, confidence: 1 },
      ear_l: { x: 0.55, y: 0.11, confidence: 1 },
    },
  },
  sitting: {
    id: 'sitting',
    name: 'Sentado',
    icon: '🪑',
    description: 'Sentado en silla con piernas a 90 grados',
    keypoints: {
      nose: { x: 0.5, y: 0.12, confidence: 1 },
      neck: { x: 0.5, y: 0.16, confidence: 1 },
      shoulder_r: { x: 0.40, y: 0.18, confidence: 1 },
      elbow_r: { x: 0.36, y: 0.28, confidence: 1 },
      wrist_r: { x: 0.38, y: 0.38, confidence: 1 },
      shoulder_l: { x: 0.60, y: 0.18, confidence: 1 },
      elbow_l: { x: 0.64, y: 0.28, confidence: 1 },
      wrist_l: { x: 0.62, y: 0.38, confidence: 1 },
      hip_r: { x: 0.44, y: 0.42, confidence: 1 },
      knee_r: { x: 0.36, y: 0.52, confidence: 1 },
      ankle_r: { x: 0.36, y: 0.62, confidence: 1 },
      hip_l: { x: 0.56, y: 0.42, confidence: 1 },
      knee_l: { x: 0.64, y: 0.52, confidence: 1 },
      ankle_l: { x: 0.64, y: 0.62, confidence: 1 },
      eye_r: { x: 0.48, y: 0.13, confidence: 1 },
      eye_l: { x: 0.52, y: 0.13, confidence: 1 },
      ear_r: { x: 0.45, y: 0.15, confidence: 1 },
      ear_l: { x: 0.55, y: 0.15, confidence: 1 },
    },
  },
  arms_raised: {
    id: 'arms_raised',
    name: 'Brazos arriba',
    icon: '🙋',
    description: 'Brazos levantados a 45°, mostrando la prenda',
    keypoints: {
      nose: { x: 0.5, y: 0.08, confidence: 1 },
      neck: { x: 0.5, y: 0.12, confidence: 1 },
      shoulder_r: { x: 0.40, y: 0.14, confidence: 1 },
      elbow_r: { x: 0.28, y: 0.08, confidence: 1 },
      wrist_r: { x: 0.22, y: 0.02, confidence: 1 },
      shoulder_l: { x: 0.60, y: 0.14, confidence: 1 },
      elbow_l: { x: 0.72, y: 0.08, confidence: 1 },
      wrist_l: { x: 0.78, y: 0.02, confidence: 1 },
      hip_r: { x: 0.45, y: 0.38, confidence: 1 },
      knee_r: { x: 0.44, y: 0.55, confidence: 1 },
      ankle_r: { x: 0.44, y: 0.72, confidence: 1 },
      hip_l: { x: 0.55, y: 0.38, confidence: 1 },
      knee_l: { x: 0.56, y: 0.55, confidence: 1 },
      ankle_l: { x: 0.56, y: 0.72, confidence: 1 },
      eye_r: { x: 0.48, y: 0.09, confidence: 1 },
      eye_l: { x: 0.52, y: 0.09, confidence: 1 },
      ear_r: { x: 0.45, y: 0.11, confidence: 1 },
      ear_l: { x: 0.55, y: 0.11, confidence: 1 },
    },
  },
};

export const POSE_PRESET_LIST = Object.values(POSE_PRESETS);

export function getPosePreset(id: PosePreset): PosePresetConfig {
  return POSE_PRESETS[id];
}

export function buildOpenPoseImage(keypoints: PosePresetConfig['keypoints']): string {
  if (typeof window === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#FF0000';
  ctx.fillStyle = '#FF0000';
  ctx.lineWidth = 2;

  const connections = [
    ['neck', 'shoulder_r'],
    ['neck', 'shoulder_l'],
    ['neck', 'nose'],
    ['nose', 'eye_r'],
    ['nose', 'eye_l'],
    ['eye_r', 'ear_r'],
    ['eye_l', 'ear_l'],
    ['shoulder_r', 'elbow_r'],
    ['elbow_r', 'wrist_r'],
    ['shoulder_l', 'elbow_l'],
    ['elbow_l', 'wrist_l'],
    ['shoulder_r', 'hip_r'],
    ['shoulder_l', 'hip_l'],
    ['hip_r', 'hip_l'],
    ['hip_r', 'knee_r'],
    ['knee_r', 'ankle_r'],
    ['hip_l', 'knee_l'],
    ['knee_l', 'ankle_l'],
  ];

  for (const [a, b] of connections) {
    const kpA = keypoints[a as keyof typeof keypoints];
    const kpB = keypoints[b as keyof typeof keypoints];

    if (kpA && kpB && kpA.confidence > 0 && kpB.confidence > 0) {
      ctx.beginPath();
      ctx.moveTo(kpA.x * 512, kpA.y * 512);
      ctx.lineTo(kpB.x * 512, kpB.y * 512);
      ctx.stroke();
    }
  }

  for (const key of Object.keys(keypoints) as (keyof typeof keypoints)[]) {
    const kp = keypoints[key];
    if (kp && kp.confidence > 0) {
      ctx.beginPath();
      ctx.arc(kp.x * 512, kp.y * 512, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/png');
}
