'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/supabase/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const passwordsMatch = password === confirm;
  const passwordStrong = password.length >= 8;
  const formValid = name.trim() && email && passwordStrong && passwordsMatch;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid) return;
      setError(null);
      setLoading(true);

      const { error } = await signUp(email, password, name.trim());

      if (error) {
        setError(translateAuthError(error.message));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    },
    [email, password, name, formValid]
  );

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-8">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-display text-white mb-3">Revisa tu correo</h2>
        <p className="text-white/50 leading-relaxed mb-8 text-[14px]">
          Te enviamos un enlace de confirmación a <span className="text-white/80">{email}</span>.
          Haz clic en él para activar tu cuenta.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-medium text-[13px] transition-colors"
        >
          Ir al inicio de sesión
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
        Crear cuenta
      </span>

      <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3 text-balance">
        Empieza a
        <br />
        <span className="text-white/40 italic">vestirte mejor.</span>
      </h1>

      <p className="text-white/50 leading-relaxed mb-10 text-[14px]">
        Crea tu cuenta para escanear tu cuerpo y probar ropa virtualmente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
            Nombre
          </label>
          <div className="border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoComplete="name"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/15 focus:outline-none"
            />
          </div>
        </div>

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
          <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
            Contraseña
          </label>
          <div className="border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/15 focus:outline-none"
            />
          </div>
          {password && !passwordStrong && (
            <p className="mt-2 text-[11px] font-mono text-rose-400/80">Mínimo 8 caracteres</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
            Confirmar contraseña
          </label>
          <div className="border-b border-white/10 focus-within:border-white/40 transition-colors pb-2">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              autoComplete="new-password"
              className="w-full bg-transparent text-lg text-white placeholder:text-white/15 focus:outline-none"
            />
          </div>
          {confirm && !passwordsMatch && (
            <p className="mt-2 text-[11px] font-mono text-rose-400/80">Las contraseñas no coinciden</p>
          )}
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
          disabled={loading || !formValid}
          className={`w-full h-14 rounded-full font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2 ${
            loading || !formValid
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border border-black/20 border-t-black rounded-full animate-spin" />
              Creando cuenta…
            </>
          ) : (
            <>
              Crear cuenta
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-white/40">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

function translateAuthError(message: string): string {
  if (message.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (message.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('Unable to validate email')) return 'El correo no es válido.';
  return 'Ocurrió un error. Inténtalo de nuevo.';
}
