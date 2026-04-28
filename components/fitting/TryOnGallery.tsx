'use client';

import { useState, useEffect } from 'react';
import { getTryOnQueue } from '@/lib/tryOnQueue';
import type { QueuedTryOn } from '@/lib/vtonTypes';
import { MOCK_CATALOG } from '@/lib/mockCatalog';

interface TryOnGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TryOnGallery({ isOpen, onClose }: TryOnGalleryProps) {
  const [items, setItems] = useState<QueuedTryOn[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueuedTryOn | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const queue = getTryOnQueue();
    setItems(queue.getItems());

    const unsubscribe = queue.subscribe((newItems) => {
      setItems([...newItems]);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const completedItems = items.filter((item) => item.status === 'succeeded' && item.outputUrl);

  const getGarmentInfo = (garmentId: string) => {
    return MOCK_CATALOG.find((g) => g.id === garmentId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleDownload = (url: string, garmentId: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `tryon-${garmentId}-${Date.now()}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Mis Looks</h2>
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
          {completedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Sin looks generados</h3>
              <p className="text-zinc-400 text-sm">Los looks que generes apareceran aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {completedItems.map((item) => {
                const garment = getGarmentInfo(item.garmentId);
                return (
                  <button
                    key={item.predictionId}
                    onClick={() => setSelectedItem(item)}
                    className="group relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <img
                      src={item.outputUrl}
                      alt={garment?.name || 'Look generado'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">{garment?.name}</p>
                      <p className="text-zinc-300 text-xs">{formatDate(item.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Processing items */}
          {items.filter((item) => item.status === 'pending' || item.status === 'processing').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">En proceso</h3>
              <div className="space-y-2">
                {items
                  .filter((item) => item.status === 'pending' || item.status === 'processing')
                  .map((item) => {
                    const garment = getGarmentInfo(item.garmentId);
                    return (
                      <div
                        key={item.predictionId}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl"
                      >
                        <div className="w-12 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.garmentImageUrl && (
                            <img
                              src={item.garmentImageUrl}
                              alt={garment?.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{garment?.name}</p>
                          <p className="text-zinc-400 text-xs">
                            {item.status === 'pending' ? 'Esperando...' : 'Generando...'}
                          </p>
                        </div>
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedItem.outputUrl}
              alt={getGarmentInfo(selectedItem.garmentId)?.name}
              className="w-full rounded-2xl"
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{getGarmentInfo(selectedItem.garmentId)?.name}</p>
                <p className="text-zinc-400 text-sm">{formatDate(selectedItem.createdAt)}</p>
              </div>
              <button
                onClick={() => handleDownload(selectedItem.outputUrl!, selectedItem.garmentId)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
