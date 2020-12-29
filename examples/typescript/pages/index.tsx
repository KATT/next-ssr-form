import { ProgressBar } from 'components/ProgressBar';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/dist/client/router';
import { useState } from 'react';
import { createForm } from 'next-ssr-form';
import { prettyDate } from 'utils/prettyDate';
import * as z from 'zod';
import { DB } from '../utils/db';

export const createPostForm = createForm({
  schema: z.object({
    from: z.string().min(2),
    message: z.string().min(4),
  }),
  defaultValues: {
    message: '',
    from: '',
  },
  formId: 'createPost',
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Home(props: Props) {
  const [posts, setPosts] = useState(props.posts);
  const [feedback, setFeedback] = useState(
    createPostForm.getFeedbackFromProps(props)
  );

  return (
    <>
      <h1>
        Formik <code>noscript</code>
      </h1>
      <p>
        Uses Formik to HTTP post to Next.js' special page endpoint (
        <code>_next/data/[..]/[..].json</code>) then re-renders the{' '}
        <code>posts</code> from the response
      </p>
      <p>This page works without JavaScript enabled!</p>

      <h2>My guestbook</h2>
      {posts.map(item => (
        <article key={item.id}>
          <strong>
            From {item.from} at {prettyDate(item.createdAt)}:
          </strong>
          <p className="message">{item.message}</p>
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
            if (newProps.createPost.response?.success) {
              console.log(
                'added post with id',
                newProps.createPost.response.data.id
              );
            }
            setFeedback(feedback);
            if (feedback.state === 'success') {
              setPosts(newProps.posts); // refresh posts
              actions.resetForm();
            }
          } catch (error) {
            setFeedback({
              state: 'error',
              error,
            });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form method="post" action={props.createPost.endpoints.action}>
            <ProgressBar loading={isSubmitting} />
            <p className="field">
              <label htmlFor="from">Name</label>
              <br />
              <Field type="text" name="from" disabled={isSubmitting} />
              <br />
              <ErrorMessage
                name="from"
                component="span"
                className="field__error"
              />
            </p>
            <p className="field">
              <label htmlFor="message">Message</label>
              <br />
              <Field
                type="textarea"
                name="message"
                as="textarea"
                disabled={isSubmitting}
              />
              <br />
              <ErrorMessage
                name="message"
                component="span"
                className="field__error"
              />
            </p>
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>

            <br />
            {feedback?.state === 'success' && (
              <span className="feedback success">
                Yay! Your entry was added
              </span>
            )}

            {feedback?.state === 'error' && (
              <>
                <span className="feedback error">
                  Something went wrong: {feedback.error.message}. Full Error:{' '}
                  <pre>
                    {JSON.stringify(
                      {
                        ...feedback.error,
                        message: feedback.error.message,
                        stack: feedback.error.stack,
                      },
                      null,
                      4
                    )}
                  </pre>
                </span>
              </>
            )}
            {isSubmitting && <span className="feedback">Loading...</span>}
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
      // if (Math.random() < 0.3) {
      //   throw new Error('Emulating the mutation failing');
      // }
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
