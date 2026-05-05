import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimiter } from '@/lib/api/rateLimit';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });

    expect(limiter.check('user1').ok).toBe(true);
    expect(limiter.check('user1').ok).toBe(true);
    expect(limiter.check('user1').ok).toBe(true);
  });

  it('blocks requests that exceed the limit', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });

    limiter.check('user1');
    limiter.check('user1');
    const result = limiter.check('user1');

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns a 429 NextResponse when blocked', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limiter.check('user1');
    const result = limiter.check('user1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(429);
    }
  });

  it('tracks different users independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limiter.check('user1');
    const user1Result = limiter.check('user1');
    const user2Result = limiter.check('user2');

    expect(user1Result.ok).toBe(false);
    expect(user2Result.ok).toBe(true);
  });

  it('resets after the window expires', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limiter.check('user1');
    expect(limiter.check('user1').ok).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61_000);

    expect(limiter.check('user1').ok).toBe(true);
  });

  it('decrements remaining count correctly', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

    const r1 = limiter.check('user1');
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.remaining).toBe(4);

    const r2 = limiter.check('user1');
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.remaining).toBe(3);
  });

  it('uses custom message when provided', async () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      message: 'Custom limit message',
    });

    limiter.check('user1');
    const result = limiter.check('user1');

    if (!result.ok) {
      const body = await result.error.json();
      expect(body.error).toBe('Custom limit message');
    }
  });
});
