import { useState, useEffect, useCallback, useRef } from 'react';
import type { PosePreset } from './posePresets';
import type { GeneratedLook } from './useTryOn';

export interface PoseResult {
  poseId: PosePreset;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  resultUrl?: string;
  error?: string;
  createdAt: number;
}

export interface UsePoseGeneratorReturn {
  poseResults: Record<PosePreset, PoseResult | null>;
  isGenerating: boolean;
  error: string | null;
  generatePoses: (
    baseImageUrl: string,
    stylePrompt: string,
    garmentId: string
  ) => Promise<void>;
  generateSinglePose: (
    baseImageUrl: string,
    pose: PosePreset,
    stylePrompt: string,
    garmentId: string
  ) => Promise<PoseResult | null>;
  cancelAll: () => void;
  clearResults: () => void;
}

const POSE_CACHE_PREFIX = 'vfr_pose_cache_';
const POLLING_INTERVAL = 3000;

function getPoseCacheKey(lookId: string, pose: PosePreset): string {
  return `${POSE_CACHE_PREFIX}${lookId}_${pose}`;
}

function getCachedPose(lookId: string, pose: PosePreset): PoseResult | null {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem(getPoseCacheKey(lookId, pose));
  if (!cached) return null;

  try {
    const result = JSON.parse(cached) as PoseResult;
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - result.createdAt > maxAge) {
      localStorage.removeItem(getPoseCacheKey(lookId, pose));
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function cachePoseResult(lookId: string, result: PoseResult): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getPoseCacheKey(lookId, result.poseId), JSON.stringify(result));
}

export function usePoseGenerator(): UsePoseGeneratorReturn {
  const [poseResults, setPoseResults] = useState<Record<PosePreset, PoseResult | null>>({
    standing_natural: null,
    walking: null,
    sitting: null,
    arms_raised: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const generationTimeoutsRef = useRef<Set<string>>(new Set());

  const clearPolling = useCallback(() => {
    pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
    pollingIntervalsRef.current.clear();
  }, []);

  const clearTimeouts = useCallback(() => {
    generationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    generationTimeoutsRef.current.clear();
  }, []);

  const pollPosePrediction = useCallback(async (predictionId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/pose/${predictionId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Prediction not found');
        throw new Error('Failed to poll');
      }
      const data = await response.json();
      return data.status === 'succeeded' ? data.outputUrl : null;
    } catch {
      return null;
    }
  }, []);

  const startPolling = useCallback((
    predictionId: string,
    pose: PosePreset,
    lookId: string,
    onComplete: (result: PoseResult) => void
  ) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/pose/${predictionId}`);
        if (!response.ok) return;

        const data = await response.json();

        if (data.status === 'succeeded' && data.outputUrl) {
          clearInterval(intervalId);
          pollingIntervalsRef.current.delete(predictionId);

          const result: PoseResult = {
            poseId: pose,
            status: 'succeeded',
            resultUrl: data.outputUrl,
            createdAt: Date.now(),
          };

          cachePoseResult(lookId, result);
          onComplete(result);
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          pollingIntervalsRef.current.delete(predictionId);

          const result: PoseResult = {
            poseId: pose,
            status: 'failed',
            error: data.error || 'Generation failed',
            createdAt: Date.now(),
          };

          onComplete(result);
        }
      } catch {
        // Continue polling
      }
    }, POLLING_INTERVAL);

    pollingIntervalsRef.current.set(predictionId, intervalId);
  }, []);

  const generateSinglePose = useCallback(async (
    baseImageUrl: string,
    pose: PosePreset,
    stylePrompt: string,
    garmentId: string
  ): Promise<PoseResult | null> => {
    const lookId = `${garmentId}_${Date.now()}`;

    setPoseResults((prev) => ({
      ...prev,
      [pose]: { poseId: pose, status: 'pending', createdAt: Date.now() },
    }));

    try {
      const response = await fetch('/api/pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseImageUrl,
          targetPose: pose,
          stylePrompt,
          garmentDescription: stylePrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start pose generation');
      }

      const data = await response.json();
      const predictionId = data.predictionId;

      setPoseResults((prev) => ({
        ...prev,
        [pose]: { poseId: pose, status: 'processing', createdAt: Date.now() },
      }));

      return new Promise<PoseResult | null>((resolve) => {
        const timeout = setTimeout(() => {
          const result: PoseResult = {
            poseId: pose,
            status: 'failed',
            error: 'Timeout',
            createdAt: Date.now(),
          };
          setPoseResults((prev) => ({ ...prev, [pose]: result }));
          resolve(result);
        }, 120000);

        generationTimeoutsRef.current.add(predictionId);

        startPolling(predictionId, pose, lookId, (finalResult) => {
          clearTimeout(timeout);
          generationTimeoutsRef.current.delete(predictionId);
          setPoseResults((prev) => ({ ...prev, [pose]: finalResult }));
          resolve(finalResult);
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const result: PoseResult = {
        poseId: pose,
        status: 'failed',
        error: errorMessage,
        createdAt: Date.now(),
      };
      setPoseResults((prev) => ({ ...prev, [pose]: result }));
      return result;
    }
  }, [startPolling]);

  const generatePoses = useCallback(async (
    baseImageUrl: string,
    stylePrompt: string,
    garmentId: string
  ) => {
    setIsGenerating(true);
    setError(null);

    const poses: PosePreset[] = ['standing_natural', 'walking', 'sitting', 'arms_raised'];

    const generationPromises = poses.map((pose) =>
      generateSinglePose(baseImageUrl, pose, stylePrompt, garmentId)
    );

    try {
      await Promise.all(generationPromises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate poses');
    } finally {
      setIsGenerating(false);
    }
  }, [generateSinglePose]);

  const cancelAll = useCallback(() => {
    clearPolling();
    clearTimeouts();
    setIsGenerating(false);
  }, [clearPolling, clearTimeouts]);

  const clearResults = useCallback(() => {
    setPoseResults({
      standing_natural: null,
      walking: null,
      sitting: null,
      arms_raised: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
      clearTimeouts();
    };
  }, [clearPolling, clearTimeouts]);

  return {
    poseResults,
    isGenerating,
    error,
    generatePoses,
    generateSinglePose,
    cancelAll,
    clearResults,
  };
}
