import * as z from "zod";

export const createPostSchema = z.object({
  message: z.string().min(10),
  from: z.string().min(2),
});
export type createPostSchemaType = z.infer<typeof createPostSchema>;

export const createPostDefaultValues: createPostSchemaType = {
  message: "",
  from: "",
};
