# JS is PHP 🥴 

You should probably not do this.

## Some features

- Uses Next.js' `getServerSideProps` to both fetch and write data straight to the db
- Server-side data validation that's propagated to page props
- Works without JS enabled!
- E2E type safety! TypeScript types inferred between client <-> server with all the nice autocomplete jazz
- [zod](https://github.com/colinhacks/zod) for data validation
- [babel-plugin-superjson-next](babel-plugin-superjson-next) to be able to avoid parsing date fields
## Wanna play around with it?

```bash
git clone git@github.com:KATT/js-is-php.git
cd js-is-php
yarn
yarn dev
```

## Author

[@alexdotjs](https://twitter.com/alexdotjs)

