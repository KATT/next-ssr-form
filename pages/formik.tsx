import { ErrorMessage, Field, Form, Formik } from "formik";
import {
  createPostDefaultValues,
  createPostSchema,
} from "forms/createPostSchema";
import { createPost } from "forms/createPostSchema.server";
import { formikZodValidate, getInitialTouched } from "forms/zodFormik";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import nProgress from "nprogress";
import { useEffect, useState } from "react";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import { getPostBody } from "utils/getPostBody";
import { DB } from "../forms/db";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;
export default function Home(props: Props) {
  const router = useRouter();
  const { formData } = props;
  const [state, setState] = useState<
    "initial" | "submitting" | "error" | "success"
  >(() => {
    if (formData?.success) {
      return "success";
    }
    if (formData?.error) {
      return "error";
    }
    return "initial";
  });
  useEffect(() => {
    if (state === "submitting") {
      nProgress.start();
    }
    return () => {
      nProgress.done();
    };
  }, [state === "submitting"]);

  const initialValues = formData?.error
    ? formData.input
    : createPostDefaultValues;
  return (
    <>
      <h1>Formik SSR</h1>
      <p>
        Uses Formik to HTTP post to Next.js' special page endpoint (
        <code>_next/data/[..]/[..].json</code>) then triggers a page data to be
        reloaded by using <code>router.replace()</code> to itself.
      </p>
      <p>
        If JavaScript is not enabled, it does pretty much the same as the{" "}
        <Link href='/'>Vanilla</Link>-example and propagates error feedback
        through page props.
      </p>

      <h2>My guestbook</h2>
      {props.posts.map((item) => (
        <article key={item.id}>
          <strong>
            From {item.from} at {item.createdAt.toLocaleDateString("sv-SE")}{" "}
            {item.createdAt.toLocaleTimeString("sv-SE").substr(0, 5)}:
          </strong>
          <p className='message'>{item.message}</p>
        </article>
      ))}
      <h3>Add post</h3>

      <Formik
        initialValues={initialValues}
        initialErrors={formData?.formikError}
        initialTouched={getInitialTouched(initialValues, formData?.formikError)}
        validate={formikZodValidate(createPostSchema)}
        onSubmit={async (values, actions) => {
          setState("submitting");
          const path = `${props.postEndpointPrefix}${router.asPath}.json`;
          console.log({ values, path });
          const res = await fetch(path, {
            method: "post",
            body: JSON.stringify(values),
            headers: {
              "content-type": "application/json",
            },
          });
          if (!res.ok) {
            setState("error");
            return;
          }
          const json: {
            pageProps: SuperJSONResult;
          } = await res.json();
          console.log("res json", json);
          const result = deserialize(json.pageProps) as Props;
          console.log("res result", result);
          if (!result.formData?.success) {
            console.error("Error", result.formData);
            setState("error");
            return;
          }

          await router.replace(router.asPath); // trigger refresh
          setState("success");
          actions.resetForm();
        }}
      >
        {() => (
          <Form method='post' action={router.asPath}>
            <p className='field'>
              <label htmlFor='from'>Name</label>
              <br />
              <Field
                type='text'
                name='from'
                disabled={state === "submitting"}
              />
              <br />
              <ErrorMessage
                name='from'
                component='span'
                className='field__error'
              />
            </p>
            <p className='field'>
              <label htmlFor='message'>Message</label>
              <br />
              <Field
                type='textarea'
                name='message'
                as='textarea'
                disabled={state === "submitting"}
              />
              <br />
              <ErrorMessage
                name='message'
                component='span'
                className='field__error'
              />
            </p>
            <p>
              <button type='submit' disabled={state === "submitting"}>
                Submit
              </button>
            </p>

            {state === "success" && (
              <p className='success'>Yay! Your entry was added</p>
            )}
            {state === "error" && (
              <p className='error'>Your message was not added.</p>
            )}
          </Form>
        )}
      </Formik>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const body = await getPostBody(ctx.req);
  const formData = body ? await createPost(body as any) : null;

  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const postEndpointPrefix = sha
    ? `/_next/data/${sha}`
    : "/_next/data/development";
  return {
    props: {
      postEndpointPrefix,
      posts: await DB.getAllPosts(),
      formData,
    },
  };
};
