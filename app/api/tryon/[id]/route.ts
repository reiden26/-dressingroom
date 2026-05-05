import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/api/requireAuth';
import { tryOnPollLimiter } from '@/lib/api/rateLimit';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Prediction IDs from Replicate are alphanumeric strings
const PREDICTION_ID_REGEX = /^[a-z0-9]{10,30}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth ──────────────────────────────────────────────────
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  // ── 2. Rate limit ────────────────────────────────────────────
  const rateCheck = tryOnPollLimiter.check(user.id);
  if (!rateCheck.ok) return rateCheck.error;

  // ── 3. Validate prediction ID ────────────────────────────────
  const { id } = await params;

  if (!id || !PREDICTION_ID_REGEX.test(id)) {
    return NextResponse.json(
      { error: 'ID de predicción inválido.' },
      { status: 400 }
    );
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Servicio no configurado.' },
      { status: 503 }
    );
  }

  // ── 4. Poll Replicate ─────────────────────────────────────────
  try {
    const prediction = await replicate.predictions.get(id);

    const response: {
      id: string;
      status: string;
      outputUrl?: string;
      error?: string;
    } = {
      id: prediction.id,
      status: prediction.status,
    };

    if (prediction.status === 'succeeded' && prediction.output) {
      const output = prediction.output;
      if (Array.isArray(output) && output.length > 0) {
        response.outputUrl = typeof output[0] === 'string' ? output[0] : undefined;
      } else if (typeof output === 'string') {
        response.outputUrl = output;
      }
    }

    if (prediction.status === 'failed') {
      response.error = 'La generación falló. Inténtalo de nuevo.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[tryon/poll] error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Predicción no encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al consultar el estado.' },
      { status: 500 }
    );
  }
}
