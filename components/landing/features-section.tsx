'use client';

import { useEffect, useRef, useState } from 'react';

function ParticleVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const COUNT = 70;
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const seed = i * 1.618;
      return {
        bx: ((seed * 127.1) % 1),
        by: ((seed * 311.7) % 1),
        phase: seed * Math.PI * 2,
        speed: 0.4 + (seed % 0.4),
        radius: 1.2 + (seed % 2.2),
      };
    });

    let time = 0;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        const flowX = Math.sin(time * p.speed * 0.4 + p.phase) * 38;
        const flowY = Math.cos(time * p.speed * 0.3 + p.phase * 0.7) * 24;

        const bx = p.bx * w;
        const by = p.by * h;
        const dx = p.bx - mx;
        const dy = p.by - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 2.8);

        const x = bx + flowX + influence * Math.cos(time + p.phase) * 36;
        const y = by + flowY + influence * Math.sin(time + p.phase) * 36;

        const pulse = Math.sin(time * p.speed + p.phase) * 0.5 + 0.5;
        const alpha = 0.08 + pulse * 0.18 + influence * 0.3;

        ctx.beginPath();
        ctx.arc(x, y, p.radius + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      time += 0.016;
      frameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className='absolute inset-0 pointer-events-auto'
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const features = [
  {
    number: '01',
    title: 'Escaneo Corporal',
    description: 'Usa tu cámara para capturar tu silueta. Nuestro algoritmo de visión por computadora calcula tus medidas exactas.',
    stats: { value: '30s', label: 'tiempo de escaneo' },
    image: '/img.png',
  },
  {
    number: '02',
    title: 'Medición Precisa',
    description: 'Obtén medidas corporales precisas: pecho, cintura, cadera, largo de piernas y más, sin cinta métrica.',
    stats: { value: '99.7%', label: 'precisión' },
    image: '/img.png',
  },
  {
    number: '03',
    title: 'Prueba Virtual',
    description: 'Visualiza cómo te queda la ropa antes de comprarla. Filtra por tu talla exacta y encuentra lo mejor para ti.',
    stats: { value: '500+', label: 'prendas' },
    image: '/img.png',
  },
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id='features'
      ref={sectionRef}
      className='relative py-24 lg:py-32 overflow-hidden bg-black'
    >
      <div className='max-w-[1400px] mx-auto px-6 lg:px-12'>
        {/* Header */}
        <div className='relative mb-24 lg:mb-32'>
          <div className='grid lg:grid-cols-12 gap-8 items-end'>
            <div className='lg:col-span-7'>
              <span className='inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-6'>
                <span className='w-12 h-px bg-white/20' />
                Funciones
              </span>
              <h2
                className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ color: 'white' }}
              >
                Escaneo
                <br />
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>corporal.</span>
              </h2>
            </div>
            <div className='lg:col-span-5 lg:pb-4'>
              <p
                className={`text-xl leading-relaxed transition-all duration-1000 delay-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Usa la cámara de tu dispositivo para escanear tu cuerpo.Nuestro algoritmo calcula tus medidas exactas en segundos.Sin supervisión, sin complicaciones.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className='grid lg:grid-cols-12 gap-4 lg:gap-6'>
          <div
            className={`lg:col-span-12 relative overflow-hidden group transition-all duration-700 flex ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            onMouseEnter={() => setActiveFeature(0)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              minHeight: '500px',
            }}
          >
            <div className='relative flex-1 p-8 lg:p-12'>
              <ParticleVisualization />
              <div className='relative z-10'>
                <span className='font-mono text-sm' style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {features[0].number}
                </span>
                <h3
                  className='text-3xl lg:text-4xl font-display mt-4 mb-6 transition-transform duration-500'
                  style={{ color: 'white' }}
                >
                  {features[0].title}
                </h3>
                <p
                  className='text-lg leading-relaxed max-w-md mb-8'
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {features[0].description}
                </p>
                <div>
                  <span className='text-5xl lg:text-6xl font-display' style={{ color: 'white' }}>
                    {features[0].stats.value}
                  </span>
                  <span
                    className='block text-sm font-mono mt-2'
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {features[0].stats.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Image right side */}
            <div
              className='hidden lg:block relative shrink-0 overflow-hidden'
              style={{ width: '42%' }}
            >
              <img
                src={features[0].image}
                alt=''
                aria-hidden='true'
                className='absolute inset-0 w-full h-full object-cover object-center'
                style={{ transform: 'scaleX(-1)' }}
              />
              <div
                className='absolute inset-0'
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 50%, transparent 100%)',
                }}
              />
            </div>
          </div>

          {/* Other feature cards */}
          {features.slice(1).map((feature, i) => (
            <div
              key={feature.number}
              className={`lg:col-span-6 relative overflow-hidden p-8 lg:p-12 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: '400px',
                transitionDelay: `${(i + 1) * 100}ms`,
              }}
            >
              <ParticleVisualization />
              <div className='relative z-10'>
                <span className='font-mono text-sm' style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {feature.number}
                </span>
                <h3
                  className='text-2xl lg:text-3xl font-display mt-4 mb-4'
                  style={{ color: 'white' }}
                >
                  {feature.title}
                </h3>
                <p
                  className='text-base leading-relaxed mb-8'
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {feature.description}
                </p>
                <div>
                  <span className='text-4xl lg:text-5xl font-display' style={{ color: 'white' }}>
                    {feature.stats.value}
                  </span>
                  <span
                    className='block text-sm font-mono mt-2'
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {feature.stats.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
