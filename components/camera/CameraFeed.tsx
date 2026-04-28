'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { KEY_LANDMARKS } from '@/lib/landmarkNames';

interface CameraFeedProps {
  className?: string;
}

export interface CameraFeedRef {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
}

const CameraFeed = forwardRef<CameraFeedRef, CameraFeedProps>(
  ({ className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [detectionState, setDetectionState] = useState<'no_person' | 'too_close' | 'partial' | 'good'>('no_person');
    const [coveragePercent, setCoveragePercent] = useState(0);

    const streamRef = useRef<MediaStream | null>(null);
    const landmarkerRef = useRef<unknown>(null);
    const rafRef = useRef<number>(0);
    const lastVideoTimeRef = useRef<number>(-1);

    useImperativeHandle(ref, () => ({
      videoElement: videoRef.current,
      canvasElement: canvasRef.current,
    }), []);

    // Load model
    useEffect(() => {
      let cancelled = false;

      async function loadModel() {
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

          if (!cancelled) {
            landmarkerRef.current = landmarker;
            setIsModelLoaded(true);
            console.log('✅ PoseLandmarker cargado');
          }
        } catch (err) {
          console.error('❌ Error cargando MediaPipe:', err);
        }
      }

      loadModel();
      return () => {
        cancelled = true;
      };
    }, []);

    // Detection loop
    useEffect(() => {
      if (!isModelLoaded) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const landmarker = landmarkerRef.current as {
        detectForVideo: (video: HTMLVideoElement, timestamp: number) => {
          landmarks: { x: number; y: number; z: number; visibility: number }[][];
          worldLandmarks: { x: number; y: number; z: number; visibility: number }[][];
        };
      };

      console.log('🎬 Iniciando loop de detección');
      setDetectionState('no_person');

      function drawLoop(timestamp: number) {
        if (!video || !canvas || !landmarker) {
          rafRef.current = requestAnimationFrame(drawLoop);
          return;
        }

        if (video.readyState < 2) {
          rafRef.current = requestAnimationFrame(drawLoop);
          return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          console.log('📐 Canvas sincronizado:', canvas.width, 'x', canvas.height);
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          const results = landmarker.detectForVideo(video, timestamp);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0];

              // Draw skeleton
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

              // Update detection state
              const visible = landmarks.filter(l => (l.visibility ?? 0) > 0.5);
              const coverage = Math.round((visible.length / 33) * 100);
              setCoveragePercent(coverage);

              const leftAnkle = landmarks[KEY_LANDMARKS.LEFT_ANKLE];
              const rightAnkle = landmarks[KEY_LANDMARKS.RIGHT_ANKLE];
              const nose = landmarks[KEY_LANDMARKS.NOSE];

              if ((leftAnkle?.visibility ?? 0) > 0.3 || (rightAnkle?.visibility ?? 0) > 0.3) {
                setDetectionState(visible.length >= 20 ? 'good' : 'partial');
              } else if ((nose?.visibility ?? 0) > 0.5) {
                setDetectionState('too_close');
              } else if (visible.length >= 8) {
                setDetectionState('partial');
              } else {
                setDetectionState('no_person');
              }
            } else {
              setDetectionState('no_person');
              setCoveragePercent(0);
            }
          }
        }

        rafRef.current = requestAnimationFrame(drawLoop);
      }

      rafRef.current = requestAnimationFrame(drawLoop);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [isModelLoaded]);

    // Start camera
    useEffect(() => {
      let mounted = true;

      async function startCamera() {
        try {
          console.log('📷 Iniciando cámara...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: false,
          });

          streamRef.current = stream;

          if (mounted && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = async () => {
              if (mounted && videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                console.log('📐 Video listo:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                await videoRef.current.play();
                setCameraReady(true);
              }
            };
          }
        } catch (err) {
          if (!mounted) return;
          const error = err as Error;
          console.error('❌ Error cámara:', error.name, error.message);
          if (error.name === 'NotAllowedError') {
            setError('Permiso denegado. Permite el acceso a la cámara.');
          } else if (error.name === 'NotFoundError') {
            setError('No se encontró cámara.');
          } else if (error.name === 'NotReadableError') {
            setError('Cámara en uso por otra app.');
          } else {
            setError('Error: ' + error.message);
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      }

      startCamera();

      return () => {
        mounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
    }, []);

    if (error) {
      return (
        <div className={`flex flex-col items-center justify-center bg-slate-900 rounded-2xl ${className}`}>
          <svg className="w-12 h-12 text-rose-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-rose-400 text-sm text-center px-4">{error}</p>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900 ${className}`}>
        {(isLoading || !cameraReady) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Iniciando cámara...</p>
          </div>
        )}

        {!isModelLoaded && cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white text-sm animate-pulse">Cargando detector...</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
          className="w-full h-full object-cover"
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
          }}
        />
      </div>
    );
  }
);

CameraFeed.displayName = 'CameraFeed';

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number; visibility: number }[],
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

export default CameraFeed;
