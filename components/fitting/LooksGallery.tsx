'use client';

import { useState, useMemo } from 'react';
import GeneratedLookCard from './GeneratedLookCard';
import type { GeneratedLook } from '@/lib/useTryOn';
import { MOCK_CATALOG } from '@/lib/mockCatalog';

interface LooksGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  looks: GeneratedLook[];
  onRateLook: (lookId: string, rating: number) => void;
  onDeleteLook: (lookId: string) => void;
}

type SortOption = 'recent' | 'oldest' | 'rating';
type FilterOption = 'all' | 'tops' | 'bottoms' | 'dresses' | 'outerwear';

export default function LooksGallery({
  isOpen,
  onClose,
  looks,
  onRateLook,
  onDeleteLook,
}: LooksGalleryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getGarmentCategory = (garmentId: string): string => {
    const garment = MOCK_CATALOG.find((g) => g.id === garmentId);
    return garment?.category || 'unknown';
  };

  const filteredAndSortedLooks = useMemo(() => {
    let result = [...looks];

    if (searchQuery) {
      result = result.filter((look) =>
        look.garmentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterBy !== 'all') {
      result = result.filter((look) => {
        const category = getGarmentCategory(look.garmentId);
        return category === filterBy;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [looks, sortBy, filterBy, searchQuery]);

  const handleDownload = (look: GeneratedLook) => {
    const link = document.createElement('a');
    link.href = look.resultUrl;
    link.download = `look-${look.garmentName.replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  const getAverageRating = () => {
    if (looks.length === 0) return 0;
    const total = looks.reduce((sum, look) => sum + (look.rating || 0), 0);
    return (total / looks.length).toFixed(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Mis Looks</h2>
            <p className="text-zinc-400 text-sm">
              {looks.length} looks • Valoración promedio: {getAverageRating() || '—'}
            </p>
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

        {/* Filters and search */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre de prenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter and sort */}
          <div className="flex items-center gap-3">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las prendas</option>
              <option value="tops">Tops</option>
              <option value="bottoms">Pantalones</option>
              <option value="dresses">Vestidos</option>
              <option value="outerwear">Chaquetas</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAndSortedLooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">
                {looks.length === 0 ? 'Sin looks generados' : 'No hay resultados'}
              </h3>
              <p className="text-zinc-400 text-sm">
                {looks.length === 0
                  ? 'Los looks que generes aparecerán aquí'
                  : 'Intenta con otros filtros'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAndSortedLooks.map((look) => (
                <GeneratedLookCard
                  key={look.id}
                  look={look}
                  onRate={(rating) => onRateLook(look.id, rating)}
                  onDelete={() => onDeleteLook(look.id)}
                  onDownload={() => handleDownload(look)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {looks.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs text-center">
              {filteredAndSortedLooks.length} de {looks.length} looks mostrados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
