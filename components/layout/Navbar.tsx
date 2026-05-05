'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { signOut } from '@/lib/supabase/auth';
import { setUser } from '@/lib/monitoring';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/info',    label: 'Información' },
  { href: '/fitting', label: 'Catálogo' },
  { href: '/scan',    label: 'Escanear' },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, loading } = useSession();

  // Keep Sentry user context in sync with auth state
  useEffect(() => {
    setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
  }, [user]);
  const [open, setOpen]   = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setOpen(false);
    await signOut();
    router.push('/');
    router.refresh();
    setSigningOut(false);
  };

  // Initials avatar from email
  const initials = user?.email
    ? user.user_metadata?.full_name
      ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : user.email[0].toUpperCase()
    : '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div
        className="mx-auto max-w-3xl flex items-center justify-between px-6 py-3.5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="text-[17px] font-semibold text-white">
          <span className="text-sky-400">VFR</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Auth */}
          {!loading && (
            user ? (
              /* ── User dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Menú de usuario"
                  aria-expanded={open}
                  className={`flex items-center gap-2 rounded-full transition-all ${
                    open ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  {/* Avatar circle */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-black select-none"
                    style={{ background: '#7dd3fc' }}
                  >
                    {initials}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {open && (
                  <div
                    className="absolute right-0 top-full mt-3 w-56 rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(15,15,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3.5 border-b border-white/8">
                      <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-0.5">
                        Sesión activa
                      </p>
                      <p className="text-[13px] text-white truncate">{user.email}</p>
                    </div>

                    {/* Links */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi perfil
                      </Link>
                      <Link
                        href="/scan"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Nuevo escaneo
                      </Link>
                      <Link
                        href="/fitting"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Catálogo
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/8 py-1.5">
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-rose-400/80 hover:text-rose-400 hover:bg-rose-400/5 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Login button ── */
              <Link
                href="/auth/login"
                className="text-[13px] font-medium px-4 py-1.5 rounded-full transition-all text-white/80 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              >
                Iniciar sesión
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
