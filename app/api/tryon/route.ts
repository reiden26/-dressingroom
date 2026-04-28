import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODEL_VERSION = 'cuuupid/idm-vton:fa79c38c7f4b7e0d0c9e18d7e0c9e18d7e0c9e18d7e0c9e18d7e0c9e18d7e0c9';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personImageBase64, garmentImageBase64, garmentDescription, garmentId } = body;

    if (!personImageBase64 || !garmentImageBase64 || !garmentDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: personImageBase64, garmentImageBase64, garmentDescription' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    const personImageUrl = `data:image/png;base64,${personImageBase64.replace(/^data:image\/\w+;base64,/, '')}`;
    const garmentImageUrl = `data:image/png;base64,${garmentImageBase64.replace(/^data:image\/\w+;base64,/, '')}`;

    const prediction = await replicate.predictions.create({
      version: MODEL_VERSION,
      input: {
        human_img: personImageUrl,
        garm_img: garmentImageUrl,
        garment_des: garmentDescription,
      },
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
    });
  } catch (error) {
    console.error('TryOn API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      if (error.message.includes('invalid') || error.message.includes('image')) {
        return NextResponse.json(
          { error: 'Invalid image provided. Please ensure images are valid PNG/JPG format.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to start try-on prediction. Please try again.' },
      { status: 500 }
    );
  }
}
