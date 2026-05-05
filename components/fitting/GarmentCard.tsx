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

  const badgeStyle = useMemo(() => {
    if (!sizeRecommendation) {
      return {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.7)',
      };
    }
    if (sizeRecommendation.match === 'perfect') {
      return {
        background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.35)',
        color: '#6ee7b7',
      };
    }
    if (sizeRecommendation.match === 'approximate') {
      return {
        background: 'rgba(245,158,11,0.15)',
        border: '1px solid rgba(245,158,11,0.35)',
        color: '#fcd34d',
      };
    }
    return {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: 'rgba(255,255,255,0.7)',
    };
  }, [sizeRecommendation]);

  return (
    <button
      onClick={() => onSelect(garment)}
      className="group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: isSelected ? '1px solid rgba(125,211,252,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isSelected ? '0 0 0 1px rgba(125,211,252,0.3)' : 'none',
      }}
    >
      {/* Image */}
      <div className="aspect-[3/4] relative overflow-hidden bg-white/5">
        <img
          src={garment.imageUrl || '/placeholder.svg'}
          alt={garment.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Bottom gradient for legibility */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Size badge (top-left) */}
        {sizeRecommendation?.size && (
          <div className="absolute top-2.5 left-2.5">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-medium rounded-full backdrop-blur-md"
              style={badgeStyle}
            >
              {sizeRecommendation.match === 'perfect' && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#10b981' }}
                />
              )}
              Talla {sizeRecommendation.size.size}
            </span>
          </div>
        )}

        {/* Selected check (top-right) */}
        {isSelected && (
          <div
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(125,211,252,0.95)',
              boxShadow: '0 0 12px rgba(125,211,252,0.4)',
            }}
          >
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 60%)',
          }}
        />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1 truncate">
          {garment.brand}
        </p>
        <h3 className="text-[14px] font-medium text-white leading-snug truncate">{garment.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/50 truncate">{garment.color}</span>
          {garment.price != null && (
            <span className="text-[11px] font-mono text-white/70">
              ${garment.price}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
