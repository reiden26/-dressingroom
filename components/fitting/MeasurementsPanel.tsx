'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';

export default function MeasurementsPanel() {
  const { userProfile, capturedPoses } = useAppStore();

  const measurements = userProfile?.measurements;

  const measurementLines = [
    { label: 'Hombros', value: measurements?.shoulders, y: 22 },
    { label: 'Pecho', value: measurements?.chest, y: 30 },
    { label: 'Cintura', value: measurements?.waist, y: 42 },
    { label: 'Cadera', value: measurements?.hips, y: 52 },
    { label: 'Entrepierna', value: measurements?.inseam, y: 72 },
    { label: 'Largo brazo', value: measurements?.armLength, y: 35 },
  ];

  if (!userProfile) {
    return (
      <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sin perfil</h3>
          <p className="text-sm text-zinc-400 mb-4">Completa tu escaneo para ver tus medidas</p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Escanear ahora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Medidas</h3>
        <Link
          href="/scan"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Re-escanear
        </Link>
      </div>

      <div className="flex gap-6">
        <div className="relative w-24 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 200" className="w-full h-full">
            <ellipse cx="50" cy="15" rx="12" ry="15" fill="#3F3F46" />
            <line x1="50" y1="30" x2="50" y2="120" stroke="#3F3F46" strokeWidth="3" />
            <line x1="50" y1="40" x2="20" y2="80" stroke="#3F3F46" strokeWidth="3" />
            <line x1="50" y1="40" x2="80" y2="80" stroke="#3F3F46" strokeWidth="3" />
            <line x1="50" y1="120" x2="30" y2="190" stroke="#3F3F46" strokeWidth="3" />
            <line x1="50" y1="120" x2="70" y2="190" stroke="#3F3F46" strokeWidth="3" />

            {measurementLines.map((line) => (
              <g key={line.label}>
                <line
                  x1="50"
                  y1={line.y * 2}
                  x2="90"
                  y2={line.y * 2}
                  stroke={line.value ? '#6366F1' : '#52525B'}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                {line.value && (
                  <circle cx="50" cy={line.y * 2} r="3" fill="#6366F1" />
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          {measurementLines.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{item.label}</span>
              <span className={`font-mono text-sm font-medium ${item.value ? 'text-white' : 'text-zinc-600'}`}>
                {item.value ? `${item.value} cm` : '--'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {measurements && (
        <div className="mt-4 pt-4 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${measurements.confidence > 0.7 ? 'bg-emerald-500' : measurements.confidence > 0.4 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="text-xs text-zinc-400">
              Confianza: {Math.round(measurements.confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      {capturedPoses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-700/50">
          <p className="text-xs text-zinc-500 mb-2">Fotos capturadas:</p>
          <div className="flex gap-2">
            {['front', 'side', 'back'].map((pose) => {
              const captured = capturedPoses.find((p) => p.poseId === pose);
              return (
                <div
                  key={pose}
                  className={`w-10 h-12 rounded-lg overflow-hidden ${
                    captured ? 'ring-2 ring-indigo-500' : 'opacity-30'
                  }`}
                >
                  {captured ? (
                    <img src={captured.imageDataUrl} alt={pose} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
