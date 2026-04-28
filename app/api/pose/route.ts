import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseImageUrl, targetPose, stylePrompt, garmentDescription } = body;

    if (!baseImageUrl || !targetPose) {
      return NextResponse.json(
        { error: 'Missing required fields: baseImageUrl, targetPose' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    const prompt = `fashion photography, ${stylePrompt || garmentDescription || 'clothing'}, studio lighting, high quality, consistent with the person in the reference image`;
    const negativePrompt = 'deformed, blurry, low quality, bad anatomy, extra limbs, watermark, text';

    const prediction = await replicate.predictions.create({
      version: 'jagilley/controlnet-pose:',
      input: {
        image: baseImageUrl,
        prompt: prompt,
        negative_prompt: negativePrompt,
        num_samples: 1,
        guidance_scale: 7.5,
        ip_adapter_weight: 0.7,
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    });
  } catch (error) {
    console.error('Pose API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to start pose generation. Please try again.' },
      { status: 500 }
    );
  }
}
