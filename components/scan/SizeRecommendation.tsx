'use client';

import { useState, useEffect } from 'react';
import type { BodyMeasurements } from '@/lib/types';

interface SizeRecommendationProps {
  measurements: BodyMeasurements;
  onEdit?: () => void;
}

type GarmentType = 'top' | 'bottom' | 'dress' | 'shoes';

interface SizeChart {
  name: string;
  icon: string;
  measurements: {
    size: string;
    chest?: { min: number; max: number };
    waist?: { min: number; max: number };
    hips?: { min: number; max: number };
    inseam?: { min: number; max: number };
  }[];
}

const SIZE_CHARTS: SizeChart[] = [
  {
    name: 'Camiseta / Top',
    icon: 'M6 4h12v4l-3 2v10h-6V10l-3-2V4z',
    measurements: [
      { size: 'XS', chest: { min: 78, max: 82 } },
      { size: 'S', chest: { min: 82, max: 88 } },
      { size: 'M', chest: { min: 88, max: 96 } },
      { size: 'L', chest: { min: 96, max: 104 } },
      { size: 'XL', chest: { min: 104, max: 112 } },
      { size: 'XXL', chest: { min: 112, max: 120 } },
    ],
  },
  {
    name: 'Pantalón',
    icon: 'M6 4h12v4l-1 14h-4l-1-10-1 10h-4l-1-14V4z',
    measurements: [
      { size: 'XS', waist: { min: 58, max: 62 } },
      { size: 'S', waist: { min: 62, max: 68 } },
      { size: 'M', waist: { min: 68, max: 76 } },
      { size: 'L', waist: { min: 76, max: 84 } },
      { size: 'XL', waist: { min: 84, max: 92 } },
      { size: 'XXL', waist: { min: 92, max: 100 } },
    ],
  },
  {
    name: 'Vestido',
    icon: 'M12 2c-2 0-3 1-3 3l-3 6 2 1v12h8V12l2-1-3-6c0-2-1-3-3-3z',
    measurements: [
      { size: 'XS', chest: { min: 78, max: 82 }, waist: { min: 58, max: 62 }, hips: { min: 84, max: 88 } },
      { size: 'S', chest: { min: 82, max: 88 }, waist: { min: 62, max: 68 }, hips: { min: 88, max: 94 } },
      { size: 'M', chest: { min: 88, max: 96 }, waist: { min: 68, max: 76 }, hips: { min: 94, max: 102 } },
      { size: 'L', chest: { min: 96, max: 104 }, waist: { min: 76, max: 84 }, hips: { min: 102, max: 110 } },
      { size: 'XL', chest: { min: 104, max: 112 }, waist: { min: 84, max: 92 }, hips: { min: 110, max: 118 } },
    ],
  },
  {
    name: 'Zapatos',
    icon: 'M4 16c0-2 1-3 3-3h10c2 0 3 1 3 3v2H4v-2z',
    measurements: [
      { size: '37', inseam: { min: 23, max: 23.5 } },
      { size: '38', inseam: { min: 23.5, max: 24 } },
      { size: '39', inseam: { min: 24, max: 24.5 } },
      { size: '40', inseam: { min: 24.5, max: 25 } },
      { size: '41', inseam: { min: 25, max: 25.5 } },
      { size: '42', inseam: { min: 25.5, max: 26 } },
    ],
  },
];

function findSize(charts: SizeChart, measurements: BodyMeasurements): string | null {
  for (const entry of charts.measurements) {
    const { chest, waist, hips } = entry;

    let matches = 0;
    let total = 0;

    if (chest && measurements.chest > 0) {
      total++;
      if (measurements.chest >= chest.min && measurements.chest < chest.max) matches++;
    }
    if (waist && measurements.waist > 0) {
      total++;
      if (measurements.waist >= waist.min && measurements.waist < waist.max) matches++;
    }
    if (hips && measurements.hips > 0) {
      total++;
      if (measurements.hips >= hips.min && measurements.hips < hips.max) matches++;
    }

    if (total > 0 && matches === total) {
      return entry.size;
    }
  }

  // Fallback: use chest for tops, waist for bottoms
  if (charts.name.includes('Camiseta') && measurements.chest > 0) {
    for (const entry of charts.measurements) {
      if (entry.chest && measurements.chest >= entry.chest.min && measurements.chest < entry.chest.max) {
        return entry.size;
      }
    }
  }
  if (charts.name.includes('Pantalón') && measurements.waist > 0) {
    for (const entry of charts.measurements) {
      if (entry.waist && measurements.waist >= entry.waist.min && measurements.waist < entry.waist.max) {
        return entry.size;
      }
    }
  }

  return null;
}

function GarmentCard({
  chart,
  measurements,
  delay
}: {
  chart: SizeChart;
  measurements: BodyMeasurements;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), delay);
    const size = findSize(chart, measurements);
    setTimeout(() => setRecommendedSize(size), delay + 300);
  }, [chart, measurements, delay]);

  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur rounded-xl p-4 border border-zinc-800 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={chart.icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h4 className="text-white font-medium">{chart.name}</h4>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm">Talla recomendada</span>
        {recommendedSize ? (
          <span className="text-2xl font-bold text-indigo-400">{recommendedSize}</span>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
      </div>

      {/* Size range indicator */}
      <div className="flex gap-1 mt-3">
        {chart.measurements.map((entry) => {
          const isRecommended = entry.size === recommendedSize;
          return (
            <div
              key={entry.size}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                isRecommended
                  ? 'bg-indigo-500 scale-y-150'
                  : recommendedSize && !isRecommended
                  ? 'bg-zinc-700'
                  : 'bg-zinc-600'
              }`}
              style={{ transitionDelay: `${delay + 400 + chart.measurements.indexOf(entry) * 50}ms` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SizeRecommendation({ measurements, onEdit }: SizeRecommendationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Tallas Sugeridas</h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Tallas Sugeridas</h3>
        <button
          onClick={onEdit}
          className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar medidas
        </button>
      </div>

      <p className="text-zinc-400 text-sm">
        Basado en tus medidas, estas son las tallas que te recomendamos según las guías estándar de tallaje.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {SIZE_CHARTS.map((chart, index) => (
          <GarmentCard
            key={chart.name}
            chart={chart}
            measurements={measurements}
            delay={600 + index * 150}
          />
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-amber-400 text-xs">
          <span className="font-medium">Nota:</span> Las tallas pueden variar entre marcas. Te recomendamos verificar la guía de tallas específica antes de comprar.
        </p>
      </div>
    </div>
  );
}
