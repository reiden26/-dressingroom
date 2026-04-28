export interface TryOnRequest {
  personImageBase64: string;
  garmentImageBase64: string;
  garmentDescription: string;
  garmentId: string;
}

export interface TryOnResponse {
  predictionId: string;
  status: 'pending';
  error?: string;
}

export interface TryOnStatusResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  outputUrl?: string;
  error?: string;
}

export interface QueuedTryOn {
  predictionId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  outputUrl?: string;
  garmentId: string;
  garmentImageUrl: string;
  createdAt: number;
  error?: string;
}

export interface TryOnQueueState {
  items: QueuedTryOn[];
  maxConcurrent: number;
}

export interface PreprocessedImages {
  personImageBase64: string;
  garmentImageBase64: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  base64?: string;
  width?: number;
  height?: number;
}
