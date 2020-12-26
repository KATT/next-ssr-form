import { FormikErrors } from "formik";
import { ZodError } from "zod";

export function zodErrorToFormikError<TSchema = any>(err: ZodError) {
  const flat = err.flatten();

  const errors: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(flat.fieldErrors)) {
    errors[key] = value.join(", ");
  }

  return errors as FormikErrors<any>;
}
