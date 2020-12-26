import { ErrorMessage, Field, Form, Formik, FormikErrors } from "formik";
import { createPost, createPostDefaultValues } from "forms/posts";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import { getPostBody } from "utils/getPostBody";
import { DB } from "./api/db";

export default function Home({
  posts,
  formData,
  createPostDefaultValues,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  return (
    <>
      <h1>Formik</h1>
      <h2>My guestbook</h2>
      {posts.map((item) => (
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
        validate={(values) => {
          const errors: FormikErrors<typeof values> = {};

          return errors;
        }}
        onSubmit={async (values, actions) => {
          console.log("values", values);
          await fetch(router.asPath, {
            method: "post",
            body: JSON.stringify(values),
          });
          await router.replace(router.asPath); // trigger refresh
          actions.resetForm();
        }}
      >
        {({ isSubmitting }) => (
          <Form action={router.asPath}>
            <p className='field'>
              <label htmlFor='from'>Name</label>
              <br />
              <Field type='text' name='from' />
              <ErrorMessage
                name='from'
                component='span'
                className='field__error'
              />
            </p>
            <p className='field'>
              <label htmlFor='message'>Message</label>
              <br />
              <Field type='textarea' name='message' as='textarea' />
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
            </p>
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
  
  console.log("formData", JSON.stringify(formData, null, 4));
  return {
    props: {
      createPostDefaultValues,
      posts: await DB.getAllPosts(),
      formData,
    },
  };
};
