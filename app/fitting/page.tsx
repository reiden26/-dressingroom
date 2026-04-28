'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GarmentCard from '@/components/fitting/GarmentCard';
import TryOnGenerator from '@/components/fitting/TryOnGenerator';
import LooksGallery from '@/components/fitting/LooksGallery';
import PoseSelector from '@/components/fitting/PoseSelector';
import LookEditor from '@/components/fitting/LookEditor';
import Navbar from '@/components/layout/Navbar';
import { MOCK_CATALOG, type MockGarment, findMatchingSize } from '@/lib/mockCatalog';
import { useAppStore } from '@/store/useAppStore';
import { useTryOn } from '@/lib/useTryOn';
import { type LightingPresetId } from '@/lib/lightingPresets';

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

  const handleSelectGarment = useCallback(
    (garment: MockGarment) => {
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
    },
    [userProfile]
  );

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
      navigator
        .share({
          title: 'Mi look',
          text: `Mira como me queda ${currentResult.garmentName}`,
          url: currentResult.resultUrl,
        })
        .catch(console.error);
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
    console.log('[v0] Edited look saved', editedImageUrl);
  }, []);

  const handleLightingRegenerate = useCallback((lightingId: LightingPresetId, prompt: string) => {
    console.log('[v0] Regenerate with lighting', lightingId, prompt);
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

  const activeCategoryLabel = categories.find((c) => c.id === selectedCategory)?.label ?? 'Todo';

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      {/* Floating "looks" button (top right) */}
      <button
        onClick={() => setShowGallery(true)}
        className="fixed top-4 right-4 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        title="Mis looks"
        aria-label="Mis looks guardados"
      >
        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {looks.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-medium text-black rounded-full flex items-center justify-center"
            style={{ background: '#7dd3fc' }}
          >
            {looks.length > 9 ? '9+' : looks.length}
          </span>
        )}
      </button>

      {/* Header */}
      <section className="pt-32 pb-10 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-white/30" />
            <span className="text-[12px] font-mono text-white/60 uppercase tracking-wider">Catalogo</span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display leading-[0.95] tracking-tight text-white text-balance">
            Pruébate prendas
            <br />
            <span className="text-white/30">a tu medida.</span>
          </h1>
          <p className="mt-6 max-w-xl text-white/50 leading-relaxed">
            Filtra por categoría y selecciona una prenda. Si tienes tus medidas guardadas, te recomendamos la talla
            ideal automáticamente.
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-20">
        {!userFrontImage && (
          <div
            className="mb-8 p-4 rounded-2xl flex items-start sm:items-center gap-3 flex-col sm:flex-row"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <svg
              className="w-5 h-5 text-amber-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-white/80 text-[14px] leading-relaxed flex-1">
              Necesitas una foto frontal para probarte ropa con IA.
            </p>
            <button
              onClick={handleGoToScan}
              className="px-4 py-2 bg-white text-black text-[12px] font-medium rounded-full hover:bg-white/90 transition-colors"
            >
              Escanearme
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-28 space-y-4">
              {/* Filters card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-px bg-white/30" />
                  <h3 className="text-[11px] font-mono text-white/60 uppercase tracking-wider">Filtros</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 text-[12px] font-medium rounded-full transition-all ${
                          isActive
                            ? 'bg-white text-black'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                        style={
                          !isActive
                            ? { border: '1px solid rgba(255,255,255,0.12)' }
                            : undefined
                        }
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size recommendation panel */}
              {selectedGarment && (
                <div
                  className="p-5 rounded-2xl fade-in"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-px bg-white/30" />
                    <h3 className="text-[11px] font-mono text-white/60 uppercase tracking-wider">
                      Prenda seleccionada
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-14 h-18 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <img
                        src={selectedGarment.imageUrl || '/placeholder.svg'}
                        alt={selectedGarment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
                        {selectedGarment.brand}
                      </p>
                      <p className="text-white text-[14px] font-medium truncate">{selectedGarment.name}</p>
                      {selectedSize && userProfile?.measurements && (
                        <p className="mt-1 text-[12px] text-white/60">
                          Tu talla: <span className="text-sky-400 font-medium">{selectedSize}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {!userProfile?.measurements && (
                    <p className="mb-4 text-[12px] text-white/50 leading-relaxed">
                      Escanea tu cuerpo para recibir una recomendación personalizada de talla.
                    </p>
                  )}

                  {userFrontImage ? (
                    <button
                      onClick={handleTryOn}
                      className="w-full py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-[13px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Probarme con IA
                    </button>
                  ) : (
                    <button
                      onClick={handleGoToScan}
                      className="w-full py-3 text-white font-medium rounded-full transition-colors text-[13px] hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                      Escanéate primero
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Catalog grid */}
          <section className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <p className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Mostrando</p>
                <h2 className="text-2xl lg:text-3xl font-display text-white leading-tight">{activeCategoryLabel}</h2>
              </div>
              <span className="text-[12px] font-mono text-white/40">
                {filteredGarments.length.toString().padStart(2, '0')} prendas
              </span>
            </div>

            {filteredGarments.length === 0 ? (
              <div
                className="py-16 text-center rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                }}
              >
                <p className="text-white/50">No hay prendas en esta categoría todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                {filteredGarments.map((garment) => (
                  <GarmentCard
                    key={garment.id}
                    garment={garment}
                    onSelect={handleSelectGarment}
                    isSelected={selectedGarment?.id === garment.id}
                  />
                ))}
              </div>
            )}
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

      <LooksGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        looks={looks}
        onRateLook={rateLook}
        onDeleteLook={deleteLook}
      />

      {showPoseSelector && currentResult && (
        <PoseSelector
          baseImageUrl={currentResult.resultUrl}
          garmentId={currentResult.garmentId}
          garmentName={currentResult.garmentName}
          isOpen={showPoseSelector}
          onClose={() => setShowPoseSelector(false)}
        />
      )}

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
