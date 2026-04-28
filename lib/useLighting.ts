import { useState, useCallback, useRef } from 'react';
import type { LightingPresetId } from './lightingPresets';
import type { ColorFilterId } from './colorFilters';

export interface LightingState {
  lightingId: LightingPresetId;
  colorFilterId: ColorFilterId;
  originalImageUrl: string;
  filteredImageUrl: string;
  isAILoading: boolean;
  error: string | null;
}

export interface UseLightingReturn {
  lighting: LightingState;
  setLightingFilter: (filterId: LightingPresetId) => void;
  setColorFilter: (filterId: ColorFilterId) => void;
  regenerateWithAI: (prompt: string) => Promise<string | null>;
  resetToOriginal: () => void;
  applyCurrentFilters: () => Promise<string>;
}

const POLLING_INTERVAL = 3000;

export function useLighting(originalImageUrl: string): UseLightingReturn {
  const [lighting, setLighting] = useState<LightingState>({
    lightingId: 'daylight',
    colorFilterId: 'normal',
    originalImageUrl,
    filteredImageUrl: originalImageUrl,
    isAILoading: false,
    error: null,
  });

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const applyCSSFilters = useCallback(async (imageUrl: string): Promise<string> => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;

    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.95);
  }, []);

  const setLightingFilter = useCallback((filterId: LightingPresetId) => {
    setLighting((prev) => ({
      ...prev,
      lightingId: filterId,
    }));
  }, []);

  const setColorFilter = useCallback((filterId: ColorFilterId) => {
    setLighting((prev) => ({
      ...prev,
      colorFilterId: filterId,
    }));
  }, []);

  const regenerateWithAI = useCallback(async (prompt: string): Promise<string | null> => {
    clearPolling();
    setLighting((prev) => ({ ...prev, isAILoading: true, error: null }));

    try {
      const response = await fetch('/api/lighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImageUrl: lighting.originalImageUrl,
          lightingPrompt: prompt,
          garmentDescription: '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start lighting regeneration');
      }

      const data = await response.json();
      const predictionId = data.predictionId;

      return new Promise<string | null>((resolve) => {
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/lighting/${predictionId}`);
            if (!statusResponse.ok) {
              clearInterval(pollingIntervalRef.current!);
              throw new Error('Failed to poll status');
            }

            const statusData = await statusResponse.json();

            if (statusData.status === 'succeeded' && statusData.outputUrl) {
              clearInterval(pollingIntervalRef.current!);
              pollingIntervalRef.current = null;

              setLighting((prev) => ({
                ...prev,
                filteredImageUrl: statusData.outputUrl,
                originalImageUrl: statusData.outputUrl,
                isAILoading: false,
              }));

              resolve(statusData.outputUrl);
            } else if (statusData.status === 'failed') {
              clearInterval(pollingIntervalRef.current!);
              pollingIntervalRef.current = null;
              throw new Error(statusData.error || 'Lighting regeneration failed');
            }
          } catch {
            // Continue polling
          }
        }, POLLING_INTERVAL);

        setTimeout(() => {
          clearPolling();
          setLighting((prev) => ({ ...prev, isAILoading: false }));
          resolve(null);
        }, 120000);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setLighting((prev) => ({
        ...prev,
        isAILoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [lighting.originalImageUrl, clearPolling]);

  const resetToOriginal = useCallback(() => {
    clearPolling();
    setLighting((prev) => ({
      ...prev,
      filteredImageUrl: prev.originalImageUrl,
      isAILoading: false,
      error: null,
    }));
  }, [clearPolling]);

  const applyCurrentFilters = useCallback(async (): Promise<string> => {
    return lighting.filteredImageUrl;
  }, [lighting.filteredImageUrl]);

  return {
    lighting,
    setLightingFilter,
    setColorFilter,
    regenerateWithAI,
    resetToOriginal,
    applyCurrentFilters,
  };
}
