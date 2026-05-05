import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock @supabase/ssr before importing requireAuth ─────────
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@supabase/ssr';
import { requireAuth } from '@/lib/api/requireAuth';

const mockCreateServerClient = vi.mocked(createServerClient);

function makeRequest(cookies: Record<string, string> = {}): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/tryon', {
    method: 'POST',
  });
  Object.entries(cookies).forEach(([name, value]) => {
    req.cookies.set(name, value);
  });
  return req;
}

function mockSupabaseUser(user: object | null) {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'Not authenticated' },
      }),
    },
  } as any);
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user when session is valid', async () => {
    const fakeUser = { id: 'user-123', email: 'test@example.com' };
    mockSupabaseUser(fakeUser);

    const result = await requireAuth(makeRequest());

    expect(result.error).toBeNull();
    expect(result.user).toEqual(fakeUser);
  });

  it('returns 401 when no session exists', async () => {
    mockSupabaseUser(null);

    const result = await requireAuth(makeRequest());

    expect(result.user).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
  });

  it('returns 401 error response with correct message', async () => {
    mockSupabaseUser(null);

    const result = await requireAuth(makeRequest());

    if (result.error) {
      const body = await result.error.json();
      expect(body.error).toContain('No autorizado');
    }
  });

  it('passes cookies from request to Supabase client', async () => {
    const fakeUser = { id: 'user-456', email: 'user@example.com' };
    mockSupabaseUser(fakeUser);

    const req = makeRequest({ 'sb-access-token': 'fake-token' });
    await requireAuth(req);

    // Verify createServerClient was called with a cookies config object
    expect(mockCreateServerClient).toHaveBeenCalledOnce();
    const callArgs = mockCreateServerClient.mock.calls[0];
    // Third argument should be the cookies config
    expect(callArgs[2]).toMatchObject({
      cookies: {
        getAll: expect.any(Function),
        setAll: expect.any(Function),
      },
    });
  });
});
