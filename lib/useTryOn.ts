import { useState, useEffect, useCallback, useRef } from 'react';
import type { QueuedTryOn } from './vtonTypes';
import { getTryOnQueue } from './tryOnQueue';
import { preparePersonImage, prepareGarmentImage } from './imagePreprocessor';

export type TryOnStatus = 'idle' | 'uploading' | 'generating' | 'done' | 'error';

export interface GeneratedLook {
  id: string;
  predictionId: string;
  garmentId: string;
  garmentName: string;
  garmentImageUrl: string;
  resultUrl: string;
  createdAt: number;
  rating?: number;
  isLowQuality?: boolean;
}

export interface UseTryOnReturn {
  status: TryOnStatus;
  progress: number;
  currentResult: GeneratedLook | null;
  error: string | null;
  looks: GeneratedLook[];
  startTryOn: (garmentId: string, garmentName: string, garmentImageUrl: string) => Promise<string | null>;
  cancelTryOn: () => void;
  rateLook: (lookId: string, rating: number) => void;
  deleteLook: (lookId: string) => void;
  clearAllLooks: () => void;
}

const LOOKS_STORAGE_KEY = 'vfr_generated_looks';
const POLLING_INTERVAL = 3000;
const MAX_GENERATION_TIME = 180000;

function getLooks(): GeneratedLook[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOOKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLooks(looks: GeneratedLook[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOOKS_STORAGE_KEY, JSON.stringify(looks));
}

async function checkImageQuality(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }
      ctx.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;
      let blackPixels = 0;
      let totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r === 0 && g === 0 && b === 0) {
          blackPixels++;
        }
      }

      const blackRatio = blackPixels / totalPixels;
      resolve(blackRatio > 0.4);
    };
    img.onerror = () => resolve(true);
    img.src = imageUrl;
  });
}

export function useTryOn(personImageUrl: string | null): UseTryOnReturn {
  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<GeneratedLook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [looks, setLooks] = useState<GeneratedLook[]>([]);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentPredictionIdRef = useRef<string | null>(null);

  useEffect(() => {
    setLooks(getLooks());
  }, []);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startFakeProgress = useCallback(() => {
    progressIntervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const fakeProgress = Math.min(90, (elapsed / MAX_GENERATION_TIME) * 100);
      setProgress(fakeProgress);
    }, 500);
  }, []);

  const pollPrediction = useCallback(async (predictionId: string): Promise<QueuedTryOn | null> => {
    try {
      const response = await fetch(`/api/tryon/${predictionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Predicción no encontrada');
        }
        throw new Error('Error al consultar el estado');
      }

      const data = await response.json();

      if (data.status === 'succeeded' && data.outputUrl) {
        return {
          predictionId,
          status: 'succeeded',
          outputUrl: data.outputUrl,
          garmentId: '',
          garmentImageUrl: '',
          createdAt: Date.now(),
        };
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'La generación falló');
      }

      return {
        predictionId,
        status: data.status as 'pending' | 'processing',
        garmentId: '',
        garmentImageUrl: '',
        createdAt: Date.now(),
      };
    } catch (err) {
      throw err;
    }
  }, []);

  const saveLook = useCallback((look: GeneratedLook) => {
    const currentLooks = getLooks();
    const existingIndex = currentLooks.findIndex((l) => l.id === look.id);

    if (existingIndex >= 0) {
      currentLooks[existingIndex] = look;
    } else {
      currentLooks.unshift(look);
    }

    saveLooks(currentLooks);
    setLooks([...currentLooks]);
  }, []);

  const startTryOn = useCallback(
    async (garmentId: string, garmentName: string, garmentImageUrl: string): Promise<string | null> => {
      if (!personImageUrl) {
        setError('Necesitas una foto frontal para probarte ropa');
        return null;
      }

      clearPolling();
      setStatus('uploading');
      setProgress(0);
      setError(null);
      setCurrentResult(null);

      try {
        const personBase64 = await preparePersonImage(personImageUrl);
        const garmentBase64 = await prepareGarmentImage(garmentImageUrl);

        setStatus('generating');
        startTimeRef.current = Date.now();
        startFakeProgress();

        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personImageBase64: personBase64,
            garmentImageBase64: garmentBase64,
            garmentDescription: garmentName,
            garmentId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al iniciar la generación');
        }

        const data = await response.json();
        const predictionId = data.predictionId;
        currentPredictionIdRef.current = predictionId;

        pollingIntervalRef.current = setInterval(async () => {
          try {
            const result = await pollPrediction(predictionId);

            if (!result) return;

            if (result.status === 'succeeded' && result.outputUrl) {
              clearPolling();
              setProgress(100);

              const isLowQuality = await checkImageQuality(result.outputUrl);

              const look: GeneratedLook = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                predictionId,
                garmentId,
                garmentName,
                garmentImageUrl,
                resultUrl: result.outputUrl,
                createdAt: Date.now(),
                isLowQuality,
              };

              saveLook(look);
              setCurrentResult(look);
              setStatus('done');
            } else if (result.status === 'failed') {
              clearPolling();
              throw new Error('La generación falló');
            }
          } catch (err) {
            clearPolling();
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            setStatus('error');
          }
        }, POLLING_INTERVAL);

        return predictionId;
      } catch (err) {
        clearPolling();
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        setStatus('error');
        return null;
      }
    },
    [personImageUrl, clearPolling, pollPrediction, saveLook, startFakeProgress]
  );

  const cancelTryOn = useCallback(() => {
    clearPolling();
    startTimeRef.current = null;
    currentPredictionIdRef.current = null;
    setStatus('idle');
    setProgress(0);
  }, [clearPolling]);

  const rateLook = useCallback((lookId: string, rating: number) => {
    const currentLooks = getLooks();
    const lookIndex = currentLooks.findIndex((l) => l.id === lookId);

    if (lookIndex >= 0) {
      currentLooks[lookIndex] = { ...currentLooks[lookIndex], rating };
      saveLooks(currentLooks);
      setLooks([...currentLooks]);

      if (currentResult?.id === lookId) {
        setCurrentResult(currentLooks[lookIndex]);
      }
    }
  }, [currentResult]);

  const deleteLook = useCallback((lookId: string) => {
    const currentLooks = getLooks().filter((l) => l.id !== lookId);
    saveLooks(currentLooks);
    setLooks([...currentLooks]);

    if (currentResult?.id === lookId) {
      setCurrentResult(null);
      setStatus('idle');
    }
  }, [currentResult]);

  const clearAllLooks = useCallback(() => {
    saveLooks([]);
    setLooks([]);
    setCurrentResult(null);
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    status,
    progress,
    currentResult,
    error,
    looks,
    startTryOn,
    cancelTryOn,
    rateLook,
    deleteLook,
    clearAllLooks,
  };
}
