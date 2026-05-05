'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/supabase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { error } = await resetPassword(email);

      if (error) {
        setError('Ocurrió un error. Verifica el correo e inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    },
    [email]
  );

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-sky-400/10 border border-sky-400/30 flex items-center justify-center mx-auto mb-8">
          <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-display text-white mb-3">Revisa tu correo</h2>
        <p className="text-white/50 leading-relaxed mb-8 text-[14px]">
          Si existe una cuenta con <span className="text-white/80">{email}</span>, recibirás
          un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-medium text-[13px] transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-2 mb-12">
        <span className="text-2xl font-display text-white">
          <span className="text-sky-400">VFR</span>
        </span>
      </Link>

      <span className="inline-flex items-center gap-3 text-xs font-mono text-white/40 uppercase tracking-widest mb-8">
        <span className="w-8 h-px bg-white/20" />
        Recuperar acceso
      </span>

      <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3 text-balance">
        ¿Olvidaste tu
        <br />
        <span className="text-white/40 italic">contraseña?</span>
      </h1>

      <p className="text-white/50 leading-relaxed mb-10 text-[14px]">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
            Correo electrónico
          </label>
          <div className="border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/15 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div
            className="p-3 rounded-xl text-[13px] text-rose-300"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className={`w-full h-14 rounded-full font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2 ${
            loading || !email
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border border-black/20 border-t-black rounded-full animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Enviar enlace
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-white/40">
        <Link href="/auth/login" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
