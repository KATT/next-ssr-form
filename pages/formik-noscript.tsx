import { ErrorMessage, Field, Form, Formik } from "formik";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import { useState } from "react";
import { createForm } from "utils/createForm";
import * as z from "zod";
import { DB } from "../forms/db";

export const createPostForm = createForm({
  schema: z.object({
    message: z.string().min(10),
    from: z.string().min(2),
  }),
  defaultValues: {
    message: "",
    from: "",
  },
  formId: "createPost",
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Home(props: Props) {
  const [posts, setPosts] = useState(props.posts);
  const router = useRouter();

  const [feedback, setFeedback] = useState(
    createPostForm.getFeedbackFromProps(props),
  );

  return (
    <>
      <h1>
        Formik <code>noscript</code>
      </h1>
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
      {posts.map((item) => (
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
        initialValues={createPostForm.getInitialValues(props)}
        initialErrors={createPostForm.getInitialErrors(props)}
        initialTouched={createPostForm.getInitialTouched(props)}
        validate={createPostForm.formikValidator}
        onSubmit={async (values, actions) => {
          try {
            setFeedback(null);
            const { newProps } = await createPostForm.clientRequest({
              values,
              props,
            });

            const feedback = createPostForm.getFeedbackFromProps(newProps);
            if (!feedback) {
              throw new Error("Didn't receive feedback from props");
            }
            if (newProps.createPost.output?.success) {
              console.log(
                "added post with id",
                newProps.createPost.output.data.id,
              );
            }
            setFeedback(feedback);
            if (feedback.state === "success") {
              setPosts(newProps.posts); // refresh posts
            }

            actions.resetForm();
          } catch (error) {
            setFeedback({
              state: "error",
              error,
            });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form method='post' action={router.asPath}>
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
            </p>

            <br />
            {feedback?.state === "success" && (
              <span className='feedback success'>
                Yay! Your entry was added
              </span>
            )}

            {feedback?.state === "error" && (
              <span className='feedback error'>
                Something went wrong: {feedback.error.message}
              </span>
            )}
            {isSubmitting && <span className='feedback'>Loading...</span>}
          </Form>
        )}
      </Formik>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPostProps = await createPostForm.getPageProps({
    ctx,
    async mutation(input) {
      return DB.createPost(input);
    },
  });

  return {
    props: {
      ...createPostProps,
      posts: await DB.getAllPosts(),
    },
  };
};
