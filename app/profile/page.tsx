'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import MeasurementsReveal from '@/components/scan/MeasurementsReveal';
import SizeRecommendation from '@/components/scan/SizeRecommendation';
import MeasurementEditModal from '@/components/scan/MeasurementEditModal';
import ProcessingScreen from '@/components/scan/ProcessingScreen';
import { useAppStore } from '@/store/useAppStore';
import { saveMeasurements, saveProfile } from '@/lib/storage';
import type { BodyMeasurements } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, capturedPoses, setUserProfile } = useAppStore();
  const [showProcessing, setShowProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localMeasurements, setLocalMeasurements] = useState<BodyMeasurements | null>(null);

  useEffect(() => {
    if (!userProfile) {
      router.push('/scan');
      return;
    }

    if (userProfile.measurements) {
      setLocalMeasurements(userProfile.measurements);
    }
  }, [userProfile, router]);

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

  const handleRetakeScan = () => {
    router.push('/scan');
  };

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 border-4 border-teal-dark border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60">Redirigiendo...</p>
        </div>
      </main>
    );
  }

  const displayMeasurements = localMeasurements;

  return (
    <>
      {showProcessing && <ProcessingScreen onComplete={handleProcessingComplete} />}

      {!showProcessing && (
        <main className="min-h-screen bg-app pb-24">
          <nav className="fixed top-0 left-0 right-0 z-40 glass-strong mx-4 mt-4 rounded-2xl">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="text-xl font-bold text-white">
                  <span className="text-teal-dark">VFR</span>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/fitting" className="text-sm text-white/60 hover:text-white transition-colors">
                    Vestidor
                  </Link>
                  <Link href="/scan" className="text-sm text-white/60 hover:text-white transition-colors">
                    Escanear
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 pt-24 max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-card rounded-full mb-4">
                <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Escaneo Completado!</h1>
              <p className="text-white/60">
                Altura registrada: <span className="text-white font-medium">{userProfile.height} cm</span>
              </p>
            </div>

            {displayMeasurements ? (
              <>
                {/* Measurements Reveal */}
                <Card className="mb-4">
                  <MeasurementsReveal
                    measurements={displayMeasurements}
                    onEdit={() => setShowEditModal(true)}
                  />
                </Card>

                {/* Size Recommendations */}
                <Card className="mb-6">
                  <SizeRecommendation
                    measurements={displayMeasurements}
                    onEdit={() => setShowEditModal(true)}
                  />
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRetakeScan}
                    className="flex-1 h-12 glass rounded-xl hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Nuevo Escaneo
                  </button>
                  <Link
                    href="/"
                    className="flex-1 h-12 rounded-xl bg-teal-dark hover:bg-teal text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Explorar Catalogo
                  </Link>
                </div>

                {/* Captured Photos */}
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Fotos Capturadas</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['front', 'side', 'back'].map((pose) => {
                      const captured = capturedPoses.find((p) => p.poseId === pose);
                      const poseName = pose === 'front' ? 'Frente' : pose === 'side' ? 'Perfil' : 'Espalda';
                      return (
                        <div key={pose} className="aspect-[3/4] glass-card rounded-xl overflow-hidden">
                          {captured ? (
                            <img src={captured.imageDataUrl} alt={poseName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <svg className="w-8 h-8 text-white/20 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-white/40 text-xs">{poseName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* No measurements yet */
              <Card className="mb-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 glass-card rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Sin medidas disponibles</h3>
                  <p className="text-white/60 mb-6">Completa el escaneo de 3 poses para ver tus medidas detalladas.</p>

                  <div className="flex justify-center gap-3 mb-6">
                    {['front', 'side', 'back'].map((pose, i) => {
                      const captured = capturedPoses.find((p) => p.poseId === pose);
                      const poseName = pose === 'front' ? 'Frente' : pose === 'side' ? 'Perfil' : 'Espalda';
                      return (
                        <div key={pose} className="text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${captured ? 'glass-card' : 'glass'}`}>
                            {captured ? (
                              <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-medium text-white/60">{i + 1}</span>
                            )}
                          </div>
                          <span className="text-xs text-white/40">{poseName}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href="/scan"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-dark hover:bg-teal text-white font-medium rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Continuar escaneo
                  </Link>
                </div>
              </Card>
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
