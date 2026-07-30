import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { Field } from "../../components/Field";
import { TextInput } from "../../components/inputs";
import { Button } from "../../components/Button";
import { signIn } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export function AdminLogin() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    try {
      await signIn(values.email, values.password);
      navigate("/admin");
    } catch {
      setAuthError("Incorrect email or password.");
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-navy px-6 py-16">
      <div className="w-full max-w-sm rounded-lg bg-linen p-8 text-navy">
        <h1 className="mb-6 text-2xl">Concierge console</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <TextInput id="email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <TextInput id="password" type="password" autoComplete="current-password" {...register("password")} />
          </Field>
          {authError && (
            <p role="alert" className="text-sm text-red-700">
              {authError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </section>
  );
}
