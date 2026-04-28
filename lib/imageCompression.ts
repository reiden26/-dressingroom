export interface CompressionOptions {
  maxSizeKB: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface CompressionResult {
  dataUrl: string;
  sizeKB: number;
  width: number;
  height: number;
}

export async function compressImage(
  dataUrl: string,
  options: CompressionOptions
): Promise<CompressionResult> {
  const { maxSizeKB, maxWidth = 1024, maxHeight = 1024, quality = 0.9 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let result = canvas.toDataURL('image/jpeg', currentQuality);

        while (result.length > maxSizeKB * 1024 && currentQuality > 0.1) {
          currentQuality -= 0.1;
          result = canvas.toDataURL('image/jpeg', currentQuality);
        }

        const sizeKB = Math.round((result.length - result.indexOf(',') - 1) * 0.75 / 1024);

        resolve({
          dataUrl: result,
          sizeKB,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export async function createThumbnail(
  dataUrl: string,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const scale = Math.max(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export function getImageSizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  return Math.round((base64.length - base64.indexOf(',') - 1) * 0.75 / 1024);
}
