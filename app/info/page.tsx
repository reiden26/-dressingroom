'use client';

import Link from 'next/link';

const features = [
  {
    title: 'Escaneo 3D',
    description: 'Usa tu cámara para capturar tu silueta y calcular medidas precisas.',
    icon: (
      <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
      </svg>
    ),
    color: 'sky',
    stats: { value: '30s', label: 'tiempo de escaneo' },
  },
  {
    title: 'Probador Virtual',
    description: 'Visualiza cómo te queda la ropa antes de comprarla.',
    icon: (
      <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' />
      </svg>
    ),
    color: 'amber',
    stats: { value: '500+', label: 'prendas disponibles' },
  },
  {
    title: 'Talla Exacta',
    description: 'Filtra por tu talla en base a tus medidas corporales.',
    icon: (
      <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
      </svg>
    ),
    color: 'emerald',
    stats: { value: '99.7%', label: 'precisión' },
  },
];

const colorClasses = {
  sky: { bg: 'bg-sky-50', ring: 'ring-sky-200', text: 'text-sky-600' },
  amber: { bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-500' },
  emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-500' },
};

export default function InfoPage() {
  return (
    <main className='min-h-screen bg-black'>
      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50 px-4 pt-4'>
        <div className='mx-auto max-w-3xl flex items-center justify-between px-6 py-4 rounded-2xl' style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Link href='/' className='text-[17px] font-semibold text-white'>
            <span className='text-sky-400'>VFR</span>
          </Link>
          <div className='flex items-center gap-5'>
            <Link href='/fitting' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>Catalogo</Link>
            <Link href='/scan' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>Escanear</Link>
            <Link href='/profile' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>Perfil</Link>
            <Link href='/info' className='text-[13px] text-white transition-colors font-medium'>Información</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className='relative min-h-[60vh] flex flex-col justify-center items-start overflow-hidden'>
        <div className='relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-32'>
          <div className='lg:max-w-[55%]'>
            <div className='mb-8'>
              <span className='inline-flex items-center gap-3 text-sm font-mono text-white/60'>
                <span className='w-8 h-px bg-white/30' />
                Vestidor Virtual
              </span>
            </div>
            <h1 className='text-left text-[clamp(2rem,6vw,7rem)] font-display leading-[0.92] tracking-tight text-white'>
              <span className='block'>Tecnología</span>
              <span className='block'>de vestidor</span>
              <br />
              <span className='block'>virtual.</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='py-24 lg:py-32'>
        <div className='max-w-[1400px] mx-auto px-6 lg:px-12'>
          <div className='grid lg:grid-cols-12 gap-4 lg:gap-6'>
            {features.map((feature, i) => {
              const colors = colorClasses[feature.color as keyof typeof colorClasses];
              return (
                <div
                  key={feature.title}
                  className={`lg:col-span-4 glass-card p-8 hover:scale-[1.01] transition-transform`}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className={`w-14 h-14 ${colors.bg} ring-1 ${colors.ring} rounded-2xl flex items-center justify-center mb-6`}>
                    <span className={colors.text}>{feature.icon}</span>
                  </div>
                  <h3 className='text-xl font-semibold text-white mb-3'>{feature.title}</h3>
                  <p className='text-white/50 mb-8 leading-relaxed'>{feature.description}</p>
                  <div>
                    <span className='text-4xl font-display text-white'>{feature.stats.value}</span>
                    <span className='block text-xs font-mono text-white/40 mt-1'>{feature.stats.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className='py-24 lg:py-32 border-t border-white/10'>
        <div className='max-w-[1400px] mx-auto px-6 lg:px-12'>
          <div className='text-center mb-16'>
            <span className='inline-flex items-center gap-3 text-sm font-mono text-white/60 mb-6'>
              <span className='w-8 h-px bg-white/30' />
              Cómo funciona
              <span className='w-8 h-px bg-white/30' />
            </span>
            <h2 className='text-5xl lg:text-7xl font-display text-white'>3 pasos simples</h2>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              { step: '01', title: 'Escanea tu cuerpo', desc: 'Usa la cámara de tu dispositivo para capturar tu silueta en 3 poses diferentes.' },
              { step: '02', title: 'Recibe tus medidas', desc: 'Nuestro algoritmo calcula tus medidas corporales precisas en segundos.' },
              { step: '03', title: 'Prueba ropa virtual', desc: 'Visualiza cómo te queda cualquier prenda sin necesidad de probártela.' },
            ].map((item) => (
              <div key={item.step} className='text-center'>
                <span className='text-7xl font-display text-white/10'>{item.step}</span>
                <h3 className='text-xl font-semibold text-white mt-2 mb-3'>{item.title}</h3>
                <p className='text-white/50'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-24 lg:py-32'>
        <div className='max-w-[1400px] mx-auto px-6 lg:px-12 text-center'>
          <h2 className='text-5xl lg:text-7xl font-display text-white mb-8'>Empieza hoy</h2>
          <p className='text-white/60 text-lg mb-10 max-w-xl mx-auto'>Crea tu perfil corporal en 30 segundos y transforma tu experiencia de compra.</p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/scan' className='inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors'>
              Comenzar escaneo
            </Link>
            <Link href='/fitting' className='inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-colors'>
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className='px-4 py-5'
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 0,
        }}
      >
        <div className='text-center'>
          <p className='text-[12px] text-white/40'>Vestidor Virtual - Demo</p>
        </div>
      </footer>
    </main>
  );
}
