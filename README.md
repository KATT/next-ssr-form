# `next-ssr-form` 
---

> ⚠️ This is an experimental library and it might be discontinued

## About

- 🔨 Uses Next.js' `getServerSideProps` to both fetch and provide helpers to 
- ♻️ E2E type safety! TypeScript types inferred between 
- ☁️ Allow you to write data straight to the db with confidence
client <-> server with all the nice autocomplete jazz
- 🔐 Server-side data validation that's propagated to page props
- 🤘 Works without JS enabled!

**(Peer) Dependencies:**

- [zod](https://github.com/colinhacks/zod) for data validation
- [Formik](https://github.com/formium/formik) as the form library


## Table of contents

- [# `next-ssr-form`](#-next-ssr-form)
- [About](#about)
- [Table of contents](#table-of-contents)
- [Get started](#get-started)
  - [0. Install](#0-install)
  - [1. Add form to top of page](#1-add-form-to-top-of-page)
  - [2. Add mutation to `getServerSideProps`](#2-add-mutation-to-getserversideprops)
  - [3. Infer data types](#3-infer-data-types)
  - [4. Use form](#4-use-form)
- [Author](#author)
## Get started

> ℹ️ Easiest thing to do is to look at the pages in [`examples/typescript`](./examples/typescript).

### 0. Install
```bash
yarn add next-ssr-form zod formik
```

### 1. Add form to top of page

In a Next.js `page/..`:

```tsx
export const createPostForm = createForm({
  schema: z.object({
    from: z.string().min(2),
    message: z.string().min(4),
  }),
  defaultValues: {
    message: "",
    from: "",
  },
  formId: "createPost",
});
```

### 2. Add mutation to `getServerSideProps`


```tsx
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPostProps = await createPostForm.getPageProps({
    ctx,
    async mutation(input) {
      // 🌟 `input` will be type inferred!
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
```

### 3. Infer data types

```tsx
type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

export default function Home(props: Props) {
  // ...
```

Your data usage is now typesafe!

### 4. Use form

- Formik: Simple example with code scaffolding: [`pages/formik-scaffold.tsx`](./pages/formik-scaffold.tsx) or 
- Formik: More verbose example: [`pages/index.tsx`](./pages/index.tsx)
- Without form library: [`pages/vanilla.tsx`](./pages/vanilla.tsx)

<details>
<summary>Basic form w/o JS</summary>

```tsx

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
```

</details>

## Author

[@alexdotjs](https://twitter.com/alexdotjs)
