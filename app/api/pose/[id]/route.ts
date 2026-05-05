import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/api/requireAuth';
import { generalLimiter } from '@/lib/api/rateLimit';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const PREDICTION_ID_REGEX = /^[a-z0-9]{10,30}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const rateCheck = generalLimiter.check(auth.user.id);
  if (!rateCheck.ok) return rateCheck.error;

  const { id } = await params;

  if (!id || !PREDICTION_ID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID de predicción inválido.' }, { status: 400 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503 });
  }

  try {
    const prediction = await replicate.predictions.get(id);

    const response: { id: string; status: string; outputUrl?: string; error?: string } = {
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
      response.error = 'La generación de pose falló.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[pose/poll] error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Predicción no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al consultar el estado.' }, { status: 500 });
  }
}
