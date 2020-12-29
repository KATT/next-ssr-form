# `next-ssr-form` Example


## Wanna play around with it?

```bash
git clone git@github.com:KATT/js-is-php.git
cd examples/typescript
yarn
yarn dev
```

## How to use the "library"

In a Next.js `page/..`:

### 1. Add form to top of page

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

### 2. Add mutations to `getServerSideProps`


```tsx
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const createPostProps = await createPostForm.getPageProps({
    ctx,
    async mutation(input) {
      if (Math.random() < 0.3) {
        throw new Error("Emulating the mutation failing");
      }
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


## Author

[@alexdotjs](https://twitter.com/alexdotjs)
