"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; sent?: boolean } | undefined;

const emailSchema = z.email();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

const roleEnum = z.enum(["writer", "director", "actor"]);

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: emailSchema,
  password: passwordSchema,
  roles: z.array(roleEnum).min(1, "Pick at least one — you can add more later."),
});

export async function signup(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });

  if (error) return { error: error.message };

  // Only possible if email confirmation is off and a session came back
  // immediately — otherwise the member sets their roles from /account
  // after confirming their email.
  if (data.user && data.session) {
    await supabase.from("profiles").update({ creative_roles: parsed.data.roles }).eq("id", data.user.id);
  }

  redirect("/");
}

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  // Deliberately generic — don't reveal whether the email exists.
  if (error) return { error: "Incorrect email or password." };

  redirect("/");
}

const magicLinkSchema = z.object({ email: emailSchema });

export async function sendMagicLink(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
