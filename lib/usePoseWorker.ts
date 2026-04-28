import { useState, useEffect, useRef, useCallback } from 'react';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  processingTime: number;
}

interface UsePoseWorkerReturn {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
  detectPose: (imageBitmap: ImageBitmap) => void;
  terminate: () => void;
}

export function usePoseWorker(): UsePoseWorkerReturn {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (result: PoseDetectionResult) => void>>(new Map());

  useEffect(() => {
    workerRef.current = new Worker('/workers/poseDetector.worker.js', { type: 'module' });

    workerRef.current.onmessage = (event) => {
      const { type, landmarks, processingTime, error: workerError } = event.data;

      switch (type) {
        case 'ready':
          setIsReady(true);
          setError(null);
          break;
        case 'result':
          setIsProcessing(false);
          const callback = callbacksRef.current.get('detect');
          if (callback) {
            callback({ landmarks, processingTime });
            callbacksRef.current.delete('detect');
          }
          break;
        case 'no_pose':
          setIsProcessing(false);
          const noPoseCallback = callbacksRef.current.get('detect');
          if (noPoseCallback) {
            noPoseCallback({ landmarks: [], processingTime: 0 });
            callbacksRef.current.delete('detect');
          }
          break;
        case 'error':
          setIsReady(false);
          setIsProcessing(false);
          setError(workerError);
          break;
      }
    };

    workerRef.current.onerror = (err) => {
      setError(err.message);
      setIsReady(false);
    };

    workerRef.current.postMessage({ type: 'init' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const detectPose = useCallback((imageBitmap: ImageBitmap) => {
    if (!workerRef.current || !isReady) {
      setError('Worker not ready');
      return;
    }

    setIsProcessing(true);
    setError(null);

    workerRef.current.postMessage(
      { type: 'detect', data: { imageBitmap } },
      [imageBitmap]
    );
  }, [isReady]);

  const terminate = useCallback(() => {
    workerRef.current?.postMessage({ type: 'destroy' });
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsReady(false);
  }, []);

  return {
    isReady,
    isProcessing,
    error,
    detectPose,
    terminate,
  };
}
