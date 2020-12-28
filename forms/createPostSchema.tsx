import * as z from "zod";
import * as yup from "yup";

// zod
export const createPostSchema = z.object({
  message: z.string().min(10),
  from: z.string().min(2),
});

export type createPostSchemaType = z.infer<typeof createPostSchema>;

export const createPostDefaultValues: createPostSchemaType = {
  message: "",
  from: "",
};

// yup
export const createPostSchemaYup = yup
  .object({
    message: yup.string().min(10).required(),
    from: yup.string().min(2).required(),
  })
  .required();

export type createPostSchemaYupType = yup.InferType<typeof createPostSchemaYup>;
