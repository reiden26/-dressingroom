'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import CameraFeed, { type CameraFeedRef, type CapturedLandmark } from '@/components/camera/CameraFeed';
import Navbar from '@/components/layout/Navbar';
import { useAppStore } from '@/store/useAppStore';
import { POSES } from '@/lib/constants';
import { savePose, clearAllPoses, saveProfile, saveMeasurements } from '@/lib/storage';
import { calculateMeasurements } from '@/lib/measurementCalculator';
import { validateMeasurements } from '@/lib/anatomicalValidation';
import type { CapturedPose } from '@/lib/types';

const POSE_STEPS = ['front', 'side', 'back'] as const;
type PoseType = typeof POSE_STEPS[number];

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
  const [capturedLandmarks, setCapturedLandmarks] = useState<Record<PoseType, CapturedLandmark[]>>({
    front: [],
    side: [],
    back: [],
  });
  const [capturedSizes, setCapturedSizes] = useState<Record<PoseType, { width: number; height: number } | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [liveDetection, setLiveDetection] = useState<{
    state: 'no_person' | 'too_close' | 'partial' | 'good';
    coverage: number;
  }>({ state: 'no_person', coverage: 0 });

  const { setUserProfile, addCapturedPose, clearPoses, userProfile } = useAppStore();

  const handleDetectionUpdate = useCallback(
    (state: 'no_person' | 'too_close' | 'partial' | 'good', coverage: number) => {
      setLiveDetection({ state, coverage });
    },
    []
  );

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
    if (!video) return;

    // Snapshot the latest landmarks BEFORE drawing, so we have the exact pose
    // at the moment of capture.
    const latestLandmarks = cameraRef.current?.getLatestLandmarks() ?? null;
    const videoSize = cameraRef.current?.getVideoSize() ?? {
      width: video.videoWidth,
      height: video.videoHeight,
    };

    if (!latestLandmarks || latestLandmarks.length === 0) {
      console.warn('[v0] Captura sin landmarks: el detector aun no encuentra el cuerpo.');
    } else {
      console.log(
        '[v0] Captura',
        poseId,
        'con',
        latestLandmarks.length,
        'landmarks. Video',
        videoSize.width,
        'x',
        videoSize.height
      );
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoSize.width;
    tempCanvas.height = videoSize.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, -tempCanvas.width, tempCanvas.height);
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

    const landmarks = latestLandmarks ?? [];

    setCapturedImages((prev) => ({ ...prev, [poseId]: dataUrl }));
    setCapturedLandmarks((prev) => ({ ...prev, [poseId]: landmarks }));
    setCapturedSizes((prev) => ({ ...prev, [poseId]: videoSize }));

    const pose: CapturedPose = {
      poseId,
      imageDataUrl: dataUrl,
      capturedAt: new Date(),
      landmarks,
    };

    savePose(pose).catch(console.error);
    addCapturedPose(pose);
  }, [currentPoseIndex, addCapturedPose]);

  const handleRetake = useCallback((poseId: PoseType) => {
    setCapturedImages((prev) => ({ ...prev, [poseId]: null }));
    setCapturedLandmarks((prev) => ({ ...prev, [poseId]: [] }));
    setCapturedSizes((prev) => ({ ...prev, [poseId]: null }));
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
    setAnalysisError(null);
    setIsAnalyzing(true);

    if (!userProfile) {
      setAnalysisError('No se ha registrado tu altura. Vuelve a comenzar.');
      setIsAnalyzing(false);
      return;
    }

    if (capturedLandmarks.front.length === 0) {
      setAnalysisError(
        'No se detectaron puntos corporales en la pose frontal. Repite la captura asegurandote de que tu cuerpo entero sea visible.'
      );
      setIsAnalyzing(false);
      return;
    }

    // Use the same image size that MediaPipe used to normalize the landmarks.
    const frontSize = capturedSizes.front ?? { width: 1280, height: 720 };
    const sideSize = capturedSizes.side ?? frontSize;

    // The pixel scale on the frontal image matters for vertical and horizontal
    // distances; the side image uses its own width for depth measurements,
    // but since both are roughly the same camera, we pass the same dims and
    // recompute scale per-view inside the calculator.
    const result = calculateMeasurements(
      capturedLandmarks.front,
      capturedLandmarks.side,
      userProfile.height,
      Math.max(frontSize.width, sideSize.width),
      Math.max(frontSize.height, sideSize.height)
    );

    // Brief delay so the spinner is visible.
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (result.measurements.shoulders === 0 && result.measurements.hips === 0) {
      setAnalysisError(
        result.warnings.join(' ') ||
          'No se pudieron calcular medidas. Repite el escaneo asegurandote de que la cabeza y los pies sean visibles.'
      );
      setIsAnalyzing(false);
      return;
    }

    const validation = validateMeasurements(result.measurements, userProfile.height);
    const finalMeasurements = result.measurements;

    setUserProfile({ ...userProfile, measurements: finalMeasurements });
    saveMeasurements(finalMeasurements).catch(console.error);

    console.log('[v0] Analisis completado', {
      measurements: finalMeasurements,
      warnings: [...result.warnings, ...validation.warnings],
      valid: validation.valid,
    });

    setIsAnalyzing(false);
    router.push('/profile');
  }, [capturedLandmarks, capturedSizes, userProfile, setUserProfile, router]);

  // ---------- HEIGHT ENTRY ----------
  if (!heightEntered) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-sky-500/10 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-white/5 blur-[120px]" />
          </div>

          <div className="relative w-full max-w-md">
            <div className="mb-8">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/50 mb-6">
                <span className="w-8 h-px bg-white/20" />
                Paso 1 de 2
              </span>
              <h1 className="text-5xl md:text-6xl font-display leading-[0.95] tracking-tight text-white mb-4">
                Bienvenido al
                <br />
                <span className="text-white/40">escaneo.</span>
              </h1>
              <p className="text-[15px] text-white/55 leading-relaxed max-w-sm">
                Ingresa tu altura para comenzar. La usaremos para calibrar las proporciones de tu cuerpo.
              </p>
            </div>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-3">
                Altura (cm)
              </label>
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
                autoFocus
                className="w-full bg-transparent text-white text-5xl font-display tracking-tight text-center py-4 outline-none border-b border-white/15 focus:border-sky-400 transition-colors placeholder:text-white/15"
              />
              <p className="text-[12px] text-white/40 text-center mt-2">
                Entre 100 y 250 cm
              </p>

              <button
                onClick={handleHeightSubmit}
                disabled={height < 100 || height > 250}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed"
              >
                Comenzar Escaneo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            <p className="text-center text-[12px] text-white/30 mt-6">
              Tus datos se procesan localmente en tu dispositivo.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // ---------- ANALYZING ----------
  if (isAnalyzing) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <section className="min-h-screen flex items-center justify-center px-6 pt-32">
          <div
            className="p-10 rounded-2xl text-center max-w-sm w-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="w-14 h-14 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-display text-white mb-2">Analizando tu cuerpo</h2>
            <p className="text-[13px] text-white/50">Calculando proporciones y medidas corporales</p>
          </div>
        </section>
      </main>
    );
  }

  // ---------- ALL CAPTURED SUMMARY ----------
  if (isAllCaptured && !isAnalyzing) {
    return (
      <main className="min-h-screen bg-black text-white pb-24">
        <Navbar />

        <section className="container mx-auto px-6 pt-32">
          <div className="max-w-2xl mx-auto">
            <div className="mb-10">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/50 mb-6">
                <span className="w-8 h-px bg-white/20" />
                Resumen del escaneo
              </span>
              <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3">
                Capturas listas.
              </h1>
              <p className="text-[15px] text-white/55">
                Se capturaron 3 poses de tu cuerpo correctamente.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {POSE_STEPS.map((poseId) => {
                const pose = POSES.find((p) => p.id === poseId);
                return (
                  <div key={poseId}>
                    <div
                      className="aspect-[3/4] rounded-2xl overflow-hidden mb-3"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {capturedImages[poseId] && (
                        <img
                          src={capturedImages[poseId] || ''}
                          alt={pose?.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-white text-center mb-1">{pose?.name}</p>
                    <button
                      onClick={() => handleRetake(poseId)}
                      className="block mx-auto text-[11px] font-mono uppercase tracking-wider text-white/40 hover:text-white transition-colors"
                    >
                      Repetir
                    </button>
                  </div>
                );
              })}
            </div>

            {analysisError && (
              <div
                className="mb-4 p-4 rounded-2xl text-[13px] text-amber-200/90 leading-relaxed"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                <div className="flex gap-3 items-start">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{analysisError}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setCapturedImages({ front: null, side: null, back: null });
                  setCapturedLandmarks({ front: [], side: [], back: [] });
                  setCapturedSizes({ front: null, side: null, back: null });
                  setAnalysisError(null);
                  setCurrentPoseIndex(0);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/15 text-white font-medium rounded-full hover:bg-white/5 transition-colors"
              >
                Repetir todo
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Analizar medidas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ---------- CAPTURE FLOW ----------
  return (
    <main className="min-h-screen bg-black text-white pb-32">
      <Navbar />

      <section className="container mx-auto px-6 pt-28">
        <div className="max-w-lg mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
              Paso {currentPoseIndex + 1} de 3
            </span>

            <div className="flex items-center gap-2">
              {POSE_STEPS.map((poseId, index) => (
                <button
                  key={poseId}
                  onClick={() => setCurrentPoseIndex(index)}
                  aria-label={`Ir al paso ${index + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    capturedImages[poseId]
                      ? 'w-8 bg-sky-400'
                      : index === currentPoseIndex
                      ? 'w-8 bg-white'
                      : 'w-4 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Pose title */}
          <div className="mb-5">
            <h2 className="text-3xl md:text-4xl font-display leading-tight tracking-tight text-white mb-1">
              {currentPose.name}
            </h2>
            <p className="text-[13px] text-white/55">{currentPose.instruction}</p>
          </div>

          {/* Camera */}
          <div
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <CameraFeed
              ref={cameraRef}
              className="w-full h-full"
              onDetectionUpdate={handleDetectionUpdate}
            />

            {/* Captured overlay */}
            {capturedImages[currentPose.id] && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div
                  className="px-4 py-2 rounded-full inline-flex items-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[12px] font-medium text-white">Pose capturada</span>
                </div>
              </div>
            )}
          </div>

          {/* Capture button row */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {(() => {
              const alreadyCaptured = !!capturedImages[currentPose.id];
              const detectionReady = liveDetection.state === 'good' || liveDetection.state === 'partial';
              const canCapture = !alreadyCaptured && detectionReady;

              return (
                <>
                  <button
                    onClick={handleCapture}
                    disabled={!canCapture}
                    aria-label="Capturar pose"
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                      canCapture
                        ? 'bg-white hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-white/10 cursor-not-allowed'
                    }`}
                    style={{
                      boxShadow: canCapture
                        ? '0 0 0 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.3)'
                        : '0 0 0 1px rgba(255,255,255,0.1)',
                    }}
                  >
                    {alreadyCaptured ? (
                      <svg
                        className="w-7 h-7 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span
                        className={`w-14 h-14 rounded-full border-2 ${
                          canCapture ? 'bg-white border-black/10' : 'bg-white/30 border-white/20'
                        }`}
                      />
                    )}
                  </button>

                  <p
                    className={`text-[12px] font-mono uppercase tracking-wider ${
                      alreadyCaptured
                        ? 'text-emerald-400'
                        : canCapture
                        ? 'text-white/70'
                        : 'text-amber-400/80'
                    }`}
                  >
                    {alreadyCaptured
                      ? 'Capturado'
                      : liveDetection.state === 'no_person'
                      ? 'Buscando cuerpo...'
                      : liveDetection.state === 'too_close'
                      ? 'Alejate de la camara'
                      : liveDetection.state === 'partial'
                      ? `Cuerpo parcial (${liveDetection.coverage}%)`
                      : `Listo - toca para capturar`}
                  </p>

                  {alreadyCaptured && capturedLandmarks[currentPose.id].length === 0 && (
                    <p className="text-[11px] text-amber-400/80 text-center max-w-xs">
                      Esta foto no tiene puntos de pose detectados. Repite la captura asegurando que tu cuerpo entero sea visible.
                    </p>
                  )}

                  {alreadyCaptured && (
                    <button
                      onClick={() => handleRetake(currentPose.id)}
                      className="text-[12px] text-white/50 hover:text-white transition-colors underline underline-offset-4"
                    >
                      Repetir foto
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentPoseIndex > 0 && (
              <button
                onClick={handlePrevPose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/15 text-white font-medium rounded-full hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Anterior
              </button>
            )}
            {currentPoseIndex < 2 ? (
              <button
                onClick={handleNextPose}
                disabled={!capturedImages[currentPose.id]}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => router.push('/profile')}
                disabled={!isAllCaptured}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed"
              >
                Ver Resultados
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
