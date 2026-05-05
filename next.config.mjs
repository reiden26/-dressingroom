import withPWAInit from '@ducanh2912/next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        return isSameOrigin && !url.pathname.startsWith('/api/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  async headers() {
    // ── Content Security Policy ──────────────────────────────────────────
    // Built per-directive so it's easy to audit and extend.
    // In development we use report-only mode so CSP violations are logged
    // to the console without breaking anything.
    const isDev = process.env.NODE_ENV === 'development';

    // Supabase project hostname (extracted from the URL env var)
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : '*.supabase.co';

    const csp = [
      // Only allow same-origin by default
      `default-src 'self'`,

      // Scripts: self + Next.js inline scripts (needed for hydration) + Sentry CDN
      // 'unsafe-inline' is needed for Next.js <Script> tags and inline event handlers
      // In a future hardening pass this can be replaced with nonces
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.sentry.io`,

      // Styles: self + inline (Tailwind generates inline styles)
      `style-src 'self' 'unsafe-inline'`,

      // Images: self + data URIs (base64 scan photos) + Unsplash + Supabase Storage + Replicate outputs
      `img-src 'self' data: blob: https://images.unsplash.com https://${supabaseHost} https://replicate.delivery https://*.replicate.delivery`,

      // Fonts: self only (using local @fontsource packages)
      `font-src 'self'`,

      // Connect (fetch/XHR/WebSocket):
      // - self (API routes)
      // - Supabase (auth + database + storage)
      // - Replicate (AI generation)
      // - MediaPipe model downloads
      // - Sentry (error reporting)
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.replicate.com https://storage.googleapis.com https://cdn.jsdelivr.net https://*.sentry.io`,

      // Media: self + blob (camera stream)
      `media-src 'self' blob: https://hebbkx1anhila5yf.public.blob.vercel-storage.com`,

      // Workers: self + blob (MediaPipe web workers)
      `worker-src 'self' blob:`,

      // WASM: needed for MediaPipe
      `script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.sentry.io`,

      // Frames: none (no iframes needed)
      `frame-src 'none'`,

      // Objects: none (no Flash/plugins)
      `object-src 'none'`,

      // Base URI: restrict to self to prevent base tag injection
      `base-uri 'self'`,

      // Form actions: self only
      `form-action 'self'`,

      // Upgrade insecure requests in production
      ...(isDev ? [] : [`upgrade-insecure-requests`]),
    ].join('; ');

    const cspHeader = isDev
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

    // ── Security headers applied to all routes ───────────────────────────
    const globalSecurityHeaders = [
      // CSP
      { key: cspHeader, value: csp },
      // Prevent MIME type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Prevent clickjacking
      { key: 'X-Frame-Options', value: 'DENY' },
      // Control referrer information
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permissions policy — disable features not used by the app
      {
        key: 'Permissions-Policy',
        value: [
          'camera=(self)',        // camera only on same origin (scan page)
          'microphone=()',        // not used
          'geolocation=()',       // not used
          'payment=()',           // not used
          'usb=()',               // not used
          'accelerometer=()',     // not used
          'gyroscope=()',         // not used
        ].join(', '),
      },
    ];

    return [
      // COEP + COOP only on /scan — required for MediaPipe WebAssembly SharedArrayBuffer.
      {
        source: '/scan',
        headers: [
          ...globalSecurityHeaders,
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        source: '/scan/:path*',
        headers: [
          ...globalSecurityHeaders,
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      // Workers and WASM assets
      {
        source: '/workers/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      // All other routes
      {
        source: '/((?!scan|workers).*)',
        headers: [
          ...globalSecurityHeaders,
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
};

export default withSentryConfig(
  withPWA(nextConfig),
  {
    // Sentry organization and project — set these after creating your Sentry project
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Auth token for uploading source maps (only needed in CI/production builds)
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Suppress Sentry CLI output during builds
    silent: !process.env.CI,

    // Upload source maps to Sentry for readable stack traces in production
    // Disable in development to speed up builds
    sourcemaps: {
      disable: process.env.NODE_ENV !== 'production',
    },

    // Automatically tree-shake Sentry logger statements in production
    disableLogger: true,

    // Tunnel Sentry requests through your own server to avoid ad blockers
    // tunnelRoute: '/monitoring',
  }
);
