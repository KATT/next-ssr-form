# JS is PHP 🥴 

You should probably not do this.

## Some features

- Uses Next.js' `getServerSideProps` to both fetch and write data straight to the db
- No `/api`-routes used 😳
- Server-side data validation that's propagated to page props
- Works without JS enabled!
- E2E type safety! TypeScript types inferred between client <-> server with all the nice autocomplete jazz
- [zod](https://github.com/colinhacks/zod) for data validation

## Wanna play around with it?

```bash
git clone git@github.com:KATT/js-is-php.git
cd js-is-php
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


- Formik: Simple example with code scaffolding: [`pages/formik-scaffold.tsx`](https://github.com/KATT/js-is-php/blob/main/pages/formik-scaffold.tsx) or 
- Formik: More verbose example: [`pages/index.tsx`](https://github.com/KATT/js-is-php/blob/main/pages/index.tsx)
- Without form library: [`pages/vanilla.tsx`](https://github.com/KATT/js-is-php/blob/main/pages/vanilla.tsx)


## Author

[@alexdotjs](https://twitter.com/alexdotjs)
