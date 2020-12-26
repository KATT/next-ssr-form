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
      <h1>Vanilla</h1>
      <h2>My Guestbook</h2>
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
              defaultValue={!formData?.success ? formData?.input.from : ""}
            />
            {formData?.error?.fieldErrors.from && (
              <span className='field__error'>
                {formData?.error?.fieldErrors.from}
              </span>
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
              defaultValue={!formData?.success ? formData?.input.message : ""}
            />
            {formData?.error?.fieldErrors.message && (
              <span className='field__error'>
                {formData?.error?.fieldErrors.message}
              </span>
            )}
          </label>
        </p>
        <p>
          <input type='submit' />
        </p>
        {formData?.success && (
          <p className='success'>Yay! Your entry was added</p>
        )}
        {formData?.error && (
          <p className='error'>Your message was not added.</p>
        )}
      </form>
      <h3>Notes</h3>
      <ul>
        <li>You should probably not do this.</li>
        <li>
          Data is reset whenever app is restarted or when Vercel's lambda gets
          cold.
        </li>
        <li>Try disabling JS in your browser. Page still works fine.</li>
      </ul>
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
