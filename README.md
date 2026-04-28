# Vestidor Virtual - Virtual Fitting Room

Una aplicación web para probarte ropa virtualmente usando IA. Escanea tu cuerpo, selecciona prendas del catálogo y genera imágenes realistas de cómo te quedarían.

## Características

- **Escaneo corporal 3D**: Usa MediaPipe Pose para detectar tus puntos corporales
- **Medición precisa**: Calcula automáticamente: hombros, pecho, cintura, cadera, entrepierna, largo de brazo y torso
- **Recomendación de tallas**: Basado en tus medidas corporales
- **Virtual Try-On con IA**: Genera imágenes realistas de cómo te quedaría cada prenda usando IDM-VTON
- **Múltiples poses**: Verifica cómo te queda la ropa en diferentes poses
- **Filtros de iluminación**: Ajusta la iluminación y colores de las fotos generadas
- **PWA instalable**: Funciona como app en desktop y mobile

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Token de API de Replicate (gratuito en [replicate.com](https://replicate.com/account/api-tokens))

## Instalación

1. Clona el repositorio:
```bash
git clone <repo-url>
cd virtual-fitting-room
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.local.example .env.local
```

4. Edita `.env.local` y añade tu token de Replicate:
```
REPLICATE_API_TOKEN=tu_token_aqui
```

Para obtener tu token:
1. Ve a [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Crea un nuevo token o usa uno existente
3. Cópialo en `.env.local`

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

6. Abre [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── tryon/          # Virtual try-on endpoints
│   │   ├── pose/           # Pose generation endpoints
│   │   ├── lighting/      # Lighting adjustment endpoints
│   │   └── health/         # Health check
│   ├── scan/               # Escaneo corporal
│   ├── fitting/            # Catálogo y probador
│   └── profile/            # Perfil y medidas
├── components/
│   ├── camera/             # Componentes de cámara
│   ├── fitting/            # Componentes del probador
│   └── ui/                 # Componentes UI base
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y lógica de negocio
│   ├── measurementCalculator.ts
│   ├── anatomicalValidation.ts
│   ├── posePresets.ts
│   ├── lightingPresets.ts
│   ├── colorFilters.ts
│   ├── imageCompression.ts
│   └── ...
├── store/                  # Estado global (Zustand)
└── public/                 # Assets estáticos
    ├── workers/            # Web Workers
    └── manifest.json        # PWA manifest
```

## Páginas

### `/` - Inicio
Página principal con acceso rápido a escanear y explorar el catálogo.

### `/scan` - Escaneo Corporal
1. Ingresa tu altura
2. Captura 3 fotos: frontal, perfil y espalda
3. La IA detecta tus puntos corporales
4. Se calculan tus medidas automáticamente

### `/fitting` - Probador Virtual
1. Explora el catálogo de prendas
2. Selecciona una prenda
3. Genera una imagen de cómo te queda con IA
4. Verifica en diferentes poses
5. Ajusta iluminación y colores
6. Guarda tus looks favoritos

### `/profile` - Tu Perfil
- Visualiza tus medidas corporales
- Historial de looks generados
- Recomendaciones de tallas

## API Routes

### `/api/tryon`
Inicia una predicción de virtual try-on.

```typescript
POST /api/tryon
Body: {
  personImageBase64: string,
  garmentImageBase64: string,
  garmentDescription: string,
  garmentId: string
}
Response: { predictionId: string, status: string }
```

### `/api/tryon/[id]`
Consulta el estado de una predicción.

```typescript
GET /api/tryon/[id]
Response: {
  id: string,
  status: 'starting' | 'processing' | 'succeeded' | 'failed',
  outputUrl?: string,
  error?: string
}
```

### `/api/pose`
Genera una pose diferente para un look existente.

```typescript
POST /api/pose
Body: {
  baseImageUrl: string,
  targetPose: 'standing_natural' | 'walking' | 'sitting' | 'arms_raised',
  stylePrompt: string
}
```

### `/api/lighting`
Regenera una imagen con diferente iluminación usando img2img.

```typescript
POST /api/lighting
Body: {
  baseImageUrl: string,
  lightingPrompt: string
}
```

## Modelos de IA Utilizados

- **MediaPipe Pose**: Detección de pose (33 landmark points)
- **IDM-VTON (cuuupid/idm-vton)**: Virtual try-on via Replicate
- **Stable Diffusion img2img**: Regeneración con iluminación

## Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Linting con Next.js
npm run test         # Tests con Vitest
npm run test:run     # Tests sin watch mode
```

### Tests E2E con Playwright

```bash
# Instalar Playwright (si no está)
npx playwright install chromium

# Ejecutar tests
npm run test:e2e

# Con UI
npx playwright test --ui
```

### Limitaciones Conocidas

1. **Imágenes de catálogo**: El catálogo usa imágenes de placeholder (picsum). En producción, las tiendas deberían fornecer imágenes reales de sus prendas.

2. **Rate Limits de Replicate**: El plan gratuito tiene límites. El sistema implementa cola con máximo 3 requests simultáneos.

3. **Precisión de Medidas**: Las medidas son estimaciones basadas en proporciones. Para mayor precisión, se necesitaría calibración adicional.

4. **Servicio de Cámara**: Requiere HTTPS o localhost para acceso a la cámara.

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Next.js API  │────▶│  Replicate  │
│   (React)   │◀────│   Routes     │◀────│    API      │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       │            │  IndexedDB    │
       │            │  (idb)       │
       │            └──────────────┘
       │
       ▼
┌─────────────┐
│  MediaPipe  │  (Pose Detection - Client Side)
│    Pose     │
└─────────────┘
```

## Licencia

MIT
