/**
 * Monitoring helpers — thin wrappers around Sentry.
 * Using wrappers instead of calling Sentry directly means you can
 * swap the monitoring provider without touching every call site.
 */
import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception and send it to Sentry.
 * Use this for non-fatal errors that should be tracked but don't crash the UI.
 *
 * @example
 * captureError(err, { context: 'saveScanToSupabase', userId });
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[captureError]', error, context);
    return;
  }

  Sentry.captureException(error, { extra: context });
}

/**
 * Capture a message (non-error event) for tracking important events.
 *
 * @example
 * captureMessage('Scan completed', { userId, confidence: 0.85 });
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.info('[captureMessage]', message, context);
    return;
  }

  Sentry.captureMessage(message, { extra: context });
}

/**
 * Set the current user context for all subsequent Sentry events.
 * Call this after login and clear it after logout.
 */
export function setUser(user: { id: string; email?: string } | null): void {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Wrap an async function with error capture.
 * Runs the function and captures any thrown error without re-throwing.
 * Returns the result or null on failure.
 *
 * @example
 * const result = await withErrorCapture(
 *   () => saveScanToSupabase(measurements, poses, profile),
 *   { context: 'scan-save' }
 * );
 */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    captureError(err, context);
    return null;
  }
}
