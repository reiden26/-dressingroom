'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GarmentCard from '@/components/fitting/GarmentCard';
import TryOnGenerator from '@/components/fitting/TryOnGenerator';
import LooksGallery from '@/components/fitting/LooksGallery';
import PoseSelector from '@/components/fitting/PoseSelector';
import LookEditor from '@/components/fitting/LookEditor';
import { MOCK_CATALOG, type MockGarment, findMatchingSize } from '@/lib/mockCatalog';
import { useAppStore } from '@/store/useAppStore';
import { useTryOn } from '@/lib/useTryOn';
import { LIGHTING_PRESETS, type LightingPresetId } from '@/lib/lightingPresets';

type CategoryFilter = 'all' | 'top' | 'bottom' | 'dress' | 'outerwear';

export default function FittingPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedGarment, setSelectedGarment] = useState<MockGarment | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPoseSelector, setShowPoseSelector] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const { userProfile, capturedPoses } = useAppStore();

  const userFrontImage = useMemo(() => {
    const front = capturedPoses.find((p) => p.poseId === 'front');
    return front?.imageDataUrl || null;
  }, [capturedPoses]);

  const {
    status,
    progress,
    currentResult,
    error,
    looks,
    startTryOn,
    cancelTryOn,
    rateLook,
    deleteLook,
    clearAllLooks,
  } = useTryOn(userFrontImage);

  useEffect(() => {
    if (!userFrontImage && !userProfile?.measurements) {
      // User has no front image, might need to redirect to scan
    }
  }, [userFrontImage, userProfile]);

  const filteredGarments = useMemo(() => {
    if (selectedCategory === 'all') return MOCK_CATALOG;
    return MOCK_CATALOG.filter((g) => g.category === selectedCategory);
  }, [selectedCategory]);

  const handleSelectGarment = useCallback((garment: MockGarment) => {
    setSelectedGarment(garment);

    if (userProfile?.measurements) {
      const match = findMatchingSize(garment, {
        chest: userProfile.measurements.chest,
        waist: userProfile.measurements.waist,
        hips: userProfile.measurements.hips,
        shoulders: userProfile.measurements.shoulders,
      });
      setSelectedSize(match.size?.size);
    } else {
      setSelectedSize(garment.sizes[Math.floor(garment.sizes.length / 2)]?.size);
    }
  }, [userProfile]);

  const handleTryOn = useCallback(() => {
    if (!selectedGarment) return;
    setShowGenerator(true);
  }, [selectedGarment]);

  const handleStartTryOn = useCallback(async () => {
    if (!selectedGarment) return;
    await startTryOn(selectedGarment.id, selectedGarment.name, selectedGarment.imageUrl);
  }, [selectedGarment, startTryOn]);

  const handleCancelTryOn = useCallback(() => {
    cancelTryOn();
    setShowGenerator(false);
  }, [cancelTryOn]);

  const handleSaveLook = useCallback(() => {
    // Look is already saved by useTryOn hook
    setShowGenerator(false);
    setSelectedGarment(null);
  }, []);

  const handleTryAnother = useCallback(() => {
    cancelTryOn();
    setShowGenerator(false);
  }, [cancelTryOn]);

  const handleShare = useCallback(() => {
    if (!currentResult) return;
    if (navigator.share) {
      navigator.share({
        title: 'Mi look',
        text: `Mira cómo me queda ${currentResult.garmentName}`,
        url: currentResult.resultUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(currentResult.resultUrl).catch(console.error);
    }
  }, [currentResult]);

  const handleShowPoses = useCallback(() => {
    setShowPoseSelector(true);
  }, []);

  const handleOpenEditor = useCallback(() => {
    setShowEditor(true);
  }, []);

  const handleSaveEditedLook = useCallback((editedImageUrl: string) => {
    // Save the edited look
    console.log('Edited look saved:', editedImageUrl);
  }, []);

  const handleLightingRegenerate = useCallback((lightingId: LightingPresetId, prompt: string) => {
    console.log('Regenerate with lighting:', lightingId, prompt);
    // TODO: Implement AI lighting regeneration
  }, []);

  const handleGoToScan = useCallback(() => {
    router.push('/scan');
  }, [router]);

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Pantalones' },
    { id: 'dress', label: 'Vestidos' },
    { id: 'outerwear', label: 'Chaquetas' },
  ];

  return (
    <main className="min-h-screen bg-app">
      {/* Top Navigation Bar - Glass style */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-strong mx-4 mt-4 rounded-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-white">
              <span className="text-teal-dark">VFR</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/scan" className="text-sm text-white/60 hover:text-white transition-colors">
                Escanear
              </Link>
              <Link href="/profile" className="text-sm text-white/60 hover:text-white transition-colors">
                Mis Medidas
              </Link>
              <Link href="/fitting" className="text-sm text-white font-medium">
                Catalogo
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGallery(true)}
                className="relative p-2 glass hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                title="Mis Looks"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {looks.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-dark text-white text-xs rounded-full flex items-center justify-center">
                    {looks.length > 9 ? '9+' : looks.length}
                  </span>
                )}
              </button>
              <div className="w-8 h-8 glass rounded-full overflow-hidden">
                {userFrontImage ? (
                  <img src={userFrontImage} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-8">
        {!userFrontImage && (
          <div className="mb-6 p-4 glass-card">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-white text-sm flex-1">
                Necesitas una foto frontal para probarte ropa con IA
              </p>
              <button
                onClick={handleGoToScan}
                className="px-3 py-1.5 glass hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Escanearme
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Size recommendation panel */}
              {selectedGarment && userProfile?.measurements && (
                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Tu talla recomendada</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-16 rounded-lg overflow-hidden">
                      <img src={selectedGarment.imageUrl} alt={selectedGarment.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{selectedGarment.name}</p>
                      <p className="text-teal-dark text-lg font-bold">{selectedSize}</p>
                    </div>
                  </div>
                  {userFrontImage && (
                    <button
                      onClick={handleTryOn}
                      className="w-full py-3 bg-gradient-to-r from-teal-dark to-teal hover:from-teal hover:to-teal-dark text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Probarme con IA
                    </button>
                  )}
                </div>
              )}

              {/* Filters */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Filtros</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                        ${selectedCategory === cat.id
                          ? 'bg-teal-dark text-white'
                          : 'glass hover:bg-white/10 text-white/60 hover:text-white'
                        }
                      `}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {selectedCategory === 'all' ? 'Todas las prendas' : categories.find(c => c.id === selectedCategory)?.label}
              </h2>
              <span className="text-sm text-zinc-500">{filteredGarments.length} prendas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGarments.map((garment) => (
                <GarmentCard
                  key={garment.id}
                  garment={garment}
                  onSelect={handleSelectGarment}
                  isSelected={selectedGarment?.id === garment.id}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Try-on generator modal */}
      {showGenerator && selectedGarment && (
        <TryOnGenerator
          garment={selectedGarment}
          personImageUrl={userFrontImage}
          status={status}
          progress={progress}
          result={currentResult}
          error={error}
          onStartTryOn={handleStartTryOn}
          onCancel={handleCancelTryOn}
          onSaveLook={handleSaveLook}
          onTryAnother={handleTryAnother}
          onShare={handleShare}
          onShowPoses={handleShowPoses}
          onEdit={handleOpenEditor}
        />
      )}

      {/* Looks gallery modal */}
      <LooksGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        looks={looks}
        onRateLook={rateLook}
        onDeleteLook={deleteLook}
      />

      {/* Pose selector modal */}
      {showPoseSelector && currentResult && (
        <PoseSelector
          baseImageUrl={currentResult.resultUrl}
          garmentId={currentResult.garmentId}
          garmentName={currentResult.garmentName}
          isOpen={showPoseSelector}
          onClose={() => setShowPoseSelector(false)}
        />
      )}

      {/* Look editor modal */}
      {showEditor && currentResult && (
        <LookEditor
          imageUrl={currentResult.resultUrl}
          garmentName={currentResult.garmentName}
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveEditedLook}
          onRegenerateWithAI={handleLightingRegenerate}
        />
      )}
    </main>
  );
}
