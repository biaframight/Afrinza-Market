/**
 * Afrinza — Supabase Auth Helpers
 *
 * This file is prepared for future authentication integration.
 * Import `supabase` and call these helpers from your components or hooks.
 *
 * Supported flows:
 *  - Email + Password sign-up / sign-in
 *  - Magic Link (passwordless email)
 *  - Google OAuth (configure in Supabase dashboard → Authentication → Providers)
 *  - Sign out
 *  - Get current session / user
 */

import { supabase } from "./supabase";
import type { Provider } from "@supabase/supabase-js";

/** Sign up a new user with email and password */
export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { fullName?: string; role?: "buyer" | "seller" }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: options?.fullName ?? "",
        role: options?.role ?? "buyer",
      },
    },
  });
}

/** Update the current user's metadata */
export async function updateUserProfile(updates: { fullName?: string; phone?: string }) {
  return supabase.auth.updateUser({
    data: {
      ...(updates.fullName !== undefined && { full_name: updates.fullName }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
    },
  });
}

/** Sign in an existing user with email and password */
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Send a magic link (passwordless sign-in) to the user's email */
export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

/** Sign in with an OAuth provider (e.g. "google", "facebook") */
export async function signInWithOAuth(provider: Provider) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

/** Sign the current user out */
export async function signOut() {
  return supabase.auth.signOut();
}

/** Get the currently authenticated user (null if not signed in) */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Get the full session object (includes access token etc.) */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribe to auth state changes.
 *
 * Usage:
 *   const { data: { subscription } } = onAuthStateChange((event, session) => {
 *     console.log(event, session?.user);
 *   });
 *   // Later: subscription.unsubscribe();
 */
export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback);
}
