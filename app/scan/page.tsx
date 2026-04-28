'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import CameraFeed, { type CameraFeedRef } from '@/components/camera/CameraFeed';
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCapturedImages({ front: null, side: null, back: null })}
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
            <CameraFeed ref={cameraRef} className="w-full h-full" />

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
            <button
              onClick={handleCapture}
              disabled={!!capturedImages[currentPose.id]}
              aria-label="Capturar pose"
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                !capturedImages[currentPose.id]
                  ? 'bg-white hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-white/10 cursor-not-allowed'
              }`}
              style={{
                boxShadow: !capturedImages[currentPose.id]
                  ? '0 0 0 4px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.3)'
                  : '0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              {capturedImages[currentPose.id] ? (
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-14 h-14 rounded-full bg-white border-2 border-black/10" />
              )}
            </button>

            <p
              className={`text-[12px] font-mono uppercase tracking-wider ${
                capturedImages[currentPose.id] ? 'text-emerald-400' : 'text-white/50'
              }`}
            >
              {capturedImages[currentPose.id] ? 'Capturado' : 'Toca para capturar'}
            </p>

            {capturedImages[currentPose.id] && (
              <button
                onClick={() => handleRetake(currentPose.id)}
                className="text-[12px] text-white/50 hover:text-white transition-colors underline underline-offset-4"
              >
                Repetir foto
              </button>
            )}
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
