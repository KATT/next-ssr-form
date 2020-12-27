import { ErrorMessage, Field, Form, Formik } from "formik";
import {
  createPostDefaultValues,
  createPostSchemaYup,
} from "forms/createPostSchema";
import { createPostYup } from "forms/createPostSchema.server";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { deserialize } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";
import { getPostBody } from "utils/getPostBody";
import { ProgressBar } from "../components/ProgressBar";
import { DB } from "../forms/db";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

function useIsMounted() {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);

  return () => ref.current;
}
function useReloadPage() {
  const router = useRouter();
  const isMounted = useIsMounted();
  return useCallback(async () => {
    if (isMounted()) {
      await router.replace({
        pathname: router.asPath,
      });
    }
  }, [router.asPath]);
}
export default function Home(props: Props) {
  const reloadPage = useReloadPage();
  const [feedback, setFeedback] = useState<
    | null
    | {
        state: "success";
      }
    | {
        state: "error";
        err: Error;
      }
  >(null);

  return (
    <>
      <h1>Formik</h1>
      <p>
        Uses Formik to HTTP post to Next.js' special page endpoint (
        <code>_next/data/[..]/[..].json</code>) then triggers a page data to be
        reloaded by using <code>router.replace()</code> to itself.
      </p>
      <p>
        Does <strong>not</strong> support usage without JS which is why it's a
        lot cleaner
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
        initialValues={createPostDefaultValues}
        validationSchema={createPostSchemaYup}
        onSubmit={async (values, actions) => {
          try {
            setFeedback(null);
            const res = await fetch(props.postActionUrl, {
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
            const result = deserialize(json.pageProps) as Props;

            if (!result?.formData?.success) {
              throw new Error(
                "Not successful response, try reloading the page",
              );
            }

            await reloadPage();

            setFeedback({ state: "success" });
            actions.resetForm();
          } catch (err) {
            setFeedback({
              state: "error",
              err,
            });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form method='post'>
            <ProgressBar loading={isSubmitting} />
            <p className='field'>
              <label htmlFor='from'>Name</label>
              <br />
              <Field type='text' name='from' disabled={isSubmitting} />
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
                disabled={isSubmitting}
              />
              <br />
              <ErrorMessage
                name='message'
                component='span'
                className='field__error'
              />
            </p>
            <p>
              <button type='submit' disabled={isSubmitting}>
                Submit
              </button>
              <br />
              {feedback?.state === "success" && (
                <div className='success'>Yay! Your entry was added</div>
              )}

              {feedback?.state === "error" && (
                <div className='error'>
                  Something went wrong: {feedback.err.message}
                </div>
              )}
              {isSubmitting && <div>Loading...</div>}
            </p>
          </Form>
        )}
      </Formik>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const body = await getPostBody(ctx.req);
  const formData = body ? await createPostYup(body as any) : null;

  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const postEndpointPrefix = sha
    ? `/_next/data/${sha}`
    : "/_next/data/development";

  const postActionUrl = `${postEndpointPrefix}${ctx.resolvedUrl}.json`;
  return {
    props: {
      postActionUrl,
      posts: await DB.getAllPosts(),
      formData,
    },
  };
};
