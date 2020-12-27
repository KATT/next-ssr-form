import { FormikErrors, FormikTouched } from "formik";
import * as z from "zod";
import { ZodError } from "zod";

export function zodErrorToFormikError<TValues = any>(err: ZodError) {
  const flat = err.flatten();

  const errors: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(flat.fieldErrors)) {
    errors[key] = value.join(", ");
  }

  return errors as FormikErrors<TValues>;
}

export function formikZodValidate<
  TSchema extends z.ZodSchema<any, any>,
  TValues
>(schema: TSchema) {
  return function validator(values: TValues): FormikErrors<TValues> {
    const res = schema.safeParse(values);

    if (res.success) {
      return {};
    }

    const errs = zodErrorToFormikError(res.error);

    return errs;
  };
}

export function getInitialTouched<
  TFormikErrors extends FormikErrors<TValues>,
  TValues
>(errors?: TFormikErrors) {
  const res: Record<string, boolean> = {};
  if (!errors) {
    return res as FormikTouched<TValues>;
  }

  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      res[key] = true;
    }
  }

  return res as FormikTouched<TValues>;
}
