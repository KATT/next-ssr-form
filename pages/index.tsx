import { createPost } from "forms/posts";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import { getPostBody } from "utils/getPostBody";
import { DB } from "./api/db";

export default function Home({
  posts,
  formData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  return (
    <>
      <div className='wrapper'>
        <main>
          <h1>JS is PHP</h1>
          <h2>My guestbook</h2>
          {posts.map((item) => (
            <article key={item.id}>
              <strong>
                From {item.from} at {item.createdAt.toLocaleDateString("sv-SE")}{" "}
                {item.createdAt.toLocaleTimeString("sv-SE").substr(0, 5)}:
              </strong>
              <p className='message'>
                <em>{item.message}</em>
              </p>
            </article>
          ))}
          <h3>Add post</h3>

          <form action={router.asPath} method='post'>
            <p
              className={`field ${
                formData?.error?.fieldErrors["from"] ? "field--error" : ""
              }`}
            >
              <label>
                Your name:
                <br />
                <input
                  type='text'
                  name='from'
                  required
                  defaultValue={!formData?.success ? formData?.input.from : ""}
                />
                {formData?.error?.fieldErrors.from && (
                  <div className='error'>
                    {formData?.error?.fieldErrors.from}
                  </div>
                )}
              </label>
            </p>
            <p
              className={`field ${
                formData?.error?.fieldErrors["message"] ? "field--error" : ""
              }`}
            >
              <label>
                Your message:
                <br />
                <textarea
                  name='message'
                  required
                  defaultValue={
                    !formData?.success ? formData?.input.message : ""
                  }
                />
                {formData?.error?.fieldErrors.message && (
                  <div className='error'>
                    {formData?.error?.fieldErrors.message}
                  </div>
                )}
              </label>
            </p>
            <p>
              <input type='submit' />
              {formData?.success && (
                <p className='success'>Yay! Your entry was added</p>
              )}
              {formData?.error && (
                <p className='error'>Your message was not added.</p>
              )}
            </p>
          </form>
        </main>
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
      <style jsx>{`
        .wrapper {
          margin: 0 auto;
          max-width: 768px;
          padding: 20px;
          margin: 20px auto;
          background: white;
        }
        article {
          padding: 5px;
        }
        .message {
          white-space: pre-line;
        }
        footer {
          margin-top: 40px;
          border-top: 1px solid #ddd;
        }
        footer p {
          margin-bottom: 0;
        }
        .field {
        }
        .field--error input,
        .field--error textarea {
          border-color: red;
        }
        .field-error {
          color: red;
        }
        .success {
          color: green;
          font-style: italic;
        }
        .error {
          color: red;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const body = await getPostBody(ctx.req);
  const formData = body ? await createPost(body as any) : null;

  return {
    props: {
      posts: await DB.getAllPosts(),
      formData,
    },
  };
};
