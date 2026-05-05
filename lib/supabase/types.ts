/**
 * Typed wrappers for Supabase Auth user metadata.
 * Extends the base User type with our custom user_metadata fields.
 */
import type { User } from '@supabase/supabase-js';

export interface UserMetadata {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

/** Supabase User with typed user_metadata */
export interface AppUser extends Omit<User, 'user_metadata'> {
  user_metadata: UserMetadata;
}

/** Safely extract typed metadata from a raw Supabase user */
export function getUserMetadata(user: User | null): UserMetadata {
  if (!user) return {};
  return (user.user_metadata ?? {}) as UserMetadata;
}

/** Get display name — full_name or first part of email */
export function getDisplayName(user: User | null): string | null {
  if (!user) return null;
  const meta = getUserMetadata(user);
  if (meta.full_name?.trim()) return meta.full_name.trim();
  return user.email?.split('@')[0] ?? null;
}

/** Get initials for avatar (max 2 chars) */
export function getInitials(user: User | null): string {
  if (!user) return '?';
  const meta = getUserMetadata(user);
  if (meta.full_name?.trim()) {
    return meta.full_name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}
