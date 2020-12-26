import { assertOnServer } from "utils/assertOnServer";
import { DB } from "forms/db";
import { createPostSchemaType, createPostSchema } from "./createPostSchema";
import { zodErrorToFormikError } from "./zodErrorToFormikError";

assertOnServer("createPostSchema.server.tsx");

export async function createPost(input: createPostSchemaType) {
  assertOnServer("createPost");

  const parsed = createPostSchema.safeParse(input);

  if (!parsed.success) {
    const err = parsed.error;
    return {
      input,
      success: false as const,
      error: err.flatten(),
      formikError: zodErrorToFormikError(err),
    };
  }
  const instance = await DB.createPost(parsed.data);

  return {
    input,
    success: true as const,
    data: instance,
  };
}
