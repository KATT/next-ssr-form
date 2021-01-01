import { ErrorMessage, Field, useFormikContext } from 'formik';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import React, { useState } from 'react';
import * as z from 'zod';
import { createForm } from '../src';

type DBUser = {
  id: string;
  message: string;
  createdAt: string;
  from: {
    name: string;
    twitter?: undefined | string;
  };
};

const db = {
  posts: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      message: 'hello',
      from: {
        name: 'alexdotjs',
        twitter: 'alexdotjs',
      },
      createdAt: new Date(2020, 12, 26).toJSON(),
    },
  ] as DBUser[],
};
export const createPostForm = createForm({
  schema: z.object({
    message: z.string().min(4),
    from: z.object({
      name: z.string().min(2),
      twitter: z
        .string()
        .refine(str => !str || /^[a-zA-Z0-9_]{1,15}/.test(str), {
          message: 'Not a valid twitter handle',
        })
        .optional(),
    }),
  }),
  defaultValues: {
    message: 'world',
    from: {
      name: 'KATT',
      twitter: 'alexdotjs',
    },
  },
  formId: 'guestbook',
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

function FieldAndError({ name, as }: { name: string; as?: string }) {
  const fmk = useFormikContext();
  const field = fmk.getFieldProps(name);
  const errs = fmk.initialErrors;
  return (
    <p>
      <label>
        <strong>{name}</strong>
        <br />
        <Field type="text" name={name} as={as} data-testid={name} />
        <br />

        <ErrorMessage name={name} />
      </label>
    </p>
  );
}

export default function Home(props: Props) {
  const [posts, setPosts] = useState(props.posts);
  const { Form, feedback } = createPostForm._unstable_useFormikScaffold(props);

  return (
    <div>
      <h1>
        <code>useFormikScaffold()</code>
      </h1>
      <p>This page works without JavaScript enabled!</p>

      <h2>My guestbook</h2>
      {posts.map(item => (
        <article key={item.id}>
          <strong>
            From{' '}
            {item.from.twitter ? (
              <a
                href={`https://twitter.com/${encodeURIComponent(
                  item.from.twitter
                )}`}
              >
                {item.from.name}
              </a>
            ) : (
              item.from.name
            )}{' '}
            at {item.createdAt}
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
            <FieldAndError name="from.name" />
            <FieldAndError name="from.twitter" />
            <FieldAndError name="message" as="textarea" />
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
      </Form>
    </div>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPostProps = await createPostForm.getPageProps({
    ctx,
    async mutation(input) {
      return db.posts.push({
        id: `${Math.random()}`,
        createdAt: new Date().toJSON(),
        ...input,
      });
    },
  });

  return {
    props: {
      ...createPostProps,
      posts: db.posts,
    },
  };
};
