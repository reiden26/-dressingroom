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
  armLength: 'Brazo',
  torsoLength: 'Torso',
};

const MEASUREMENT_ICONS: Record<MeasurementKey, string> = {
  shoulders: 'M12 4C14 4 16 5 16 7V9C16 11 14 13 12 13C10 13 8 11 8 9V7C8 5 10 4 12 4',
  chest: 'M8 10C6 10 4 12 4 14V16C4 18 6 19 8 19H16C18 19 20 18 20 16V14C20 12 18 10 16 10',
  waist: 'M9 13C7 13 5 15 5 17V19C5 20 6 21 7 21H17C18 21 19 20 19 19V17C19 15 17 13 15 13',
  hips: 'M7 18C5 18 4 19.5 4 21V23H20V21C20 19.5 19 18 17 18',
  inseam: 'M12 13V23M12 23L9 28M12 23L15 28',
  armLength: 'M4 8L12 12L20 8M12 12V18',
  torsoLength: 'M12 5V15M8 5H16',
};

function MeasurementRow({
  label,
  value,
  icon,
  delay,
  unit = 'cm'
}: {
  label: string;
  value: number;
  icon: string;
  delay: number;
  unit?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-center gap-4 py-3 border-b border-zinc-800 last:border-0 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-zinc-400 text-sm">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white font-mono text-lg">{value.toFixed(1)}</span>
        <span className="text-zinc-500 text-sm">{unit}</span>
      </div>
    </div>
  );
}

export default function MeasurementsReveal({ measurements, onEdit }: MeasurementsRevealProps) {
  const [silhouetteVisible, setSilhouetteVisible] = useState(false);
  const [confidenceBar, setConfidenceBar] = useState(0);

  useEffect(() => {
    setTimeout(() => setSilhouetteVisible(true), 300);
    setTimeout(() => setConfidenceBar(measurements.confidence * 100), 800);
  }, [measurements.confidence]);

  const measurementEntries = Object.entries(MEASUREMENT_LABELS) as [MeasurementKey, string][];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Tus Medidas</h3>
        <button
          onClick={onEdit}
          className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar
        </button>
      </div>

      <div className="flex gap-6">
        {/* SVG Silhouette */}
        <div
          className={`w-32 flex-shrink-0 transition-all duration-700 ${
            silhouetteVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <svg viewBox="0 0 100 180" className="w-full">
            {/* Body silhouette */}
            <path
              d="M50 5
                 C55 5 58 8 58 13
                 L58 20
                 C65 22 75 25 78 35
                 L82 45
                 C83 48 82 52 80 55
                 L75 60
                 C78 65 80 72 78 80
                 L72 95
                 C70 100 68 102 65 105
                 L60 108
                 L60 140
                 L70 175
                 L65 178
                 L55 145
                 L55 178
                 L50 178
                 L50 145
                 L45 178
                 L40 178
                 L45 145
                 L40 108
                 L35 105
                 C32 102 30 100 28 95
                 L22 80
                 C20 72 22 65 25 60
                 L20 55
                 C18 52 17 48 18 45
                 L22 35
                 C25 25 35 22 42 20
                 L42 13
                 C42 8 45 5 50 5Z"
              fill="url(#silhouetteGradient)"
              stroke="url(#silhouetteStroke)"
              strokeWidth="0.5"
              className="transition-all duration-500"
            />

            {/* Measurement lines */}
            <g className="transition-all duration-500" style={{ transitionDelay: '400ms' }}>
              {/* Shoulders */}
              <line x1="22" y1="32" x2="78" y2="32" stroke="#6366F1" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
              <text x="50" y="28" textAnchor="middle" fill="#6366F1" fontSize="6" className="opacity-0 animate-fade-in">Hombros</text>

              {/* Chest */}
              <line x1="24" y1="48" x2="76" y2="48" stroke="#6366F1" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />

              {/* Waist */}
              <line x1="28" y1="65" x2="72" y2="65" stroke="#6366F1" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />

              {/* Hips */}
              <line x1="28" y1="85" x2="72" y2="85" stroke="#6366F1" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
            </g>

            <defs>
              <linearGradient id="silhouetteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="silhouetteStroke" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Measurements List */}
        <div className="flex-1 space-y-1">
          {measurementEntries.map(([key, label], index) => {
            const value = measurements[key];
            if (typeof value !== 'number' || value === 0) return null;
            return (
              <MeasurementRow
                key={key}
                label={label}
                value={value}
                icon={MEASUREMENT_ICONS[key]}
                delay={500 + index * 100}
              />
            );
          })}
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Confianza del escaneo</span>
          <span className="text-sm font-mono text-indigo-400">{measurements.confidence.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${confidenceBar}%` }}
          />
        </div>
      </div>
    </div>
  );
}
