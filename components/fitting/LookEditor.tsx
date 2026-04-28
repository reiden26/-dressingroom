'use client';

import { useState, useRef, useCallback } from 'react';
import LightingSelector from './LightingSelector';
import ColorFilter from './ColorFilter';
import { LIGHTING_PRESETS, type LightingPresetId } from '@/lib/lightingPresets';
import { COLOR_FILTERS, exportWithFilter, type ColorFilterId } from '@/lib/colorFilters';

interface LookEditorProps {
  imageUrl: string;
  garmentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
  onRegenerateWithAI?: (lightingId: LightingPresetId, prompt: string) => void;
}

export default function LookEditor({
  imageUrl,
  garmentName,
  isOpen,
  onClose,
  onSave,
  onRegenerateWithAI,
}: LookEditorProps) {
  const [currentLighting, setCurrentLighting] = useState<LightingPresetId>('daylight');
  const [currentColorFilter, setCurrentColorFilter] = useState<ColorFilterId>('normal');
  const [showCompare, setShowCompare] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyFilters = useCallback(async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0);

    if (currentColorFilter !== 'normal') {
      const filter = COLOR_FILTERS[currentColorFilter];
      if (filter?.matrix) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];

          imageData.data[i] = Math.min(255, r * filter.matrix![0] + g * filter.matrix![1] + b * filter.matrix![2] + filter.matrix![4] * 255);
          imageData.data[i + 1] = Math.min(255, r * filter.matrix![5] + g * filter.matrix![6] + b * filter.matrix![7] + filter.matrix![9] * 255);
          imageData.data[i + 2] = Math.min(255, r * filter.matrix![10] + g * filter.matrix![11] + b * filter.matrix![12] + filter.matrix![14] * 255);
          imageData.data[i + 3] = a;
        }

        ctx.putImageData(imageData, 0, 0);
      }
    }

    const filteredUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCurrentImageUrl(filteredUrl);
    onSave(filteredUrl);
  }, [imageUrl, currentColorFilter, onSave]);

  const handleLightingChange = (lightingId: LightingPresetId) => {
    setCurrentLighting(lightingId);
  };

  const handleColorFilterChange = async (filterId: ColorFilterId) => {
    setCurrentColorFilter(filterId);

    const newUrl = await exportWithFilter(imageUrl, filterId);
    if (newUrl) {
      setCurrentImageUrl(newUrl);
    }
  };

  const handleRegenerateWithAI = async () => {
    if (!onRegenerateWithAI) return;

    setIsAILoading(true);
    const preset = LIGHTING_PRESETS[currentLighting];
    await onRegenerateWithAI(currentLighting, preset.aiPrompt || '');
    setIsAILoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `look-${garmentName.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
    link.click();
  };

  const getCSSFilter = (lightingId: LightingPresetId) => {
    return LIGHTING_PRESETS[lightingId]?.cssFilter || 'none';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Editar Look</h2>
            <p className="text-zinc-400 text-sm">{garmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden">
            {showCompare ? (
              <div className="grid grid-cols-2 h-full">
                <div className="relative border-r border-zinc-700">
                  <img src={imageUrl} alt="Original" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Original
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Con filtros"
                    className="w-full h-full object-cover"
                    style={{ filter: getCSSFilter(currentLighting) }}
                  />
                  <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                    Con filtros
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={currentImageUrl}
                alt="Look editado"
                className="w-full h-full object-cover"
                style={{ filter: getCSSFilter(currentLighting) }}
              />
            )}

            {isAILoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm">Regenerando con IA...</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCompare(!showCompare)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showCompare ? 'Ocultar comparación' : 'Comparar con original'}
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-zinc-800 space-y-4 max-h-[40vh] overflow-y-auto">
          <LightingSelector
            imageUrl={imageUrl}
            currentFilter={currentLighting}
            onFilterChange={handleLightingChange}
            onRegenerateWithAI={onRegenerateWithAI ? handleRegenerateWithAI : undefined}
          />

          <ColorFilter
            imageUrl={imageUrl}
            currentFilter={currentColorFilter}
            onFilterChange={handleColorFilterChange}
          />

          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Aplicar
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
