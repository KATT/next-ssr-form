# `next-ssr-form`

⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
- Experimental library
- Work in progress. 
- Might be discontinued.
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️


## About

- Uses Next.js' `getServerSideProps` to both fetch and provide helpers to write data straight to the db
- No `/api`-routes used 😳
- Server-side data validation that's propagated to page props
- Works without JS enabled!
- E2E type safety! TypeScript types inferred between client <-> server with all the nice autocomplete jazz

### (Peer) Dependencies

- [zod](https://github.com/colinhacks/zod) for data validation
- [Formik](https://github.com/formium/formik) as a form library


## Get started

ℹ️ Easiest thing to do is to look at the pages in [`examples/typescript`](./examples/typescript).

```bash
yarn add next-ssr-form zod formik
```

