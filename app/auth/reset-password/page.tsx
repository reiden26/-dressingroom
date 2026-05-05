'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/supabase/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrong = password.length >= 8;
  const passwordsMatch = password === confirm;
  const formValid = passwordStrong && passwordsMatch;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formValid) return;
      setError(null);
      setLoading(true);

      const { error } = await updatePassword(password);

      if (error) {
        setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/profile'), 2500);
    },
    [password, formValid, router]
  );

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-8">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-display text-white mb-3">Contraseña actualizada</h2>
        <p className="text-white/50 text-[14px]">Redirigiendo a tu perfil…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="inline-flex items-center gap-2 mb-12">
        <span className="text-2xl font-display text-white">
          <span className="text-sky-400">VFR</span>
        </span>
      </Link>

      <span className="inline-flex items-center gap-3 text-xs font-mono text-white/40 uppercase tracking-widest mb-8">
        <span className="w-8 h-px bg-white/20" />
        Nueva contraseña
      </span>

      <h1 className="text-4xl md:text-5xl font-display leading-[0.95] tracking-tight text-white mb-3">
        Elige una nueva
        <br />
        <span className="text-white/40 italic">contraseña.</span>
      </h1>

      <p className="text-white/50 leading-relaxed mb-10 text-[14px]">
        Mínimo 8 caracteres. Elige algo que no uses en otros sitios.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
            Nueva contraseña
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
              Actualizando…
            </>
          ) : (
            'Actualizar contraseña'
          )}
        </button>
      </form>
    </div>
  );
}
