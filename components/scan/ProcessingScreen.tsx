'use client';

import { useEffect, useState } from 'react';

interface ProcessingScreenProps {
  onComplete?: () => void;
}

const PROCESSING_STEPS = [
  { text: 'Detectando puntos corporales', duration: 1000 },
  { text: 'Analizando proporciones', duration: 800 },
  { text: 'Calculando medidas', duration: 800 },
  { text: 'Generando tu perfil', duration: 600 },
];

export default function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const totalDuration = PROCESSING_STEPS.reduce((acc, step) => acc + step.duration, 0);
    let currentTime = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    PROCESSING_STEPS.forEach((step, index) => {
      const stepStart = currentTime;
      const stepEnd = currentTime + step.duration;

      timeouts.push(
        setTimeout(() => {
          setCurrentStep(index);
          setProgress((stepEnd / totalDuration) * 100);
        }, stepStart)
      );

      currentTime = stepEnd;
    });

    timeouts.push(
      setTimeout(() => {
        setShowCheck(true);
        setProgress(100);
      }, totalDuration)
    );

    timeouts.push(
      setTimeout(() => {
        onComplete?.();
      }, totalDuration + 600)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-12">
          Procesando escaneo
        </span>

        {/* Progress ring */}
        <div className="relative w-44 h-44 mb-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(56,189,248,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
              style={{ filter: 'blur(2px)' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {showCheck ? (
              <svg
                className="w-12 h-12 text-white animate-scale-in"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <>
                <span className="text-5xl font-display text-white tabular-nums leading-none">
                  {Math.round(progress)}
                </span>
                <span className="text-[11px] font-mono text-white/35 mt-2 uppercase tracking-widest">
                  {showCheck ? 'completo' : 'progreso'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Step list */}
        <div className="w-full space-y-3 mb-10">
          {PROCESSING_STEPS.map((step, index) => {
            const isDone = index < currentStep || showCheck;
            const isActive = index === currentStep && !showCheck;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 text-[13px] transition-all duration-300 ${
                  isDone ? 'text-white/55' : isActive ? 'text-white' : 'text-white/20'
                }`}
              >
                <span className={`w-4 h-4 flex items-center justify-center flex-shrink-0`}>
                  {isDone ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                  )}
                </span>
                <span className={isActive ? 'font-medium' : ''}>{step.text}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom line */}
        <div className="w-full flex justify-center gap-2">
          {PROCESSING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-px transition-all duration-500 ${
                index <= currentStep ? 'w-12 bg-white' : 'w-8 bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
