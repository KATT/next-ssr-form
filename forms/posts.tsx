import * as z from "zod";
import { assertOnServer } from "utils/assertOnServer";
import { DB } from "pages/api/db";

export const createPostSchema = z.object({
  message: z.string().min(10),
  from: z.string().min(2),
});
export type createPostSchemaType = z.infer<typeof createPostSchema>;

export async function createPost(input: createPostSchemaType) {
  assertOnServer("createPost");

  const parsed = createPostSchema.safeParse(input);

  if (!parsed.success) {
    const err = parsed.error;
    return {
      input,
      success: false as const,
      error: err.flatten(),
    };
  }
  const instance = await DB.createPost(parsed.data);

  return {
    input,
    success: true as const,
    data: instance,
  };
}
