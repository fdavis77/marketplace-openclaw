import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { WaypointProgress } from "../components/WaypointProgress";
import { Field } from "../components/Field";
import { TextInput, TextArea, Select } from "../components/inputs";
import { Button } from "../components/Button";
import { submitOwnerRequest } from "../services/ownerRequests";
import { CUISINES } from "../constants";
import { validateStep } from "../lib/stepValidation";

const schema = z.object({
  vessel_name: z.string().min(1, "Tell us the vessel's name"),
  vessel_length_m: z
    .string()
    .min(1, "Enter the vessel's length in metres")
    .regex(/^\d+(\.\d+)?$/, "Enter a number"),
  region: z.enum(["mediterranean", "caribbean", "other"], { message: "Choose a region" }),
  crew_size: z.string().min(1, "Enter a crew size").regex(/^\d+$/, "Enter a whole number"),
  guests_size: z
    .string()
    .min(1, "Enter the number of guests")
    .regex(/^\d+$/, "Enter a whole number"),
  season_start: z.string().min(1, "Enter a start date"),
  season_end: z.string().min(1, "Enter an end date"),
  chef_type: z.enum(["seasonal", "permanent", "rotational", "single_charter"], {
    message: "Choose the kind of engagement you're after",
  }),
  budget_range: z.string().min(1, "Give us a rough budget so we can match sensibly"),
  cuisine_preferences: z.array(z.string()).min(1, "Choose at least one style"),
  dietary_requirements: z.string().optional(),
  additional_notes: z.string().optional(),
  owner_name: z.string().min(1, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEPS: { label: string; fields: (keyof FormValues)[] }[] = [
  { label: "Vessel", fields: ["vessel_name", "vessel_length_m", "region", "crew_size", "guests_size"] },
  { label: "Season", fields: ["season_start", "season_end", "chef_type", "budget_range"] },
  { label: "Table", fields: ["cuisine_preferences", "dietary_requirements", "additional_notes"] },
  { label: "You", fields: ["owner_name", "email", "phone"] },
];

export function OwnerRequestForm() {
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
    defaultValues: { cuisine_preferences: [] },
  });

  function fieldError(name: keyof FormValues) {
    return attemptedSteps.has(step) ? errors[name]?.message : undefined;
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
      await submitOwnerRequest({
        owner_name: values.owner_name,
        email: values.email,
        phone: values.phone || null,
        vessel_name: values.vessel_name,
        vessel_length_m: Number(values.vessel_length_m),
        region: values.region,
        season_start: values.season_start,
        season_end: values.season_end,
        crew_size: Number(values.crew_size),
        guests_size: Number(values.guests_size),
        cuisine_preferences: values.cuisine_preferences,
        dietary_requirements: values.dietary_requirements || null,
        budget_range: values.budget_range,
        chef_type: values.chef_type,
        additional_notes: values.additional_notes || null,
      });
      navigate("/owners/thank-you");
    } catch {
      setSubmitError("We couldn't submit your request just now. Please try again shortly.");
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <section className="bg-navy px-6 py-16 text-linen">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-brass">
          For owners &amp; captains
        </p>
        <h1 className="mb-8 text-3xl">Tell us about your season</h1>

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
              <Field label="Vessel name" htmlFor="vessel_name" error={fieldError("vessel_name")}>
                <TextInput id="vessel_name" {...register("vessel_name")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Length (metres)"
                  htmlFor="vessel_length_m"
                  error={fieldError("vessel_length_m")}
                >
                  <TextInput id="vessel_length_m" type="number" min="1" {...register("vessel_length_m")} />
                </Field>
                <Field label="Cruising region" htmlFor="region" error={fieldError("region")}>
                  <Select id="region" defaultValue="" {...register("region")}>
                    <option value="" disabled>
                      Choose a region
                    </option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="caribbean">Caribbean</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Crew size" htmlFor="crew_size" error={fieldError("crew_size")}>
                  <TextInput id="crew_size" type="number" min="0" {...register("crew_size")} />
                </Field>
                <Field
                  label="Guests aboard (typical)"
                  htmlFor="guests_size"
                  error={fieldError("guests_size")}
                >
                  <TextInput id="guests_size" type="number" min="1" {...register("guests_size")} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Season starts" htmlFor="season_start" error={fieldError("season_start")}>
                  <TextInput id="season_start" type="date" {...register("season_start")} />
                </Field>
                <Field label="Season ends" htmlFor="season_end" error={fieldError("season_end")}>
                  <TextInput id="season_end" type="date" {...register("season_end")} />
                </Field>
              </div>
              <Field label="What kind of chef are you after?" htmlFor="chef_type" error={fieldError("chef_type")}>
                <Select id="chef_type" defaultValue="" {...register("chef_type")}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option value="seasonal">Seasonal, for the charter season</option>
                  <option value="permanent">Permanent, year-round</option>
                  <option value="rotational">Rotational</option>
                  <option value="single_charter">A single charter or trip</option>
                </Select>
              </Field>
              <Field
                label="Budget range"
                htmlFor="budget_range"
                error={fieldError("budget_range")}
                hint="A rough monthly or day-rate figure is fine — this stays between us."
              >
                <TextInput id="budget_range" placeholder="e.g. €5,000–7,000/month" {...register("budget_range")} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <Field
                label="Which styles of food fit your table?"
                htmlFor="cuisine_preferences"
                error={fieldError("cuisine_preferences")}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" id="cuisine_preferences">
                  {CUISINES.map((cuisine) => (
                    <label key={cuisine} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={cuisine}
                        {...register("cuisine_preferences")}
                        className="h-4 w-4 rounded border-navy/30 text-brass focus:ring-brass"
                      />
                      {cuisine}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Dietary requirements or allergies" htmlFor="dietary_requirements">
                <TextArea id="dietary_requirements" {...register("dietary_requirements")} />
              </Field>
              <Field label="Anything else that matters to you" htmlFor="additional_notes">
                <TextArea
                  id="additional_notes"
                  placeholder="Guest preferences, provisioning ports, past chefs you've loved — whatever's useful."
                  {...register("additional_notes")}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <Field label="Your name" htmlFor="owner_name" error={fieldError("owner_name")}>
                <TextInput id="owner_name" autoComplete="name" {...register("owner_name")} />
              </Field>
              <Field label="Email" htmlFor="email" error={fieldError("email")}>
                <TextInput id="email" type="email" autoComplete="email" {...register("email")} />
              </Field>
              <Field label="Phone (optional)" htmlFor="phone" error={fieldError("phone")}>
                <TextInput id="phone" type="tel" autoComplete="tel" {...register("phone")} />
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
                {isSubmitting ? "Submitting…" : "Submit request"}
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
