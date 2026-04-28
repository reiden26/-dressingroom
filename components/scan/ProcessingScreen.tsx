'use client';

import { useEffect, useState } from 'react';

interface ProcessingScreenProps {
  onComplete?: () => void;
}

const PROCESSING_STEPS = [
  { text: 'Detectando puntos corporales...', duration: 1000 },
  { text: 'Analizando proporciones...', duration: 800 },
  { text: 'Calculando medidas...', duration: 800 },
  { text: 'Generando tu perfil...', duration: 600 },
];

export default function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    let totalDuration = PROCESSING_STEPS.reduce((acc, step) => acc + step.duration, 0);
    let currentTime = 0;

    PROCESSING_STEPS.forEach((step, index) => {
      const stepStart = currentTime;
      const stepEnd = currentTime + step.duration;

      setTimeout(() => {
        setCurrentStep(index);
        setProgress((stepEnd / totalDuration) * 100);
      }, stepStart);

      currentTime = stepEnd;
    });

    // Final completion
    setTimeout(() => {
      setShowCheck(true);
      setProgress(100);
    }, totalDuration);

    // Call onComplete after showing check
    setTimeout(() => {
      onComplete?.();
    }, totalDuration + 600);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Animated circles */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#27272a"
                strokeWidth="4"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {showCheck ? (
                <svg
                  className="w-16 h-16 text-indigo-400 animate-scale-in"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-3 text-center min-h-[80px]">
          {PROCESSING_STEPS.map((step, index) => (
            <p
              key={index}
              className={`text-sm transition-all duration-300 ${
                index === currentStep
                  ? 'text-white font-medium'
                  : index < currentStep
                  ? 'text-indigo-400'
                  : 'text-zinc-600'
              }`}
            >
              {index < currentStep && (
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step.text}
            </p>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2">
            {PROCESSING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-indigo-500' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
