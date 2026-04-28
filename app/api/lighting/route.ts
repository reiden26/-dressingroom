import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseImageUrl, lightingPrompt, garmentDescription } = body;

    if (!baseImageUrl || !lightingPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: baseImageUrl, lightingPrompt' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    const prompt = `${garmentDescription || 'fashion photography'}, ${lightingPrompt}, high quality, professional`;

    const prediction = await replicate.predictions.create({
      version: 'stability-ai/stable-diffusion-img2img:',
      input: {
        image: baseImageUrl,
        prompt: prompt,
        strength: 0.4,
        guidance_scale: 7.5,
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    });
  } catch (error) {
    console.error('Lighting regeneration API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to start lighting regeneration. Please try again.' },
      { status: 500 }
    );
  }
}
