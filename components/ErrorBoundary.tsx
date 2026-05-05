'use client';

import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary-${this.props.section ?? 'unknown'}]:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Report to Sentry with component context
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        section: this.props.section,
      },
    });
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2 text-[15px]">Algo salió mal</h3>
          <p className="text-white/40 text-[13px] text-center mb-5 max-w-xs leading-relaxed">
            {this.state.error?.message ?? 'Error inesperado. El equipo ha sido notificado.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null, eventId: null })}
              className="h-9 px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors"
            >
              Reintentar
            </button>
            {this.state.eventId && (
              <button
                onClick={() =>
                  Sentry.showReportDialog({ eventId: this.state.eventId! })
                }
                className="h-9 px-5 rounded-full border border-white/15 text-white/60 hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors"
              >
                Reportar
              </button>
            )}
          </div>
          {this.state.eventId && (
            <p className="mt-3 text-[10px] font-mono text-white/20">
              ID: {this.state.eventId}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Specialized fallbacks ────────────────────────────────────

export function CameraErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-2 text-[15px]">Error de cámara</h3>
      <p className="text-white/40 text-[13px] text-center mb-5 max-w-xs leading-relaxed">
        No se pudo acceder a la cámara. Verifica los permisos y que ninguna otra app la esté usando.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="h-9 px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function AIErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(125,211,252,0.1)', border: '1px solid rgba(125,211,252,0.2)' }}>
        <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-2 text-[15px]">Servicio de IA no disponible</h3>
      <p className="text-white/40 text-[13px] text-center mb-5 max-w-xs leading-relaxed">
        No se pudo conectar con el servicio de generación. Verifica tu conexión e inténtalo de nuevo.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="h-9 px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function GalleryErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-2 text-[15px]">Error al cargar galería</h3>
      <p className="text-white/40 text-[13px] text-center mb-5 max-w-xs leading-relaxed">
        No se pudieron cargar tus looks guardados.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="h-9 px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors">
          Reintentar
        </button>
      )}
    </div>
  );
}
