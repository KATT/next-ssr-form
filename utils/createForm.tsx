/**
 * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
 * This is unmaintainable spaghetti right now
 * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
 */
import {
  Form,
  Formik,
  FormikErrors,
  FormikProps,
  FormikTouched,
  setIn,
} from "formik";
import { IncomingMessage } from "http";
import { GetServerSidePropsContext } from "next";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import url from "url";
import qs from "querystring";
import * as z from "zod";
import { ZodRawShape } from "zod/lib/src/types/base";
import { getPostBody } from "./getPostBody";
import { ReactNode, useMemo, useState } from "react";

function throwServerOnlyError(message: string): never {
  throw new Error(`You have access server-only functionality (${message})`);
}

type Dict<T> = Record<string, T | undefined>;
type PostResponseError =
  | {
      type: "ValidationError";
      message: string;
      stack?: string | undefined;
      fieldErrors: Dict<string[]>;
    }
  | {
      type: "MutationError";
      message: string;
      stack?: string | undefined;
      fieldErrors?: null;
    };
type PostResponse<TMutationData, TValues> =
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
      error: PostResponseError;
    };

type PagePropsValue<TMutationData, TValues> = {
  endpoints: {
    /**
     * endpoint for using in `fetch()`
     */
    fetch: string;
    /**
     * endpoint for using in `<form action={x}`
     */
    action: string;
  };
  response: PostResponse<TMutationData, TValues> | null;
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
  type TPostResponse<TMutationData> = PostResponse<TMutationData, TValues>;

  async function performMutation<TMutationData>(
    input: TValues,
    mutation: (data: TValues) => Promise<TMutationData>,
  ): Promise<TPostResponse<TMutationData> | null> {
    if (!process.browser) {
      if (!input) {
        return null;
      }
      const parsed = schema.safeParse(input);

      if (!parsed.success) {
        const err = parsed.error;
        const { fieldErrors } = err.flatten();
        return {
          success: false,
          input,
          error: {
            type: "ValidationError",
            message: err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
            fieldErrors,
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

  async function getPostBodyForForm(req: IncomingMessage) {
    if (req.url?.endsWith(`?formId=${encodeURIComponent(formId)}`)) {
      return getPostBody(req);
    }
    return null;
  }
  function getEndpoints(resolvedUrl: string) {
    if (!process.browser) {
      const currentUrl = url.parse(resolvedUrl);
      const currentQuery = qs.parse(currentUrl.query ?? "");
      const newQuery = qs.stringify({ ...currentQuery, formId });

      // make sure to config `generateBuildId` in `next.config.js`
      const sha = process.env.VERCEL_GIT_COMMIT_SHA;
      const endpointPrefix = sha
        ? `/_next/data/${sha}`
        : "/_next/data/development";

      const fetchPathname =
        currentUrl.pathname === "/" ? "/index" : currentUrl.pathname;

      const fetchEndpoint = `${endpointPrefix}${fetchPathname}.json?${newQuery}`;
      const action = `${currentUrl.pathname}?${newQuery}`;
      return {
        fetch: fetchEndpoint,
        action,
      };
    }

    throwServerOnlyError("getEndpoints()");
  }
  async function getPageProps<TMutationData>({
    ctx,
    mutation,
  }: {
    ctx: GetServerSidePropsContext;
    mutation: (data: TValues) => Promise<TMutationData>;
  }) {
    if (!process.browser) {
      const body = await getPostBodyForForm(ctx.req);

      const endpoints = getEndpoints(ctx.resolvedUrl);

      // make sure to config `generateBuildId` in `next.config.js`
      const sha = process.env.VERCEL_GIT_COMMIT_SHA;
      const baseUrl = sha ? `/_next/data/${sha}` : "/_next/data/development";
      const endpoint = `${baseUrl}${ctx.resolvedUrl}.json`;

      const response = await performMutation<TMutationData>(
        body as any,
        mutation,
      );
      return {
        [formId]: {
          endpoints,
          response,
        },
      } as TPageProps<TMutationData>;
    }
    throwServerOnlyError("getPageProps");
  }

  async function clientRequest<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >({ values, props }: { props: TProps; values: TValues }) {
    const res = await fetch(props[formId].endpoints.fetch, {
      method: "post",
      body: JSON.stringify(values),
      headers: {
        "content-type": "application/json",
      },
    });
    const json: {
      pageProps: SuperJSONResult;
    } = await res.json();

    const newProps: TProps = deserialize(json.pageProps);

    return {
      newProps,
    };
  }
  function getInitialValues<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >(props: TProps): TValues {
    const res = props[formId].response;
    if (res?.error && res.input) {
      return res.input;
    }
    return defaultValues;
  }

  function getInitialErrors<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >(props: TProps) {
    const fieldErrors = props[formId].response?.error?.fieldErrors;
    if (!fieldErrors) {
      return undefined;
    }

    const errors: Dict<string> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (!value) {
        continue;
      }
      errors[key] = value.join(", ");
    }

    return errors as FormikErrors<TValues>;
  }
  function getFeedbackFromProps<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >(props: TProps) {
    const response = props[formId].response;
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
  }
  function formikValidator(values: TValues) {
    let errors: FormikErrors<TValues> = {};
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const err of parsed.error.errors) {
        errors = setIn(errors, err.path.join("."), err.message);
      }
    }
    // console.log("errors", errors);
    return errors;
  }

  function getInitialTouched<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >(props: TProps) {
    const error = props[formId].response?.error;
    if (!error) {
      return undefined;
    }

    const touched: Record<string, boolean> = {};

    for (const key in defaultValues) {
      // not deep setting
      touched[key] = true;
    }

    return touched as FormikTouched<TValues>;
  }
  function useFormikScaffold<
    TProps extends TPageProps<TMutationData>,
    TMutationData
  >(props: TProps) {
    const [feedback, setFeedback] = useState(getFeedbackFromProps(props));

    const MyForm = useMemo(() => {
      return (formProps: {
        children: (formikProps: FormikProps<TValues>) => ReactNode;
        onSuccess?: ({ newProps }: { newProps: TProps }) => void;
      }) => (
        <Formik
          initialValues={getInitialValues(props)}
          initialErrors={getInitialErrors(props)}
          initialTouched={getInitialTouched(props)}
          validate={formikValidator}
          onSubmit={async (values, actions) => {
            try {
              setFeedback(null);
              const { newProps } = await clientRequest({
                values,
                props,
              });

              const feedback = getFeedbackFromProps(newProps);
              if (!feedback) {
                throw new Error("Didn't receive feedback from props");
              }
              if (feedback.state === "success") {
                actions.resetForm();
                formProps.onSuccess && formProps.onSuccess({ newProps });
              }
              setFeedback(feedback);
            } catch (error) {
              setFeedback({
                state: "error",
                error,
              });
            }
          }}
          children={(p) => (
            <Form method='post' action={props[formId].endpoints.action}>
              {formProps.children(p)}
            </Form>
          )}
        />
      );
    }, [props]);
    return {
      Form: MyForm,
      feedback,
    };
  }
  return {
    formId,
    schema,
    getPageProps,
    clientRequest,
    getInitialValues,
    getInitialErrors,
    getInitialTouched,
    getFeedbackFromProps,
    formikValidator,
    useFormikScaffold,
  };
}
