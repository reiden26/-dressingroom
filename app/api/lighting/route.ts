import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/api/requireAuth';
import { generalLimiter } from '@/lib/api/rateLimit';
import { lightingRequestSchema, parseBody } from '@/lib/api/schemas';
import { env, isTryOnEnabled } from '@/lib/env';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const rateCheck = generalLimiter.check(auth.user.id);
  if (!rateCheck.ok) return rateCheck.error;

  if (!isTryOnEnabled) {
    return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503 });
  }

  const parsed = await parseBody(request, lightingRequestSchema);
  if (parsed.error) return parsed.error;
  const { baseImageUrl, lightingPrompt, garmentDescription } = parsed.data;

  try {
    const prompt = `${garmentDescription ?? 'fashion photography'}, ${lightingPrompt}, high quality, professional`;

    const prediction = await replicate.predictions.create({
      version: 'stability-ai/stable-diffusion-img2img:',
      input: { image: baseImageUrl, prompt, strength: 0.4, guidance_scale: 7.5 },
    });

    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    console.error('[lighting] error:', error);
    return NextResponse.json({ error: 'Error al iniciar la regeneración.' }, { status: 500 });
  }
}
