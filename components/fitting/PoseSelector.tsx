'use client';

import { useState, useEffect } from 'react';
import type { PosePreset, PosePresetConfig } from '@/lib/posePresets';
import { POSE_PRESET_LIST, buildOpenPoseImage } from '@/lib/posePresets';
import { usePoseGenerator } from '@/lib/usePoseGenerator';

interface PoseSelectorProps {
  baseImageUrl: string;
  garmentId: string;
  garmentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PoseSelector({
  baseImageUrl,
  garmentId,
  garmentName,
  isOpen,
  onClose,
}: PoseSelectorProps) {
  const {
    poseResults,
    isGenerating,
    generatePoses,
    clearResults,
  } = usePoseGenerator();

  const [poseImages, setPoseImages] = useState<Record<PosePreset, string>>({
    standing_natural: '',
    walking: '',
    sitting: '',
    arms_raised: '',
  });

  const [selectedPose, setSelectedPose] = useState<PosePreset | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const images: Record<PosePreset, string> = {
      standing_natural: '',
      walking: '',
      sitting: '',
      arms_raised: '',
    };

    POSE_PRESET_LIST.forEach((preset) => {
      try {
        images[preset.id] = buildOpenPoseImage(preset.keypoints);
      } catch {
        images[preset.id] = '';
      }
    });

    setPoseImages(images);
  }, [isOpen]);

  const handleGenerateAll = () => {
    generatePoses(baseImageUrl, garmentName, garmentId);
  };

  const handleGenerateSingle = (pose: PosePreset) => {
    setSelectedPose(pose);
    generatePoses(baseImageUrl, garmentName, garmentId);
  };

  const getStatusBadge = (pose: PosePreset) => {
    const result = poseResults[pose];
    if (!result) return null;

    switch (result.status) {
      case 'pending':
        return (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <span className="text-white text-xs">Esperando...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        );
      case 'succeeded':
        return (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Listo
          </div>
        );
      case 'failed':
        return (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
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

  const completedCount = Object.values(poseResults).filter(
    (r) => r?.status === 'succeeded'
  ).length;
  const totalCount = POSE_PRESET_LIST.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Ver en diferentes poses</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Pose Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {POSE_PRESET_LIST.map((preset) => {
              const result = poseResults[preset.id];
              const hasResult = result?.status === 'succeeded' && result.resultUrl;

              return (
                <button
                  key={preset.id}
                  onClick={() => hasResult && setSelectedPose(preset.id)}
                  disabled={!hasResult}
                  className={`
                    relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden border-2 transition-all
                    ${selectedPose === preset.id ? 'border-indigo-500' : 'border-transparent'}
                    ${hasResult ? 'hover:border-indigo-400 cursor-pointer' : 'cursor-not-allowed opacity-70'}
                  `}
                >
                  {hasResult ? (
                    <img
                      src={result.resultUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : result?.status === 'processing' || result?.status === 'pending' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {poseImages[preset.id] && (
                        <img
                          src={poseImages[preset.id]}
                          alt={preset.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-medium">{preset.name}</p>
                      </div>
                    </>
                  )}

                  {getStatusBadge(preset.id)}
                </button>
              );
            })}
          </div>

          {/* Progress info */}
          {isGenerating && (
            <div className="text-center mb-4">
              <p className="text-zinc-400 text-sm">
                Generando poses... {completedCount}/{totalCount}
              </p>
              <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Selected pose preview */}
          {selectedPose && poseResults[selectedPose]?.status === 'succeeded' && (
            <div className="mb-4">
              <div className="relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden max-w-sm mx-auto">
                <img
                  src={poseResults[selectedPose]!.resultUrl}
                  alt="Pose preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = poseResults[selectedPose]!.resultUrl!;
                    link.download = `pose-${selectedPose}-${Date.now()}.png`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar
                </button>
                <button
                  onClick={() => setSelectedPose(null)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={clearResults}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar las 4 poses
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
