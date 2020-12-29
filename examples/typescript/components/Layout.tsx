import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { ReactNode } from 'react';

const routes: [string, string][] = [
  ['/', 'Formik'],
  ['/vanilla', 'Vanilla form with HTTP post and no JS'],
  ['/formik-scaffold', 'Scaffolding'],
];

export function Layout(props: { children: ReactNode }) {
  const router = useRouter();

  return (
    <>
      <div className="wrapper">
        <header>
          <nav>
            {routes.map(([to, title]) => (
              <Link href={to} key={to}>
                <a key={to} className={to === router.pathname ? 'active' : ''}>
                  {title}
                </a>
              </Link>
            ))}
          </nav>
        </header>
        <main>{props.children}</main>

        <hr />
        <h2>About what you're looking at</h2>
        <ul>
          <li>
            We're using <code>getServerSideProps</code> to receive{' '}
            <code>POST</code> data.
          </li>
          <li>
            Validates and adds to the db on the server with <code>/api</code>
            -endpoints.
          </li>
          <li>Reuses same zod schemas in server &amp; client</li>
          <li>TypeScript types are inferred to client.</li>
          <li>
            Data is reset whenever app is restarted or when Vercel's lambda gets
            cold.
          </li>
          <li>Try disabling JS in your browser. Page still works fine.</li>
          <li>
            This is a hack. You should (probably?) not do this. I just got the
            idea and did this as an exercise. The talks about
            React&nbsp;Server&nbsp;Components made me I miss the old PHP-days
            where I could just fetch data from the db and display it. Wanted to
            see if I could do something remotely similar with React and
            TypeScript. Next's <code>getServerSideProps</code> is the closest
            thing.
          </li>
        </ul>
        <hr />
        <footer>
          <p>
            Made by <a href="https://twitter.com/alexdotjs">@alexdotjs</a>.
            Source at{' '}
            <a href="https://github.com/KATT/js-is-php">
              github.com/KATT/js-is-php
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
