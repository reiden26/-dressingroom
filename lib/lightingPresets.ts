export type LightingPresetId = 'daylight' | 'studio' | 'golden_hour' | 'night' | 'warm';

export interface LightingPreset {
  id: LightingPresetId;
  name: string;
  icon: string;
  cssFilter: string;
  aiPrompt?: string;
}

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  daylight: {
    id: 'daylight',
    name: 'Luz natural',
    icon: '☀️',
    cssFilter: 'brightness(1.05) contrast(1.02) saturate(1.1)',
    aiPrompt: 'soft natural daylight, outdoor, bright, professional fashion photography',
  },
  studio: {
    id: 'studio',
    name: 'Estudio',
    icon: '💡',
    cssFilter: 'brightness(1.1) contrast(1.15) saturate(0.95)',
    aiPrompt: 'professional studio photography, controlled lighting, clean background',
  },
  golden_hour: {
    id: 'golden_hour',
    name: 'Hora dorada',
    icon: '🌅',
    cssFilter: 'brightness(1.0) sepia(0.2) saturate(1.3) hue-rotate(-10deg)',
    aiPrompt: 'golden hour photography, warm sunset light, soft shadows, magical glow',
  },
  night: {
    id: 'night',
    name: 'Noche',
    icon: '🌙',
    cssFilter: 'brightness(0.7) contrast(1.2) saturate(0.8) hue-rotate(200deg)',
    aiPrompt: 'night scene, city lights, dramatic shadows, moody atmosphere',
  },
  warm: {
    id: 'warm',
    name: 'Cálido',
    icon: '🕯️',
    cssFilter: 'brightness(1.0) sepia(0.15) saturate(1.2) hue-rotate(-15deg)',
    aiPrompt: 'warm indoor lighting, cozy atmosphere, tungsten light, soft warmth',
  },
};

export const LIGHTING_PRESET_LIST = Object.values(LIGHTING_PRESETS);

export function getLightingPreset(id: LightingPresetId): LightingPreset {
  return LIGHTING_PRESETS[id];
}
