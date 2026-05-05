import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/api/requireAuth';
import { tryOnLimiter } from '@/lib/api/rateLimit';
import { tryOnRequestSchema, parseBody } from '@/lib/api/schemas';
import { env, isTryOnEnabled } from '@/lib/env';

const MODEL = 'cuuupid/idm-vton';

export async function POST(request: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // ── 2. Rate limit ────────────────────────────────────────────
  const rateCheck = tryOnLimiter.check(auth.user.id);
  if (!rateCheck.ok) return rateCheck.error;

  // ── 3. Service availability ──────────────────────────────────
  if (!isTryOnEnabled) {
    return NextResponse.json(
      { error: 'El servicio de prueba virtual no está configurado.' },
      { status: 503 }
    );
  }

  // ── 4. Validate body with Zod ────────────────────────────────
  const parsed = await parseBody(request, tryOnRequestSchema);
  if (parsed.error) return parsed.error;
  const { personImageBase64, garmentImageBase64, garmentDescription } = parsed.data;

  // ── 5. Call Replicate ─────────────────────────────────────────
  const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

  const toDataUrl = (b64: string, mime = 'image/jpeg') =>
    b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;

  try {
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        human_img:       toDataUrl(personImageBase64),
        garm_img:        toDataUrl(garmentImageBase64),
        garment_des:     garmentDescription,
        is_checked:      true,
        is_checked_crop: false,
        denoise_steps:   30,
        seed:            42,
      },
    });

    return NextResponse.json(
      { predictionId: prediction.id, status: prediction.status },
      { headers: { 'X-RateLimit-Remaining': String(rateCheck.remaining) } }
    );
  } catch (error) {
    console.error('[tryon] POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Límite de Replicate alcanzado. Espera un momento.' },
          { status: 429 }
        );
      }
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // Don't expose token details — log server-side only
        console.error('[tryon] Replicate auth failed — check REPLICATE_API_TOKEN');
        return NextResponse.json(
          { error: 'Error de configuración del servicio.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error al iniciar la generación. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
