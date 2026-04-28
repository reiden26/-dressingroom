'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type CaptureState = 'idle' | 'countdown' | 'captured';

interface CaptureButtonProps {
  onCapture: (dataUrl: string) => void;
  videoRef: HTMLVideoElement | null;
  disabled?: boolean;
  isAligned?: boolean;
  className?: string;
  enableSound?: boolean;
}

function createBeepSound(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
}

function createCaptureSound(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1760;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

export default function CaptureButton({
  onCapture,
  videoRef,
  disabled = false,
  isAligned = false,
  className = '',
  enableSound = true,
}: CaptureButtonProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (enableSound && audioContextRef.current) {
      createCaptureSound(audioContextRef.current);
    }

    onCapture(dataUrl);
    setState('captured');

    setTimeout(() => {
      setState('idle');
      setCountdown(3);
    }, 1000);
  }, [videoRef, onCapture, enableSound]);

  const handleClick = useCallback(() => {
    if (disabled || !isAligned || state !== 'idle') return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setState('countdown');
    setCountdown(3);

    if (enableSound) {
      createBeepSound(audioContextRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          setTimeout(() => {
            captureFrame();
          }, 100);
          return 0;
        }

        if (enableSound && audioContextRef.current) {
          createBeepSound(audioContextRef.current);
        }
        return prev - 1;
      });
    }, 1000);
  }, [disabled, isAligned, state, captureFrame, enableSound]);

  const isDisabled = disabled || !isAligned || state !== 'idle';
  const isPressed = state === 'countdown';

  const buttonBgColor = !isAligned ? 'bg-zinc-600' : isPressed ? 'bg-zinc-100' : 'bg-white';
  const borderColor = !isAligned ? 'border-zinc-500' : 'border-indigo-500';
  const innerBgColor = !isAligned ? 'bg-zinc-500' : 'bg-indigo-500';

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {showFlash && (
        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
      )}

      <div className="relative" title={!isAligned ? 'Alineate con la silueta guia' : undefined}>
        <button
          onClick={handleClick}
          disabled={isDisabled}
          className={`
            relative w-24 h-24 rounded-full
            ${buttonBgColor} border-4 ${borderColor}
            transition-all duration-150
            focus:outline-none focus:ring-4 focus:ring-indigo-500/50
            disabled:opacity-60 disabled:cursor-not-allowed
            ${isPressed ? 'scale-90' : 'hover:scale-105 active:scale-95'}
          `}
        >
          {state === 'countdown' ? (
            <span className={`text-4xl font-bold ${!isAligned ? 'text-zinc-400' : 'text-indigo-600'}`}>
              {countdown}
            </span>
          ) : state === 'captured' ? (
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className={`w-14 h-14 rounded-full ${innerBgColor} flex items-center justify-center`}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </button>

        {!isAligned && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )}
      </div>

      {state === 'idle' && (
        <p className={`text-center text-sm mt-2 ${!isAligned ? 'text-amber-400' : 'text-zinc-400'}`}>
          {!isAligned ? 'Alineate con la guia' : 'Toca para capturar'}
        </p>
      )}
      {state === 'countdown' && (
        <p className="text-center text-amber-400 text-sm mt-2">Preparate...</p>
      )}
      {state === 'captured' && (
        <p className="text-center text-emerald-400 text-sm mt-2">Capturado</p>
      )}
    </div>
  );
}
