'use client';

import { useState, useRef, useEffect } from 'react';
import { LIGHTING_PRESET_LIST, type LightingPresetId } from '@/lib/lightingPresets';

interface LightingSelectorProps {
  imageUrl: string;
  currentFilter: LightingPresetId;
  onFilterChange: (filterId: LightingPresetId) => void;
  onRegenerateWithAI?: (filterId: LightingPresetId) => void;
}

export default function LightingSelector({
  imageUrl,
  currentFilter,
  onFilterChange,
  onRegenerateWithAI,
}: LightingSelectorProps) {
  const [previews, setPreviews] = useState<Record<LightingPresetId, string>>({
    daylight: '',
    studio: '',
    golden_hour: '',
    night: '',
    warm: '',
  });
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generatePreviews();
  }, [imageUrl]);

  const generatePreviews = async () => {
    setIsGeneratingPreviews(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 107;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGeneratingPreviews(false);
      return;
    }

    const newPreviews: Record<LightingPresetId, string> = {
      daylight: '',
      studio: '',
      golden_hour: '',
      night: '',
      warm: '',
    };

    for (const preset of LIGHTING_PRESET_LIST) {
      ctx.filter = preset.cssFilter;
      ctx.drawImage(img, 0, 0, 80, 107);
      newPreviews[preset.id] = canvas.toDataURL('image/jpeg', 0.7);
    }

    setPreviews(newPreviews);
    setIsGeneratingPreviews(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Iluminación</h4>
        {isGeneratingPreviews && (
          <span className="text-xs text-zinc-500">Generando previews...</span>
        )}
      </div>

      <div className="flex gap-2">
        {LIGHTING_PRESET_LIST.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onFilterChange(preset.id)}
            title={preset.name}
            className={`
              relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all
              ${currentFilter === preset.id
                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                : 'border-transparent hover:border-zinc-600'
              }
            `}
            disabled={isGeneratingPreviews}
          >
            {previews[preset.id] ? (
              <img
                src={previews[preset.id]}
                alt={preset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-700 animate-pulse" />
            )}
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-xs py-0.5">
              {preset.icon}
            </span>
          </button>
        ))}
      </div>

      {onRegenerateWithAI && (
        <button
          onClick={() => onRegenerateWithAI(currentFilter)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerar con IA
        </button>
      )}
    </div>
  );
}
