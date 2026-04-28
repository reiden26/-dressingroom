import type { PoseConfig } from './types';

export const POSES: PoseConfig[] = [
  {
    id: 'front',
    name: 'Frontal',
    instruction: 'Párate derecho, brazos ligeramente separados del cuerpo',
    description: 'Brazos al lado, palmas hacia adelante, pies separados al ancho de los hombros',
    overlayColor: '#22c55e',
    guidePoints: {
      head: { x: 0.5, y: 0.08 },
      shoulders: { x: 0.5, y: 0.22 },
      hips: { x: 0.5, y: 0.52 },
      feet: { x: 0.5, y: 0.95 },
    },
  },
  {
    id: 'side',
    name: 'Perfil',
    instruction: 'Gira 90° hacia la derecha, perfil derecho visible',
    description: 'Brazo derecho pegado al cuerpo, vista lateral pura',
    overlayColor: '#3b82f6',
    guidePoints: {
      head: { x: 0.5, y: 0.08 },
      shoulders: { x: 0.5, y: 0.22 },
      hips: { x: 0.5, y: 0.52 },
      feet: { x: 0.5, y: 0.95 },
    },
  },
  {
    id: 'back',
    name: 'Espalda',
    instruction: 'Gira 180°, da la espalda a la cámara',
    description: 'Brazos al lado, espalda recta hacia la cámara',
    overlayColor: '#a855f7',
    guidePoints: {
      head: { x: 0.5, y: 0.08 },
      shoulders: { x: 0.5, y: 0.22 },
      hips: { x: 0.5, y: 0.52 },
      feet: { x: 0.5, y: 0.95 },
    },
  },
];

export const MEASUREMENT_CONFIG = {
  proportions: {
    shouldersToHeight: 0.23,
    chestToHeight: 0.18,
    waistToHeight: 0.14,
    hipsToHeight: 0.16,
    inseamToHeight: 0.3,
    armLengthToHeight: 0.2,
    torsoLengthToHeight: 0.28,
  },
  confidenceThresholds: {
    minVisibility: 0.7,
    minPosesRequired: 3,
  },
};

export const CAMERA_CONFIG = {
  facingMode: 'user',
  width: 720,
  height: 1280,
  aspectRatio: 9 / 16,
};

