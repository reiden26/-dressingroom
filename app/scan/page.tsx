'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import CameraFeed, { type CameraFeedRef, type CameraStatus } from '@/components/camera/CameraFeed';
import Navbar from '@/components/layout/Navbar';
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
  const [weight, setWeight] = useState<number>(0);
  const [weightInput, setWeightInput] = useState('');
  const [profileEntered, setProfileEntered] = useState(false);

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
  const [, setAnalysisResult] = useState<{
    measurements: BodyMeasurements;
    warnings: string[];
  } | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    cameraReady: false,
    modelLoaded: false,
    error: null,
    detectionState: 'no_person',
    coveragePercent: 0,
  });

  const { setUserProfile, addCapturedPose, clearPoses, userProfile } = useAppStore();

  // Stable callback so CameraFeed doesn't re-fire on every render
  const handleStatusChange = useCallback((s: CameraStatus) => {
    setCameraStatus(s);
  }, []);

  // Capture is only allowed when:
  // 1. The camera stream is ready (not loading / not errored)
  // 2. The MediaPipe model has finished loading
  // 3. A body is actually detected ('partial' or 'good' — not 'no_person' / 'too_close')
  const canCapture =
    cameraStatus.cameraReady &&
    cameraStatus.modelLoaded &&
    !cameraStatus.error &&
    (cameraStatus.detectionState === 'good' || cameraStatus.detectionState === 'partial');

  const captureBlockedReason: string | null = (() => {
    if (cameraStatus.error) return cameraStatus.error;
    if (!cameraStatus.cameraReady) return 'Iniciando cámara…';
    if (!cameraStatus.modelLoaded) return 'Cargando detector de pose…';
    if (cameraStatus.detectionState === 'no_person')
      return 'No detectamos a nadie. Sitúate frente a la cámara.';
    if (cameraStatus.detectionState === 'too_close')
      return 'Estás demasiado cerca. Aléjate para que se vea tu cuerpo.';
    if (cameraStatus.detectionState === 'partial')
      return 'Cuerpo parcialmente visible — intenta encuadrarte por completo.';
    return null;
  })();

  const currentPose = POSES.find((p) => p.id === POSE_STEPS[currentPoseIndex]) || POSES[0];
  const capturedCount = Object.values(capturedImages).filter(Boolean).length;
  const isAllCaptured = capturedCount === 3;

  useEffect(() => {
    clearAllPoses();
    clearPoses();
    setHeight(0);
    setHeightInput('');
    setWeight(0);
    setWeightInput('');
    setProfileEntered(false);
  }, [clearPoses]);

  const handleCapture = useCallback(() => {
    // Hard guard — never capture when the camera/detector aren't ready
    // or when no body is detected.
    if (!canCapture) {
      console.log('[v0] Capture blocked:', captureBlockedReason);
      return;
    }

    const poseId = POSE_STEPS[currentPoseIndex];
    const video = cameraRef.current?.videoElement;
    const landmarks = cameraRef.current?.getLandmarks?.() ?? null;

    // Extra safety: even though canCapture is true, if landmarks vanished
    // between the last frame and the click, abort the capture.
    if (!video || video.readyState < 2 || !landmarks || landmarks.length === 0) {
      console.log('[v0] Capture aborted — no live frame or landmarks');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, 0, 0, -tempCanvas.width, tempCanvas.height);
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

    setCapturedImages((prev) => ({ ...prev, [poseId]: dataUrl }));
    setCapturedLandmarks((prev) => ({ ...prev, [poseId]: landmarks }));

    const pose: CapturedPose = {
      poseId,
      imageDataUrl: dataUrl,
      capturedAt: new Date(),
      landmarks,
    };

    savePose(pose).catch(console.error);
    addCapturedPose(pose);
  }, [canCapture, captureBlockedReason, currentPoseIndex, addCapturedPose]);

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

  const heightValid = height >= 100 && height <= 250;
  const weightValid = weight >= 30 && weight <= 250;
  const profileValid = heightValid && weightValid;

  const handleProfileSubmit = () => {
    if (!profileValid) return;

    const profile = {
      id: uuidv4(),
      height,
      weight,
      createdAt: new Date(),
    };
    setUserProfile(profile);
    saveProfile(profile);
    setProfileEntered(true);
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
        IMAGE_HEIGHT,
        userProfile.weight
      );

      const validation = validateMeasurements(result.measurements, userProfile.height);

      // Always persist the calculated measurements so the user can see / edit them.
      // Validation warnings/errors are surfaced but never block storage —
      // otherwise the profile page shows "Sin medidas todavía" even after a
      // successful capture, which is confusing for the user.
      const finalMeasurements = result.measurements;
      setUserProfile({ ...userProfile, measurements: finalMeasurements });
      saveMeasurements(finalMeasurements).catch(console.error);

      setAnalysisResult({
        measurements: result.measurements,
        warnings: [...validation.warnings, ...validation.errors],
      });
    }

    setIsAnalyzing(false);
    router.push('/profile');
  }, [capturedLandmarks, userProfile, setUserProfile, router]);

  // ─── Step 1: Profile entry (height + weight) ──────────────────────────
  if (!profileEntered) {
    return (
      <main className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center px-6 pt-32 pb-16 min-h-screen">
          <div className="w-full max-w-md">
            <span className="inline-flex items-center gap-3 text-xs font-mono text-white/40 uppercase tracking-widest mb-8">
              <span className="w-8 h-px bg-white/20" />
              Paso 1 de 2 — Tus datos
            </span>

            <h1 className="text-5xl md:text-6xl font-display leading-[0.95] tracking-tight text-white mb-4 text-balance">
              Antes de medir<span className="text-white/30">,</span>
              <br />
              <span className="text-white/40 italic">conócete.</span>
            </h1>

            <p className="text-white/50 leading-relaxed mb-12 text-[15px]">
              Tu altura calibra los puntos del escaneo y tu peso refina el cálculo
              de tallas para que coincidan con tu cuerpo real.
            </p>

            <div className="space-y-6 mb-10">
              {/* Height */}
              <div>
                <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
                  Altura
                </label>
                <div className="flex items-baseline gap-3 border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heightInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                      setHeightInput(val);
                      const numVal = parseInt(val, 10);
                      setHeight(isNaN(numVal) ? 0 : numVal);
                    }}
                    placeholder="170"
                    className="flex-1 bg-transparent text-4xl md:text-5xl font-display text-white placeholder:text-white/15 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-sm font-mono text-white/40">cm</span>
                </div>
                <p className="mt-2 text-[11px] font-mono text-white/30">Entre 100 y 250 cm</p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
                  Peso
                </label>
                <div className="flex items-baseline gap-3 border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={weightInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '').slice(0, 5);
                      setWeightInput(val);
                      const numVal = parseFloat(val);
                      setWeight(isNaN(numVal) ? 0 : numVal);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && profileValid) {
                        e.preventDefault();
                        handleProfileSubmit();
                      }
                    }}
                    placeholder="70"
                    className="flex-1 bg-transparent text-4xl md:text-5xl font-display text-white placeholder:text-white/15 focus:outline-none"
                  />
                  <span className="text-sm font-mono text-white/40">kg</span>
                </div>
                <p className="mt-2 text-[11px] font-mono text-white/30">Entre 30 y 250 kg</p>
              </div>
            </div>

            <button
              onClick={handleProfileSubmit}
              disabled={!profileValid}
              className={`w-full h-14 rounded-full font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2 ${
                profileValid
                  ? 'bg-white text-black hover:bg-white/90 active:scale-[0.99]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Comenzar escaneo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <p className="mt-6 text-[11px] text-white/30 leading-relaxed text-center">
              Tus datos se procesan localmente en tu dispositivo. Nada se envía a un servidor.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ─── Capture summary (3 poses captured, before analysis) ──────────────
  if (isAllCaptured && !isAnalyzing) {
    return (
      <main className="min-h-screen bg-black">
        <Navbar />
        <div className="pb-32 px-6 pt-32">
          <div className="max-w-lg mx-auto">
            <span className="inline-flex items-center gap-3 text-xs font-mono text-white/40 uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-white/20" />
              Capturas listas
            </span>

            <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3 text-balance">
              Tres ángulos<span className="text-white/30">,</span>
              <br />
              <span className="text-white/40 italic">un cuerpo.</span>
            </h1>

            <p className="text-white/50 mb-10 text-[14px] leading-relaxed">
              Verifica que las imágenes muestren tu cuerpo completo y prosigue al análisis.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {POSE_STEPS.map((poseId) => {
                const pose = POSES.find((p) => p.id === poseId);
                return (
                  <div key={poseId}>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 border border-white/10 bg-white/[0.02]">
                      {capturedImages[poseId] && (
                        <img src={capturedImages[poseId] || undefined} alt={pose?.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-[12px] font-mono text-white/60 text-center">{pose?.name}</p>
                    <button
                      onClick={() => handleRetake(poseId)}
                      className="block mx-auto text-[10.5px] text-white/30 hover:text-white/60 transition-colors mt-1"
                    >
                      Repetir
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCapturedImages({ front: null, side: null, back: null })}
                className="flex-1 h-12 rounded-full border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-[13px] font-medium transition-colors"
              >
                Repetir todo
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 h-12 rounded-full bg-white text-black hover:bg-white/90 text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                Analizar medidas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Analyzing state — fullscreen blocker, no nav ────────────────────
  if (isAnalyzing) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-white/15 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-display text-white mb-2">Analizando tu cuerpo</h2>
          <p className="text-[13px] text-white/40 font-mono">Calibrando proporciones</p>
        </div>
      </main>
    );
  }

  // ─── Camera capture step ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="px-6 pt-28 pb-16 max-w-xl mx-auto">
        {/* Step header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-3 text-xs font-mono text-white/40 uppercase tracking-widest mb-5">
            <span className="w-8 h-px bg-white/20" />
            Paso 2 de 2 — Captura {currentPoseIndex + 1} de 3
          </span>

          <h1 className="text-4xl md:text-[44px] font-display leading-[0.95] tracking-tight text-white mb-2 text-balance">
            {currentPose.name.split(' ')[0]}{' '}
            <span className="text-white/40 italic">
              {currentPose.name.split(' ').slice(1).join(' ') || ''}
            </span>
          </h1>

          <p className="text-white/50 text-[14px] leading-relaxed">
            {currentPose.instruction}
          </p>
        </div>

        {/* Pose progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {POSE_STEPS.map((poseId, index) => {
            const captured = !!capturedImages[poseId];
            const isCurrent = index === currentPoseIndex;
            return (
              <button
                key={poseId}
                onClick={() => setCurrentPoseIndex(index)}
                className="flex items-center gap-2 group"
                aria-label={`Ir a captura ${index + 1}`}
              >
                <span
                  className={`block transition-all duration-300 rounded-full ${
                    captured
                      ? 'w-8 h-1 bg-sky-400'
                      : isCurrent
                      ? 'w-8 h-1 bg-white'
                      : 'w-4 h-1 bg-white/15 group-hover:bg-white/30'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Camera viewport */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] mb-6">
          <CameraFeed
            ref={cameraRef}
            className="w-full h-full"
            onStatusChange={handleStatusChange}
          />

          {/* Live status pill in viewport */}
          {!capturedImages[currentPose.id] && cameraStatus.cameraReady && cameraStatus.modelLoaded && !cameraStatus.error && (
            <div className="absolute top-3 left-3 z-10">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10.5px] font-mono uppercase tracking-widest backdrop-blur-md border ${
                  cameraStatus.detectionState === 'good'
                    ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-200'
                    : cameraStatus.detectionState === 'partial'
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                    : 'bg-rose-400/15 border-rose-400/40 text-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    cameraStatus.detectionState === 'good'
                      ? 'bg-emerald-300'
                      : cameraStatus.detectionState === 'partial'
                      ? 'bg-amber-300'
                      : 'bg-rose-300'
                  }`}
                />
                {cameraStatus.detectionState === 'good' && 'Listo'}
                {cameraStatus.detectionState === 'partial' && 'Parcial'}
                {cameraStatus.detectionState === 'too_close' && 'Muy cerca'}
                {cameraStatus.detectionState === 'no_person' && 'Sin detección'}
              </div>
            </div>
          )}

          {/* Captured overlay */}
          {capturedImages[currentPose.id] && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <img
                src={capturedImages[currentPose.id] || undefined}
                alt={currentPose.name}
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sky-400/20 border border-sky-400/60 flex items-center justify-center mb-3 backdrop-blur-md">
                  <svg className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[12px] font-mono text-white/80 uppercase tracking-widest">
                  Captura realizada
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Capture / Retake button */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {!capturedImages[currentPose.id] ? (
            <>
              <button
                onClick={handleCapture}
                disabled={!canCapture}
                aria-disabled={!canCapture}
                aria-label={canCapture ? 'Capturar foto' : 'Captura no disponible'}
                title={captureBlockedReason ?? 'Capturar foto'}
                className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  canCapture ? 'active:scale-95 cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <span
                  className={`absolute inset-0 rounded-full border transition-colors ${
                    canCapture
                      ? 'border-white/30 group-hover:border-white/60'
                      : 'border-white/10'
                  }`}
                />
                <span
                  className={`absolute inset-2 rounded-full transition-colors ${
                    canCapture
                      ? 'bg-white group-hover:bg-white/90'
                      : 'bg-white/15'
                  }`}
                />
                {!canCapture && (
                  <svg className="relative z-10 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
              <p
                className={`text-[11px] font-mono uppercase tracking-widest text-center max-w-[260px] leading-relaxed ${
                  canCapture ? 'text-white/40' : 'text-white/50'
                }`}
              >
                {canCapture ? 'Toca para capturar' : captureBlockedReason}
              </p>
            </>
          ) : (
            <button
              onClick={() => handleRetake(currentPose.id)}
              className="px-6 h-11 rounded-full border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-[13px] font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repetir captura
            </button>
          )}
        </div>

        {/* Pose navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevPose}
            disabled={currentPoseIndex === 0}
            className={`flex-1 h-12 rounded-full border text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
              currentPoseIndex === 0
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-white/15 text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Anterior
          </button>

          {currentPoseIndex < 2 ? (
            <button
              onClick={handleNextPose}
              disabled={!capturedImages[currentPose.id]}
              className={`flex-1 h-12 rounded-full text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
                capturedImages[currentPose.id]
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => {/* All captured handler activates the summary screen automatically */}}
              disabled={!isAllCaptured}
              className={`flex-1 h-12 rounded-full text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
                isAllCaptured
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Finalizar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
