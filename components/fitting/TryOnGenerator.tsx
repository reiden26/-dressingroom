'use client';

import { useEffect, useRef } from 'react';
import type { MockGarment } from '@/lib/mockCatalog';
import type { TryOnStatus, GeneratedLook } from '@/lib/useTryOn';

interface TryOnGeneratorProps {
  garment: MockGarment;
  personImageUrl: string | null;
  status: TryOnStatus;
  progress: number;
  result: GeneratedLook | null;
  error: string | null;
  onStartTryOn: () => void;
  onCancel: () => void;
  onSaveLook: () => void;
  onTryAnother: () => void;
  onShare: () => void;
  onShowPoses?: () => void;
  onEdit?: () => void;
}

export default function TryOnGenerator({
  garment,
  personImageUrl,
  status,
  progress,
  result,
  error,
  onStartTryOn,
  onCancel,
  onSaveLook,
  onTryAnother,
  onShare,
  onShowPoses,
  onEdit,
}: TryOnGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mergeProgressRef = useRef(0);

  useEffect(() => {
    if (status !== 'generating') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, width, height);

      const personImg = new Image();
      const garmentImg = new Image();

      let imagesLoaded = 0;
      const totalImages = 2;

      const onImageLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          drawMerging(ctx, width, height, personImg, garmentImg);
        }
      };

      personImg.onload = onImageLoad;
      garmentImg.onload = onImageLoad;
      personImg.src = personImageUrl || '';
      garmentImg.src = garment.imageUrl;

      function drawMerging(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        person: HTMLImageElement,
        garmentImg: HTMLImageElement
      ) {
        mergeProgressRef.current += 0.01;

        const progressVal = Math.min(mergeProgressRef.current, 1);
        const easeProgress = 1 - Math.pow(1 - progressVal, 3);

        const personWidth = width * 0.45;
        const personDrawHeight = personWidth * (person.height / person.width);
        const personX = width * 0.1;
        const personY = (height - personDrawHeight) / 2;

        ctx.save();
        ctx.globalAlpha = 1 - easeProgress * 0.5;
        ctx.drawImage(
          person,
          personX,
          personY,
          personWidth,
          personDrawHeight
        );
        ctx.restore();

        const garmentWidth = width * 0.35;
        const garmentHeight = garmentWidth * (garmentImg.height / garmentImg.width);
        const garmentX = width * 0.55 - garmentWidth / 2;
        const garmentY = (height - garmentHeight) / 2;

        ctx.save();
        ctx.globalAlpha = 0.3 + easeProgress * 0.7;
        ctx.drawImage(garmentImg, garmentX, garmentY, garmentWidth, garmentHeight);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const arrowY = height / 2;
        const arrowStartX = personX + personWidth + 20;
        const arrowEndX = garmentX - 20;

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();

        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - arrowSize, arrowY - arrowSize);
        ctx.lineTo(arrowEndX - arrowSize, arrowY + arrowSize);
        ctx.closePath();
        ctx.fillStyle = '#6366F1';
        ctx.fill();

        ctx.restore();
      }

      function render() {
        if (status !== 'generating') return;
        if (!ctx) return;

        ctx.fillStyle = '#18181B';
        ctx.fillRect(0, 0, width, height);

        imagesLoaded = 0;
        personImg.src = personImageUrl || '';
        garmentImg.src = garment.imageUrl;

        animationRef.current = requestAnimationFrame(render);
      }

      animationRef.current = requestAnimationFrame(render);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    };

    animate();
  }, [status, personImageUrl, garment.imageUrl]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (status === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm w-full text-center">
          <div className="w-16 h-20 mx-auto mb-4 bg-white rounded-lg overflow-hidden">
            <img src={garment.imageUrl} alt={garment.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-white font-semibold mb-2">{garment.name}</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Genera una imagen realista de cómo te quedaría esta prenda
          </p>

          {personImageUrl ? (
            <button
              onClick={onStartTryOn}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Probarme esta prenda
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-amber-400 text-sm">Necesitas una foto frontal para probarte ropa</p>
              <button
                onClick={onCancel}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
              >
                Ir a escanearme
              </button>
            </div>
          )}

          <button onClick={onCancel} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (status === 'uploading' || status === 'generating') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <h3 className="text-white font-semibold mb-1">Generando tu prueba</h3>
            <p className="text-zinc-400 text-sm">La IA está calculando cómo te quedaría esta prenda...</p>
          </div>

          <div className="relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden mb-6">
            <canvas
              ref={canvasRef}
              width={400}
              height={533}
              className="w-full h-full"
            />

            {status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm">Preparando imágenes...</p>
                </div>
              </div>
            )}

            {status === 'generating' && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">
                    {progress < 90 ? 'Procesando...' : 'Finalizando...'}
                  </span>
                  <span className="text-indigo-400 text-sm font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            <p className="text-zinc-500 text-xs">Tiempo estimado: ~30-60 segundos</p>
          </div>

          <button
            onClick={onCancel}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-white font-semibold mb-2">Error en la generación</h3>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={onStartTryOn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={onTryAnother}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Probar otra prenda
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'done' && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg">
          <div className="relative">
            <img
              src={result.resultUrl}
              alt="Resultado"
              className="w-full aspect-[3/4] object-cover rounded-t-2xl"
            />

            {result.isLowQuality && (
              <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Resultado impreciso
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium">{result.garmentName}</p>
              <p className="text-zinc-400 text-sm">
                {new Date(result.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="p-4 flex gap-3">
            <button
              onClick={onSaveLook}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar look
            </button>
            <button
              onClick={onTryAnother}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Probar otra
            </button>
            {onShowPoses && (
              <button
                onClick={onShowPoses}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Ver poses
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                title="Editar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            )}
            <button
              onClick={onShare}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              title="Compartir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={onCancel}
              className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
