/**
 * Server-side auth guard for API routes.
 *
 * Usage:
 *   const { user, error } = await requireAuth(request);
 *   if (error) return error; // NextResponse with 401
 */
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

interface AuthResult {
  user: User;
  error: null;
}

interface AuthError {
  user: null;
  error: NextResponse;
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // API routes don't need to set cookies — session is read-only here
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado. Inicia sesión para continuar.' },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}
