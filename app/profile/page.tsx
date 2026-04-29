'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MeasurementsReveal from '@/components/scan/MeasurementsReveal';
import SizeRecommendation from '@/components/scan/SizeRecommendation';
import MeasurementEditModal from '@/components/scan/MeasurementEditModal';
import ProcessingScreen from '@/components/scan/ProcessingScreen';
import { useAppStore } from '@/store/useAppStore';
import {
  saveMeasurements,
  saveProfile,
  clearAllPoses,
  clearAllMeasurements,
} from '@/lib/storage';
import type { BodyMeasurements } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, capturedPoses, setUserProfile, clearPoses } = useAppStore();
  const [showProcessing, setShowProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localMeasurements, setLocalMeasurements] = useState<BodyMeasurements | null>(null);
  // Gate the "no profile -> redirect to /scan" effect on persist hydration.
  // Otherwise a returning user (whose profile lives in localStorage) gets
  // a flicker-redirect before the persisted state is rehydrated.
  const [hydrated, setHydrated] = useState(() =>
    typeof window !== 'undefined' && useAppStore.persist?.hasHydrated?.()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (useAppStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = useAppStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!userProfile) {
      router.push('/scan');
      return;
    }
    if (userProfile.measurements) {
      setLocalMeasurements(userProfile.measurements);
    }
  }, [hydrated, userProfile, router]);

  const handleProcessingComplete = () => {
    setShowProcessing(false);
  };

  const handleEditSave = (newMeasurements: BodyMeasurements) => {
    setLocalMeasurements(newMeasurements);
    if (userProfile) {
      const updatedProfile = { ...userProfile, measurements: newMeasurements };
      setUserProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
    saveMeasurements(newMeasurements);
  };

  const handleRetakeScan = async () => {
    // Explicit "start over": wipe persisted profile, captures and saved
    // measurements so the user re-enters height/weight cleanly. Without
    // this the persisted profile would auto-skip step 1.
    setUserProfile(null);
    clearPoses();
    try {
      await Promise.all([clearAllPoses(), clearAllMeasurements()]);
    } catch (err) {
      console.error('[v0] Failed clearing previous scan data', err);
    }
    router.push('/scan');
  };

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-white/15 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-[13px] font-mono">Redirigiendo...</p>
        </div>
      </main>
    );
  }

  const displayMeasurements = localMeasurements;
  const heightM = userProfile.height / 100;
  const computedBmi =
    userProfile.weight && heightM > 0
      ? userProfile.weight / (heightM * heightM)
      : null;

  return (
    <>
      {showProcessing && <ProcessingScreen onComplete={handleProcessingComplete} />}

      {!showProcessing && (
        <main className="min-h-screen bg-black pb-32">
          {/* Top nav */}
          <Navbar />

          <div className="max-w-[1100px] mx-auto px-6 lg:px-12 pt-32 lg:pt-40">
            {/* Hero / Header */}
            <header className="mb-20 lg:mb-28 max-w-3xl">
              <span className="inline-flex items-center gap-3 text-[11px] font-mono text-white/40 uppercase tracking-widest mb-6">
                <span className="w-8 h-px bg-white/25" />
                Resumen del escaneo
              </span>

              <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-display leading-[0.95] tracking-tight text-white mb-8 text-balance">
                Tu cuerpo<span className="text-white/30">,</span>
                <br />
                <span className="text-white/40 italic">en cifras.</span>
              </h1>

              <p className="text-white/50 leading-relaxed text-[15px] max-w-xl">
                A partir de tus tres capturas y de tus datos personales hemos generado
                un perfil corporal preciso y un set de tallas recomendadas por categoría.
              </p>

              {/* Stat strip */}
              <div className="mt-12 grid grid-cols-3 gap-6 lg:gap-12 max-w-md">
                <div>
                  <span className="block text-3xl lg:text-4xl font-display text-white tabular-nums">
                    {userProfile.height}
                  </span>
                  <span className="block text-[10.5px] font-mono text-white/40 uppercase tracking-widest mt-1">
                    altura · cm
                  </span>
                </div>
                <div>
                  <span className="block text-3xl lg:text-4xl font-display text-white tabular-nums">
                    {userProfile.weight}
                  </span>
                  <span className="block text-[10.5px] font-mono text-white/40 uppercase tracking-widest mt-1">
                    peso · kg
                  </span>
                </div>
                {computedBmi !== null && (
                  <div>
                    <span className="block text-3xl lg:text-4xl font-display text-white tabular-nums">
                      {computedBmi.toFixed(1)}
                    </span>
                    <span className="block text-[10.5px] font-mono text-white/40 uppercase tracking-widest mt-1">
                      bmi
                    </span>
                  </div>
                )}
              </div>
            </header>

            {displayMeasurements ? (
              <>
                {/* Measurements section */}
                <div className="mb-24 lg:mb-32">
                  <MeasurementsReveal
                    measurements={displayMeasurements}
                    onEdit={() => setShowEditModal(true)}
                  />
                </div>

                {/* Sizes section */}
                <div className="mb-24 lg:mb-32">
                  <SizeRecommendation
                    measurements={displayMeasurements}
                    onEdit={() => setShowEditModal(true)}
                  />
                </div>

                {/* Captured photos */}
                <section className="mb-24 lg:mb-32">
                  <div className="flex items-end justify-between mb-10">
                    <div>
                      <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
                        Sección 03 — Capturas
                      </span>
                      <h2 className="text-3xl md:text-4xl font-display text-white mt-3 leading-none">
                        Tres ángulos<span className="text-white/30">.</span>
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {(['front', 'side', 'back'] as const).map((pose) => {
                      const captured = capturedPoses.find((p) => p.poseId === pose);
                      const poseName = pose === 'front' ? 'Frontal' : pose === 'side' ? 'Perfil' : 'Espalda';
                      return (
                        <div key={pose} className="group">
                          <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] relative">
                            {captured ? (
                              <img src={captured.imageDataUrl} alt={poseName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <svg className="w-7 h-7 text-white/15 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9.5px] font-mono text-white/80 uppercase tracking-wider">
                              0{pose === 'front' ? 1 : pose === 'side' ? 2 : 3}
                            </div>
                          </div>
                          <p className="text-[11.5px] font-mono text-white/55 uppercase tracking-wider mt-3 text-center">
                            {poseName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Actions */}
                <section className="border-t border-white/10 pt-12">
                  <div className="flex flex-col md:flex-row gap-3 max-w-xl">
                    <button
                      onClick={handleRetakeScan}
                      className="flex-1 h-12 rounded-full border border-white/15 text-white/80 hover:bg-white/5 hover:text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Nuevo escaneo
                    </button>
                    <Link
                      href="/fitting"
                      className="flex-1 h-12 rounded-full bg-white text-black hover:bg-white/90 text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Explorar catálogo
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </section>
              </>
            ) : (
              /* No measurements yet */
              <section className="border-t border-white/10 pt-12">
                <div className="max-w-md">
                  <h3 className="text-2xl font-display text-white mb-3">
                    Sin medidas todavía
                  </h3>
                  <p className="text-white/50 leading-relaxed mb-8 text-[14px]">
                    Completa el escaneo de las tres poses para ver tus medidas detalladas
                    y las tallas recomendadas.
                  </p>

                  <div className="flex gap-2 mb-8">
                    {(['front', 'side', 'back'] as const).map((pose, i) => {
                      const captured = capturedPoses.find((p) => p.poseId === pose);
                      const poseName = pose === 'front' ? 'Frontal' : pose === 'side' ? 'Perfil' : 'Espalda';
                      return (
                        <div key={pose} className="flex-1 text-center">
                          <div
                            className={`h-12 rounded-lg flex items-center justify-center mb-2 border ${
                              captured ? 'border-white/30 bg-white/5' : 'border-white/10'
                            }`}
                          >
                            {captured ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-[13px] font-mono text-white/30">0{i + 1}</span>
                            )}
                          </div>
                          <span className="text-[10.5px] font-mono text-white/35 uppercase tracking-wider">
                            {poseName}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href="/scan"
                    className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-white text-black hover:bg-white/90 font-medium text-[13px] transition-colors"
                  >
                    Continuar escaneo
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </section>
            )}
          </div>
        </main>
      )}

      {/* Edit Modal */}
      {displayMeasurements && (
        <MeasurementEditModal
          isOpen={showEditModal}
          measurements={displayMeasurements}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
