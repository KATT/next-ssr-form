import { ProgressBar } from 'components/ProgressBar';
import { ErrorMessage, Field } from 'formik';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { createForm } from 'next-ssr-form';
import { useState } from 'react';
import { prettyDate } from 'utils/prettyDate';
import * as z from 'zod';
import { DB } from '../utils/db';

export const createPostForm = createForm({
  schema: z.object({
    message: z.string().min(4),
    from: z.object({
      name: z.string().min(2),
      twitter: z
        .string()
        .regex(/^[a-zA-Z0-9_]{1,15}$/, {
          message: 'Not a valid twitter handle',
        })
        .optional(),
    }),
    rating: z.enum(['', '1', '2', '3', '4', '5']).refine(val => val !== '', {
      message: 'You have to pick a rating',
    }),
  }),
  defaultValues: {
    message: '',
    from: {
      name: '',
      twitter: '',
    },
    rating: '',
  },
  formId: 'createPost',
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

function RatingInput({
  name,
  min = 1,
  max = 5,
}: {
  name: string;
  min?: number;
  max?: number;
}) {
  const inputs = new Array(max - min + 1).fill(null).map((_, index) => {
    const num = min + index;
    return (
      <label key={num}>
        <Field type="radio" name={name} value={String(num)} />
        {new Array(num).fill(null).map((_, index) => (
          <span key={index} className="icon">
            ★
          </span>
        ))}
      </label>
    );
  });
  return (
    <>
      <div className="rating">{inputs}</div>
      <ErrorMessage name={name} component="span" className="field__error" />
    </>
  );
}

export default function Home(props: Props) {
  const [posts, setPosts] = useState(props.posts);
  const { Form, feedback } = createPostForm._unstable_useFormikScaffold(props);

  return (
    <>
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
            From{' '}
            {item.twitter ? (
              <a
                href={`https://twitter.com/${encodeURIComponent(item.twitter)}`}
              >
                {item.from}
              </a>
            ) : (
              item.from
            )}{' '}
            at {prettyDate(item.createdAt)}
          </strong>
          <p className="message">{item.message}</p>
        </article>
      ))}
      <h3>Add post</h3>

      <Form
        onSuccess={({ newProps }) => {
          setPosts(newProps.posts);
        }}
      >
        {({ isSubmitting }) => (
          <>
            <ProgressBar loading={isSubmitting} />
            <p className="field">
              <label htmlFor="from.name">
                Name (<code>from.name</code>)
              </label>
              <br />
              <Field type="text" name="from.name" disabled={isSubmitting} />
              <br />
              <ErrorMessage
                name="from.name"
                component="span"
                className="field__error"
              />
            </p>
            <p className="field">
              <label htmlFor="from.twitter">
                Twitter handle (<code>from.twitter</code>)
              </label>
              <br />
              <Field type="text" name="from.twitter" disabled={isSubmitting} />
              <br />
              <ErrorMessage
                name="from.twitter"
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

            <RatingInput name="rating" />
            <br />
            <br />
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
            {isSubmitting && <span className="feedback">Loading...</span>}

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
          </>
        )}
      </Form>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPostProps = await createPostForm.getPageProps({
    ctx,
    async mutation({ from, message, rating }) {
      // if (Math.random() < 0.5) {
      //   throw new Error('Emulating the mutation failing');
      // }
      return DB.createPost({
        message,
        from: from.name,
        twitter: from.twitter,
        rating: rating || undefined,
      });
    },
  });

  return {
    props: {
      ...createPostProps,
      posts: await DB.getAllPosts(),
    },
  };
};
