'use client';

import { useState, useEffect } from 'react';
import type { BodyMeasurements } from '@/lib/types';

interface SizeRecommendationProps {
  measurements: BodyMeasurements;
  onEdit?: () => void;
}

interface SizeRange {
  size: string;
  chest?: { min: number; max: number };
  waist?: { min: number; max: number };
  hips?: { min: number; max: number };
  inseam?: { min: number; max: number };
}

interface SizeChart {
  name: string;
  category: 'top' | 'bottom' | 'dress' | 'shoes';
  measurements: SizeRange[];
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const SIZE_CHARTS: SizeChart[] = [
  {
    name: 'Camiseta · Top',
    category: 'top',
    measurements: [
      { size: 'XS', chest: { min: 78, max: 84 } },
      { size: 'S',  chest: { min: 84, max: 90 } },
      { size: 'M',  chest: { min: 90, max: 98 } },
      { size: 'L',  chest: { min: 98, max: 106 } },
      { size: 'XL', chest: { min: 106, max: 114 } },
      { size: 'XXL', chest: { min: 114, max: 124 } },
    ],
  },
  {
    name: 'Pantalón',
    category: 'bottom',
    measurements: [
      { size: 'XS', waist: { min: 60, max: 66 } },
      { size: 'S',  waist: { min: 66, max: 72 } },
      { size: 'M',  waist: { min: 72, max: 80 } },
      { size: 'L',  waist: { min: 80, max: 88 } },
      { size: 'XL', waist: { min: 88, max: 96 } },
      { size: 'XXL', waist: { min: 96, max: 106 } },
    ],
  },
  {
    name: 'Vestido',
    category: 'dress',
    measurements: [
      { size: 'XS', chest: { min: 78, max: 84 }, waist: { min: 60, max: 66 }, hips: { min: 84, max: 90 } },
      { size: 'S',  chest: { min: 84, max: 90 }, waist: { min: 66, max: 72 }, hips: { min: 90, max: 96 } },
      { size: 'M',  chest: { min: 90, max: 98 }, waist: { min: 72, max: 80 }, hips: { min: 96, max: 104 } },
      { size: 'L',  chest: { min: 98, max: 106 }, waist: { min: 80, max: 88 }, hips: { min: 104, max: 112 } },
      { size: 'XL', chest: { min: 106, max: 114 }, waist: { min: 88, max: 96 }, hips: { min: 112, max: 120 } },
    ],
  },
  {
    name: 'Calzado',
    category: 'shoes',
    measurements: [
      { size: '37', inseam: { min: 70, max: 73 } },
      { size: '38', inseam: { min: 73, max: 76 } },
      { size: '39', inseam: { min: 76, max: 79 } },
      { size: '40', inseam: { min: 79, max: 82 } },
      { size: '41', inseam: { min: 82, max: 85 } },
      { size: '42', inseam: { min: 85, max: 88 } },
      { size: '43', inseam: { min: 88, max: 100 } },
    ],
  },
];

function findSizeFromMeasurements(chart: SizeChart, measurements: BodyMeasurements): string | null {
  for (const entry of chart.measurements) {
    const { chest, waist, hips, inseam } = entry;
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
    if (inseam && measurements.inseam > 0) {
      total++;
      if (measurements.inseam >= inseam.min && measurements.inseam < inseam.max) matches++;
    }

    if (total > 0 && matches === total) return entry.size;
  }

  // Fallbacks for top/bottom: use the most relevant measurement only
  if (chart.category === 'top' && measurements.chest > 0) {
    for (const entry of chart.measurements) {
      if (entry.chest && measurements.chest >= entry.chest.min && measurements.chest < entry.chest.max) {
        return entry.size;
      }
    }
  }
  if (chart.category === 'bottom' && measurements.waist > 0) {
    for (const entry of chart.measurements) {
      if (entry.waist && measurements.waist >= entry.waist.min && measurements.waist < entry.waist.max) {
        return entry.size;
      }
    }
  }
  if (chart.category === 'shoes' && measurements.inseam > 0) {
    for (const entry of chart.measurements) {
      if (entry.inseam && measurements.inseam >= entry.inseam.min && measurements.inseam < entry.inseam.max) {
        return entry.size;
      }
    }
  }

  return null;
}

/**
 * Map a BMI to an expected lettered size for an average-build adult.
 * Used as a sanity-check floor for top/dress recommendations so very lean
 * shoulders + a normal/overweight BMI never produces an XS recommendation
 * for an M-sized person.
 */
function bmiToExpectedSize(bmi: number | undefined): string | null {
  if (typeof bmi !== 'number') return null;
  if (bmi < 18) return 'XS';
  if (bmi < 21) return 'S';
  if (bmi < 25) return 'M';
  if (bmi < 28) return 'L';
  if (bmi < 32) return 'XL';
  return 'XXL';
}

function maxSize(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const ai = SIZE_ORDER.indexOf(a as (typeof SIZE_ORDER)[number]);
  const bi = SIZE_ORDER.indexOf(b as (typeof SIZE_ORDER)[number]);
  if (ai === -1) return b;
  if (bi === -1) return a;
  return SIZE_ORDER[Math.max(ai, bi)];
}

function GarmentRow({
  chart,
  recommendedSize,
  delay,
}: {
  chart: SizeChart;
  recommendedSize: string | null;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [animatedSize, setAnimatedSize] = useState<string | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setAnimatedSize(recommendedSize), delay + 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [delay, recommendedSize]);

  return (
    <div
      className={`grid grid-cols-12 gap-4 items-center py-6 border-b border-white/8 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="col-span-5 md:col-span-4">
        <p className="text-[11px] font-mono text-white/35 uppercase tracking-widest mb-1.5">
          {chart.category === 'top' ? 'Parte superior' :
           chart.category === 'bottom' ? 'Parte inferior' :
           chart.category === 'dress' ? 'Una pieza' : 'Calzado'}
        </p>
        <h4 className="text-[17px] text-white font-medium">{chart.name}</h4>
      </div>

      <div className="col-span-7 md:col-span-8 flex items-center gap-6 justify-end">
        {/* Range bar */}
        <div className="hidden md:flex flex-1 items-center gap-1 max-w-[260px]">
          {chart.measurements.map((entry) => {
            const isRecommended = entry.size === animatedSize;
            return (
              <div key={entry.size} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full transition-all duration-500 ${
                    isRecommended
                      ? 'h-1.5 bg-white'
                      : animatedSize
                      ? 'h-px bg-white/15'
                      : 'h-px bg-white/25'
                  }`}
                />
                <span className={`text-[9.5px] font-mono transition-colors duration-300 ${
                  isRecommended ? 'text-white' : 'text-white/25'
                }`}>
                  {entry.size}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recommended size */}
        <div className="text-right min-w-[60px]">
          {animatedSize ? (
            <span
              key={animatedSize}
              className="block text-5xl md:text-6xl font-display text-white leading-none"
              style={{ animation: 'sizeReveal 0.6s ease-out both' }}
            >
              {animatedSize}
            </span>
          ) : (
            <span className="text-5xl md:text-6xl font-display text-white/15 leading-none">—</span>
          )}
        </div>
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
      <section>
        <h3 className="text-3xl md:text-4xl font-display text-white mb-8">Tallas sugeridas</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/[0.03] rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const expected = bmiToExpectedSize(measurements.bmi);

  return (
    <section className="relative">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            Sección 02 — Tallas sugeridas
          </span>
          <h2 className="text-3xl md:text-4xl font-display text-white mt-3 leading-none">
            Tu talla, <span className="italic text-white/50">por prenda.</span>
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar medidas
        </button>
      </div>

      <div className="border-t border-white/15">
        {SIZE_CHARTS.map((chart, index) => {
          let raw = findSizeFromMeasurements(chart, measurements);

          // For tops/dresses, never go below the BMI-expected size by more than
          // 1 step — this prevents a lean shoulder reading from giving an XS to
          // someone whose weight indicates an M.
          if ((chart.category === 'top' || chart.category === 'dress') && expected) {
            const rawIdx = raw ? SIZE_ORDER.indexOf(raw as (typeof SIZE_ORDER)[number]) : -1;
            const expIdx = SIZE_ORDER.indexOf(expected as (typeof SIZE_ORDER)[number]);
            if (rawIdx === -1 || expIdx - rawIdx > 1) {
              raw = expected;
            }
          }

          return (
            <GarmentRow
              key={chart.name}
              chart={chart}
              recommendedSize={raw}
              delay={400 + index * 120}
            />
          );
        })}
      </div>

      {/* Note */}
      <div className="mt-8 flex items-start gap-3 p-4 border border-white/10 rounded-lg bg-white/[0.02]">
        <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[12px] text-white/50 leading-relaxed">
          Las tallas de cada marca varían ligeramente. Estos valores son una guía
          basada en tus medidas y tu peso — verifica la tabla específica antes de comprar.
        </p>
      </div>

      <button
        onClick={onEdit}
        className="sm:hidden mt-6 inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Editar medidas
      </button>

      <style jsx>{`
        @keyframes sizeReveal {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </section>
  );
}
