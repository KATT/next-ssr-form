import { GetServerSidePropsContext } from "next";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import * as z from "zod";
import { ZodRawShape } from "zod/lib/src/types/base";
import { getPostBody } from "./getPostBody";

function throwServerOnlyError(message: string): never {
  throw new Error(`You have access server-only functionality (${message})`);
}

export function createForm<
  TSchema extends z.ZodObject<TValues>,
  TValues extends ZodRawShape
>({
  schema,
  defaultValues,
}: {
  schema: TSchema;
  defaultValues: z.infer<TSchema>;
}) {
  type InputType = z.infer<TSchema>;

  async function serverRequest<TExecutorOutput = unknown>(
    input: InputType,
    executor: (data: InputType) => Promise<TExecutorOutput>,
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
  async function ssrHelper(ctx: GetServerSidePropsContext) {
    if (!process.browser) {
      const postBody = await getPostBody(ctx.req);
      // make sure to config `generateBuildId` in `next.config.js`
      const sha = process.env.VERCEL_GIT_COMMIT_SHA;
      const endpoint = sha ? `/_next/data/${sha}` : "/_next/data/development";

      return {
        endpoint,
        postBody,
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
    const data: T = result[pagePropsKey];

    if (!result?.formData?.success) {
      throw new Error("Not successful response, try reloading the page");
    }
  }
  return {
    schema,
    defaultValues,
    serverRequest,
    ssrHelper,
    clientRequest,
  };
}
