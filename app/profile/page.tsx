'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MeasurementsReveal from '@/components/scan/MeasurementsReveal';
import SizeRecommendation from '@/components/scan/SizeRecommendation';
import MeasurementEditModal from '@/components/scan/MeasurementEditModal';
import { useAppStore } from '@/store/useAppStore';
import { saveMeasurements, saveProfile, clearAllPoses, clearAllMeasurements, getAllPoses } from '@/lib/storage';
import { getAllScansFromSupabase, deleteScanFromSupabase, type ScanRecord } from '@/lib/supabase/profile';
import { useSession } from '@/lib/useSession';
import { updateUserProfile } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { getUserMetadata, getInitials, type AppUser } from '@/lib/supabase/types';
import type { BodyMeasurements } from '@/lib/types';

const POSE_LABELS = { front: 'Frontal', side: 'Perfil', back: 'Espalda' } as const;

// ─── User info card ───────────────────────────────────────────
function UserInfoCard({ user, onUpdated }: { user: AppUser | null; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const meta = getUserMetadata(user);
  const [name, setName]   = useState(meta.full_name ?? '');
  const [phone, setPhone] = useState(meta.phone ?? '');

  useEffect(() => {
    const m = getUserMetadata(user);
    setName(m.full_name ?? '');
    setPhone(m.phone ?? '');
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error } = await updateUserProfile({ full_name: name.trim(), phone: phone.trim() });
    setSaving(false);
    if (error) { setError('No se pudo guardar. Inténtalo de nuevo.'); return; }
    setSuccess(true);
    setEditing(false);
    onUpdated();
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCancel = () => {
    const m = getUserMetadata(user);
    setName(m.full_name ?? '');
    setPhone(m.phone ?? '');
    setEditing(false);
    setError(null);
  };

  const initials = getInitials(user);

  return (
    <div
      className="rounded-2xl p-6 mb-16 lg:mb-20"
      style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-black flex-shrink-0"
            style={{ background: '#7dd3fc' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-white font-medium text-[15px]">
              {name || <span className="text-white/30 italic">Sin nombre</span>}
            </p>
            <p className="text-white/40 text-[13px] font-mono">{user?.email}</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[12px] font-mono text-white/40 hover:text-white/70 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-widest mb-2">Nombre completo</label>
            <div className="border-b border-white/15 focus-within:border-white/40 transition-colors pb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                className="w-full bg-transparent text-[15px] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-widest mb-2">
              Teléfono <span className="text-white/20 normal-case">(opcional)</span>
            </label>
            <div className="border-b border-white/15 focus-within:border-white/40 transition-colors pb-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 000 000 0000"
                autoComplete="tel"
                className="w-full bg-transparent text-[15px] text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-widest mb-2">
              Correo electrónico <span className="text-white/20 normal-case">(no editable)</span>
            </label>
            <p className="text-[15px] text-white/30 pb-2 border-b border-white/8">{user?.email}</p>
          </div>
          {error && <p className="text-[12px] text-rose-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-10 px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />Guardando…</>
                : 'Guardar cambios'
              }
            </button>
            <button
              onClick={handleCancel}
              className="h-10 px-5 rounded-full border border-white/15 text-white/60 hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Nombre',   value: name  || '—' },
            { label: 'Teléfono', value: phone || '—' },
            { label: 'Correo',   value: user?.email ?? '—' },
            { label: 'Miembro desde', value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10.5px] font-mono text-white/35 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-[14px] text-white truncate">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-emerald-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cambios guardados
        </div>
      )}
    </div>
  );
}

// ─── Scan history card ────────────────────────────────────────
function ScanCard({ scan, isLatest, isExpanded, onToggle, onDelete }: {
  scan: ScanRecord; isLatest: boolean; isExpanded: boolean;
  onToggle: () => void; onDelete: (id: string) => void;
}) {
  const date = scan.capturedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = scan.capturedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const m = scan.measurements;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
        <div className="flex items-center gap-3">
          {isLatest && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest" style={{ background: 'rgba(125,211,252,0.12)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.25)' }}>
              Último
            </span>
          )}
          <div>
            <p className="text-[13px] font-medium text-white">{date}</p>
            <p className="text-[11px] font-mono text-white/40">{time}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-5 mr-4">
          {[{ label: 'Pecho', value: m.chest }, { label: 'Cintura', value: m.waist }, { label: 'Cadera', value: m.hips }, { label: 'Hombros', value: m.shoulders }].map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-[13px] font-display text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] font-mono text-white/35 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
        <svg className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-white/8 px-5 pb-5 pt-4 space-y-6">
          {/* Photos */}
          <div>
            <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">Capturas</p>
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as const).map((pose) => (
                <div key={pose}>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    {scan.photos[pose] ? (
                      <img src={scan.photos[pose]!} alt={POSE_LABELS[pose]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] font-mono text-white/70 uppercase tracking-wider">
                      {pose === 'front' ? '01' : pose === 'side' ? '02' : '03'}
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono text-white/40 uppercase tracking-wider mt-1.5 text-center">{POSE_LABELS[pose]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          <div>
            <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">Medidas · cm</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pecho', value: m.chest }, { label: 'Cintura', value: m.waist },
                { label: 'Cadera', value: m.hips }, { label: 'Hombros', value: m.shoulders },
                { label: 'Entrepierna', value: m.inseam }, { label: 'Largo brazo', value: m.armLength },
                { label: 'Torso', value: m.torsoLength }, { label: 'Confianza', value: `${Math.round(m.confidence * 100)}%` },
              ].map((item) => (
                <div key={item.label} className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[18px] font-display text-white tabular-nums">{item.value}</p>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {(scan.heightAtScan || scan.weightAtScan) && (
            <div className="flex items-center gap-4 text-[12px] font-mono text-white/40">
              {scan.heightAtScan && <span>Altura: <span className="text-white/60">{scan.heightAtScan} cm</span></span>}
              {scan.weightAtScan && <span>Peso: <span className="text-white/60">{scan.weightAtScan} kg</span></span>}
              {scan.heightAtScan && scan.weightAtScan && (
                <span>BMI: <span className="text-white/60">{(scan.weightAtScan / ((scan.heightAtScan / 100) ** 2)).toFixed(1)}</span></span>
              )}
            </div>
          )}

          {!isLatest && (
            <div className="flex justify-end pt-1">
              <button onClick={() => onDelete(scan.id)} className="text-[12px] font-mono text-rose-400/50 hover:text-rose-400 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar escaneo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { userProfile, capturedPoses, setUserProfile, clearPoses } = useAppStore();

  const [showEditModal, setShowEditModal]         = useState(false);
  const [localMeasurements, setLocalMeasurements] = useState<BodyMeasurements | null>(null);
  const [scans, setScans]                         = useState<ScanRecord[]>([]);
  const [scansLoading, setScansLoading]           = useState(true);
  const [expandedScan, setExpandedScan]           = useState<string | null>(null);
  const [userRefresh, setUserRefresh]             = useState(0);
  const [freshUser, setFreshUser]                 = useState<AppUser | null>(null);

  // Hydration gate
  const [hydrated, setHydrated] = useState(() =>
    typeof window !== 'undefined' && useAppStore.persist?.hasHydrated?.()
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (useAppStore.persist?.hasHydrated?.()) { setHydrated(true); return; }
    const unsub = useAppStore.persist?.onFinishHydration?.(() => setHydrated(true));
    return () => unsub?.();
  }, []);

  // Redirect if no profile — but only after both hydration AND session check complete.
  // Without the session guard, a logged-in user gets bounced to /scan on F5 because
  // Zustand's userProfile is null for ~100ms while localStorage hydrates.
  useEffect(() => {
    if (!hydrated) return;
    // Still waiting for Supabase session to resolve
    if (user === undefined) return;
    // Authenticated but no local profile → go scan
    if (!userProfile && user !== null) { router.push('/scan'); return; }
    // Not authenticated → middleware handles redirect to /auth/login
    if (userProfile?.measurements) setLocalMeasurements(userProfile.measurements);
  }, [hydrated, userProfile, user, router]);

  // Load scan history
  useEffect(() => {
    if (!user) return;
    setScansLoading(true);
    getAllScansFromSupabase()
      .then((data) => {
        setScans(data);
        if (data.length > 0) setExpandedScan(data[0].id);
        if (!userProfile?.measurements && data.length > 0) {
          setLocalMeasurements(data[0].measurements);
          if (userProfile) setUserProfile({ ...userProfile, measurements: data[0].measurements });
        }
      })
      .catch(console.error)
      .finally(() => setScansLoading(false));
  }, [user]);

  // Restore poses from IndexedDB
  useEffect(() => {
    if (capturedPoses.length > 0) return;
    getAllPoses().then((poses) => {
      poses.forEach((p) => useAppStore.getState().addCapturedPose(p));
    }).catch(console.error);
  }, []);

  // Refresh user after profile edit
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setFreshUser(data.user as AppUser);
    });
  }, [userRefresh]);

  const handleEditSave = useCallback((m: BodyMeasurements) => {
    setLocalMeasurements(m);
    if (userProfile) {
      const updated = { ...userProfile, measurements: m };
      setUserProfile(updated);
      saveProfile(updated);
    }
    saveMeasurements(m);
  }, [userProfile, setUserProfile]);

  const handleNewScan = useCallback(async () => {
    setUserProfile(null);
    clearPoses();
    try { await Promise.all([clearAllPoses(), clearAllMeasurements()]); } catch {}
    router.push('/scan');
  }, [setUserProfile, clearPoses, router]);

  const handleDeleteScan = useCallback(async (id: string) => {
    await deleteScanFromSupabase(id);
    setScans((prev) => prev.filter((s) => s.id !== id));
  }, []);

  if (!hydrated || sessionLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border border-white/15 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border border-white/15 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  const latestScan        = scans[0] ?? null;
  const displayMeasurements = localMeasurements ?? latestScan?.measurements ?? null;
  const heightM           = userProfile.height / 100;
  const computedBmi       = userProfile.weight && heightM > 0 ? userProfile.weight / (heightM * heightM) : null;
  const genderLabel       = userProfile.gender === 1 ? 'Hombre' : userProfile.gender === 2 ? 'Mujer' : 'Neutro';
  const displayUser       = freshUser ?? user;

  return (
    <>
      <main className="min-h-screen bg-black pb-32">
        <Navbar />

        <div className="max-w-[1100px] mx-auto px-6 lg:px-12 pt-32 lg:pt-40">

          {/* ── User info — siempre visible, primero ── */}
          <UserInfoCard
            user={displayUser}
            onUpdated={() => setUserRefresh((n) => n + 1)}
          />

          {/* ── Header ── */}
          <header className="mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-3 text-[11px] font-mono text-white/40 uppercase tracking-widest mb-6">
              <span className="w-8 h-px bg-white/25" />
              Perfil corporal
            </span>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-display leading-[0.95] tracking-tight text-white mb-4 text-balance">
                  {getUserMetadata(displayUser).full_name
                    ? <>{getUserMetadata(displayUser).full_name!.split(' ')[0]}<span className="text-white/30">,</span><br /><span className="text-white/40 italic">tu cuerpo en cifras.</span></>
                    : <>Tu cuerpo<span className="text-white/30">,</span><br /><span className="text-white/40 italic">en cifras.</span></>
                  }
                </h1>
                <p className="text-white/50 text-[14px] leading-relaxed max-w-lg">
                  {scans.length > 0
                    ? `${scans.length} escaneo${scans.length > 1 ? 's' : ''} registrado${scans.length > 1 ? 's' : ''}. Último: ${latestScan?.capturedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}.`
                    : 'Completa tu primer escaneo para ver tus medidas y tallas recomendadas.'
                  }
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleNewScan} className="flex items-center gap-2 h-10 px-5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-[13px] font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo escaneo
                </button>
                <Link href="/fitting" className="flex items-center gap-2 h-10 px-5 rounded-full bg-white text-black hover:bg-white/90 text-[13px] font-medium transition-colors">
                  Catálogo
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-10 flex flex-wrap gap-6 lg:gap-10">
              {[
                { label: 'Altura · cm', value: userProfile.height },
                { label: 'Peso · kg',   value: userProfile.weight },
                ...(computedBmi ? [{ label: 'BMI', value: computedBmi.toFixed(1) }] : []),
                { label: 'Género',      value: genderLabel },
              ].map((s) => (
                <div key={s.label}>
                  <span className="block text-2xl lg:text-3xl font-display text-white tabular-nums">{s.value}</span>
                  <span className="block text-[10.5px] font-mono text-white/40 uppercase tracking-widest mt-1">{s.label}</span>
                </div>
              ))}
            </div>
          </header>

          {displayMeasurements ? (
            <>
              {/* Latest scan photos */}
              {latestScan && (
                <section className="mb-16 lg:mb-20">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Último escaneo — Capturas</span>
                    <span className="text-[11px] font-mono text-white/30">
                      {latestScan.capturedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg">
                    {(['front', 'side', 'back'] as const).map((pose, i) => {
                      const src = latestScan.photos[pose] ?? capturedPoses.find((p) => p.poseId === pose)?.imageDataUrl ?? null;
                      return (
                        <div key={pose}>
                          <div className="aspect-[3/4] rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                            {src
                              ? <img src={src} alt={POSE_LABELS[pose]} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                  <svg className="w-6 h-6 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-[9px] font-mono text-white/20 uppercase">Sin foto</span>
                                </div>
                            }
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9.5px] font-mono text-white/80 uppercase tracking-wider">
                              0{i + 1}
                            </div>
                          </div>
                          <p className="text-[11px] font-mono text-white/50 uppercase tracking-wider mt-2 text-center">{POSE_LABELS[pose]}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Measurements */}
              <div className="mb-16 lg:mb-20">
                <MeasurementsReveal measurements={displayMeasurements} onEdit={() => setShowEditModal(true)} />
              </div>

              {/* Size recommendations */}
              <div className="mb-16 lg:mb-20">
                <SizeRecommendation measurements={displayMeasurements} onEdit={() => setShowEditModal(true)} />
              </div>

              {/* Scan history */}
              <section className="mb-16 lg:mb-20">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Historial de escaneos</span>
                    <h2 className="text-2xl md:text-3xl font-display text-white mt-2 leading-none">
                      {scans.length} escaneo{scans.length !== 1 ? 's' : ''}
                    </h2>
                  </div>
                  <button onClick={handleNewScan} className="flex items-center gap-2 h-9 px-4 rounded-full border border-white/15 text-white/60 hover:text-white hover:bg-white/5 text-[12px] font-medium transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo
                  </button>
                </div>

                {scansLoading ? (
                  <div className="flex items-center gap-3 py-8 text-white/30 text-[13px] font-mono">
                    <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    Cargando historial…
                  </div>
                ) : scans.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p className="text-white/30 text-[13px]">Aún no tienes escaneos guardados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scans.map((scan, i) => (
                      <ScanCard
                        key={scan.id}
                        scan={scan}
                        isLatest={i === 0}
                        isExpanded={expandedScan === scan.id}
                        onToggle={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                        onDelete={handleDeleteScan}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="border-t border-white/10 pt-12">
              <div className="max-w-md">
                <h3 className="text-2xl font-display text-white mb-3">Sin medidas todavía</h3>
                <p className="text-white/50 leading-relaxed mb-8 text-[14px]">
                  Completa el escaneo de las tres poses para ver tus medidas detalladas y las tallas recomendadas.
                </p>
                <Link href="/scan" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-white text-black hover:bg-white/90 font-medium text-[13px] transition-colors">
                  Comenzar escaneo
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      {displayMeasurements && (
        <MeasurementEditModal
          isOpen={showEditModal}
          measurements={displayMeasurements}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
