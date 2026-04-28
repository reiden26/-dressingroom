import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

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
      response.error = prediction.error?.toString() || 'Prediction failed';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('TryOn status polling error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get prediction status' },
      { status: 500 }
    );
  }
}
