'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { Shield, Lock, Eye, FileCheck } from 'lucide-react';

const securityFeatures = [
  { icon: Shield, title: 'Aislamiento seguro', description: 'Cada escaneo se procesa en su propio entorno aislado.' },
  { icon: Lock, title: 'Datos encriptados', description: 'Tus medidas están encriptadas en reposo y en tránsito.' },
  { icon: Eye, title: 'Trazabilidad completa', description: 'Cada operación queda registrada e inspeccionable.' },
  { icon: FileCheck, title: 'Límites de permisos', description: 'Principio de mínimo privilegio por diseño.' },
];

const certifications = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR'];

const footerLinks = {
  Producto: [
    { name: 'Escaneo 3D', href: '/scan' },
    { name: 'Probador virtual', href: '/fitting' },
    { name: 'Talla exacta', href: '/info' },
  ],
  Info: [
    { name: 'Características', href: '/info' },
    { name: 'Cómo funciona', href: '/info' },
    { name: 'Seguridad', href: '/info' },
  ],
  Compañía: [
    { name: 'Acerca de', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Contacto', href: '#' },
  ],
  Legal: [
    { name: 'Privacidad', href: '#' },
    { name: 'Términos', href: '#' },
  ],
};

function AnimatedWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(100, 200, 150, 0.3)';
      ctx.lineWidth = 1;

      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const y =
            height * 0.5 +
            Math.sin(x * 0.01 + time + wave * 0.5) * 30 +
            Math.sin(x * 0.02 + time * 1.5 + wave) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time += 0.02;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className='w-full h-full' />;
}

function SecuritySection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % securityFeatures.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id='security' ref={sectionRef} className='relative py-24 lg:py-32 overflow-hidden' style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className='max-w-[1400px] mx-auto px-6 lg:px-12'>
        <div className='mb-20'>
          <span
            className={`inline-flex items-center gap-4 text-sm font-mono mb-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <span className='w-12 h-px' style={{ background: 'rgba(255,255,255,0.15)' }} />
            Seguridad
          </span>

          <h2
            className={`text-5xl md:text-6xl lg:text-[100px] font-display tracking-tight leading-[0.9] mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ color: 'white' }}
          >
            Controlado,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>no limitado.</span>
          </h2>

          <div className={`transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className='text-xl leading-relaxed max-w-2xl' style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tu vestidor virtual es poderoso pero seguro. Medidas de nivel empresarial garantizan tu privacidad en todo momento.
            </p>
          </div>
        </div>

        <div className='grid lg:grid-cols-12 gap-6'>
          <div
            className={`lg:col-span-7 relative p-8 lg:p-12 min-h-[400px] overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className='relative z-10'>
              <span className='font-mono text-sm' style={{ color: 'rgba(255,255,255,0.4)' }}>Proteccion activa</span>
              <div className='mt-8'>
                <span className='text-7xl lg:text-8xl font-display' style={{ color: 'white' }}>0</span>
                <span className='block mt-2' style={{ color: 'rgba(255,255,255,0.4)' }}>Incidentes de privacidad este año</span>
              </div>
            </div>

            <div className='absolute bottom-8 left-8 right-8 flex flex-wrap gap-2'>
              {certifications.map((cert, index) => (
                <span
                  key={cert}
                  className='px-3 py-1 text-xs font-mono transition-all duration-500'
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', transitionDelay: `${index * 100 + 300}ms`, opacity: isVisible ? 1 : 0 }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div className='lg:col-span-5 flex flex-col gap-4'>
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className='p-6 transition-all duration-500 cursor-default'
                style={{
                  border: `1px solid ${activeFeature === index ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  background: activeFeature === index ? 'rgba(255,255,255,0.04)' : 'transparent',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(8px)',
                  transitionDelay: `${index * 80}ms`,
                }}
                onClick={() => setActiveFeature(index)}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className='flex items-start gap-4'>
                  <div
                    className='shrink-0 w-10 h-10 flex items-center justify-center transition-colors'
                    style={{
                      border: `1px solid ${activeFeature === index ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      color: activeFeature === index ? 'white' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <feature.icon className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-medium mb-1' style={{ color: 'white' }}>{feature.title}</h3>
                    <p className='text-sm' style={{ color: 'rgba(255,255,255,0.4)' }}>{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className='relative bg-black'>
      {/* Panoramic banner image */}
      <div className='relative w-full h-[340px] md:h-[420px] overflow-hidden'>
        <img
          src='/fashion.jpg'
          alt='Fashion'
          className='w-full h-full object-cover object-center'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black' />
        <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40' />
      </div>

      {/* Footer content */}
      <div className='relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12'>
        <div className='py-16 lg:py-20'>
          <div className='grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8'>
            {/* Brand Column */}
            <div className='col-span-2'>
              <a href='#' className='inline-flex items-center gap-2 mb-6'>
                <span className='text-2xl font-display text-white'>VFR</span>
              </a>

              <p className='text-white/50 leading-relaxed mb-8 max-w-xs text-sm'>
                Tu vestidor virtual con inteligencia artificial. Escanea, mide y prueba ropa sin necesidad de probarla.
              </p>

              <div className='flex gap-6'>
                {['Twitter', 'GitHub', 'LinkedIn'].map((link) => (
                  <a
                    key={link}
                    href='#'
                    className='text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 group'
                  >
                    {link}
                    <ArrowUpRight className='w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all' />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className='text-sm font-medium text-white mb-6'>{title}</h3>
                <ul className='space-y-4'>
                  {links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className='text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-2'>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4'>
          <p className='text-sm text-white/30'>
            © 2025 VFR. Todos los derechos reservados.
          </p>

          <div className='flex items-center gap-4 text-sm text-white/30'>
            <span className='flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full' style={{ background: '#eca8d6' }} />
              Todos los agentes operativos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className='min-h-screen bg-black'>
      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50 px-4 pt-4'>
        <div
          className='mx-auto max-w-3xl flex items-center justify-between px-6 py-4 rounded-2xl'
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <span className='text-[17px] font-semibold text-white'>
            <span className='text-sky-400'>VFR</span>
          </span>
          <div className='flex items-center gap-5'>
            <Link href='/info' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>
              Información
            </Link>
            <Link href='/fitting' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>
              Catalogo
            </Link>
            <Link href='/scan' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>
              Escanear
            </Link>
            <Link href='/profile' className='text-[13px] text-white/60 hover:text-white transition-colors font-medium'>
              Perfil
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Capabilities Section */}
      <FeaturesSection />

      {/* Security / Discover More Section */}
      <SecuritySection />

      {/* Footer */}
      <FooterSection />
    </main>
  );
}
