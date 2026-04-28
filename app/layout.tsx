import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { OfflineBanner } from '@/lib/useNetworkStatus';
import BottomNav from '@/components/ui/BottomNav';

export const metadata: Metadata = {
  title: 'VFR - Vestidor Virtual con Inteligencia Artificial',
  description: 'Escanea tu cuerpo, obtén medidas precisas y prueba ropa virtualmente. Tu vestidor virtual con IA que te permite ver cómo te queda la ropa antes de comprarla.',
  keywords: ['vestidor virtual', 'prueba de ropa virtual', 'escaneo corporal 3D', 'inteligencia artificial moda', 'talla exacta', 'probador virtual'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VFR - Vestidor Virtual',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'VFR - Vestidor Virtual',
    description: 'Escanea tu cuerpo y prueba ropa virtualmente con inteligencia artificial',
    type: 'website',
    locale: 'es_ES',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className='antialiased'>
        <Providers>
          {children}
          <BottomNav />
        </Providers>
        <OfflineBanner />
      </body>
    </html>
  );
}
