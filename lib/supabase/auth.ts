/**
 * Auth helper actions — called from client components.
 * All functions return { error } so the UI can handle messages uniformly.
 */
import { createClient } from './client';

export async function signUp(email: string, password: string, name?: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name ?? '' },
      // Supabase will send a confirmation email automatically
    },
  });
  return { error };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

export async function updateUserProfile(data: { full_name?: string; phone?: string }) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ data });
  return { error };
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}
