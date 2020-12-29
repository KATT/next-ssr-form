import { ProgressBar } from 'components/ProgressBar';
import { ErrorMessage, Field } from 'formik';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useState } from 'react';
import { createForm, MiniTest } from 'next-ssr-form';
import { prettyDate } from 'utils/prettyDate';
import * as z from 'zod';
import { DB } from '../utils/db';

// export const createPostForm = createForm({
//   schema: z.object({
//     from: z.string().min(2),
//     message: z.string().min(4),
//   }),
//   defaultValues: {
//     message: '',
//     from: '',
//   },
//   formId: 'createPost',
// });

const instance = new MiniTest({
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
  const fafa = createPostForm.useFormikScaffold(props);

  return (
    <div>
      <h1>Formik scaffold</h1>
      <p>
        Like the <a href="/">first example</a> but scaffold a lot of code for
        you
      </p>
      <p>This page works without JavaScript enabled!</p>

      <h2>My guestbook</h2>
      {posts.map(item => (
        <article key={item.id}>
          <strong>
            From {item.from} at {prettyDate(item.createdAt)}
          </strong>
          <p className="message">{item.message}</p>
        </article>
      ))}
      <h3>Add post</h3>
      {/* 
      <Form
        onSuccess={({ newProps }) => {
          setPosts(newProps.posts);
        }}
      >
        {({ isSubmitting }) => (
          <>
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
          </>
        )}
      </Form> */}
    </div>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // const createPostProps = await createPostForm.getPageProps({
  //   ctx,
  //   async mutation(input) {
  //     if (Math.random() < 0.5) {
  //       throw new Error('Emulating the mutation failing');
  //     }
  //     return DB.createPost(input);
  //   },
  // });

  return {
    props: {
      // ...createPostProps,
      posts: await DB.getAllPosts(),
    },
  };
};
