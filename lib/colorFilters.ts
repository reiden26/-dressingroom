export type ColorFilterId = 'normal' | 'bw' | 'warm' | 'cool' | 'vintage';

export interface ColorFilter {
  id: ColorFilterId;
  name: string;
  icon: string;
  matrix?: number[];
}

const identityMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const bwMatrix = [
  0.33, 0.33, 0.33, 0, 0,
  0.33, 0.33, 0.33, 0, 0,
  0.33, 0.33, 0.33, 0, 0,
  0, 0, 0, 1, 0,
];

const warmMatrix = [
  1.2, 0, 0, 0, 0,
  0, 1.1, 0, 0, 0,
  0, 0, 0.9, 0, 0,
  0, 0, 0, 1, 0,
];

const coolMatrix = [
  0.9, 0, 0, 0, 0,
  0, 1.0, 0, 0, 0,
  0, 0, 1.2, 0, 0,
  0, 0, 0, 1, 0,
];

const vintageMatrix = [
  1.1, 0.1, 0, 0, 0,
  0.05, 0.9, 0.05, 0, 0,
  0, 0.05, 0.8, 0, 0,
  0, 0, 0, 1, 0,
];

export const COLOR_FILTERS: Record<ColorFilterId, ColorFilter> = {
  normal: {
    id: 'normal',
    name: 'Normal',
    icon: '🎨',
    matrix: identityMatrix,
  },
  bw: {
    id: 'bw',
    name: 'B&W',
    icon: '⬜',
    matrix: bwMatrix,
  },
  warm: {
    id: 'warm',
    name: 'Cálido',
    icon: '🟠',
    matrix: warmMatrix,
  },
  cool: {
    id: 'cool',
    name: 'Frío',
    icon: '🔵',
    matrix: coolMatrix,
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    icon: '📷',
    matrix: vintageMatrix,
  },
};

export const COLOR_FILTER_LIST = Object.values(COLOR_FILTERS);

export function getColorFilter(id: ColorFilterId): ColorFilter {
  return COLOR_FILTERS[id];
}

export function applyColorMatrix(
  imageData: ImageData,
  matrix: number[]
): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    data[i] = Math.min(255, r * matrix[0] + g * matrix[1] + b * matrix[2] + a * matrix[3] + matrix[4] * 255);
    data[i + 1] = Math.min(255, r * matrix[5] + g * matrix[6] + b * matrix[7] + a * matrix[8] + matrix[9] * 255);
    data[i + 2] = Math.min(255, r * matrix[10] + g * matrix[11] + b * matrix[12] + a * matrix[13] + matrix[14] * 255);
    data[i + 3] = a;
  }

  return imageData;
}

export function applySepia(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }

  return imageData;
}

export function exportWithFilter(imageUrl: string, filterId: ColorFilterId): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);

      if (filterId === 'normal') {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
        return;
      }

      const filter = COLOR_FILTERS[filterId];
      if (!filter?.matrix) {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const processedData = applyColorMatrix(imageData, filter.matrix);
      ctx.putImageData(processedData, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => resolve(null);
  });
}
