/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Each limiter instance tracks requests per key (user ID or IP).
 * The store is per-process — resets on server restart, which is fine
 * for development and single-instance deployments. For multi-instance
 * production, replace the Map with a Redis/Upstash store.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
 *   const { ok, error } = limiter.check(userId);
 *   if (!ok) return error; // NextResponse 429
 */
import { NextResponse } from 'next/server';

interface RateLimiterOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Human-readable message shown when limit is exceeded */
  message?: string;
}

interface CheckResult {
  ok: true;
  remaining: number;
  error: null;
}

interface CheckError {
  ok: false;
  remaining: 0;
  error: NextResponse;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs, message } = options;
  const store = new Map<string, WindowEntry>();

  // Periodically clean up expired entries to avoid memory leaks
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of Array.from(store.entries())) {
        if (now > entry.resetAt) store.delete(key);
      }
    }, windowMs * 2);
  }

  function check(key: string): CheckResult | CheckError {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1, error: null };
    }

    if (entry.count >= limit) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      const errorMessage =
        message ??
        `Demasiadas solicitudes. Espera ${retryAfterSec} segundos e inténtalo de nuevo.`;

      const response = NextResponse.json(
        { error: errorMessage },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );

      return { ok: false, remaining: 0, error: response };
    }

    entry.count += 1;
    return { ok: true, remaining: limit - entry.count, error: null };
  }

  return { check };
}

// ─── Pre-configured limiters ──────────────────────────────────

/**
 * Try-on generation: max 10 requests per user per 10 minutes.
 * Each generation costs ~$0.024, so 10 = ~$0.24 max per window.
 */
export const tryOnLimiter = createRateLimiter({
  limit: 10,
  windowMs: 10 * 60 * 1000,
  message: 'Límite de generaciones alcanzado. Espera unos minutos e inténtalo de nuevo.',
});

/**
 * Try-on status polling: max 120 requests per user per minute.
 * Polling every 3s for 3 minutes = 60 requests max in normal use.
 */
export const tryOnPollLimiter = createRateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
});

/**
 * General API: max 60 requests per user per minute.
 */
export const generalLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60 * 1000,
});
