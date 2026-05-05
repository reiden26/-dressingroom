export interface GarmentSize {
  size: string;
  chest: number;
  waist: number;
  hips: number;
  length: number;
  shoulders: number;
}

export interface MockGarment {
  id: string;
  name: string;
  brand: string;
  category: 'top' | 'bottom' | 'dress' | 'outerwear';
  imageUrl: string;
  sizes: GarmentSize[];
  material: string;
  price: number;
  color: string;
}

export const MOCK_CATALOG: MockGarment[] = [
  {
    id: '1',
    name: 'Camiseta Basica Blanca',
    brand: 'NORDIST',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
    sizes: [
      { size: 'XS', chest: 84, waist: 84, hips: 86, length: 66, shoulders: 38 },
      { size: 'S',  chest: 88, waist: 88, hips: 90, length: 68, shoulders: 40 },
      { size: 'M',  chest: 94, waist: 94, hips: 96, length: 70, shoulders: 42 },
      { size: 'L',  chest: 100, waist: 100, hips: 102, length: 72, shoulders: 44 },
      { size: 'XL', chest: 108, waist: 108, hips: 110, length: 74, shoulders: 46 },
    ],
    color: 'Blanco',
    material: '100% Algodón',
    price: 29.90,
  },
  {
    id: '2',
    name: 'Camiseta Oversize Negra',
    brand: 'NORDIST',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S',  chest: 96,  waist: 96,  hips: 98,  length: 72, shoulders: 44 },
      { size: 'M',  chest: 102, waist: 102, hips: 104, length: 74, shoulders: 46 },
      { size: 'L',  chest: 108, waist: 108, hips: 110, length: 76, shoulders: 48 },
      { size: 'XL', chest: 116, waist: 116, hips: 118, length: 78, shoulders: 50 },
    ],
    color: 'Negro',
    material: '95% Algodón, 5% Elastano',
    price: 34.90,
  },
  {
    id: '3',
    name: 'Top Deportivo Azul',
    brand: 'STREETFIT',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=600&fit=crop',
    sizes: [
      { size: 'XS', chest: 80, waist: 78, hips: 82, length: 40, shoulders: 36 },
      { size: 'S',  chest: 84, waist: 82, hips: 86, length: 42, shoulders: 38 },
      { size: 'M',  chest: 90, waist: 88, hips: 92, length: 44, shoulders: 40 },
      { size: 'L',  chest: 96, waist: 94, hips: 98, length: 46, shoulders: 42 },
    ],
    color: 'Azul',
    material: 'Polyester Deportivo',
    price: 39.90,
  },
  {
    id: '4',
    name: 'Camisa de Lino Beige',
    brand: 'LINEN&CO',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S',  chest: 92,  waist: 90,  hips: 94,  length: 72, shoulders: 42 },
      { size: 'M',  chest: 98,  waist: 96,  hips: 100, length: 74, shoulders: 44 },
      { size: 'L',  chest: 104, waist: 102, hips: 106, length: 76, shoulders: 46 },
      { size: 'XL', chest: 112, waist: 110, hips: 114, length: 78, shoulders: 48 },
    ],
    color: 'Beige',
    material: '100% Lino',
    price: 59.90,
  },
  {
    id: '5',
    name: 'Jeans Slim Azul Oscuro',
    brand: 'DENIMLAB',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
    sizes: [
      { size: '28', chest: 0, waist: 72, hips: 90,  length: 100, shoulders: 0 },
      { size: '30', chest: 0, waist: 76, hips: 94,  length: 102, shoulders: 0 },
      { size: '32', chest: 0, waist: 82, hips: 98,  length: 104, shoulders: 0 },
      { size: '34', chest: 0, waist: 88, hips: 104, length: 106, shoulders: 0 },
      { size: '36', chest: 0, waist: 94, hips: 108, length: 108, shoulders: 0 },
    ],
    color: 'Azul Oscuro',
    material: '98% Algodón, 2% Elastano',
    price: 69.90,
  },
  {
    id: '6',
    name: 'Pantalón Cargo Verde',
    brand: 'URBANOUT',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S',  chest: 0, waist: 74, hips: 96,  length: 100, shoulders: 0 },
      { size: 'M',  chest: 0, waist: 80, hips: 102, length: 102, shoulders: 0 },
      { size: 'L',  chest: 0, waist: 86, hips: 108, length: 104, shoulders: 0 },
      { size: 'XL', chest: 0, waist: 92, hips: 114, length: 106, shoulders: 0 },
    ],
    color: 'Verde',
    material: 'Algodón Pesado',
    price: 79.90,
  },
  {
    id: '7',
    name: 'Falda Midi Negra',
    brand: 'MINIMAL',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=600&fit=crop',
    sizes: [
      { size: 'XS', chest: 0, waist: 64, hips: 88,  length: 75, shoulders: 0 },
      { size: 'S',  chest: 0, waist: 68, hips: 92,  length: 76, shoulders: 0 },
      { size: 'M',  chest: 0, waist: 74, hips: 98,  length: 78, shoulders: 0 },
      { size: 'L',  chest: 0, waist: 80, hips: 104, length: 80, shoulders: 0 },
    ],
    color: 'Negro',
    material: '97% Algodón, 3% Elastano',
    price: 49.90,
  },
  {
    id: '8',
    name: 'Vestido Slip Gris',
    brand: 'SLEEKWEAR',
    category: 'dress',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
    sizes: [
      { size: 'XS', chest: 82, waist: 66, hips: 88,  length: 105, shoulders: 36 },
      { size: 'S',  chest: 86, waist: 70, hips: 92,  length: 106, shoulders: 38 },
      { size: 'M',  chest: 92, waist: 76, hips: 98,  length: 108, shoulders: 40 },
      { size: 'L',  chest: 98, waist: 82, hips: 104, length: 110, shoulders: 42 },
    ],
    color: 'Gris',
    material: 'Silk Satin',
    price: 89.90,
  },
  {
    id: '9',
    name: 'Vestido Midi Floral',
    brand: 'BOTANICA',
    category: 'dress',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S', chest: 86, waist: 70, hips: 94,  length: 115, shoulders: 38 },
      { size: 'M', chest: 92, waist: 76, hips: 100, length: 116, shoulders: 40 },
      { size: 'L', chest: 98, waist: 82, hips: 106, length: 118, shoulders: 42 },
    ],
    color: 'Floral',
    material: '100% Viscosa',
    price: 74.90,
  },
  {
    id: '10',
    name: 'Vestido Body Negro',
    brand: 'BASIC',
    category: 'dress',
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=600&fit=crop',
    sizes: [
      { size: 'XS', chest: 80, waist: 64, hips: 86,  length: 85, shoulders: 36 },
      { size: 'S',  chest: 84, waist: 68, hips: 90,  length: 86, shoulders: 38 },
      { size: 'M',  chest: 90, waist: 74, hips: 96,  length: 88, shoulders: 40 },
      { size: 'L',  chest: 96, waist: 80, hips: 102, length: 90, shoulders: 42 },
    ],
    color: 'Negro',
    material: '92% Algodón, 8% Elastano',
    price: 44.90,
  },
  {
    id: '11',
    name: 'Chaqueta Denim Clásica',
    brand: 'DENIMLAB',
    category: 'outerwear',
    imageUrl: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S',  chest: 96,  waist: 94,  hips: 98,  length: 62, shoulders: 42 },
      { size: 'M',  chest: 102, waist: 100, hips: 104, length: 64, shoulders: 44 },
      { size: 'L',  chest: 108, waist: 106, hips: 110, length: 66, shoulders: 46 },
      { size: 'XL', chest: 116, waist: 114, hips: 118, length: 68, shoulders: 48 },
    ],
    color: 'Azul Denim',
    material: '100% Algodón Denim',
    price: 119.90,
  },
  {
    id: '12',
    name: 'Blazer Estructurado Negro',
    brand: 'OFFICE',
    category: 'outerwear',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop',
    sizes: [
      { size: 'S',  chest: 94,  waist: 90,  hips: 98,  length: 72, shoulders: 40 },
      { size: 'M',  chest: 100, waist: 96,  hips: 104, length: 74, shoulders: 42 },
      { size: 'L',  chest: 106, waist: 102, hips: 110, length: 76, shoulders: 44 },
      { size: 'XL', chest: 114, waist: 110, hips: 118, length: 78, shoulders: 46 },
    ],
    color: 'Negro',
    material: '80% Lana, 20% Polyester',
    price: 149.90,
  },
];

export function findMatchingSize(
  garment: MockGarment,
  userMeasurements: { chest?: number; waist?: number; hips?: number; shoulders?: number }
): { size: GarmentSize | null; match: 'perfect' | 'approximate' | 'none' } {
  const tolerance = 4;
  for (const size of garment.sizes) {
    let chestMatch = true;
    let waistMatch = true;
    let hipsMatch = true;
    let shouldersMatch = true;
    if (userMeasurements.chest && size.chest > 0) {
      chestMatch = Math.abs(size.chest - userMeasurements.chest) <= tolerance;
    }
    if (userMeasurements.waist && size.waist > 0) {
      waistMatch = Math.abs(size.waist - userMeasurements.waist) <= tolerance;
    }
    if (userMeasurements.hips && size.hips > 0) {
      hipsMatch = Math.abs(size.hips - userMeasurements.hips) <= tolerance;
    }
    if (userMeasurements.shoulders && size.shoulders > 0) {
      shouldersMatch = Math.abs(size.shoulders - userMeasurements.shoulders) <= tolerance;
    }
    if (chestMatch && waistMatch && hipsMatch && shouldersMatch) {
      return { size, match: 'perfect' };
    }
  }
  for (const size of garment.sizes) {
    let hasApproximate = false;
    if (userMeasurements.chest && size.chest > 0) {
      if (Math.abs(size.chest - userMeasurements.chest) <= tolerance * 2) {
        hasApproximate = true;
      }
    }
    if (userMeasurements.waist && size.waist > 0) {
      if (Math.abs(size.waist - userMeasurements.waist) <= tolerance * 2) {
        hasApproximate = true;
      }
    }
    if (hasApproximate) {
      return { size, match: 'approximate' };
    }
  }
  return { size: null, match: 'none' };
}

export function getSizeRecommendations(garment: MockGarment): string[] {
  return garment.sizes.map(s => s.size);
}
