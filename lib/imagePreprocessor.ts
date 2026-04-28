import type { ImageValidationResult, PreprocessedImages } from './vtonTypes';

const MIN_WIDTH = 512;
const MIN_HEIGHT = 682;
const TARGET_RATIO = 3 / 4;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return loadImage(dataUrl);
}

export async function imageToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  const scale = Math.max(
    targetWidth / img.width,
    targetHeight / img.height
  );
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;

  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  return canvas;
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function validateBase64Image(
  base64: string
): Promise<ImageValidationResult> {
  try {
    const img = await loadImage(base64);

    if (img.width < 64 || img.height < 64) {
      return { valid: false, error: 'Image too small (min 64x64)' };
    }

    return {
      valid: true,
      base64,
      width: img.width,
      height: img.height,
    };
  } catch {
    return { valid: false, error: 'Invalid image format' };
  }
}

export async function preparePersonImage(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);

  let targetWidth = img.width;
  let targetHeight = img.height;

  if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
    const scaleW = MIN_WIDTH / img.width;
    const scaleH = MIN_HEIGHT / img.height;
    const scale = Math.max(scaleW, scaleH);
    targetWidth = Math.round(img.width * scale);
    targetHeight = Math.round(img.height * scale);
  }

  targetWidth = Math.round(targetWidth / 8) * 8;
  targetHeight = Math.round(targetHeight / 8) * 8;

  const canvas = await imageToCanvas(img, targetWidth, targetHeight);
  return canvasToDataUrl(canvas);
}

export async function prepareGarmentImage(imageUrl: string): Promise<string> {
  let base64 = imageUrl;

  if (imageUrl.startsWith('http')) {
    base64 = await fetchImageAsBase64(imageUrl);
  }

  const img = await loadImage(base64);

  const maxDimension = 1024;
  let targetWidth = img.width;
  let targetHeight = img.height;

  if (img.width > maxDimension || img.height > maxDimension) {
    const scale = maxDimension / Math.max(img.width, img.height);
    targetWidth = Math.round(img.width * scale);
    targetHeight = Math.round(img.height * scale);
  }

  targetWidth = Math.round(targetWidth / 8) * 8;
  targetHeight = Math.round(targetHeight / 8) * 8;

  const canvas = await imageToCanvas(img, targetWidth, targetHeight);
  return canvasToDataUrl(canvas);
}

export async function prepareImagesForTryOn(
  personDataUrl: string,
  garmentImageUrl: string
): Promise<PreprocessedImages> {
  const [personImageBase64, garmentImageBase64] = await Promise.all([
    preparePersonImage(personDataUrl),
    prepareGarmentImage(garmentImageUrl),
  ]);

  return { personImageBase64, garmentImageBase64 };
}

export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
