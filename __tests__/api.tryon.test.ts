import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────

vi.mock('@/lib/api/requireAuth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  tryOnLimiter: { check: vi.fn() },
  tryOnPollLimiter: { check: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  env: { REPLICATE_API_TOKEN: 'r8_test_token' },
  isTryOnEnabled: true,
}));

vi.mock('replicate', () => ({
  default: vi.fn().mockImplementation(() => ({
    predictions: {
      create: vi.fn(),
      get: vi.fn(),
    },
  })),
}));

import { requireAuth } from '@/lib/api/requireAuth';
import { tryOnLimiter, tryOnPollLimiter } from '@/lib/api/rateLimit';
import Replicate from 'replicate';

const mockRequireAuth = vi.mocked(requireAuth);
const mockTryOnLimiter = vi.mocked(tryOnLimiter);
const mockTryOnPollLimiter = vi.mocked(tryOnPollLimiter);

const FAKE_USER = { id: 'user-123', email: 'test@example.com' };
const VALID_IMAGE = `data:image/jpeg;base64,${'A'.repeat(200)}`;

function authOk() {
  mockRequireAuth.mockResolvedValue({ user: FAKE_USER as any, error: null });
}

function rateLimitOk() {
  mockTryOnLimiter.check.mockReturnValue({ ok: true, remaining: 9, error: null });
  mockTryOnPollLimiter.check.mockReturnValue({ ok: true, remaining: 119, error: null });
}

function makePostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/tryon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/tryon ──────────────────────────────────────────

describe('POST /api/tryon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    mockRequireAuth.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 }) as any,
    });

    const req = makePostRequest({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue jacket',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limit exceeded', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    authOk();
    mockTryOnLimiter.check.mockReturnValue({
      ok: false,
      remaining: 0,
      error: new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429 }) as any,
    });

    const req = makePostRequest({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue jacket',
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 422 when body is invalid', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    authOk();
    rateLimitOk();

    const req = makePostRequest({
      personImageBase64: VALID_IMAGE,
      // missing garmentImageBase64 and garmentDescription
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('returns 422 when garmentDescription is empty', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    authOk();
    rateLimitOk();

    const req = makePostRequest({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: '',
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('returns 200 with predictionId on success', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    authOk();
    rateLimitOk();

    const mockReplicate = new (Replicate as any)();
    mockReplicate.predictions.create.mockResolvedValue({
      id: 'pred-abc123',
      status: 'starting',
    });
    vi.mocked(Replicate).mockImplementation(() => mockReplicate);

    const req = makePostRequest({
      personImageBase64: VALID_IMAGE,
      garmentImageBase64: VALID_IMAGE,
      garmentDescription: 'Blue denim jacket',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('predictionId');
    expect(body).toHaveProperty('status');
  });

  it('returns 400 when body is not valid JSON', async () => {
    const { POST } = await import('@/app/api/tryon/route');
    authOk();
    rateLimitOk();

    const req = new NextRequest('http://localhost:3000/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{{',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/tryon/[id] ──────────────────────────────────────

describe('GET /api/tryon/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/tryon/[id]/route');
    mockRequireAuth.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 }) as any,
    });

    const req = new NextRequest('http://localhost:3000/api/tryon/abc123def456');
    const res = await GET(req, { params: Promise.resolve({ id: 'abc123def456' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid prediction ID format', async () => {
    const { GET } = await import('@/app/api/tryon/[id]/route');
    authOk();
    mockTryOnPollLimiter.check.mockReturnValue({ ok: true, remaining: 119, error: null });

    const req = new NextRequest('http://localhost:3000/api/tryon/invalid-id!');
    const res = await GET(req, { params: Promise.resolve({ id: 'invalid-id!' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 for path traversal attempt', async () => {
    const { GET } = await import('@/app/api/tryon/[id]/route');
    authOk();
    mockTryOnPollLimiter.check.mockReturnValue({ ok: true, remaining: 119, error: null });

    const req = new NextRequest('http://localhost:3000/api/tryon/../secrets');
    const res = await GET(req, { params: Promise.resolve({ id: '../secrets' }) });
    expect(res.status).toBe(400);
  });

  it('returns prediction status on success', async () => {
    const { GET } = await import('@/app/api/tryon/[id]/route');
    authOk();
    mockTryOnPollLimiter.check.mockReturnValue({ ok: true, remaining: 119, error: null });

    const mockReplicate = new (Replicate as any)();
    mockReplicate.predictions.get.mockResolvedValue({
      id: 'abc123def456',
      status: 'processing',
      output: null,
    });
    vi.mocked(Replicate).mockImplementation(() => mockReplicate);

    const req = new NextRequest('http://localhost:3000/api/tryon/abc123def456');
    const res = await GET(req, { params: Promise.resolve({ id: 'abc123def456' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('processing');
  });
});
