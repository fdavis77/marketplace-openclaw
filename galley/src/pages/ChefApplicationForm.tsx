import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { WaypointProgress } from "../components/WaypointProgress";
import { Field } from "../components/Field";
import { TextInput, TextArea } from "../components/inputs";
import { Button } from "../components/Button";
import { submitChefApplication } from "../services/chefs";
import { uploadChefPhoto, uploadChefDocument } from "../services/storage";
import { CUISINES } from "../constants";
import { validateStep } from "../lib/stepValidation";

const REGION_OPTIONS = [
  { value: "mediterranean", label: "Mediterranean" },
  { value: "caribbean", label: "Caribbean" },
];

const schema = z.object({
  full_name: z.string().min(1, "Enter your name"),
  years_experience: z
    .string()
    .min(1, "Enter your years of experience")
    .regex(/^\d+$/, "Enter a whole number"),
  cuisine_specialties: z.array(z.string()).min(1, "Choose at least one specialty"),
  certifications: z.string().optional(),
  regions_available: z.array(z.string()).min(1, "Choose at least one region"),
  availability_start: z.string().min(1, "Enter when you're available from"),
  availability_notes: z.string().optional(),
  day_rate_expectation: z.string().min(1, "Give a rate so owners know what to expect"),
  cover_letter: z.string().min(1, "Tell us a little about yourself"),
  cv: z.instanceof(FileList).optional(),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  photo: z
    .instanceof(FileList)
    .refine((list) => list.length > 0, "A photo of yourself is required"),
});

type FormValues = z.infer<typeof schema>;

const STEPS: { label: string; fields: (keyof FormValues)[] }[] = [
  { label: "Experience", fields: ["full_name", "years_experience", "cuisine_specialties", "certifications"] },
  {
    label: "Availability",
    fields: ["regions_available", "availability_start", "availability_notes", "day_rate_expectation"],
  },
  { label: "About you", fields: ["cover_letter", "cv"] },
  { label: "Contact", fields: ["email", "phone", "photo"] },
];

export function ChefApplicationForm() {
  const [step, setStep] = useState(0);
  // react-hook-form's schema resolver re-validates every field whenever the set of
  // mounted fields changes (a side effect of computing overall isValid), which would
  // otherwise surface errors on steps the user hasn't reached yet. Only steps the user
  // has actually tried to leave get their errors shown.
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cuisine_specialties: [], regions_available: [] },
  });

  function fieldError(name: keyof FormValues) {
    return attemptedSteps.has(step) ? (errors[name]?.message as string | undefined) : undefined;
  }

  function next() {
    const valid = validateStep(schema, STEPS[step].fields, getValues, setError, clearErrors);
    setAttemptedSteps((prev) => new Set(prev).add(step));
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function markAttempted() {
    setAttemptedSteps((prev) => new Set(prev).add(step));
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const photoFile = values.photo[0];
      const photo_path = await uploadChefPhoto(photoFile);

      let cv_path: string | null = null;
      if (values.cv && values.cv.length > 0) {
        cv_path = await uploadChefDocument(values.cv[0]);
      }

      await submitChefApplication({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        photo_path,
        years_experience: Number(values.years_experience),
        cuisine_specialties: values.cuisine_specialties,
        certifications: values.certifications || null,
        regions_available: values.regions_available as ("mediterranean" | "caribbean")[],
        day_rate_expectation: values.day_rate_expectation,
        availability_start: values.availability_start,
        availability_notes: values.availability_notes || null,
        cover_letter: values.cover_letter,
        cv_path,
      });

      navigate("/chefs/thank-you");
    } catch {
      setSubmitError("We couldn't submit your application just now. Please try again shortly.");
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <section className="bg-navy px-6 py-16 text-linen">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-brass">
          For chefs
        </p>
        <h1 className="mb-8 text-3xl">Apply to join the roster</h1>

        <div className="mb-10">
          <WaypointProgress steps={STEPS.map((s) => s.label)} currentStep={step} />
        </div>

        <form
          onSubmit={(e) => {
            markAttempted();
            return handleSubmit(onSubmit)(e);
          }}
          className="rounded-lg bg-linen p-6 text-navy sm:p-10"
          noValidate
        >
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <Field label="Full name" htmlFor="full_name" error={fieldError("full_name")}>
                <TextInput id="full_name" autoComplete="name" {...register("full_name")} />
              </Field>
              <Field
                label="Years of professional experience"
                htmlFor="years_experience"
                error={fieldError("years_experience")}
              >
                <TextInput id="years_experience" type="number" min="0" {...register("years_experience")} />
              </Field>
              <Field
                label="What do you cook best?"
                htmlFor="cuisine_specialties"
                error={fieldError("cuisine_specialties")}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" id="cuisine_specialties">
                  {CUISINES.map((cuisine) => (
                    <label key={cuisine} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={cuisine}
                        {...register("cuisine_specialties")}
                        className="h-4 w-4 rounded border-navy/30 text-brass focus:ring-brass"
                      />
                      {cuisine}
                    </label>
                  ))}
                </div>
              </Field>
              <Field
                label="Certifications"
                htmlFor="certifications"
                hint="STCW, food hygiene, culinary school — whatever's relevant."
              >
                <TextArea id="certifications" {...register("certifications")} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <Field
                label="Which waters are you available for?"
                htmlFor="regions_available"
                error={fieldError("regions_available")}
              >
                <div className="flex flex-col gap-2" id="regions_available">
                  {REGION_OPTIONS.map((region) => (
                    <label key={region.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={region.value}
                        {...register("regions_available")}
                        className="h-4 w-4 rounded border-navy/30 text-brass focus:ring-brass"
                      />
                      {region.label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field
                label="Available from"
                htmlFor="availability_start"
                error={fieldError("availability_start")}
              >
                <TextInput id="availability_start" type="date" {...register("availability_start")} />
              </Field>
              <Field label="Availability notes" htmlFor="availability_notes">
                <TextArea
                  id="availability_notes"
                  placeholder="Rotational preferences, blackout dates, notice period..."
                  {...register("availability_notes")}
                />
              </Field>
              <Field
                label="Day rate or salary expectation"
                htmlFor="day_rate_expectation"
                error={fieldError("day_rate_expectation")}
              >
                <TextInput id="day_rate_expectation" placeholder="e.g. €350/day" {...register("day_rate_expectation")} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <Field
                label="Tell us about yourself"
                htmlFor="cover_letter"
                error={fieldError("cover_letter")}
                hint="Your style, the boats you've worked, what makes your table distinctive."
              >
                <TextArea id="cover_letter" rows={6} {...register("cover_letter")} />
              </Field>
              <Field
                label="CV or references (optional)"
                htmlFor="cv"
                hint="PDF preferred."
              >
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  {...register("cv")}
                  className="w-full text-sm text-navy file:mr-4 file:rounded-md file:border-0 file:bg-brass file:px-4 file:py-2 file:font-semibold file:text-navy hover:file:bg-brass-light"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <Field label="Email" htmlFor="email" error={fieldError("email")}>
                <TextInput id="email" type="email" autoComplete="email" {...register("email")} />
              </Field>
              <Field label="Phone (optional)" htmlFor="phone" error={fieldError("phone")}>
                <TextInput id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              </Field>
              <Field
                label="A photo of yourself"
                htmlFor="photo"
                error={fieldError("photo")}
                hint="A clear, professional photo. This is what an owner sees first."
              >
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  {...register("photo")}
                  className="w-full text-sm text-navy file:mr-4 file:rounded-md file:border-0 file:bg-brass file:px-4 file:py-2 file:font-semibold file:text-navy hover:file:bg-brass-light"
                />
              </Field>
            </div>
          )}

          {submitError && (
            <p role="alert" className="mt-6 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className={step === 0 ? "invisible" : ""}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button key="submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit application"}
              </Button>
            ) : (
              <Button key="continue" type="button" onClick={next}>
                Continue
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
