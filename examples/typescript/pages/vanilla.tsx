import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useState } from 'react';
import { createForm } from 'next-ssr-form';
import { DB } from 'utils/db';
import { prettyDate } from 'utils/prettyDate';
import * as z from 'zod';

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
  const [feedback, setFeedback] = useState(
    createPostForm.getFeedbackFromProps(props)
  );
  const initalValues = createPostForm.getInitialValues(props);
  const initialErrors = createPostForm.getInitialErrors(props);
  const form = props.createPost;
  return (
    <>
      <h1>Normal http post (zod for validation)</h1>
      <p>
        Uses a standard <code>&lt;form&gt;</code> with the <code>action</code>
        -attribute to post to the same page. Form data is handled in{' '}
        <code>getServerSideProps</code> and feedback is passed through page
        props.
      </p>
      <h2>My guestbook</h2>
      {props.posts.map(item => (
        <article key={item.id}>
          <strong>
            From {item.from} at {prettyDate(item.createdAt)}:
          </strong>
          <p className="message">{item.message}</p>
        </article>
      ))}
      <h3>Add post</h3>

      <form action={props.createPost.endpoints.action} method="post">
        <p className={`field ${initialErrors?.from ? 'field--error' : ''}`}>
          <label>
            Your name:
            <br />
            <input type="text" name="from" defaultValue={initalValues.from} />
            {initialErrors?.from && (
              <span className="field__error">{initialErrors.from}</span>
            )}
          </label>
        </p>
        <p className={`field ${initialErrors?.message ? 'field--error' : ''}`}>
          <label>
            Your message:
            <br />
            <textarea name="message" defaultValue={initalValues.message} />
            {initialErrors?.message && (
              <span className="field__error">{initialErrors.message}</span>
            )}
          </label>
        </p>
        <input type="submit" />

        <br />
        {feedback?.state === 'success' && (
          <span className="feedback success">Yay! Your entry was added</span>
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
      </form>
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
