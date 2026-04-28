'use client';

import { useMemo } from 'react';
import type { MockGarment } from '@/lib/mockCatalog';
import { findMatchingSize } from '@/lib/mockCatalog';
import { useAppStore } from '@/store/useAppStore';

interface GarmentCardProps {
  garment: MockGarment;
  onSelect: (garment: MockGarment) => void;
  isSelected?: boolean;
}

export default function GarmentCard({ garment, onSelect, isSelected = false }: GarmentCardProps) {
  const { userProfile } = useAppStore();

  const sizeRecommendation = useMemo(() => {
    if (!userProfile?.measurements) return null;
    return findMatchingSize(garment, {
      chest: userProfile.measurements.chest,
      waist: userProfile.measurements.waist,
      hips: userProfile.measurements.hips,
      shoulders: userProfile.measurements.shoulders,
    });
  }, [garment, userProfile]);

  const badgeColor = useMemo(() => {
    if (!sizeRecommendation) return 'bg-zinc-700 text-zinc-300';
    if (sizeRecommendation.match === 'perfect') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (sizeRecommendation.match === 'approximate') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-zinc-700 text-zinc-300';
  }, [sizeRecommendation]);

  return (
    <button
      onClick={() => onSelect(garment)}
      className={`
        group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-200
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-900'}
      `}
    >
      <div className="aspect-[3/4] bg-white relative overflow-hidden">
        <img
          src={garment.imageUrl}
          alt={garment.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-xs text-zinc-400 font-medium">{garment.brand}</p>
        <h3 className="text-sm font-semibold text-white truncate">{garment.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-zinc-500">{garment.color}</span>
          {sizeRecommendation && sizeRecommendation.size && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              Tu talla: {sizeRecommendation.size.size}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
