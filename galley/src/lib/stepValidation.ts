import type { FieldValues, Path, UseFormClearErrors, UseFormGetValues, UseFormSetError } from "react-hook-form";
import type { z } from "zod";

// react-hook-form's trigger() re-runs the resolver against the *whole* schema,
// which surfaces errors on later, untouched steps. Validating just the current
// step's slice of the schema keeps errors scoped to the fields shown on screen.
export function validateStep<T extends FieldValues>(
  schema: z.ZodObject<z.ZodRawShape>,
  fields: Path<T>[],
  getValues: UseFormGetValues<T>,
  setError: UseFormSetError<T>,
  clearErrors: UseFormClearErrors<T>,
): boolean {
  const shape = Object.fromEntries(fields.map((field) => [field, true as const]));
  const subset = schema.pick(shape);
  const values = getValues(fields);
  const valuesObj = Object.fromEntries(fields.map((field, i) => [field, values[i]]));

  clearErrors(fields);

  const result = subset.safeParse(valuesObj);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as Path<T>;
      setError(field, { type: "manual", message: issue.message });
    }
    return false;
  }
  return true;
}
