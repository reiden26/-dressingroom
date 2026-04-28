'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { MockGarment } from '@/lib/mockCatalog';
import { useTryOnQueue } from '@/lib/useTryOnQueue';
import { getSizeRecommendations } from '@/lib/mockCatalog';

interface FittingCanvasProps {
  userImageUrl: string | null;
  garment: MockGarment | null;
  selectedSize?: string;
}

export default function FittingCanvas({ userImageUrl, garment, selectedSize }: FittingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [garmentPosition, setGarmentPosition] = useState({ x: 50, y: 20 });
  const [garmentScale, setGarmentScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);

  const {
    items: queueItems,
    isLoading: isQueueLoading,
    error: queueError,
    tryOn,
    removeItem,
    canTryOn,
  } = useTryOnQueue(userImageUrl);

  const currentGarmentItem = queueItems.find((item) => item.garmentId === garment?.id);
  const isGenerating = currentGarmentItem?.status === 'pending' || currentGarmentItem?.status === 'processing';
  const generatedImageUrl = currentGarmentItem?.status === 'succeeded' ? currentGarmentItem.outputUrl : null;
  const generationError = currentGarmentItem?.status === 'failed' ? currentGarmentItem.error : null;

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const imageToDraw = generatedImageUrl || userImageUrl;

    if (imageToDraw) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = imageToDraw;
      });

      if (img.complete && img.naturalWidth > 0) {
        const scale = Math.min(rect.width / img.width, rect.height / img.height);
        const x = (rect.width - img.width * scale) / 2;
        const y = (rect.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        if (generatedImageUrl) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 3;
          ctx.strokeRect(0, 0, rect.width, rect.height);
        }
      }
    } else {
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = '#3F3F46';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const centerX = rect.width / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, rect.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#71717A';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Tu foto aparecera aqui', rect.width / 2, rect.height / 2);
    }

    if (garment && !generatedImageUrl) {
      const garmentImg = new Image();
      garmentImg.crossOrigin = 'anonymous';
      setIsLoadingCanvas(true);
      await new Promise<void>((resolve) => {
        garmentImg.onload = () => resolve();
        garmentImg.onerror = () => resolve();
        garmentImg.src = garment.imageUrl;
      });
      setIsLoadingCanvas(false);

      if (garmentImg.complete && garmentImg.naturalWidth > 0) {
        const baseWidth = rect.width * 0.4 * garmentScale;
        const aspectRatio = garmentImg.height / garmentImg.width;
        const baseHeight = baseWidth * aspectRatio;

        const garmentX = (rect.width * garmentPosition.x / 100) - baseWidth / 2;
        const garmentY = (rect.height * garmentPosition.y / 100) - baseHeight / 2;

        ctx.globalAlpha = 0.85;
        ctx.drawImage(garmentImg, garmentX, garmentY, baseWidth, baseHeight);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(garmentX, garmentY, baseWidth, baseHeight);
        ctx.setLineDash([]);
      }
    }
  }, [userImageUrl, garment, garmentPosition, garmentScale, generatedImageUrl]);

  useEffect(() => {
    drawCanvas();

    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!garment || generatedImageUrl) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !garment || !generatedImageUrl || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setGarmentPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(5, Math.min(95, y)) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!garment || generatedImageUrl) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setGarmentScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleGenerateTryOn = async () => {
    if (!garment || !userImageUrl || !canTryOn) return;
    await tryOn(garment.id, garment.imageUrl);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `outfit-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getStatusBadge = () => {
    if (!currentGarmentItem) return null;

    switch (currentGarmentItem.status) {
      case 'pending':
        return (
          <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Esperando...
          </div>
        );
      case 'processing':
        return (
          <div className="absolute top-3 right-3 bg-indigo-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generando...
          </div>
        );
      case 'succeeded':
        return (
          <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Generado
          </div>
        );
      case 'failed':
        return (
          <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className={`
          relative flex-1 bg-zinc-800 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing
          ${garment ? 'min-h-[400px]' : 'min-h-[300px]'}
        `}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {(isLoadingCanvas || isGenerating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {generatedImageUrl && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-xs text-emerald-400 font-medium">Vista previa IA</p>
            <p className="text-xs text-white/70">{garment?.name} - Talla {selectedSize}</p>
          </div>
        )}

        {getStatusBadge()}

        {garment && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-xs text-white font-medium">{garment.name}</p>
            {selectedSize && <p className="text-xs text-indigo-400">Talla: {selectedSize}</p>}
          </div>
        )}
      </div>

      {queueError && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{queueError}</p>
        </div>
      )}

      {generationError && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">Error: {generationError}</p>
          <button
            onClick={handleGenerateTryOn}
            className="text-xs text-red-300 hover:text-red-200 mt-1 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {garment && (
        <div className="mt-4 flex flex-col gap-3">
          {!generatedImageUrl && !isGenerating && (
            <button
              onClick={handleGenerateTryOn}
              disabled={!canTryOn || !userImageUrl}
              className={`
                w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all
                ${canTryOn && userImageUrl
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generar con IA
              {!canTryOn && <span className="text-xs opacity-75">(Cola llena)</span>}
            </button>
          )}

          {generatedImageUrl && (
            <button
              onClick={handleGenerateTryOn}
              className="w-full py-2.5 rounded-xl font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerar
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Posicion Y</label>
              <input
                type="range"
                min="5"
                max="95"
                value={garmentPosition.y}
                onChange={(e) => setGarmentPosition({ ...garmentPosition, y: Number(e.target.value) })}
                className="w-full accent-indigo-500"
                disabled={!!generatedImageUrl}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1 block">Escala</label>
              <input
                type="range"
                min="50"
                max="200"
                value={garmentScale * 100}
                onChange={(e) => setGarmentScale(Number(e.target.value) / 100)}
                className="w-full accent-indigo-500"
                disabled={!!generatedImageUrl}
              />
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-500 mt-2 text-center">
        {garment
          ? generatedImageUrl
            ? 'Imagen generada con IA. Usa los controles para ajustar.'
            : 'Genera una vista previa realista con IA o usa los controles para posicionar.'
          : 'Selecciona una prenda para probarla'}
      </p>
    </div>
  );
}
