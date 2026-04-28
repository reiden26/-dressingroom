'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import CameraFeed, { type CameraFeedRef } from '@/components/camera/CameraFeed';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { POSES } from '@/lib/constants';
import { savePose, clearAllPoses, saveProfile, saveMeasurements } from '@/lib/storage';
import { calculateMeasurements } from '@/lib/measurementCalculator';
import { validateMeasurements } from '@/lib/anatomicalValidation';
import type { CapturedPose, BodyMeasurements } from '@/lib/types';

const POSE_STEPS = ['front', 'side', 'back'] as const;
type PoseType = typeof POSE_STEPS[number];

const IMAGE_WIDTH = 720;
const IMAGE_HEIGHT = 1280;

export default function ScanPage() {
  const router = useRouter();
  const cameraRef = useRef<CameraFeedRef>(null);

  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [height, setHeight] = useState<number>(0);
  const [heightInput, setHeightInput] = useState('');
  const [heightEntered, setHeightEntered] = useState(false);
  const [capturedImages, setCapturedImages] = useState<Record<PoseType, string | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [capturedLandmarks, setCapturedLandmarks] = useState<Record<PoseType, unknown[]>>({
    front: [],
    side: [],
    back: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    measurements: BodyMeasurements;
    warnings: string[];
  } | null>(null);

  const { setUserProfile, addCapturedPose, clearPoses, userProfile } = useAppStore();

  const currentPose = POSES.find((p) => p.id === POSE_STEPS[currentPoseIndex]) || POSES[0];
  const capturedCount = Object.values(capturedImages).filter(Boolean).length;
  const isAllCaptured = capturedCount === 3;

  useEffect(() => {
    clearAllPoses();
    clearPoses();
    setHeight(0);
    setHeightInput('');
    setHeightEntered(false);
  }, []);

  const handleCapture = useCallback(() => {
    const poseId = POSE_STEPS[currentPoseIndex];
    const video = cameraRef.current?.videoElement;

    if (video) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(video, 0, 0, -tempCanvas.width, tempCanvas.height);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

        setCapturedImages((prev) => ({ ...prev, [poseId]: dataUrl }));

        const pose: CapturedPose = {
          poseId,
          imageDataUrl: dataUrl,
          capturedAt: new Date(),
          landmarks: [],
        };

        savePose(pose).catch(console.error);
        addCapturedPose(pose);
      }
    }
  }, [currentPoseIndex, addCapturedPose]);

  const handleRetake = useCallback((poseId: PoseType) => {
    setCapturedImages((prev) => ({ ...prev, [poseId]: null }));
    setCapturedLandmarks((prev) => ({ ...prev, [poseId]: [] }));
  }, []);

  const handleNextPose = useCallback(() => {
    if (currentPoseIndex < 2) {
      setCurrentPoseIndex((prev) => prev + 1);
    }
  }, [currentPoseIndex]);

  const handlePrevPose = useCallback(() => {
    if (currentPoseIndex > 0) {
      setCurrentPoseIndex((prev) => prev - 1);
    }
  }, [currentPoseIndex]);

  const handleHeightSubmit = () => {
    if (height < 100 || height > 250) return;

    const profile = {
      id: uuidv4(),
      height,
      createdAt: new Date(),
    };
    setUserProfile(profile);
    saveProfile(profile);
    setHeightEntered(true);
  };

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (userProfile && capturedLandmarks.front.length > 0) {
      const frontLandmarks = capturedLandmarks.front.map((l: any) => ({
        x: l.x,
        y: l.y,
        z: l.z,
        visibility: l.visibility,
      }));

      const sideLandmarks = capturedLandmarks.side.length > 0
        ? capturedLandmarks.side.map((l: any) => ({
            x: l.x,
            y: l.y,
            z: l.z,
            visibility: l.visibility,
          }))
        : [];

      const result = calculateMeasurements(
        frontLandmarks,
        sideLandmarks,
        userProfile.height,
        IMAGE_WIDTH,
        IMAGE_HEIGHT
      );

      const validation = validateMeasurements(result.measurements, userProfile.height);

      if (validation.valid) {
        const finalMeasurements = result.measurements;
        setUserProfile({ ...userProfile, measurements: finalMeasurements });
        saveMeasurements(finalMeasurements).catch(console.error);
      }

      setAnalysisResult({
        measurements: result.measurements,
        warnings: validation.warnings,
      });
    }

    setIsAnalyzing(false);
    router.push('/profile');
  }, [capturedLandmarks, userProfile, setUserProfile, router]);

  if (!heightEntered) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-6">
          <h1 className="text-[17px] font-semibold text-slate-800 mb-2">Bienvenido al Escaneo</h1>
          <p className="text-[13px] text-slate-600 mb-6">Ingresa tu altura para comenzar. Esto nos ayuda a calibrar las proporciones.</p>

          <div className="mb-6">
            <label className="block label mb-2">Altura (cm)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={heightInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setHeightInput(val);
                const numVal = parseInt(val, 10);
                if (!isNaN(numVal)) {
                  setHeight(numVal);
                } else {
                  setHeight(0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && height >= 100 && height <= 250) {
                  e.preventDefault();
                  handleHeightSubmit();
                }
              }}
              placeholder="170"
              className="glass-input w-full text-center text-lg"
              autoFocus
            />
          </div>

          <Button onClick={handleHeightSubmit} disabled={height < 100 || height > 250} className="w-full">
            Comenzar Escaneo
          </Button>
        </div>
      </main>
    );
  }

  if (isAllCaptured && !isAnalyzing) {
    return (
      <main className="min-h-screen bg-app pb-24">
        <div className="container mx-auto px-4 pt-20">
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-5 mb-4">
              <h1 className="text-[17px] font-semibold text-slate-800 text-center mb-1">Resumen del Escaneo</h1>
              <p className="text-[12.5px] text-slate-500 text-center">Se capturaron 3 poses de tu cuerpo</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {POSE_STEPS.map((poseId) => {
                const pose = POSES.find((p) => p.id === poseId);
                return (
                  <div key={poseId} className="text-center">
                    <div className="aspect-[3/4] glass-card rounded-xl overflow-hidden mb-2 ring-1 ring-white/70">
                      {capturedImages[poseId] && (
                        <img src={capturedImages[poseId]} alt={pose?.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-[12.5px] font-semibold text-slate-700">{pose?.name}</p>
                    <button onClick={() => handleRetake(poseId)} className="text-[11px] text-slate-400 hover:text-slate-600">
                      Repetir
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCapturedImages({ front: null, side: null, back: null })}
                className="flex-1"
              >
                Repetir Todo
              </Button>
              <Button onClick={handleAnalyze} className="flex-1">
                Analizar Medidas
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isAnalyzing) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Analizando tu cuerpo...</h2>
          <p className="text-[12.5px] text-slate-500">Calculando proporciones y medidas corporales</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app pb-48">
      <div className="container mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-700 p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex gap-2">
            {POSE_STEPS.map((poseId, index) => (
              <button
                key={poseId}
                onClick={() => setCurrentPoseIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  capturedImages[poseId]
                    ? 'bg-emerald-500'
                    : index === currentPoseIndex
                    ? 'bg-sky-500'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="w-9" />
        </div>

        {/* Pose title */}
        <div className="text-center mb-4">
          <h2 className="text-[15px] font-semibold text-slate-800">{currentPose.name}</h2>
          <p className="text-[12.5px] text-slate-500">{currentPose.instruction}</p>
        </div>

        {/* Main camera container */}
        <div className="flex flex-col items-center gap-4 mt-6">
          {/* Video + Canvas overlay */}
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/40 shadow-lg">
            <CameraFeed ref={cameraRef} className="w-full h-full" />
          </div>

          {/* Capture button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleCapture}
              disabled={!!capturedImages[currentPose.id]}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                transition-all duration-200 ring-1
                ${!capturedImages[currentPose.id]
                  ? 'bg-white/70 ring-white/60 hover:bg-white/80 cursor-pointer'
                  : 'bg-slate-200/50 ring-slate-300/50 cursor-not-allowed opacity-60'}
              `}
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <p className={`text-[12.5px] font-medium ${
              capturedImages[currentPose.id] ? 'text-emerald-600' : 'text-slate-500'
            }`}>
              {capturedImages[currentPose.id] ? 'Capturado' : 'Toca para capturar'}
            </p>
          </div>

          {/* Retake photo link */}
          {capturedImages[currentPose.id] && (
            <button
              onClick={() => handleRetake(currentPose.id)}
              className="text-[12.5px] text-slate-400 hover:text-slate-600"
            >
              Repetir foto
            </button>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-4 w-full max-w-md">
            {currentPoseIndex > 0 && (
              <Button variant="secondary" onClick={handlePrevPose} className="flex-1">
                Anterior
              </Button>
            )}
            {currentPoseIndex < 2 ? (
              <Button
                onClick={handleNextPose}
                disabled={!capturedImages[currentPose.id]}
                className="flex-1"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/profile')}
                disabled={!isAllCaptured}
                className="flex-1"
              >
                Ver Resultados
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
