'use client';

import { useEffect, useState } from 'react';
import type { BodyMeasurements } from '@/lib/types';

interface MeasurementsRevealProps {
  measurements: BodyMeasurements;
  onEdit?: () => void;
}

type MeasurementKey = 'shoulders' | 'chest' | 'waist' | 'hips' | 'inseam' | 'armLength' | 'torsoLength';

const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  shoulders: 'Hombros',
  chest: 'Pecho',
  waist: 'Cintura',
  hips: 'Cadera',
  inseam: 'Entrepierna',
  armLength: 'Largo de brazo',
  torsoLength: 'Largo de torso',
};

const MEASUREMENT_ORDER: MeasurementKey[] = [
  'shoulders',
  'chest',
  'waist',
  'hips',
  'torsoLength',
  'armLength',
  'inseam',
];

function MeasurementRow({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-baseline justify-between py-4 border-b border-white/8 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-[13px] text-white/55 font-mono uppercase tracking-wider">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-3xl md:text-[34px] font-display text-white tabular-nums leading-none">
          {value.toFixed(0)}
        </span>
        <span className="text-[11px] font-mono text-white/35">cm</span>
      </span>
    </div>
  );
}

export default function MeasurementsReveal({ measurements, onEdit }: MeasurementsRevealProps) {
  const [silhouetteVisible, setSilhouetteVisible] = useState(false);
  const [confidenceBar, setConfidenceBar] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setSilhouetteVisible(true), 200);
    const t2 = setTimeout(() => setConfidenceBar(measurements.confidence * 100), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measurements.confidence]);

  const confidence = Math.round(measurements.confidence * 100);

  return (
    <section className="relative">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            Sección 01 — Medidas corporales
          </span>
          <h2 className="text-3xl md:text-4xl font-display text-white mt-3 leading-none">
            Tu cuerpo, <span className="italic text-white/50">mapeado.</span>
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors group"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Silhouette */}
        <div
          className={`lg:col-span-5 transition-all duration-1000 ease-out ${
            silhouetteVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="relative aspect-[3/5] max-w-[300px] mx-auto">
            <svg viewBox="0 0 200 320" className="w-full h-full" aria-hidden="true">
              <defs>
                <linearGradient id="silhouette-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="silhouette-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
                </linearGradient>
              </defs>

              {/* Subtle frame */}
              <rect x="1" y="1" width="198" height="318" fill="none" stroke="rgba(255,255,255,0.06)" />

              {/* Body silhouette - properly proportioned standing figure */}
              <path
                d="M100 18
                   c8 0 13 6 13 14
                   v10
                   c0 4 -1 6 -3 8
                   l8 6
                   c10 7 16 16 18 28
                   l4 22
                   c1 5 -1 9 -5 11
                   l-7 4
                   c4 8 6 16 5 24
                   l-3 26
                   c-1 7 -3 12 -6 16
                   l-3 4
                   v8
                   l-4 30
                   l3 60
                   l5 30
                   l-2 4
                   l-9 -2
                   l-6 -32
                   l-2 -32
                   l-3 32
                   l-4 32
                   l-9 2
                   l-2 -4
                   l5 -30
                   l3 -60
                   l-4 -30
                   v-8
                   l-3 -4
                   c-3 -4 -5 -9 -6 -16
                   l-3 -26
                   c-1 -8 1 -16 5 -24
                   l-7 -4
                   c-4 -2 -6 -6 -5 -11
                   l4 -22
                   c2 -12 8 -21 18 -28
                   l8 -6
                   c-2 -2 -3 -4 -3 -8
                   v-10
                   c0 -8 5 -14 13 -14 z"
                fill="url(#silhouette-fill)"
                stroke="url(#silhouette-stroke)"
                strokeWidth="0.8"
              />

              {/* Measurement guide lines */}
              <g stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.55">
                {/* Shoulders */}
                <line x1="58" y1="60" x2="142" y2="60" />
                {/* Chest */}
                <line x1="56" y1="92" x2="144" y2="92" />
                {/* Waist */}
                <line x1="68" y1="125" x2="132" y2="125" />
                {/* Hips */}
                <line x1="62" y1="158" x2="138" y2="158" />
                {/* Knee height */}
                <line x1="78" y1="225" x2="122" y2="225" />
              </g>

              {/* Tick markers and labels */}
              <g fill="rgba(255,255,255,0.5)" fontSize="6.5" fontFamily="monospace">
                <text x="148" y="62">hombros</text>
                <text x="148" y="94">pecho</text>
                <text x="138" y="127">cintura</text>
                <text x="142" y="160">cadera</text>
                <text x="126" y="227">entrepierna</text>
              </g>

              {/* Bracket marks at line ends */}
              <g stroke="rgba(56,189,248,0.7)" strokeWidth="1">
                {[
                  [58, 60], [142, 60],
                  [56, 92], [144, 92],
                  [68, 125], [132, 125],
                  [62, 158], [138, 158],
                ].map(([cx, cy], i) => (
                  <line key={i} x1={cx} y1={(cy as number) - 2} x2={cx} y2={(cy as number) + 2} />
                ))}
              </g>
            </svg>
          </div>

          {/* BMI block (only when available) */}
          {typeof measurements.bmi === 'number' && (
            <div className="mt-6 max-w-[300px] mx-auto">
              <div className="border-t border-white/10 pt-4 flex items-baseline justify-between">
                <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
                  Índice corporal
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-display text-white tabular-nums">
                    {measurements.bmi.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 uppercase">bmi</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Measurements list */}
        <div className="lg:col-span-7">
          <div>
            {MEASUREMENT_ORDER.map((key, index) => {
              const value = measurements[key];
              if (typeof value !== 'number' || value === 0) return null;
              return (
                <MeasurementRow
                  key={key}
                  label={MEASUREMENT_LABELS[key]}
                  value={value}
                  delay={300 + index * 80}
                />
              );
            })}
          </div>

          {/* Confidence */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
                Confianza del escaneo
              </span>
              <span className="text-[15px] font-mono text-white tabular-nums">
                {confidence}<span className="text-white/30">%</span>
              </span>
            </div>
            <div className="h-px bg-white/10 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white transition-all ease-out"
                style={{ width: `${confidenceBar}%`, height: '1px', transitionDuration: '1500ms' }}
              />
              <div
                className="absolute inset-y-[-1px] left-0 transition-all ease-out"
                style={{
                  width: `${confidenceBar}%`,
                  background: 'linear-gradient(to right, rgba(56,189,248,0), rgba(56,189,248,0.6))',
                  height: '3px',
                  top: '-1px',
                  transitionDuration: '1500ms',
                }}
              />
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed mt-3">
              {confidence >= 75
                ? 'Calibración excelente — las medidas son fiables.'
                : confidence >= 55
                ? 'Calibración adecuada — recomendamos repetir la pose lateral si quieres más precisión.'
                : 'Calibración baja — repite el escaneo en un espacio mejor iluminado para mayor precisión.'}
            </p>
          </div>

          {/* Mobile edit button */}
          <button
            onClick={onEdit}
            className="sm:hidden mt-6 inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar medidas
          </button>
        </div>
      </div>
    </section>
  );
}
