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
  { key: 'armLength', label: 'Largo de brazo', min: 40, max: 80, step: 0.5 },
  { key: 'torsoLength', label: 'Largo de torso', min: 30, max: 70, step: 0.5 },
];

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
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

  const increment = () => handleChange(Math.round((value + step) * 2) / 2);
  const decrement = () => handleChange(Math.round((value - step) * 2) / 2);

  return (
    <div className="grid grid-cols-12 gap-3 items-center py-4 border-b border-white/8 last:border-0">
      <span className="col-span-5 text-[12px] font-mono text-white/55 uppercase tracking-wider">
        {label}
      </span>
      <div className="col-span-7 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={decrement}
          aria-label={`Disminuir ${label}`}
          className="w-9 h-9 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 12H4" />
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
          className="w-20 h-9 bg-transparent border-b border-white/15 focus:border-white/60 text-white text-center text-lg font-display tabular-nums focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={increment}
          aria-label={`Aumentar ${label}`}
          className="w-9 h-9 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/5 text-white/70 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <span className="text-[10px] font-mono text-white/30 w-6">cm</span>
      </div>
    </div>
  );
}

export default function MeasurementEditModal({
  isOpen,
  measurements,
  onSave,
  onClose,
}: MeasurementEditModalProps) {
  const [editedMeasurements, setEditedMeasurements] = useState<BodyMeasurements>(measurements);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedMeasurements(measurements);
      setHasChanges(false);
    }
  }, [isOpen, measurements]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-default"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 15, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-end justify-between p-6 pb-5 border-b border-white/8">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Ajuste manual
            </span>
            <h2 className="text-2xl font-display text-white mt-2 leading-none">
              Editar medidas
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 overflow-y-auto flex-1">
          <p className="text-[12.5px] text-white/45 leading-relaxed py-4">
            Si conoces tus medidas exactas, ajústalas aquí. El cambio se reflejará
            inmediatamente en las tallas sugeridas.
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
        <div className="flex gap-3 p-6 pt-5 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-full border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-[13px] font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex-1 h-12 rounded-full text-[13px] font-medium transition-colors ${
              hasChanges
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
