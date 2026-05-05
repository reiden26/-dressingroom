'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global error boundary for the Next.js App Router.
 * Catches React rendering errors that bubble up to the root layout.
 * Required by Sentry for full error coverage.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display text-white mb-3">
            Algo salió mal
          </h2>
          <p className="text-white/40 text-[14px] leading-relaxed mb-8">
            Ocurrió un error inesperado. El equipo ha sido notificado automáticamente.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="h-11 px-6 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="h-11 px-6 rounded-full border border-white/15 text-white/60 hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors flex items-center"
            >
              Ir al inicio
            </a>
          </div>
          {error.digest && (
            <p className="mt-6 text-[10px] font-mono text-white/20">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
