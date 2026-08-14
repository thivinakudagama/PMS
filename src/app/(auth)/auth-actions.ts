"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, validateEmail, validatePassword } from "@/lib/validation";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getBaseUrl() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    return `${forwardedProto ?? "http"}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");

  const emailError = validateEmail(email);
  if (emailError) {
    redirect(`/login?error=${encodeURIComponent(emailError)}`);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirect(`/login?error=${encodeURIComponent(passwordError)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(getString(formData, "email"));
  const emailError = validateEmail(email);

  if (emailError) {
    redirect(`/forgot-password?error=${encodeURIComponent(emailError)}`);
  }

  const supabase = await createClient();
  const redirectTo = `${await getBaseUrl()}/update-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?message=If an account exists for that email, a reset link has been sent.");
}

export async function updatePassword(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");
  const passwordError = validatePassword(password);

  if (passwordError) {
    redirect(`/update-password?error=${encodeURIComponent(passwordError)}`);
  }

  if (password !== confirmPassword) {
    redirect("/update-password?error=Passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Your password has been updated. Sign in with your new password.");
}

export async function changeOwnPassword(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");
  const passwordError = validatePassword(password);

  if (passwordError) {
    redirect(`/settings?error=${encodeURIComponent(passwordError)}`);
  }

  if (password !== confirmPassword) {
    redirect("/settings?error=Passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/settings?message=Your password was updated successfully.");
}
