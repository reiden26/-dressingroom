'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/supabase/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/profile';

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { error } = await signIn(email, password);

      if (error) {
        setError(translateAuthError(error.message));
        setLoading(false);
        return;
      }

      // Show full-screen spinner while Next.js navigates + refreshes session
      setLoading(false);
      setRedirecting(true);
      router.push(redirectTo);
      router.refresh();
    },
    [email, password, redirectTo, router]
  );

  // Full-screen redirect spinner
  if (redirecting) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-5 z-50">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
          <div className="absolute inset-2 rounded-full border border-white/5" />
        </div>
        <p className="text-[13px] font-mono text-white/40 uppercase tracking-widest">
          Iniciando sesión…
        </p>
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
        Acceder
      </span>

      <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3 text-balance">
        Bienvenido<span className="text-white/30">,</span>
        <br />
        <span className="text-white/40 italic">de vuelta.</span>
      </h1>

      <p className="text-white/50 leading-relaxed mb-10 text-[14px]">
        Inicia sesión para acceder a tu perfil y probador virtual.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Contraseña
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/15 focus:outline-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-xl text-[13px] text-rose-300"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className={`w-full h-14 rounded-full font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2 ${
            loading || !email || !password
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Verificando…
            </>
          ) : (
            <>
              Iniciar sesión
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-white/40">
        ¿No tienes cuenta?{' '}
        <Link
          href="/auth/register"
          className="text-white/70 hover:text-white transition-colors underline underline-offset-2"
        >
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (message.includes('Email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (message.includes('Too many requests')) return 'Demasiados intentos. Espera unos minutos.';
  return 'Ocurrió un error. Inténtalo de nuevo.';
}
