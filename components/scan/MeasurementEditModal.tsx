'use client';

import { useState, useEffect } from 'react';
import type { BodyMeasurements } from '@/lib/types';

interface MeasurementEditModalProps {
  isOpen: boolean;
  measurements: BodyMeasurements;
  onSave: (measurements: BodyMeasurements) => void;
  onClose: () => void;
}

type MeasurementKey = 'shoulders' | 'chest' | 'waist' | 'hips' | 'inseam' | 'armLength' | 'torsoLength';

const MEASUREMENT_CONFIG: { key: MeasurementKey; label: string; min: number; max: number; step: number }[] = [
  { key: 'shoulders', label: 'Hombros', min: 30, max: 60, step: 0.5 },
  { key: 'chest', label: 'Pecho', min: 60, max: 140, step: 0.5 },
  { key: 'waist', label: 'Cintura', min: 50, max: 130, step: 0.5 },
  { key: 'hips', label: 'Cadera', min: 60, max: 150, step: 0.5 },
  { key: 'inseam', label: 'Entrepierna', min: 50, max: 100, step: 0.5 },
  { key: 'armLength', label: 'Largo brazo', min: 40, max: 80, step: 0.5 },
  { key: 'torsoLength', label: 'Largo torso', min: 30, max: 70, step: 0.5 },
];

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange(clamped);
    setLocalValue(clamped.toString());
  };

  const increment = () => handleChange(value + step);
  const decrement = () => handleChange(value - step);

  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-sm w-24">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <button
          onClick={decrement}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={(e) => {
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) handleChange(parsed);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const parsed = parseFloat(localValue);
              if (!isNaN(parsed)) handleChange(parsed);
            }
          }}
          className="flex-1 h-10 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={increment}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <span className="text-zinc-500 text-sm w-8">cm</span>
      </div>
    </div>
  );
}

export default function MeasurementEditModal({
  isOpen,
  measurements,
  onSave,
  onClose
}: MeasurementEditModalProps) {
  const [editedMeasurements, setEditedMeasurements] = useState<BodyMeasurements>(measurements);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedMeasurements(measurements);
      setHasChanges(false);
    }
  }, [isOpen, measurements]);

  const handleMeasurementChange = (key: MeasurementKey, value: number) => {
    setEditedMeasurements((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedMeasurements);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Editar Medidas</h2>
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
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-zinc-400 text-sm">
            Ajusta las medidas manualmente si conoces tus medidas exactas o deseas hacer correcciones.
          </p>

          {MEASUREMENT_CONFIG.map(({ key, label, min, max, step }) => (
            <NumberInput
              key={key}
              label={label}
              value={editedMeasurements[key] || 0}
              onChange={(value) => handleMeasurementChange(key, value)}
              min={min}
              max={max}
              step={step}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex-1 h-12 rounded-xl font-medium transition-colors ${
              hasChanges
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
