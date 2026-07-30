import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "./Field";
import { TextInput, Select } from "./inputs";
import { Button } from "./Button";
import { joinWaitlist } from "../services/waitlist";
import { REGIONS, REGION_LABELS, type Region } from "../config";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  region: z.enum(REGIONS as unknown as [Region, ...Region[]], {
    message: "Choose a region",
  }),
});

type FormValues = z.infer<typeof schema>;

export function WaitlistForm({ role }: { role?: "owner" | "chef" }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await joinWaitlist({ ...values, role });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong on our end. Please try again in a moment.");
    }
  }

  if (submitted) {
    return (
      <p className="font-display text-lg text-brass">
        You're on the list. We'll be in touch as the season takes shape.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 sm:flex-row sm:items-start"
      noValidate
    >
      <div className="flex-1">
        <Field label="Your email" htmlFor="waitlist-email" error={errors.email?.message}>
          <TextInput
            id="waitlist-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </Field>
      </div>
      <div className="sm:w-56">
        <Field label="Region of interest" htmlFor="waitlist-region" error={errors.region?.message}>
          <Select id="waitlist-region" defaultValue="" {...register("region")}>
            <option value="" disabled>
              Choose a region
            </option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {REGION_LABELS[region]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="sm:pt-7">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Joining…" : "Join the waitlist"}
        </Button>
      </div>
      {submitError && (
        <p role="alert" className="text-sm text-red-700 sm:basis-full">
          {submitError}
        </p>
      )}
    </form>
  );
}
