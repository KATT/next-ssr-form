import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  setNestedObjectValues,
} from "formik";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useState } from "react";
import { ProgressBar } from "../components/ProgressBar";
import { DB } from "../forms/db";
import { useReloadPage } from "../utils/useReloadPage";
import * as z from "zod";
import { createForm } from "utils/createForm";

export const createPostForm = createForm({
  schema: z.object({
    message: z.string().min(2),
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
        initialValues={createPostForm.defaultValues}
        validate={createPostForm.formikValidator}
        onSubmit={async (values, actions) => {
          try {
            setFeedback(null);
            const res = await createPostForm.clientRequest({
              values,
              props,
            });
            console.log(
              "added post with id",
              res.newProps.createPost.output?.data?.id,
            );

            setPosts(res.newProps.posts); // refresh posts
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
                <span className='feedback success'>
                  Yay! Your entry was added
                </span>
              )}

              {feedback?.state === "error" && (
                <span className='feedback error'>
                  Something went wrong: {feedback.err.message}
                </span>
              )}
              {isSubmitting && <span className='feedback'>Loading...</span>}
            </p>
          </Form>
        )}
      </Formik>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPost = await createPostForm.getPageProps({
    ctx,
    async mutation(input) {
      return DB.createPost(input);
    },
  });

  return {
    props: {
      ...createPost,
      posts: await DB.getAllPosts(),
    },
  };
};
