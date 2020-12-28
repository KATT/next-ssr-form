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

type PostResponseOutput<TMutationData> =
  | {
      success: true;
      input: unknown;
      data: TMutationData;
    }
  | {
      success: false;
      input: unknown;
      data: null;
      error:
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
          };
    };

type PagePropsValue<TMutationData> = {
  endpoint: string;
  output: PostResponseOutput<TMutationData> | null;
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
    PagePropsValue<TMutationData>
  >;

  async function performMutationIfNeeded<TMutationData>(
    body: unknown,
    mutation: (data: TValues) => Promise<TMutationData>,
  ): Promise<PostResponseOutput<TMutationData> | null> {
    if (!process.browser) {
      let input: null | unknown = null;
      if (
        body &&
        typeof body === "object" &&
        (body as PostEnvelope).formId === formId
      ) {
        input = (body as PostEnvelope).values;
      }
      if (!input) {
        return null;
      }
      const parsed = schema.safeParse(input);

      if (!parsed.success) {
        const err = parsed.error;
        return {
          input,
          success: false,
          data: null,
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
          data: null,
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
      const val: PagePropsValue<TMutationData> = {
        endpoint,
        output: await performMutationIfNeeded<TMutationData>(body, mutation),
      };
      return {
        [formId]: val,
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
      data: output.data,
      newProps,
    };
  }

  return {
    formId,
    schema,
    defaultValues,
    serverRequest: performMutationIfNeeded,
    getPageProps,
    clientRequest,
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
