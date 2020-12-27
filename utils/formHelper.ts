import { FormikErrors, setIn } from "formik";
import { FunctionThenArg } from "global";
import { GetServerSidePropsContext } from "next";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import { validate } from "uuid";
import * as z from "zod";
import { ZodRawShape } from "zod/lib/src/types/base";
import { getPostBody } from "./getPostBody";

function throwServerOnlyError(message: string): never {
  throw new Error(`You have access server-only functionality (${message})`);
}

export function createForm<
  TSchema extends z.ZodObject<TSchemaShape>,
  TSchemaShape extends ZodRawShape
>({
  schema,
  defaultValues,
}: {
  schema: TSchema;
  defaultValues: z.infer<TSchema>;
}) {
  type TValues = z.infer<TSchema>;

  async function serverRequest<TExecutorOutput = unknown>(
    input: TValues,
    executor: (data: TValues) => Promise<TExecutorOutput>,
  ) {
    if (!process.browser) {
      const parsed = schema.safeParse(input);

      if (!parsed.success) {
        const err = parsed.error;
        return {
          input,
          success: false as const,
          error: {
            ...err.flatten(),
            type: "ValidationError" as const,
          },
        };
      }
      try {
        const data = await executor(parsed.data);
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
            type: "ExecutorFailedError" as const,
            message: err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
        };
      }
    }
    throwServerOnlyError("serverRequest()");
  }
  async function ssrHelper<TExecutorOutput = unknown>({
    ctx,
    mutation,
  }: {
    ctx: GetServerSidePropsContext;
    mutation: (data: TValues) => Promise<TExecutorOutput>;
  }) {
    if (!process.browser) {
      const input = await getPostBody(ctx.req);
      // make sure to config `generateBuildId` in `next.config.js`
      const sha = process.env.VERCEL_GIT_COMMIT_SHA;
      const baseUrl = sha ? `/_next/data/${sha}` : "/_next/data/development";
      const endpoint = `${baseUrl}${ctx.resolvedUrl}.json`;

      return {
        endpoint,
        output: input ? await serverRequest(input as any, mutation) : null,
      };
    }
    throwServerOnlyError("ssrHelper");
  }
  async function clientRequest<T = unknown>({
    values,
    endpoint,
    pagePropsKey,
  }: {
    endpoint: string;
    values: TValues;
    pagePropsKey: string;
  }) {
    const res = await fetch(endpoint, {
      method: "post",
      body: JSON.stringify(values),
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
    const result: any = deserialize(json.pageProps);
    const data: FunctionThenArg<typeof ssrHelper> = result[pagePropsKey];

    if (!data.output?.success) {
      console.error("Invalid output", {
        result,
        pagePropsKey,
      });
      throw new Error("Not successful response, try reloading the page");
    }
    return data;
  }

  return {
    schema,
    defaultValues,
    serverRequest,
    ssrHelper,
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
