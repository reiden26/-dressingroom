import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/api/requireAuth';
import { generalLimiter } from '@/lib/api/rateLimit';
import { poseRequestSchema, parseBody } from '@/lib/api/schemas';
import { isTryOnEnabled } from '@/lib/env';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const rateCheck = generalLimiter.check(auth.user.id);
  if (!rateCheck.ok) return rateCheck.error;

  if (!isTryOnEnabled) {
    return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503 });
  }

  const parsed = await parseBody(request, poseRequestSchema);
  if (parsed.error) return parsed.error;
  const { baseImageUrl, targetPose, stylePrompt, garmentDescription } = parsed.data;

  try {
    const prompt = `fashion photography, ${stylePrompt ?? garmentDescription ?? 'clothing'}, studio lighting, high quality`;

    const prediction = await replicate.predictions.create({
      version: 'jagilley/controlnet-pose:',
      input: {
        image: baseImageUrl,
        prompt,
        negative_prompt: 'deformed, blurry, low quality, bad anatomy, extra limbs, watermark, text',
        num_samples: 1,
        guidance_scale: 7.5,
        ip_adapter_weight: 0.7,
      },
    });

    return NextResponse.json({ predictionId: prediction.id, status: prediction.status });
  } catch (error) {
    console.error('[pose] error:', error);
    return NextResponse.json({ error: 'Error al iniciar la generación de pose.' }, { status: 500 });
  }
}
