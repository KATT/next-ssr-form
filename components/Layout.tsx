import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import { ReactNode } from "react";

const routes: [string, string][] = [
  ["/", "Vanilla"],
  ["/formik", "Formik"],
];

export function Layout(props: { children: ReactNode }) {
  const router = useRouter();

  return (
    <>
      <div className='wrapper'>
        <header>
          <nav>
            {routes.map(([to, title]) => (
              <Link href={to} key={to}>
                <a key={to} className={to === router.asPath ? "active" : ""}>
                  {title}
                </a>
              </Link>
            ))}
          </nav>
        </header>
        <main>{props.children}</main>
        <footer>
          <p>
            Made by <a href='https://twitter.com/alexdotjs'>@alexdotjs</a>.
            Source at{" "}
            <a href='https://github.com/KATT/js-is-php'>
              github.com/KATT/js-is-php
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
