import { ErrorMessage, Field, Form, Formik, FormikErrors } from "formik";
import { createPost } from "forms/createPostSchema.server";
import { createPostDefaultValues } from "forms/createPostSchema";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import { getPostBody } from "utils/getPostBody";
import { DB } from "../forms/db";
import { useState } from "react";
import { deserialize, parse } from "superjson";
import { SuperJSONResult } from "superjson/dist/types";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;
export default function Home(props: Props) {
  const router = useRouter();
  const [state, setState] = useState<"initial" | "error" | "success">();
  const { formData } = props;

  return (
    <>
      <h1>Formik</h1>
      <h2>My guestbook</h2>
      {props.posts.map((item) => (
        <article key={item.id}>
          <strong>
            From {item.from} at {item.createdAt.toLocaleDateString("sv-SE")}{" "}
            {item.createdAt.toLocaleTimeString("sv-SE").substr(0, 5)}:
          </strong>
          <p className='message'>
            <em>{item.message}</em>
          </p>
        </article>
      ))}
      <h3>Add post</h3>

      <Formik
        initialValues={formData?.input ?? createPostDefaultValues}
        initialErrors={formData?.formikError}
        validate={(values) => {
          const errors: FormikErrors<typeof values> = {};

          return errors;
        }}
        onSubmit={async (values, actions) => {
          console.log("values", values);
          setState("initial");
          const res = await fetch(
            `${props.postEndpointPrefix}${router.asPath}.json`,
            {
              method: "post",
              body: JSON.stringify(values),
              headers: {
                "content-type": "application/json",
              },
            },
          );
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
        {({ isSubmitting, errors }) => (
          <Form method='post'>
            <p className='field'>
              <label htmlFor='from'>Name</label>
              <br />
              <Field type='text' name='from' />
              <ErrorMessage
                name='from'
                component='span'
                className='field__error'
              />
              <br />
              {errors.from && (
                <span className='field__error'>{errors.from}</span>
              )}
            </p>
            <p className='field'>
              <label htmlFor='message'>Message</label>
              <br />
              <Field type='textarea' name='message' as='textarea' />
              <br />
              {errors.from && (
                <span className='field__error'>{errors.from}</span>
              )}
            </p>
            <p>
              <button type='submit' disabled={isSubmitting}>
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
      <h3>Notes</h3>
      <ul>
        <li>You should probably not do this.</li>
        <li>
          Data is reset whenever app is restarted or when Vercel's lambda gets
          cold.
        </li>
        <li>Try disabling JS in your browser. Page still works fine.</li>
      </ul>
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
