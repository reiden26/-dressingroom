'use client';

import { useState, useRef, useCallback } from 'react';
import { COLOR_FILTER_LIST, applyColorMatrix, type ColorFilterId } from '@/lib/colorFilters';

interface ColorFilterProps {
  imageUrl: string;
  currentFilter: ColorFilterId;
  onFilterChange: (filterId: ColorFilterId) => void;
}

export default function ColorFilter({
  imageUrl,
  currentFilter,
  onFilterChange,
}: ColorFilterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyFilter = useCallback(async (filterId: ColorFilterId): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);

        if (filterId === 'normal') {
          resolve(imageUrl);
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const filter = COLOR_FILTER_LIST.find((f) => f.id === filterId);
        if (!filter?.matrix) {
          resolve(imageUrl);
          return;
        }

        const processedData = applyColorMatrix(imageData, filter.matrix);
        ctx.putImageData(processedData, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => resolve(null);
    });
  }, [imageUrl]);

  const handleFilterChange = async (filterId: ColorFilterId) => {
    if (filterId === currentFilter) return;

    setIsProcessing(true);
    await applyFilter(filterId);
    onFilterChange(filterId);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Filtro de color</h4>
        {isProcessing && (
          <span className="text-xs text-zinc-500">Procesando...</span>
        )}
      </div>

      <div className="flex gap-2">
        {COLOR_FILTER_LIST.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            disabled={isProcessing}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all
              ${currentFilter === filter.id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }
            `}
          >
            <span className="text-lg">{filter.icon}</span>
            <span className={`text-xs ${currentFilter === filter.id ? 'text-indigo-400' : 'text-zinc-400'}`}>
              {filter.name}
            </span>
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
