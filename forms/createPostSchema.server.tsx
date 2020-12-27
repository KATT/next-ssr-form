import { assertOnServer } from "utils/assertOnServer";
import { DB } from "forms/db";
import {
  createPostSchemaType,
  createPostSchema,
  createPostSchemaYupType,
  createPostSchemaYup,
} from "./createPostSchema";
import { zodErrorToFormikError } from "./zodFormik";
import { ValidationError } from "yup";
import { yupToFormErrors } from "formik";

assertOnServer("createPostSchema.server.tsx");

// using zod as parser
export async function createPostZod(input: createPostSchemaType) {
  assertOnServer("createPost");

  const parsed = createPostSchema.safeParse(input);

  if (!parsed.success) {
    const err = parsed.error;
    return {
      input,
      success: false as const,
      error: err.flatten(),
      formikError: zodErrorToFormikError<createPostSchemaType>(err),
    };
  }
  const instance = await DB.createPost(parsed.data);

  return {
    input,
    success: true as const,
    data: instance,
  };
}

// using yup as parser
export async function createPostYup(input: createPostSchemaYupType) {
  assertOnServer("createPost");

  try {
    const parsed = await createPostSchemaYup.validate(input, {
      stripUnknown: true,
      abortEarly: false,
    });
    const instance = await DB.createPost(parsed);

    return {
      input,
      success: true as const,
      data: instance,
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      return {
        input,
        success: false as const,
        error: {
          message: err.message,
          errors: yupToFormErrors<createPostSchemaYupType>(err),
        },
      };
    }
    // todo me later
    throw err;
  }
}
