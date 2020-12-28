import { FormikErrors, setIn } from "formik";
import { FunctionThenArg } from "global";
import { GetServerSidePropsContext } from "next";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import { validate } from "uuid";
import * as z from "zod";
import { ZodError } from "zod";
import { ZodRawShape } from "zod/lib/src/types/base";
import { getPostBody } from "./getPostBody";

function throwServerOnlyError(message: string): never {
  throw new Error(`You have access server-only functionality (${message})`);
}

export type PostResponseOutputError =
  | {
      type: "ValidationError";
      message: string;
      stack?: string | undefined;
      errors: {
        formErrors: string[];
        fieldErrors: {
          [k: string]: string[];
        };
      };
    }
  | {
      type: "MutationError";
      message: string;
      stack?: string | undefined;
      errors?: null;
    };
type PostResponseOutput<TMutationData, TValues> =
  | {
      success: true;
      input: TValues;
      data: TMutationData;
      error?: null;
    }
  | {
      success: false;
      input: TValues;
      data?: null;
      error: PostResponseOutputError;
    };

type PagePropsValue<TMutationData, TValues> = {
  endpoint: string;
  output: PostResponseOutput<TMutationData, TValues> | null;
};

type PostEnvelope = {
  formId: string;
  values: unknown;
};

export function createForm<
  TSchema extends z.ZodObject<TSchemaShape>,
  TSchemaShape extends ZodRawShape,
  TFormId extends string
>({
  schema,
  defaultValues,
  formId,
}: {
  schema: TSchema;
  defaultValues: z.infer<TSchema>;
  /**
   * A unique identifier for the form on the page, will used to identifiy it in the post receiver
   */
  formId: TFormId;
}) {
  type TValues = z.infer<TSchema>;
  type TPageProps<TMutationData> = Record<
    TFormId,
    PagePropsValue<TMutationData, TValues>
  >;
  type TPostResponseOutput<TMutationData> = PostResponseOutput<
    TMutationData,
    TValues
  >;

  type TPagePropsValue<TMutationData> = {
    endpoint: string;
    output: PostResponseOutput<TMutationData, TValues> | null;
  };

  async function performMutationIfNeeded<TMutationData>(
    body: unknown,
    mutation: (data: TValues) => Promise<TMutationData>,
  ): Promise<TPostResponseOutput<TMutationData> | null> {
    if (!process.browser) {
      let input: null | TValues = null;
      if (
        body &&
        typeof body === "object" &&
        (body as PostEnvelope).formId === formId
      ) {
        input = (body as PostEnvelope).values as TValues;
      }
      if (!input) {
        return null;
      }
      const parsed = schema.safeParse(input);

      if (!parsed.success) {
        const err = parsed.error;
        return {
          success: false,
          input,
          error: {
            type: "ValidationError",
            message: err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
            errors: err.flatten(),
          },
        };
      }
      try {
        const data = await mutation(parsed.data);
        return {
          input,
          success: true as const,
          data,
        };
      } catch (err) {
        return {
          input,
          success: false as const,
          error: {
            type: "MutationError",
            message: err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
        };
      }
    }
    throwServerOnlyError("serverRequest()");
  }

  async function getPageProps<TMutationData>({
    ctx,
    mutation,
  }: {
    ctx: GetServerSidePropsContext;
    mutation: (data: TValues) => Promise<TMutationData>;
  }) {
    if (!process.browser) {
      const body = await getPostBody(ctx.req);
      // make sure to config `generateBuildId` in `next.config.js`
      const sha = process.env.VERCEL_GIT_COMMIT_SHA;
      const baseUrl = sha ? `/_next/data/${sha}` : "/_next/data/development";
      const endpoint = `${baseUrl}${ctx.resolvedUrl}.json`;

      return {
        [formId]: {
          endpoint,
          output: await performMutationIfNeeded<TMutationData>(body, mutation),
        },
      } as TPageProps<TMutationData>;
    }
    throwServerOnlyError("getPageProps");
  }

  async function clientRequest<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >({ values, props }: { props: TProps; values: TValues }) {
    const envelope: PostEnvelope = {
      formId,
      values,
    };
    const res = await fetch(props[formId].endpoint, {
      method: "post",
      body: JSON.stringify(envelope),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Not ok error response");
    }
    const json: {
      pageProps: SuperJSONResult;
    } = await res.json();

    const newProps: TProps = deserialize(json.pageProps);
    const output = newProps[formId]?.output;

    if (!output || !output.success) {
      throw new Error("Not successful response, try reloading the page");
    }
    return {
      newProps,
    };
  }

  return {
    formId,
    schema,
    defaultValues,
    getPageProps,
    clientRequest,
    getInitialValues<TProps extends TPageProps<TMutationData>, TMutationData>(
      props: TProps,
    ): TValues {
      const res = props[formId].output;
      if (res?.error && res.input) {
        return res.input;
      }
      return defaultValues;
    },
    getInitialErrors<TProps extends TPageProps<TMutationData>, TMutationData>(
      props: TProps,
    ) {
      const fieldErrors = props[formId].output?.error?.errors?.fieldErrors;
      if (!fieldErrors) {
        return undefined;
      }

      const errors: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(fieldErrors)) {
        errors[key] = value.join(", ");
      }

      return errors as FormikErrors<TValues>;
    },
    getInitialTouched<TProps extends TPageProps<TMutationData>, TMutationData>(
      props: TProps,
    ) {
      const error = props[formId].output?.error;
      if (!error) {
        return undefined;
      }

      const touched: Record<string, boolean> = {};

      for (const key in defaultValues) {
        // not deep setting
        touched[key] = true;
      }

      return touched;
    },
    getFeedbackFromProps<
      TProps extends TPageProps<TMutationData>,
      TMutationData
    >(props: TProps) {
      const response = props[formId].output;
      if (!response) {
        return null;
      }

      if (response.success) {
        return {
          state: "success" as const,
        };
      }

      return {
        state: "error" as const,
        error: response.error as typeof response.error | Error,
      };
    },
    formikValidator(values: TValues) {
      let errors: FormikErrors<TValues> = {};
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        for (const err of parsed.error.errors) {
          errors = setIn(errors, err.path.join("."), err.message);
        }
      }
      // console.log("errors", errors);
      return errors;
    },
  };
}
