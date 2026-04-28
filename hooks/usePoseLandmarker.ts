'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { KEY_LANDMARKS } from '@/lib/landmarkNames';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type DetectionState =
  | 'no_person'
  | 'too_close'
  | 'partial'
  | 'good';

export interface DetectionResult {
  state: DetectionState;
  coveragePercent: number;
  message: string;
}

export function getDetectionState(landmarks: PoseLandmark[] | undefined): DetectionResult {
  if (!landmarks || landmarks.length === 0) {
    return { state: 'no_person', coveragePercent: 0, message: 'Colócate frente a la cámara' };
  }

  const visibleLandmarks = landmarks.filter((l) => (l.visibility ?? 0) > 0.5);
  const coveragePercent = Math.round((visibleLandmarks.length / 33) * 100);

  const leftAnkle = landmarks[KEY_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[KEY_LANDMARKS.RIGHT_ANKLE];
  const nose = landmarks[KEY_LANDMARKS.NOSE];

  if ((leftAnkle?.visibility ?? 0) > 0.3 || (rightAnkle?.visibility ?? 0) > 0.3) {
    if (visibleLandmarks.length >= 20) {
      return { state: 'good', coveragePercent, message: 'Perfecto, mantén la postura' };
    }
    return { state: 'partial', coveragePercent, message: 'Un poco más atrás...' };
  }

  if ((nose?.visibility ?? 0) > 0.5) {
    return { state: 'too_close', coveragePercent, message: 'Aléjate de la cámara' };
  }

  if (visibleLandmarks.length < 8) {
    return { state: 'no_person', coveragePercent, message: 'Buscando cuerpo...' };
  }

  return { state: 'partial', coveragePercent, message: 'Un poco más atrás...' };
}

export interface UsePoseLandmarkerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
}

interface UsePoseLandmarkerReturn {
  isLoaded: boolean;
  detectionState: DetectionState;
  coveragePercent: number;
  startDetection: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  stopDetection: () => void;
}

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [detectionState, setDetectionState] = useState<DetectionState>('no_person');
  const [coveragePercent, setCoveragePercent] = useState(0);

  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const enabledRef = useRef(true);

  const stopDetection = useCallback(() => {
    enabledRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const startDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!landmarkerRef.current) {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

        console.log('📦 Cargando modelo MediaPipe...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          runningMode: 'VIDEO',
          numPoses: 1,
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          minPoseDetectionConfidence: 0.3,
          minPosePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        landmarkerRef.current = landmarker;
        setIsLoaded(true);
        console.log('✅ PoseLandmarker cargado');
      } catch (err) {
        console.error('❌ Error cargando MediaPipe:', err);
        return;
      }
    }

    enabledRef.current = true;
    const videoEl = video;
    const landmarker = landmarkerRef.current as {
      detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
        landmarks: PoseLandmark[][];
        worldLandmarks: PoseLandmark[][];
      };
    };

    if (!canvas || !videoEl || !landmarker) return;

    function drawLoop(timestamp: number) {
      if (!enabledRef.current || !videoEl || !canvas || !landmarker) {
        return;
      }

      if (videoEl.readyState < 2) {
        rafRef.current = requestAnimationFrame(drawLoop);
        return;
      }

      if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 480;
        console.log('📐 Canvas sincronizado:', canvas.width, 'x', canvas.height);
      }

      if (videoEl.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = videoEl.currentTime;

        const results = landmarker.detectForVideo(videoEl, timestamp);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];

            const { state, coveragePercent: percent } = getDetectionState(landmarks);
            setDetectionState(state);
            setCoveragePercent(percent);

            drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
          } else {
            setDetectionState('no_person');
            setCoveragePercent(0);
          }
        }
      }

      rafRef.current = requestAnimationFrame(drawLoop);
    }

    console.log('🎬 Iniciando loop de detección');
    rafRef.current = requestAnimationFrame(drawLoop);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isLoaded,
    detectionState,
    coveragePercent,
    startDetection,
    stopDetection,
  };
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number
) {
  const POSE_CONNECTIONS: [number, number][] = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];

  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 2;

  POSE_CONNECTIONS.forEach(([start, end]) => {
    const s = landmarks[start];
    const e = landmarks[end];
    if (s && e && (s.visibility ?? 0) > 0.5 && (e.visibility ?? 0) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(s.x * width, s.y * height);
      ctx.lineTo(e.x * width, e.y * height);
      ctx.stroke();
    }
  });

  ctx.fillStyle = '#FF3366';
  const keyPoints = [0, 11, 12, 23, 24, 27, 28, 15, 16];
  keyPoints.forEach((idx) => {
    const lm = landmarks[idx];
    if (lm && (lm.visibility ?? 0) > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, idx === 0 ? 8 : 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  ctx.fillStyle = '#FFFFFF';
  landmarks.forEach((lm, idx) => {
    if ((lm.visibility ?? 0) > 0.5 && !keyPoints.includes(idx)) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
