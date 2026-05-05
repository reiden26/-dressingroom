/**
 * Environment variable validation.
 *
 * Validates all required env vars at startup using Zod.
 * Fails fast with a clear error message instead of cryptic runtime failures.
 *
 * Import this file in any server-side code that needs env vars:
 *   import { env } from '@/lib/env';
 *   env.REPLICATE_API_TOKEN  // typed, validated string
 */
import { z } from 'zod';

const serverEnvSchema = z.object({
  // Supabase — required for auth and database
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears too short'),

  // Replicate — optional (try-on feature disabled if missing)
  REPLICATE_API_TOKEN: z
    .string()
    .startsWith('r8_', 'REPLICATE_API_TOKEN must start with r8_')
    .optional()
    .or(z.literal('')),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    REPLICATE_API_TOKEN:           process.env.REPLICATE_API_TOKEN,
    NODE_ENV:                      process.env.NODE_ENV,
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    // In production, throw hard. In dev, warn but continue.
    const message = `\n❌ Invalid environment variables:\n${missing}\n\nCheck your .env.local file.\n`;

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    } else {
      console.warn(message);
      // Return partial result so dev server still starts
      return result.error.issues.reduce(
        (acc, _) => acc,
        process.env as unknown as ServerEnv
      );
    }
  }

  return result.data;
}

// Singleton — validated once at module load time
export const env = validateEnv();

/** True when the try-on feature is available */
export const isTryOnEnabled =
  typeof env.REPLICATE_API_TOKEN === 'string' &&
  env.REPLICATE_API_TOKEN.startsWith('r8_');
